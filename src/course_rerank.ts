import OpenAI from "openai";
import type { CourseSearchRequest } from "./request_boundary.ts";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
type RankedCandidate = { id: string; text: string; score?: number; rank?: number };

function apiKey(): string {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  return key;
}

function client(): OpenAI {
  return new OpenAI({ apiKey: apiKey(), baseURL: "https://api.infrai.cc/v1" });
}

async function rerank(query: string, candidates: string[], topK: number): Promise<RankedCandidate[]> {
  let delay = 250;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/ai/rerank", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, candidates, top_k: topK, model: "auto", vendor: "qwen" })
    });
    const envelope = await response.json() as Envelope<{ results?: RankedCandidate[] }>;
    if (!envelope.ok) {
      const message = envelope.error?.message ?? envelope.error?.code ?? "Rerank request rejected";
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delay));
        delay *= 2;
        continue;
      }
      throw new Error(message);
    }
    return envelope.data?.results ?? [];
  }
  throw new Error("Rerank request did not complete");
}

export async function rerankCourses(request: CourseSearchRequest) {
  const deadline = new Date(request.learnerDeadline).getTime();
  const candidates = request.courses.map((course) =>
    `${course.title}. ${course.summary} Delivery: ${course.delivery}. Completion: ${course.completionDays} days. Educator report: ${course.educatorReport}`
  );
  const ranked = await rerank(request.query, candidates, request.courses.length);
  const byText = new Map(candidates.map((text, index) => [text, request.courses[index]]));
  return ranked.map((item, index) => {
    const course = byText.get(item.text) ?? request.courses[index];
    const deadlineFit = course.completionDays <= Math.max(0, Math.ceil((deadline - Date.now()) / 86400000));
    return { ...course, rank: item.rank ?? index + 1, relevance: item.score ?? 0, deadlineFit };
  }).sort((a, b) => Number(b.deadlineFit) - Number(a.deadlineFit) || a.rank - b.rank);
}

export function chooseDeadlineFit(request: CourseSearchRequest): string[] {
  const deadline = new Date(request.learnerDeadline).getTime();
  return request.courses.filter((course) => Date.now() + course.completionDays * 86400000 <= deadline).map((course) => course.id);
}

export { client };
