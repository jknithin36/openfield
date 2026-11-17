"use client";

import { useEffect, useMemo } from "react";

import { hydrateContent, useContentStore, type ContentData } from "@/store/content";
import { hydrateInbox, useInboxStore } from "@/store/inbox";
import { hydrateSettings, useSettingsStore, type SettingsData } from "@/store/settings";
import type { DashboardRole } from "@/store/dashboard";
import type { Contact, EventsData, LibraryData, Message, Staff } from "@/lib/types";
import { currentStaff, visibleTo } from "@/lib/inbox/selectors";
import type { WorkView } from "@/lib/today";
import { useRole } from "@/components/dashboard/shared/use-dashboard";
import { useEvents } from "@/components/dashboard/shared/use-events";
import { useLibrary } from "@/components/dashboard/shared/use-library";

export type Workspace = {
  lib: LibraryData;
  ev: { data: EventsData; contacts: Contact[] };
  contacts: Contact[];
  messages: Message[];
  content: ContentData;
  settings: SettingsData;
  role: DashboardRole;
  me: Staff | undefined;
};

/** Every store, loaded. Null until all are ready in the browser. */
export function useWorkspace(): Workspace | null {
  const lib = useLibrary();
  const ev = useEvents();
  const role = useRole();
  const inbox = useInboxStore((s) => (s.hydrated ? s.data : null));
  const content = useContentStore((s) => (s.hydrated ? s.data : null));
  const settings = useSettingsStore((s) => (s.hydrated ? s.data : null));
  useEffect(() => {
    hydrateInbox();
    hydrateContent();
    hydrateSettings();
  }, []);
  return useMemo(
    () =>
      lib && ev && inbox && content && settings
        ? {
            lib,
            ev,
            contacts: ev.contacts,
            messages: inbox.messages,
            content,
            settings,
            role,
            me: currentStaff(settings.staff, role),
          }
        : null,
    [lib, ev, inbox, content, settings, role],
  );
}

/** Inbox and content as the current role sees them (for Today and badges). */
export const workView = (w: Workspace): WorkView => ({
  messages: w.messages.filter((m) => visibleTo(m, w.role, w.me?.id ?? null)),
  courses: w.content.courses,
  guides: w.content.guides,
  inboxRules: w.settings.inboxRules,
  contentRules: w.settings.contentRules,
});
