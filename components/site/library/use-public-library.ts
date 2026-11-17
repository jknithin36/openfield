"use client";

import { useEffect } from "react";

import { hydrateSettings, useSettingsStore } from "@/store/settings";
import type { LibraryData, OrganizationSettings } from "@/lib/types";
import { useLibrary } from "@/components/dashboard/shared/use-library";

/** Library data (with people) + organization details, once loaded in the browser. */
export function usePublicLibrary(): { lib: LibraryData; org: OrganizationSettings } | null {
  const lib = useLibrary();
  useEffect(() => hydrateSettings(), []);
  const org = useSettingsStore((s) => (s.hydrated ? s.data?.org : null));
  return lib && org ? { lib, org } : null;
}

export const tel = (phone: string) => phone.replace(/[^\d+]/g, "");
