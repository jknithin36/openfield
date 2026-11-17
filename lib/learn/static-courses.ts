// Course slugs, titles and lessons for metadata and static params. These don't
// depend on dates, so a fixed date keeps this deterministic at build time.
import { createCourses } from "@/data/content";

export const STATIC_COURSES = createCourses(new Date("2026-01-01T12:00:00Z")).filter(
  (c) => c.status === "published",
);
export const staticCourse = (slug: string) => STATIC_COURSES.find((c) => c.slug === slug);
