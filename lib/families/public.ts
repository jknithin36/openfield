// Public family guide selectors. Pure.
import type { AgeStage, Course, EventsData, FamilyGuide, OFEvent } from "@/lib/types";
import { JARGON } from "@/lib/readability";
import { effectiveStatus } from "@/lib/events/selectors";

export const STAGES: AgeStage[] = ["diagnosis", "birth-5", "school-age", "teen", "adult"];
export const STAGE_PUBLIC: Record<AgeStage, string> = {
  diagnosis: "Just got a diagnosis",
  "birth-5": "Birth to 5",
  "school-age": "School age",
  teen: "Teen years (14–17)",
  adult: "Adult life (18+)",
};
export const isStage = (s: string): s is AgeStage => (STAGES as string[]).includes(s);

export const publishedGuides = (guides: FamilyGuide[]) =>
  guides.filter((g) => g.status === "published");
export const guidesForStage = (guides: FamilyGuide[], stage: AgeStage) =>
  publishedGuides(guides)
    .filter((g) => g.ageStage === stage)
    .sort((a, b) => b.views - a.views || a.title.localeCompare(b.title));

export const nextStage = (stage: AgeStage): AgeStage | null =>
  STAGES[STAGES.indexOf(stage) + 1] ?? null;

/** Family nights and workshops coming up, soonest first. */
export const familyEvents = (ev: EventsData, now: Date, n = 3): OFEvent[] =>
  ev.events
    .filter(
      (e) =>
        (e.type === "family-night" || e.type === "workshop") &&
        effectiveStatus(e, now) === "published",
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, n);

export const parentCourses = (courses: Course[], n = 3) =>
  courses
    .filter((c) => c.status === "published" && c.audiences.includes("parent"))
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, n);

export function searchGuides(guides: FamilyGuide[], q: string) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return publishedGuides(guides).filter((g) =>
    terms.every((t) => `${g.title} ${g.summary} ${g.body}`.toLowerCase().includes(t)),
  );
}

export const headingId = (h: string) =>
  h
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** "IEP" and "a plan for a child's support at school", from the readability glossary. */
export const GLOSSARY = Object.entries(JARGON).map(([key, value]) => {
  const m = /^(.*?) \((.*)\)$/.exec(value);
  return { key, term: m?.[1] ?? key, meaning: m?.[2] ?? value };
});
