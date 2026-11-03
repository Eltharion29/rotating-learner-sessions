export type DeadlineStatus = "active" | "due";

export type CourseDeadline = {
  courseId: string;
  learnerId: string;
  dueAt: string;
};

export type LearnerReport = CourseDeadline & {
  status: DeadlineStatus;
};

export function reportDeadline(input: CourseDeadline, now = new Date()): LearnerReport {
  const dueAt = new Date(input.dueAt);
  if (Number.isNaN(dueAt.getTime())) throw new Error("dueAt must be an ISO date");
  return { ...input, status: dueAt.getTime() >= now.getTime() ? "active" : "due" };
}
