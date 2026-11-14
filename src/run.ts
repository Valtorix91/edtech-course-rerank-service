import { parseCourseSearchRequest } from "./request_boundary.ts";
import { chooseDeadlineFit, rerankCourses } from "./course_rerank.ts";

const body = {
  query: "short video editing for a creator portfolio",
  learnerDeadline: "2026-12-20T00:00:00.000Z",
  courses: [{
    id: "editing-101",
    title: "Editing for Short Video",
    summary: "Cut a clear creator portfolio from raw footage.",
    delivery: "self-paced",
    completionDays: 14,
    educatorReport: "Practice clips and a final edit are reported weekly."
  }]
};

const request = parseCourseSearchRequest(body);
const rankedCourses = await rerankCourses(request);
console.log(JSON.stringify({ rankedCourses, deadlineFitCourseIds: chooseDeadlineFit(request), query: request.query }, null, 2));
