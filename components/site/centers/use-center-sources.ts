"use client";

import { useState } from "react";

import type { CenterSources } from "@/lib/centers/public";
import type { InboxRules, OrganizationSettings } from "@/lib/types";
import { useWorkspace } from "@/components/dashboard/shared/use-workspace";

/** Everything a topic page reads, once the stores load in the browser (null before). */
export function useCenterSources():
  (CenterSources & { org: OrganizationSettings; inboxRules: InboxRules }) | null {
  const w = useWorkspace();
  const [now] = useState<Date | null>(() => (typeof window === "undefined" ? null : new Date()));
  if (!w || !now) return null;
  return {
    lib: w.lib,
    courses: w.content.courses,
    ev: w.ev.data,
    guides: w.content.guides,
    now,
    org: w.settings.org,
    inboxRules: w.settings.inboxRules,
  };
}
