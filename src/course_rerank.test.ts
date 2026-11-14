import test from "node:test";
import assert from "node:assert/strict";
import { chooseDeadlineFit } from "./course_rerank.ts";
import { parseCourseSearchRequest } from "./request_boundary.ts";

test("deadline fit keeps a course that can finish before the learner deadline", () => {
  const request = parseCourseSearchRequest({
    query: "creator editing",
    learnerDeadline: "2099-01-01T00:00:00.000Z",
    courses: [
      { id: "quick", title: "Quick Cut", summary: "Short lessons", delivery: "self-paced", completionDays: 2, educatorReport: "weekly" },
      { id: "long", title: "Long Studio", summary: "Deep production", delivery: "cohort", completionDays: 50000, educatorReport: "milestones" }
    ]
  });
  assert.deepEqual(chooseDeadlineFit(request), ["quick"]);
});
