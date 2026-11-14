import { z } from "zod";

export const courseSearchRequest = z.object({
  query: z.string().min(1),
  learnerDeadline: z.string().datetime(),
  courses: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    delivery: z.enum(["self-paced", "cohort"]),
    completionDays: z.number().int().positive(),
    educatorReport: z.string().min(1)
  })).min(1)
});

export type CourseSearchRequest = z.infer<typeof courseSearchRequest>;

export function parseCourseSearchRequest(body: unknown): CourseSearchRequest {
  return courseSearchRequest.parse(body);
}
