import type { Course } from "@/lib/types";

export const COURSE_FORMAT_LABEL = {
  course: "Course",
  "mini-lesson": "Mini-lesson",
  "webinar-recording": "Webinar recording",
  toolkit: "Toolkit",
} as const;
export const LEVEL_LABEL = {
  intro: "Introduction",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;
export const MAX_FEATURED = 3;

/** Formats that contain video and so need captions + transcript. */
export const isVideo = (c: Pick<Course, "format">) => c.format !== "toolkit";
export const courseMinutes = (c: Course) => c.lessons.reduce((n, l) => n + l.minutes, 0);
export const completionRate = (c: Course) =>
  c.enrollments ? Math.round((c.completions / c.enrollments) * 100) : 0;
export const lengthText = (min: number) =>
  min >= 60
    ? `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ""}`.trim()
    : `${min} min`;

/** Accessibility in words: "Complete" or what's missing. */
export function accessibilityGaps(c: Course): string[] {
  const gaps: string[] = [];
  if (isVideo(c) && !c.accessibility.captions) gaps.push("captions");
  if (isVideo(c) && !c.accessibility.transcript) gaps.push("transcript");
  if (!c.accessibility.plainLanguage) gaps.push("plain-language summary");
  return gaps;
}
export const missingCaptions = (c: Course) => isVideo(c) && !c.accessibility.captions;
