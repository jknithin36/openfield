"use client";

// Content: courses and family guides.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createCourses, createGuides } from "@/data/content";
import { withContent } from "@/data/course-content";
import { canFeature, canPublishCourse, validateCourse } from "@/lib/courses/rules";
import { canMarkReviewed, canPublishGuide, validateGuide } from "@/lib/guides/rules";
import { analyze } from "@/lib/readability";
import { fail, newId, nowIso, storeKit, type UndoEntry } from "@/lib/store-kit";
import type { ActionResult, ContentStatus, Course, FamilyGuide } from "@/lib/types";

export type ContentData = { courses: Course[]; guides: FamilyGuide[] };
export type CourseInput = Omit<
  Course,
  | "id"
  | "slug"
  | "status"
  | "featured"
  | "enrollments"
  | "completions"
  | "completionsByAudience"
  | "rating"
  | "updatedAt"
  | "reviewDueAt"
>;
export type GuideInput = Pick<FamilyGuide, "title" | "ageStage" | "summary" | "body" | "owner">;

type State = {
  data: ContentData | null;
  undoStack: UndoEntry[];
  hydrated: boolean;
  ensureSeeded: () => void;
  resetDemoData: () => void;
  undo: (id: string) => boolean;
  saveCourse: (
    id: string | null,
    input: CourseInput,
    status: ContentStatus,
  ) => ActionResult & { id?: string };
  setCourseStatus: (id: string, status: ContentStatus) => ActionResult;
  setFeatured: (id: string, featured: boolean, replaceId?: string) => ActionResult;
  saveGuide: (
    id: string | null,
    input: GuideInput,
    status: ContentStatus,
  ) => ActionResult & { id?: string };
  markReviewed: (id: string, note: string, by: string) => ActionResult;
  setGuideStatus: (id: string, status: ContentStatus) => ActionResult;
  // Public site (no undo): counted once per browser by store/learning.ts.
  recordEnrollment: (slug: string) => void;
  recordCompletion: (slug: string) => void;
  addFeedback: (slug: string, useful: boolean, comment: string) => void;
  addGuideFeedback: (slug: string, helpful: boolean, comment: string) => void;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "item";

export const useContentStore = create<State>()(
  persist(
    (set, get) => {
      const kit = storeKit<ContentData>(get, set);
      const fresh = () => ({
        courses: createCourses(new Date()),
        guides: createGuides(new Date()),
      });
      return {
        data: null,
        undoStack: [],
        hydrated: false,
        ensureSeeded: () => {
          if (!get().data) set({ data: fresh() });
          set({ hydrated: true });
        },
        resetDemoData: () => set({ data: fresh(), undoStack: [] }),
        undo: (id) => kit.undo(id),

        saveCourse: (id, input, status) => {
          const data = get().data;
          if (!data) return { ok: false, reason: "Data not loaded." };
          const errs = validateCourse(input);
          if (errs.length) return { ok: false, reason: errs[0].message };
          const existing = id ? data.courses.find((c) => c.id === id) : undefined;
          let slug = existing?.slug ?? slugify(input.title);
          if (!existing) while (data.courses.some((c) => c.slug === slug)) slug = `${slug}-2`;
          const course: Course = {
            ...(existing ?? {
              enrollments: 0,
              completions: 0,
              featured: false,
              reviewDueAt: new Date(Date.now() + 365 * 86400000).toISOString(),
            }),
            ...input,
            id: existing?.id ?? `course-${newId()}`,
            slug,
            status,
            featured: status === "published" ? (existing?.featured ?? false) : false,
            updatedAt: nowIso(),
          } as Course;
          if (status === "published") {
            const r = canPublishCourse(course);
            if (!r.ok) return fail(r);
          }
          const undoId = existing
            ? kit.commit("Save course", { updated: { courses: [course] } })
            : kit.commit("New course", { created: { courses: [course] } });
          return { ok: true, undoId, id: course.id };
        },
        setCourseStatus: (id, status) => {
          const c = get().data?.courses.find((x) => x.id === id);
          if (!c) return { ok: false, reason: "Course not found." };
          const next = {
            ...c,
            status,
            featured: status === "published" ? c.featured : false,
            updatedAt: nowIso(),
          };
          if (status === "published") {
            const r = canPublishCourse(next);
            if (!r.ok) return fail(r);
          }
          return {
            ok: true,
            undoId: kit.commit(`Course ${status}`, { updated: { courses: [next] } }),
          };
        },
        setFeatured: (id, featured, replaceId) => {
          const data = get().data;
          const c = data?.courses.find((x) => x.id === id);
          if (!data || !c) return { ok: false, reason: "Course not found." };
          if (!featured)
            return {
              ok: true,
              undoId: kit.commit("Unfeature", {
                updated: { courses: [{ ...c, featured: false }] },
              }),
            };
          const r = canFeature(data.courses, id, replaceId);
          if (!r.ok) return fail(r);
          const updated: Course[] = [{ ...c, featured: true }];
          const rep = replaceId && data.courses.find((x) => x.id === replaceId);
          if (rep) updated.push({ ...rep, featured: false });
          return {
            ok: true,
            undoId: kit.commit("Feature course", { updated: { courses: updated } }),
          };
        },

        saveGuide: (id, input, status) => {
          const data = get().data;
          if (!data) return { ok: false, reason: "Data not loaded." };
          const errs = validateGuide(input);
          if (errs.length) return { ok: false, reason: errs[0].message };
          const existing = id ? data.guides.find((g) => g.id === id) : undefined;
          const r = analyze(input.body);
          let slug = existing?.slug ?? slugify(input.title);
          if (!existing) while (data.guides.some((g) => g.slug === slug)) slug = `${slug}-2`;
          const guide: FamilyGuide = {
            helpfulYes: 0,
            helpfulNo: 0,
            comments: [],
            views: 0,
            reviewEveryMonths: 12,
            lastReviewedAt: nowIso(),
            ...existing,
            ...input,
            id: existing?.id ?? `guide-${newId()}`,
            slug,
            status,
            readingLevel: Math.round(r.grade),
            readMinutes: Math.max(1, Math.round(r.words / 200)),
          };
          if (status === "published") {
            const p = canPublishGuide(guide);
            if (!p.ok) return fail(p);
          }
          const undoId = existing
            ? kit.commit("Save guide", { updated: { guides: [guide] } })
            : kit.commit("New guide", { created: { guides: [guide] } });
          return { ok: true, undoId, id: guide.id };
        },
        markReviewed: (id, note, by) => {
          const g = get().data?.guides.find((x) => x.id === id);
          if (!g) return { ok: false, reason: "Guide not found." };
          const r = canMarkReviewed(note);
          if (!r.ok) return fail(r);
          const at = nowIso();
          return {
            ok: true,
            undoId: kit.commit("Mark reviewed", {
              updated: {
                guides: [
                  {
                    ...g,
                    lastReviewedAt: at,
                    reviewNotes: [...(g.reviewNotes ?? []), { at, by, body: note.trim() }],
                  },
                ],
              },
            }),
          };
        },
        recordEnrollment: (slug) => {
          const data = get().data;
          if (data)
            set({
              data: {
                ...data,
                courses: data.courses.map((c) =>
                  c.slug === slug ? { ...c, enrollments: c.enrollments + 1 } : c,
                ),
              },
            });
        },
        recordCompletion: (slug) => {
          const data = get().data;
          if (!data) return;
          set({
            data: {
              ...data,
              courses: data.courses.map((c) =>
                c.slug === slug
                  ? {
                      ...c,
                      completions: Math.min(c.enrollments, c.completions + 1),
                      completionsByAudience: c.completionsByAudience,
                    }
                  : c,
              ),
            },
          });
        },
        addFeedback: (slug, useful, comment) => {
          const data = get().data;
          if (!data) return;
          const entry = {
            at: nowIso(),
            useful,
            ...(comment.trim() ? { comment: comment.trim().slice(0, 500) } : {}),
          };
          set({
            data: {
              ...data,
              courses: data.courses.map((c) =>
                c.slug === slug ? { ...c, feedback: [...(c.feedback ?? []), entry] } : c,
              ),
            },
          });
        },

        addGuideFeedback: (slug, helpful, comment) => {
          const data = get().data;
          if (!data) return;
          set({
            data: {
              ...data,
              guides: data.guides.map((g) =>
                g.slug === slug
                  ? {
                      ...g,
                      helpfulYes: g.helpfulYes + (helpful ? 1 : 0),
                      helpfulNo: g.helpfulNo + (helpful ? 0 : 1),
                      comments: comment.trim()
                        ? [
                            { at: nowIso(), body: comment.trim().slice(0, 500), helpful },
                            ...g.comments,
                          ]
                        : g.comments,
                    }
                  : g,
              ),
            },
          });
        },

        setGuideStatus: (id, status) => {
          const g = get().data?.guides.find((x) => x.id === id);
          if (!g) return { ok: false, reason: "Guide not found." };
          if (status === "published") {
            const p = canPublishGuide(g);
            if (!p.ok) return fail(p);
          }
          return {
            ok: true,
            undoId: kit.commit(`Guide ${status}`, { updated: { guides: [{ ...g, status }] } }),
          };
        },
      };
    },
    {
      name: "openfield-content",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ data: s.data, undoStack: s.undoStack }),
      // v2: courses gained lesson content, outcomes, author and resources.
      migrate: (persisted, version) => {
        const p = persisted as { data: ContentData | null; undoStack: UndoEntry[] };
        if (version < 2 && p.data) p.data = { ...p.data, courses: p.data.courses.map(withContent) };
        return p;
      },
    },
  ),
);

let started = false;
export function hydrateContent(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  Promise.resolve(useContentStore.persist.rehydrate()).then(() =>
    useContentStore.getState().ensureSeeded(),
  );
}
