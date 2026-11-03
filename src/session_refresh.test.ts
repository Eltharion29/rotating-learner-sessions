import assert from "node:assert/strict";
import { reportDeadline } from "./course_deadline.ts";
import { refreshBody } from "./session_refresh.ts";

const now = new Date("2026-10-25T00:00:00.000Z");
const report = reportDeadline({ courseId: "algebra-foundations", learnerId: "learner-17", dueAt: "2026-10-26T00:00:00.000Z" }, now);
assert.equal(report.status, "active");
assert.deepEqual(refreshBody.parse({ refresh_token: "rotating-token" }), { refresh_token: "rotating-token" });
assert.throws(() => refreshBody.parse({ refresh_token: "rotating-token", email: "learner@example.test" }));
console.log("session refresh boundary and deadline decision passed");
