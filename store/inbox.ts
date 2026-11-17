"use client";

// Inbox: messages, replies, internal notes, assignment.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createMessages } from "@/data/inbox";
import { createPeople } from "@/data/people";
import {
  canAddNote,
  canAssign,
  canMarkWaiting,
  canReopen,
  canReply,
  canResolve,
} from "@/lib/inbox/rules";
import { fail, nowIso, storeKit, type UndoEntry } from "@/lib/store-kit";
import type {
  ActionResult,
  CenterSlug,
  Message,
  MessageSource,
  MessageTopic,
  Team,
} from "@/lib/types";

export type InboxData = { messages: Message[] };
export type NewMessage = {
  contactId: string | null;
  name: string;
  email: string;
  phone?: string;
  topic: MessageTopic;
  subject: string;
  body: string;
  source: MessageSource;
  /** Topic page the question came from. */
  center?: CenterSlug;
};

type State = {
  data: InboxData | null;
  undoStack: UndoEntry[];
  hydrated: boolean;
  ensureSeeded: () => void;
  resetDemoData: () => void;
  undo: (id: string) => boolean;
  reply: (id: string, body: string, by: string) => ActionResult;
  addNote: (id: string, body: string, by: string) => ActionResult;
  assign: (id: string, team: Team, staffId?: string) => ActionResult;
  markWaiting: (id: string) => ActionResult;
  resolve: (id: string) => ActionResult;
  reopen: (id: string) => ActionResult;
  linkContact: (id: string, contactId: string) => ActionResult;
  create: (m: NewMessage) => ActionResult & { id?: string };
};

export const useInboxStore = create<State>()(
  persist(
    (set, get) => {
      const kit = storeKit<InboxData>(get, set);
      const find = (id: string) => get().data?.messages.find((m) => m.id === id);
      const update = (label: string, m: Message) => ({
        ok: true as const,
        undoId: kit.commit(label, { updated: { messages: [m] } }),
      });
      return {
        data: null,
        undoStack: [],
        hydrated: false,
        ensureSeeded: () => {
          if (!get().data)
            set({ data: { messages: createMessages(createPeople(new Date()), new Date()) } });
          set({ hydrated: true });
        },
        resetDemoData: () =>
          set({
            data: { messages: createMessages(createPeople(new Date()), new Date()) },
            undoStack: [],
          }),
        undo: (id) => kit.undo(id),
        reply: (id, body, by) => {
          const m = find(id);
          if (!m) return { ok: false, reason: "Message not found." };
          const r = canReply(m, body);
          if (!r.ok) return fail(r);
          // Replying hands the next step to the sender.
          return update("Reply", {
            ...m,
            replies: [...m.replies, { at: nowIso(), by, body: body.trim() }],
            status: "waiting-on-them",
          });
        },
        addNote: (id, body, by) => {
          const m = find(id);
          if (!m) return { ok: false, reason: "Message not found." };
          const r = canAddNote(body);
          if (!r.ok) return fail(r);
          return update("Internal note", {
            ...m,
            internalNotes: [...m.internalNotes, { at: nowIso(), by, body: body.trim() }],
          });
        },
        assign: (id, team, staffId) => {
          const m = find(id);
          if (!m) return { ok: false, reason: "Message not found." };
          const r = canAssign(m);
          if (!r.ok) return fail(r);
          return update("Assign", {
            ...m,
            team,
            assignedTo: staffId,
            status: m.status === "unanswered" ? "assigned" : m.status,
          });
        },
        markWaiting: (id) => {
          const m = find(id);
          if (!m) return { ok: false, reason: "Message not found." };
          const r = canMarkWaiting(m);
          if (!r.ok) return fail(r);
          return update("Waiting on them", { ...m, status: "waiting-on-them" });
        },
        resolve: (id) => {
          const m = find(id);
          if (!m) return { ok: false, reason: "Message not found." };
          const r = canResolve(m);
          if (!r.ok) return fail(r);
          return update("Resolve", { ...m, status: "resolved", resolvedAt: nowIso() });
        },
        reopen: (id) => {
          const m = find(id);
          if (!m) return { ok: false, reason: "Message not found." };
          const r = canReopen(m);
          if (!r.ok) return fail(r);
          return update("Reopen", {
            ...m,
            status: m.assignedTo || m.team ? "assigned" : "unanswered",
            resolvedAt: undefined,
          });
        },
        linkContact: (id, contactId) => {
          const m = find(id);
          if (!m) return { ok: false, reason: "Message not found." };
          return update("Link contact", { ...m, contactId });
        },
        create: (n) => {
          if (!get().data) return { ok: false, reason: "Data not loaded." };
          if (!n.name.trim()) return { ok: false, reason: "Enter who it's from" };
          if (!n.subject.trim()) return { ok: false, reason: "Enter a short summary" };
          const m: Message = {
            ...n,
            name: n.name.trim(),
            subject: n.subject.trim(),
            body: n.body.trim(),
            id: `M-${String(Math.max(0, ...get().data!.messages.map((x) => Number(x.id.replace(/\D/g, "")) || 0)) + 1).padStart(3, "0")}`,
            receivedAt: nowIso(),
            status: "unanswered",
            replies: [],
            internalNotes: [],
          };
          return {
            ok: true,
            undoId: kit.commit(n.source === "phone" ? "Log a call" : "New message", {
              created: { messages: [m] },
            }),
            id: m.id,
          };
        },
      };
    },
    {
      name: "openfield-inbox",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ data: s.data, undoStack: s.undoStack }),
    },
  ),
);

let started = false;
export function hydrateInbox(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  Promise.resolve(useInboxStore.persist.rehydrate()).then(() =>
    useInboxStore.getState().ensureSeeded(),
  );
}
