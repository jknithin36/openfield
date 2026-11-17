"use client";

import { useCallback, useState } from "react";

import type { Role } from "@/lib/types";

// Answers live in sessionStorage (per item) until the request is sent, so a
// refresh or the Back button never loses them. Cleared after sending.

export const WHO = {
  child: "My child",
  myself: "Myself",
  students: "My students",
  work: "Someone I support at work",
} as const;
export type Who = keyof typeof WHO;
export const WHO_ROLE: Record<Who, Role> = {
  child: "parent",
  myself: "self-advocate",
  students: "teacher",
  work: "provider",
};
export const CONTACT_BY = { email: "Email", phone: "Phone call", text: "Text message" } as const;
export type ContactBy = keyof typeof CONTACT_BY;

export type Draft = {
  who?: Who;
  region?: "yes" | "no";
  name: string;
  email: string;
  phone: string;
  contactBy?: ContactBy;
  delivery?: "ship" | "pickup";
  line1: string;
  line2: string;
  town: string;
  zip: string;
  note: string;
};

export const EMPTY: Draft = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  town: "",
  zip: "",
  note: "",
};
export const NOTE_MAX = 500;
export const STEP_COUNT = 5;

const key = (slug: string) => `openfield-library-request:${slug}`;

function read(slug: string): Draft {
  if (typeof window === "undefined") return EMPTY;
  try {
    return {
      ...EMPTY,
      ...(JSON.parse(sessionStorage.getItem(key(slug)) ?? "{}") as Partial<Draft>),
    };
  } catch {
    return EMPTY;
  }
}

export function useDraft(slug: string) {
  const [draft, setDraft] = useState<Draft>(() => read(slug));
  const save = useCallback(
    (patch: Partial<Draft>) => {
      const next = { ...read(slug), ...patch };
      sessionStorage.setItem(key(slug), JSON.stringify(next));
      setDraft(next);
    },
    [slug],
  );
  const clear = useCallback(() => sessionStorage.removeItem(key(slug)), [slug]);
  return { draft, save, clear };
}

export const addressText = (d: Draft) =>
  [d.line1, d.line2, [d.town, d.zip].filter(Boolean).join(" ")]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");

/** The first step that still needs an answer (null = all done). */
export function firstMissing(d: Draft): number | null {
  if (!d.who) return 1;
  if (d.region !== "yes") return 2;
  if (!d.name.trim() || !d.email.trim() || !d.contactBy) return 3;
  if (
    !d.delivery ||
    (d.delivery === "ship" && (!d.line1.trim() || !d.town.trim() || !d.zip.trim()))
  )
    return 4;
  return null;
}
