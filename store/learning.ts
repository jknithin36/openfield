"use client";

// Course progress on this device only (no accounts). Saved in localStorage
// under "openfield.learning". Enrollment and completion are counted on the
// course once per browser, so refreshing never double counts.
import { useSyncExternalStore } from "react";

import { useContentStore } from "@/store/content";

export type CourseProgress = {
  startedAt: string;
  completedLessonIds: string[];
  lastLessonId: string;
  completedAt?: string;
  certificateName?: string;
  certificateCode?: string;
  /** Guards so each browser counts once. */
  counted?: { enrolled?: boolean; completed?: boolean };
};
export type Learning = Record<string, CourseProgress>;

const KEY = "openfield.learning";
const EVENT = "openfield-learning";
const EMPTY: Learning = {};

let cacheRaw: string | null = null;
let cache: Learning = EMPTY;
function read(): Learning {
  if (typeof window === "undefined") return EMPTY;
  const raw = localStorage.getItem(KEY);
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    cache = raw ? (JSON.parse(raw) as Learning) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}
function write(next: Learning) {
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** All progress on this device. Empty during prerender and hydration. */
export function useLearning(): Learning {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

const update = (slug: string, fn: (p: CourseProgress | undefined) => CourseProgress) => {
  const all = read();
  write({ ...all, [slug]: fn(all[slug]) });
};

/** Opening any lesson: start the course (counted once) and remember where they are. */
export function openLesson(slug: string, lessonId: string) {
  const before = read()[slug];
  update(slug, (p) => ({
    startedAt: p?.startedAt ?? new Date().toISOString(),
    completedLessonIds: p?.completedLessonIds ?? [],
    ...p,
    lastLessonId: lessonId,
    counted: { ...p?.counted, enrolled: true },
  }));
  if (!before?.counted?.enrolled) useContentStore.getState().recordEnrollment(slug);
}

export function markLessonDone(slug: string, lessonId: string) {
  update(slug, (p) => ({
    startedAt: p?.startedAt ?? new Date().toISOString(),
    lastLessonId: lessonId,
    ...p,
    completedLessonIds: [...new Set([...(p?.completedLessonIds ?? []), lessonId])],
  }));
}

/** All lessons done: mark complete (counted once). Returns false if lessons are left. */
export function finishCourse(slug: string, lessonIds: string[]): boolean {
  const p = read()[slug];
  if (!p || !lessonIds.every((id) => p.completedLessonIds.includes(id))) return false;
  if (p.counted?.completed) return true;
  update(slug, (q) => ({
    ...q!,
    completedAt: q!.completedAt ?? new Date().toISOString(),
    counted: { ...q!.counted, completed: true },
  }));
  useContentStore.getState().recordCompletion(slug);
  return true;
}

/** A short code people can quote, e.g. OF-7K2Q-91. Stable for a given completion. */
export function certificateCode(slug: string, completedAt: string): string {
  let h = 2166136261;
  for (const ch of `${slug}|${completedAt}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = Array.from({ length: 4 }, (_, i) => abc[(h >>> (i * 5)) & 31]).join("");
  return `OF-${part}-${String(h % 100).padStart(2, "0")}`;
}

export function setCertificateName(slug: string, name: string) {
  update(slug, (p) => ({
    ...p!,
    certificateName: name.trim(),
    certificateCode:
      p!.certificateCode ?? certificateCode(slug, p!.completedAt ?? new Date().toISOString()),
  }));
}

export function clearLearning() {
  write({});
}

// ── Text size for lesson content ────────────────────────────────────────────
export const TEXT_SIZES = { default: "Default", large: "Large", xl: "Extra large" } as const;
export type TextSize = keyof typeof TEXT_SIZES;
const SIZE_KEY = "openfield.textSize";
const readSize = (): TextSize => {
  if (typeof window === "undefined") return "default";
  const v = localStorage.getItem(SIZE_KEY);
  return v === "large" || v === "xl" ? v : "default";
};
export function useTextSize(): [TextSize, (s: TextSize) => void] {
  const size = useSyncExternalStore(subscribe, readSize, () => "default" as TextSize);
  return [
    size,
    (s) => {
      localStorage.setItem(SIZE_KEY, s);
      window.dispatchEvent(new Event(EVENT));
    },
  ];
}
