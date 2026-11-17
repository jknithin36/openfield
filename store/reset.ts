"use client";

import { useContactsStore } from "@/store/contacts";
import { useContentStore } from "@/store/content";
import { useDashboardStore } from "@/store/dashboard";
import { useEventsStore } from "@/store/events";
import { useInboxStore } from "@/store/inbox";
import { useLibraryStore } from "@/store/library";
import { useSettingsStore } from "@/store/settings";

/** Restore every store to fresh demo data. */
export function resetAllDemoData(): void {
  useLibraryStore.getState().resetDemoData();
  useEventsStore.getState().resetDemoData();
  useContactsStore.getState().resetDemoData();
  useInboxStore.getState().resetDemoData();
  useContentStore.getState().resetDemoData();
  useSettingsStore.getState().resetDemoData();
  useDashboardStore.getState().resetDemoData();
}

/** Everything, for "Export all demo data (JSON)". */
export function exportAll() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    library: useLibraryStore.getState().data,
    events: useEventsStore.getState().data,
    contacts: useContactsStore.getState().data,
    inbox: useInboxStore.getState().data,
    content: useContentStore.getState().data,
    settings: useSettingsStore.getState().data,
  };
}

/** Validates and loads an export. Returns an error message or null. */
export function importAll(json: unknown): string | null {
  if (!json || typeof json !== "object") return "The file isn't valid JSON.";
  const d = json as Record<string, unknown>;
  const need = ["library", "events", "contacts", "inbox", "content", "settings"];
  const missing = need.filter((k) => !d[k] || typeof d[k] !== "object");
  if (missing.length) return `The file is missing: ${missing.join(", ")}.`;
  const lib = d.library as { items?: unknown; requests?: unknown };
  if (!Array.isArray(lib.items) || !Array.isArray(lib.requests))
    return "The library section isn't in the right format.";
  useLibraryStore.setState({ data: d.library as never, undoStack: [] });
  useEventsStore.setState({ data: d.events as never, undoStack: [] });
  useContactsStore.setState({ data: d.contacts as never, undoStack: [] });
  useInboxStore.setState({ data: d.inbox as never, undoStack: [] });
  useContentStore.setState({ data: d.content as never, undoStack: [] });
  useSettingsStore.setState({ data: d.settings as never, undoStack: [] });
  return null;
}
