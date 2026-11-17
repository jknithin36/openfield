"use client";

// Contacts: the single source of truth for people (library + events).
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createPeople } from "@/data/people";
import { validateContact } from "@/lib/contacts/rules";
import { newId, nowIso, storeKit, type UndoEntry } from "@/lib/store-kit";
import type { ActionResult, Contact } from "@/lib/types";

export type ContactsData = { contacts: Contact[] };
export type ContactInput = Pick<
  Contact,
  "name" | "role" | "email" | "phone" | "address" | "region" | "inRegion"
> &
  Partial<Pick<Contact, "tags" | "preferredContact" | "accessibilityNeeds">>;

type State = {
  data: ContactsData | null;
  undoStack: UndoEntry[];
  hydrated: boolean;
  ensureSeeded: () => void;
  resetDemoData: () => void;
  undo: (id: string) => boolean;
  addContact: (input: ContactInput) => ActionResult & { id?: string };
  addMany: (inputs: ContactInput[]) => ActionResult & { count?: number };
  updateContact: (id: string, patch: Partial<ContactInput>) => ActionResult;
  /** Upsert a person created elsewhere (e.g. Events walk-in) so edits stick. */
  setConsent: (id: string, key: "newsletter" | "storiesAndPhotos", value: boolean) => ActionResult;
  addNote: (id: string, body: string, by: string) => ActionResult;
  editNote: (id: string, noteId: string, body: string) => ActionResult;
  deleteContact: (id: string, allowed: boolean, reason?: string) => ActionResult;
};

export const useContactsStore = create<State>()(
  persist(
    (set, get) => {
      const kit = storeKit<ContactsData>(get, set);
      const find = (id: string) => get().data?.contacts.find((c) => c.id === id);
      const build = (i: ContactInput): Contact => ({
        id: `p${newId()}`,
        name: i.name.trim(),
        role: i.role,
        email: i.email.trim(),
        phone: i.phone.trim(),
        address: i.address.trim(),
        region: i.region.trim() || "Riverbend",
        inRegion: i.inRegion,
        tags: i.tags ?? [],
        preferredContact: i.preferredContact ?? "email",
        accessibilityNeeds: i.accessibilityNeeds?.trim() || undefined,
        consent: { newsletter: false, storiesAndPhotos: false },
        createdAt: nowIso(),
        notes: [],
      });
      return {
        data: null,
        undoStack: [],
        hydrated: false,
        ensureSeeded: () => {
          if (!get().data) set({ data: { contacts: createPeople(new Date()) } });
          set({ hydrated: true });
        },
        resetDemoData: () => set({ data: { contacts: createPeople(new Date()) }, undoStack: [] }),
        undo: (id) => kit.undo(id),
        addContact: (input) => {
          if (!get().data) return { ok: false, reason: "Data not loaded." };
          const errs = validateContact(input);
          if (errs.length) return { ok: false, reason: errs[0].message };
          const c = build(input);
          return {
            ok: true,
            undoId: kit.commit("Add contact", { created: { contacts: [c] } }),
            id: c.id,
          };
        },
        addMany: (inputs) => {
          if (!get().data) return { ok: false, reason: "Data not loaded." };
          const valid = inputs.filter((i) => !validateContact(i).length).map(build);
          if (!valid.length) return { ok: false, reason: "No valid rows to import." };
          return {
            ok: true,
            undoId: kit.commit(`Import ${valid.length} contacts`, { created: { contacts: valid } }),
            count: valid.length,
          };
        },
        updateContact: (id, patch) => {
          const c = find(id);
          if (!c) return { ok: false, reason: "Contact not found." };
          const next = { ...c, ...patch };
          const errs = validateContact(next);
          if (errs.length) return { ok: false, reason: errs[0].message };
          return {
            ok: true,
            undoId: kit.commit("Edit contact", { updated: { contacts: [next] } }),
          };
        },
        setConsent: (id, key, value) => {
          const c = find(id);
          if (!c) return { ok: false, reason: "Contact not found." };
          const consent = {
            newsletter: false,
            storiesAndPhotos: false,
            ...c.consent,
            [key]: value,
            changedAt: nowIso(),
          };
          return {
            ok: true,
            undoId: kit.commit("Change consent", { updated: { contacts: [{ ...c, consent }] } }),
          };
        },
        addNote: (id, body, by) => {
          const c = find(id);
          if (!c) return { ok: false, reason: "Contact not found." };
          if (!body.trim()) return { ok: false, reason: "Write the note" };
          const notes = [
            { id: `n${newId()}`, at: nowIso(), by, body: body.trim() },
            ...(c.notes ?? []),
          ];
          return {
            ok: true,
            undoId: kit.commit("Add note", { updated: { contacts: [{ ...c, notes }] } }),
          };
        },
        editNote: (id, noteId, body) => {
          const c = find(id);
          if (!c) return { ok: false, reason: "Contact not found." };
          if (!body.trim()) return { ok: false, reason: "Write the note" };
          const notes = (c.notes ?? []).map((n) =>
            n.id === noteId ? { ...n, body: body.trim() } : n,
          );
          return {
            ok: true,
            undoId: kit.commit("Edit note", { updated: { contacts: [{ ...c, notes }] } }),
          };
        },
        deleteContact: (id, allowed, reason) => {
          if (!allowed) return { ok: false, reason: reason ?? "This contact can't be deleted." };
          if (!find(id)) return { ok: false, reason: "Contact not found." };
          return {
            ok: true,
            undoId: kit.commit("Delete contact", { deleted: { contacts: [id] } }),
          };
        },
      };
    },
    {
      name: "openfield-contacts",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ data: s.data, undoStack: s.undoStack }),
    },
  ),
);

let started = false;
export function hydrateContacts(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  Promise.resolve(useContactsStore.persist.rehydrate()).then(() =>
    useContactsStore.getState().ensureSeeded(),
  );
}
