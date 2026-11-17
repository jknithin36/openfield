import type { Course, RuleResult } from "@/lib/types";
import { isVideo, MAX_FEATURED } from "@/lib/courses/selectors";

export function validateCourse(
  c: Pick<Course, "title" | "summary" | "lessons" | "audiences">,
): Array<{ field: string; message: string }> {
  const errs: Array<{ field: string; message: string }> = [];
  if (!c.title.trim()) errs.push({ field: "title", message: "Enter a course title" });
  if (!c.summary.trim()) errs.push({ field: "summary", message: "Enter a short summary" });
  if (!c.audiences.length)
    errs.push({ field: "audience", message: "Choose at least one audience" });
  if (!c.lessons.length) errs.push({ field: "lessons", message: "Add at least one lesson" });
  if (c.lessons.some((l) => !l.title.trim()))
    errs.push({ field: "lessons", message: "Give every lesson a title" });
  if (c.lessons.some((l) => !(l.minutes > 0)))
    errs.push({ field: "lessons", message: "Enter minutes for every lesson, like 10" });
  return errs;
}

/** Video courses need captions and a transcript before publishing. */
export function canPublishCourse(c: Course): RuleResult {
  const errs = validateCourse(c);
  if (errs.length) return { ok: false, reason: errs[0].message };
  if (isVideo(c) && (!c.accessibility.captions || !c.accessibility.transcript)) {
    const missing = [
      !c.accessibility.captions && "captions",
      !c.accessibility.transcript && "a transcript",
    ]
      .filter(Boolean)
      .join(" and ");
    return {
      ok: false,
      reason: `This course has video, so it needs ${missing} before it can be published.`,
    };
  }
  return { ok: true };
}

export function canFeature(courses: Course[], id: string, replaceId?: string): RuleResult {
  const c = courses.find((x) => x.id === id);
  if (!c) return { ok: false, reason: "Course not found." };
  if (c.status !== "published")
    return { ok: false, reason: "Only published courses can be featured." };
  const featured = courses.filter((x) => x.featured && x.id !== id);
  if (featured.length >= MAX_FEATURED && !replaceId)
    return {
      ok: false,
      reason: `Only ${MAX_FEATURED} courses can be featured. Choose one to replace.`,
    };
  return { ok: true };
}
