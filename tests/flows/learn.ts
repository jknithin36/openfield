// Course progress lives in localStorage; give Node a tiny in-memory stand-in.
const mem = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  },
  window: { addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true },
});

import { useContentStore as content } from "@/store/content";
import * as L from "@/store/learning";
import * as P from "@/lib/learn/public";
import { RICH } from "@/data/course-content";

let f = 0;
const ok = (c: boolean, m: string) => {
  console.log(c ? "  ✓" : "  ✗", m);
  if (!c) f++;
};
content.getState().ensureSeeded();
const courses = () => content.getState().data!.courses;
const bySlug = (slug: string) => courses().find((c) => c.slug === slug);

ok(
  courses().every((c) => c.lessons.every((l) => l.type)),
  "every lesson has a type",
);
for (const slug of Object.keys(RICH)) {
  const c = bySlug(slug);
  ok(
    !!c &&
      c.lessons.length >= 3 &&
      c.lessons.length <= 6 &&
      c.lessons.some((l) => l.type === "check") &&
      (c.outcomes?.length ?? 0) >= 3,
    `${slug}: ${c?.lessons.length} lessons with a check`,
  );
}

const home = P.homeCourses(courses());
ok(
  home.length === 3 && home.map((c) => c.audiences[0]).join() === "parent,teacher,employer",
  "home: one per audience",
);

const F: P.CourseFilters = {
  q: "",
  audiences: [],
  centers: [],
  formats: [],
  lengths: [],
  certificate: false,
  sort: "popular",
};
const all = P.searchCourses(courses(), F);
ok(
  all.every((c) => c.status === "published"),
  `catalog: ${all.length} published only`,
);
ok(
  P.searchCourses(courses(), { ...F, q: "visual timetable" }).length > 0,
  "search matches outcomes",
);
const facets = P.courseFacets(courses(), F);
ok(Object.values(facets.lengths).reduce((a, b) => a + b, 0) === all.length, "length counts add up");
ok(
  P.lengthBucket(P.searchCourses(courses(), { ...F, sort: "shortest" })[0]) === "short",
  "shortest first",
);

const slug = "understanding-your-childs-autism-diagnosis";
const c0 = bySlug(slug)!;
const ids = c0.lessons.map((l) => l.id);
const e0 = c0.enrollments;
const k0 = c0.completions;
L.openLesson(slug, ids[0]);
L.openLesson(slug, ids[1]);
ok(bySlug(slug)!.enrollments === e0 + 1, "enrollment counted once for 2 lesson opens");
ok(!L.finishCourse(slug, ids), "can't finish with lessons left");
for (const id of ids) L.markLessonDone(slug, id);
ok(L.finishCourse(slug, ids) && L.finishCourse(slug, ids), "finish works (twice is fine)");
ok(bySlug(slug)!.completions === k0 + 1, "completion counted once");
const code = L.certificateCode(slug, "2026-11-17T10:00:00Z");
ok(
  /^OF-[A-Z2-9]{4}-\d{2}$/.test(code) && code === L.certificateCode(slug, "2026-11-17T10:00:00Z"),
  "certificate code is stable: " + code,
);
content.getState().addFeedback(slug, true, "Very clear");
ok(bySlug(slug)!.feedback?.length === 1, "feedback stored on the course");

if (f) throw new Error(`${f} check(s) failed`);
