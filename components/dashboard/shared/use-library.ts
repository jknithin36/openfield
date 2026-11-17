"use client";

import { useEffect, useMemo } from "react";

import { hydrateLibrary, useLibraryStore } from "@/store/library";
import { hydrateContacts, useContactsStore } from "@/store/contacts";
import type { LibraryData } from "@/lib/types";

/**
 * Library data once loaded in the browser (null before). People come from
 * the contacts store — the single source of truth — so edits show everywhere.
 */
export function useLibrary(): LibraryData | null {
  const hydrated = useLibraryStore((s) => s.hydrated);
  const data = useLibraryStore((s) => s.data);
  const cHydrated = useContactsStore((s) => s.hydrated);
  const people = useContactsStore((s) => s.data?.contacts);
  useEffect(() => {
    hydrateLibrary();
    hydrateContacts();
  }, []);
  return useMemo(
    () => (hydrated && cHydrated && data && people ? { ...data, contacts: people } : null),
    [hydrated, cHydrated, data, people],
  );
}
