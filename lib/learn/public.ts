// Public course selectors. Pure.
import type { CenterSlug, Course, CourseFormat, LessonType, Role } from "@/lib/types";
import { courseMinutes } from "@/lib/courses/selectors";

export const LENGTHS = ["short", "medium", "long"] as const;
export type LengthBucket = (typeof LENGTHS)[number];
export const LENGTH_LABEL: Record<LengthBucket, string> = {
  short: "Under 30 minutes",
  medium: "30 to 60 minutes",
  long: "Over 1 hour",
};
export const lengthBucket = (c: Course): LengthBucket => {
  const m = courseMinutes(c);
  return m < 30 ? "short" : m <= 60 ? "medium" : "long";
};

export const AUDIENCE_PLURAL: Record<Role, string> = {
  parent: "Parents",
  teacher: "Teachers",
  provider: "Providers",
  employer: "Employers",
  "self-advocate": "Self-advocates",
};
export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  video: "Video",
  reading: "Reading",
  activity: "Activity",
  check: "Quick check",
};

/** "45 minutes · 4 lessons" */
export function lengthWords(c: Course): string {
  const m = courseMinutes(c);
  const t =
    m < 60
      ? `${m} minutes`
      : m % 60
        ? `${Math.floor(m / 60)} hour${m >= 120 ? "s" : ""} ${m % 60} minutes`
        : `${m / 60} hour${m >= 120 ? "s" : ""}`;
  return `${t} · ${c.lessons.length} ${c.lessons.length === 1 ? "lesson" : "lessons"}`;
}

export const COURSE_SORTS = ["popular", "newest", "shortest"] as const;
export type CourseSort = (typeof COURSE_SORTS)[number];
export const COURSE_SORT_LABEL: Record<CourseSort, string> = {
  popular: "Most popular",
  newest: "Newest",
  shortest: "Shortest first",
};

export type CourseFilters = {
  q: string;
  audiences: Role[];
  centers: CenterSlug[];
  formats: CourseFormat[];
  lengths: LengthBucket[];
  certificate: boolean;
  sort: CourseSort;
};

const matches = (c: Course, q: string) => {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = [c.title, c.summary, ...(c.outcomes ?? [])].join(" ").toLowerCase();
  return terms.every((t) => hay.includes(t));
};

type Group = "audiences" | "centers" | "formats" | "lengths" | "certificate";
function filtered(courses: Course[], f: CourseFilters, skip?: Group) {
  return courses.filter(
    (c) =>
      c.status === "published" &&
      matches(c, f.q) &&
      (skip === "audiences" ||
        !f.audiences.length ||
        c.audiences.some((a) => f.audiences.includes(a))) &&
      (skip === "centers" || !f.centers.length || f.centers.includes(c.center)) &&
      (skip === "formats" || !f.formats.length || f.formats.includes(c.format)) &&
      (skip === "lengths" || !f.lengths.length || f.lengths.includes(lengthBucket(c))) &&
      (skip === "certificate" || !f.certificate || c.certificate),
  );
}

export function searchCourses(courses: Course[], f: CourseFilters): Course[] {
  return [...filtered(courses, f)].sort((a, b) =>
    f.sort === "newest"
      ? b.updatedAt.localeCompare(a.updatedAt)
      : f.sort === "shortest"
        ? courseMinutes(a) - courseMinutes(b) || a.title.localeCompare(b.title)
        : Number(b.featured) - Number(a.featured) || b.enrollments - a.enrollments,
  );
}

export function courseFacets(courses: Course[], f: CourseFilters) {
  const count = <K extends string>(
    skip: Group,
    keys: readonly K[],
    test: (c: Course, k: K) => boolean,
  ) => {
    const base = filtered(courses, f, skip);
    return Object.fromEntries(
      keys.map((k) => [k, base.filter((c) => test(c, k)).length]),
    ) as Record<K, number>;
  };
  return {
    audiences: count("audiences", Object.keys(AUDIENCE_PLURAL) as Role[], (c, k) =>
      c.audiences.includes(k),
    ),
    centers: count(
      "centers",
      [
        "autism",
        "assistive-technology",
        "early-childhood",
        "inclusive-learning",
        "life-transitions",
        "deaf-blind",
        "family-support",
      ] as CenterSlug[],
      (c, k) => c.center === k,
    ),
    formats: count(
      "formats",
      ["course", "mini-lesson", "webinar-recording", "toolkit"] as CourseFormat[],
      (c, k) => c.format === k,
    ),
    lengths: count("lengths", LENGTHS, (c, k) => lengthBucket(c) === k),
    certificate: filtered(courses, f, "certificate").filter((c) => c.certificate).length,
  };
}

/** Same topic first, then same audience. */
export const relatedCourses = (courses: Course[], c: Course, n: number) =>
  courses
    .filter(
      (x) =>
        x.status === "published" &&
        x.id !== c.id &&
        (x.center === c.center || x.audiences.some((a) => c.audiences.includes(a))),
    )
    .sort(
      (a, b) =>
        Number(b.center === c.center) - Number(a.center === c.center) ||
        b.enrollments - a.enrollments,
    )
    .slice(0, n);

/** One course per audience for the home page: featured first, then most enrolled. */
export function homeCourses(
  courses: Course[],
  audiences: Role[] = ["parent", "teacher", "employer"],
): Course[] {
  const live = courses
    .filter((c) => c.status === "published")
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.enrollments - a.enrollments);
  const used = new Set<string>();
  return audiences.flatMap((a) => {
    const c =
      live.find((x) => x.audiences[0] === a && !used.has(x.id)) ??
      live.find((x) => x.audiences.includes(a) && !used.has(x.id));
    if (!c) return [];
    used.add(c.id);
    return [c];
  });
}
