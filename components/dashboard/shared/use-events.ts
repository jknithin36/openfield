"use client";

import { useEffect, useMemo } from "react";

import { hydrateEvents, useEventsStore } from "@/store/events";
import type { Contact, EventsData } from "@/lib/types";
import { allContacts } from "@/lib/events/selectors";
import { useLibrary } from "@/components/dashboard/shared/use-library";

/** Events data + every contact (library + events), once loaded in the browser. */
export function useEvents(): { data: EventsData; contacts: Contact[] } | null {
  const hydrated = useEventsStore((s) => s.hydrated);
  const data = useEventsStore((s) => s.data);
  const lib = useLibrary();
  useEffect(() => hydrateEvents(), []);
  return useMemo(
    // People from the contacts store, plus anyone just added from Events.
    () => (hydrated && data && lib ? { data, contacts: allContacts(lib.contacts, data) } : null),
    [hydrated, data, lib],
  );
}
