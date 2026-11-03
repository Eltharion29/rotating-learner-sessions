import { reportDeadline } from "./course_deadline.ts";
import { refreshLearnerSession } from "./session_refresh.ts";

const session = await refreshLearnerSession({ refresh_token: process.env.LEARNER_REFRESH_TOKEN ?? "" });
const report = reportDeadline({ courseId: "algebra-foundations", learnerId: "learner-17", dueAt: "2027-01-15T17:00:00.000Z" });
console.log(JSON.stringify({ sessionId: session.session_id, learner: report.learnerId, course: report.courseId, deadline: report.status }, null, 2));
