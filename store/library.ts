"use client";

// The library store: state, validated transitions, undo stack, persistence.
// Pages NEVER change library data directly — only through these actions.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createLibraryData } from "@/data/library";
import {
  canApprove,
  canCheckIn,
  canDecline,
  canExtend,
  canFinishRepair,
  canMarkLost,
  canMarkReady,
  canPickUp,
  canRemind,
  canRetire,
  canSendToRepair,
  canSetCopies,
  canShelve,
  canShip,
  canTogglePart,
  canWaitlist,
} from "@/lib/library/rules";
import { getAvailability, itemById, requestById } from "@/lib/library/selectors";
import type {
  ActionResult,
  DeclineReason,
  Delivery,
  ItemType,
  LibraryData,
  LibraryItem,
  LoanRequest,
  ReminderChannel,
  ReturnCheck,
  RuleResult,
} from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;
/** Demo staff member performing actions. */
export const CURRENT_STAFF = "Sam Morgan";
const MAX_UNDO = 50;

/** Exact previous versions of everything an action changed. */
export type UndoEntry = {
  id: string;
  label: string;
  at: string;
  requests: LoanRequest[];
  items: LibraryItem[];
  /** Items the action created (removed again on undo). */
  createdItemIds: string[];
};

export type NewItemInput = {
  name: string;
  type: ItemType;
  center: LibraryItem["center"];
  ageRange: string;
  loanDays: number;
  maxExtensions: number;
  copies: number;
  description: string;
  parts: string[];
};

export type BulkResult = {
  done: string[];
  skipped: Array<{ id: string; reason: string }>;
  undoId?: string;
};

type LibraryState = {
  data: LibraryData | null;
  undoStack: UndoEntry[];
  hydrated: boolean;

  ensureSeeded: () => void;
  resetDemoData: () => void;
  undo: (undoId: string) => boolean;

  // Requests
  approve: (id: string) => ActionResult;
  waitlist: (id: string) => ActionResult;
  decline: (id: string, reason: DeclineReason, note: string) => ActionResult;
  // To ship
  togglePart: (id: string, part: string) => ActionResult;
  markShipped: (id: string) => ActionResult;
  markShippedMany: (ids: string[]) => BulkResult;
  markReadyForPickup: (id: string) => ActionResult;
  markPickedUp: (id: string) => ActionResult;
  // On loan
  sendReminder: (id: string, channel: ReminderChannel) => ActionResult;
  sendReminders: (ids: string[]) => BulkResult;
  extendLoan: (id: string, weeks: number) => ActionResult;
  checkIn: (id: string) => ActionResult;
  markLost: (id: string, note: string) => ActionResult;
  // Returns & cleaning
  backOnShelf: (id: string, check: ReturnCheck) => ActionResult;
  sendToRepair: (id: string, check: ReturnCheck) => ActionResult;
  finishRepair: (id: string) => ActionResult;
  retireFromRepair: (id: string, note: string) => ActionResult;
  // Catalog
  addItem: (input: NewItemInput) => ActionResult & { itemId?: string };
  updateItem: (id: string, patch: Partial<NewItemInput>) => ActionResult;
  setArchived: (id: string, archived: boolean) => ActionResult;
  setSettings: (settings: LibraryData["settings"]) => ActionResult;
  /** A request from the public website. No undo: the visitor sent it. */
  addPublicRequest: (input: {
    itemId: string;
    contactId: string;
    note: string;
    delivery: Delivery;
    shipTo?: string;
  }) => { ok: true; ref: string; waitlisted: boolean } | { ok: false; reason: string };
};

const nowIso = () => new Date().toISOString();
const addDays = (iso: string, days: number) =>
  new Date(new Date(iso).getTime() + days * DAY).toISOString();
const newId = () => `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const fail = (r: RuleResult): ActionResult =>
  r.ok ? { ok: false, reason: "Unknown error" } : { ok: false, reason: r.reason };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "item";

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => {
      /**
       * Apply changed requests/items in one step and push an undo entry
       * holding their exact previous versions.
       */
      const commit = (
        label: string,
        changes: { requests?: LoanRequest[]; items?: LibraryItem[]; created?: LibraryItem[] },
      ): string => {
        const data = get().data!;
        const reqIds = new Set((changes.requests ?? []).map((r) => r.id));
        const itemIds = new Set((changes.items ?? []).map((i) => i.id));
        const entry: UndoEntry = {
          id: newId(),
          label,
          at: nowIso(),
          requests: data.requests.filter((r) => reqIds.has(r.id)),
          items: data.items.filter((i) => itemIds.has(i.id)),
          createdItemIds: (changes.created ?? []).map((i) => i.id),
        };
        const reqMap = new Map((changes.requests ?? []).map((r) => [r.id, r]));
        const itemMap = new Map((changes.items ?? []).map((i) => [i.id, i]));
        set({
          data: {
            ...data,
            requests: data.requests.map((r) => reqMap.get(r.id) ?? r),
            items: [...data.items.map((i) => itemMap.get(i.id) ?? i), ...(changes.created ?? [])],
          },
          undoStack: [...get().undoStack, entry].slice(-MAX_UNDO),
        });
        return entry.id;
      };

      /** Look up a request (and its item), run its rule, then commit. */
      const withRequest = (
        id: string,
        rule: (data: LibraryData, r: LoanRequest, item: LibraryItem) => RuleResult,
        apply: (r: LoanRequest, item: LibraryItem) => { request: LoanRequest; item?: LibraryItem },
        label: string,
      ): ActionResult => {
        const data = get().data;
        const r = data && requestById(data, id);
        const item = data && r && itemById(data, r.itemId);
        if (!data || !r || !item) return { ok: false, reason: "Request not found." };
        const check = rule(data, r, item);
        if (!check.ok) return fail(check);
        const next = apply(r, item);
        const undoId = commit(label, {
          requests: [next.request],
          items: next.item ? [next.item] : [],
        });
        return { ok: true, undoId };
      };

      const sendOut = (r: LoanRequest, item: LibraryItem): LoanRequest => {
        const at = nowIso();
        return { ...r, status: "on-loan", shippedAt: at, dueAt: addDays(at, item.loanDays) };
      };

      return {
        data: null,
        undoStack: [],
        hydrated: false,

        ensureSeeded: () => {
          if (!get().data) set({ data: createLibraryData(new Date()) });
          set({ hydrated: true });
        },
        resetDemoData: () => set({ data: createLibraryData(new Date()), undoStack: [] }),

        undo: (undoId) => {
          const data = get().data;
          const entry = get().undoStack.find((e) => e.id === undoId);
          if (!data || !entry) return false;
          if (entry.label.startsWith("{")) {
            // Settings change: restore the previous rules.
            set({
              data: { ...data, settings: JSON.parse(entry.label) },
              undoStack: get().undoStack.filter((e) => e.id !== undoId),
            });
            return true;
          }
          const reqMap = new Map(entry.requests.map((r) => [r.id, r]));
          const itemMap = new Map(entry.items.map((i) => [i.id, i]));
          const created = new Set(entry.createdItemIds);
          set({
            data: {
              ...data,
              requests: data.requests.map((r) => reqMap.get(r.id) ?? r),
              items: data.items
                .filter((i) => !created.has(i.id))
                .map((i) => itemMap.get(i.id) ?? i),
            },
            undoStack: get().undoStack.filter((e) => e.id !== undoId),
          });
          return true;
        },

        // ── Requests ────────────────────────────────────────────────────────
        approve: (id) =>
          withRequest(
            id,
            (d, r) => canApprove(d, r),
            (r, item) => {
              const at = nowIso();
              return {
                request: {
                  ...r,
                  status: "approved",
                  approvedAt: at,
                  dueAt: addDays(at, item.loanDays), // preview; reset when it leaves
                  packedParts: [],
                  readyForPickupAt: undefined,
                },
              };
            },
            "Approve request",
          ),

        waitlist: (id) =>
          withRequest(
            id,
            (d, r) => canWaitlist(d, r),
            (r) => ({
              request: { ...r, status: "waitlisted" },
            }),
            "Add to waitlist",
          ),

        decline: (id, reason, note) =>
          withRequest(
            id,
            (_d, r) => {
              const base = canDecline(r);
              if (!base.ok) return base;
              if (reason === "other" && !note.trim())
                return { ok: false, reason: "Write a note explaining why" };
              return { ok: true };
            },
            (r) => ({
              request: {
                ...r,
                status: "declined",
                declineReason: reason,
                declineNote: note.trim() || undefined,
              },
            }),
            "Decline request",
          ),

        // ── To ship ─────────────────────────────────────────────────────────
        togglePart: (id, part) =>
          withRequest(
            id,
            (_d, r) => canTogglePart(r),
            (r) => {
              const packed = new Set(r.packedParts);
              if (packed.has(part)) packed.delete(part);
              else packed.add(part);
              return { request: { ...r, packedParts: [...packed] } };
            },
            "Tick part",
          ),

        markShipped: (id) =>
          withRequest(
            id,
            (d, r) => canShip(d, r),
            (r, item) => ({
              request: sendOut(r, item),
            }),
            "Mark shipped",
          ),

        markShippedMany: (ids) => {
          const data = get().data;
          if (!data) return { done: [], skipped: [] };
          const done: LoanRequest[] = [];
          const skipped: BulkResult["skipped"] = [];
          for (const id of ids) {
            const r = requestById(data, id);
            const item = r && itemById(data, r.itemId);
            if (!r || !item) continue;
            const check = canShip(data, r);
            if (check.ok) done.push(sendOut(r, item));
            else skipped.push({ id, reason: check.reason });
          }
          const undoId = done.length
            ? commit(`Mark ${done.length} shipped`, { requests: done })
            : undefined;
          return { done: done.map((r) => r.id), skipped, undoId };
        },

        markReadyForPickup: (id) =>
          withRequest(
            id,
            (d, r) => canMarkReady(d, r),
            (r) => ({
              request: { ...r, readyForPickupAt: nowIso() },
            }),
            "Mark ready for pickup",
          ),

        markPickedUp: (id) =>
          withRequest(
            id,
            (_d, r) => canPickUp(r),
            (r, item) => ({
              request: sendOut(r, item),
            }),
            "Mark picked up",
          ),

        // ── On loan ─────────────────────────────────────────────────────────
        sendReminder: (id, channel) =>
          withRequest(
            id,
            (_d, r) => canRemind(r),
            (r) => ({
              request: {
                ...r,
                reminders: [...r.reminders, { at: nowIso(), channel, by: CURRENT_STAFF }],
              },
            }),
            "Send reminder",
          ),

        sendReminders: (ids) => {
          const data = get().data;
          if (!data) return { done: [], skipped: [] };
          const done: LoanRequest[] = [];
          const skipped: BulkResult["skipped"] = [];
          for (const id of ids) {
            const r = requestById(data, id);
            if (!r) continue;
            const check = canRemind(r);
            if (check.ok)
              done.push({
                ...r,
                reminders: [...r.reminders, { at: nowIso(), channel: "email", by: CURRENT_STAFF }],
              });
            else skipped.push({ id, reason: check.reason });
          }
          const undoId = done.length
            ? commit(`Send ${done.length} reminders`, { requests: done })
            : undefined;
          return { done: done.map((r) => r.id), skipped, undoId };
        },

        extendLoan: (id, weeks) =>
          withRequest(
            id,
            (d, r) => {
              if (!d.settings.extensionWeeks.includes(weeks))
                return { ok: false, reason: "Choose how long to extend the loan" };
              return canExtend(d, r);
            },
            (r) => ({
              request: {
                ...r,
                dueAt: addDays(r.dueAt ?? nowIso(), weeks * 7),
                extendedBy: (r.extendedBy ?? 0) + weeks * 7,
                extensionCount: (r.extensionCount ?? 0) + 1,
              },
            }),
            "Extend loan",
          ),

        checkIn: (id) =>
          withRequest(
            id,
            (_d, r) => canCheckIn(r),
            (r) => ({
              request: { ...r, status: "returned", returnedAt: nowIso(), returnCheck: undefined },
            }),
            "Check in return",
          ),

        markLost: (id, note) =>
          withRequest(
            id,
            (_d, r) => canMarkLost(r, note),
            (r, item) => ({
              request: { ...r, status: "lost", lostNote: note.trim() },
              item: { ...item, copies: Math.max(0, item.copies - 1) },
            }),
            "Mark lost",
          ),

        // ── Returns & cleaning ──────────────────────────────────────────────
        backOnShelf: (id, check) =>
          withRequest(
            id,
            (d, r) => canShelve(d, r, check),
            (r) => {
              const at = nowIso();
              return {
                request: {
                  ...r,
                  status: "closed",
                  closedAt: at,
                  returnCheck: { ...check, checkedBy: CURRENT_STAFF, checkedAt: at },
                },
              };
            },
            "Back on shelf",
          ),

        sendToRepair: (id, check) =>
          withRequest(
            id,
            (_d, r) => canSendToRepair(r, check),
            (r) => ({
              request: {
                ...r,
                status: "in-repair",
                returnCheck: {
                  ...check,
                  condition: "needs-repair",
                  checkedBy: CURRENT_STAFF,
                  checkedAt: nowIso(),
                },
              },
            }),
            "Send to repair",
          ),

        finishRepair: (id) =>
          withRequest(
            id,
            (_d, r) => canFinishRepair(r),
            (r) => ({
              request: { ...r, status: "closed", closedAt: nowIso() },
            }),
            "Repaired, back on shelf",
          ),

        retireFromRepair: (id, note) =>
          withRequest(
            id,
            (_d, r) => canRetire(r, note),
            (r, item) => ({
              request: { ...r, status: "closed", closedAt: nowIso(), retireNote: note.trim() },
              item: { ...item, copies: Math.max(0, item.copies - 1) },
            }),
            "Retire item",
          ),

        // ── Catalog ─────────────────────────────────────────────────────────
        addItem: (input) => {
          const data = get().data;
          if (!data) return { ok: false, reason: "Data not loaded." };
          if (!input.name.trim()) return { ok: false, reason: "Enter the item name" };
          const copies = canSetCopies(data, "__new__", input.copies);
          if (!copies.ok) return fail(copies);
          let slug = slugify(input.name);
          while (data.items.some((i) => i.id === slug)) slug = `${slug}-2`;
          const item: LibraryItem = {
            ...input,
            name: input.name.trim(),
            parts: input.parts.map((p) => p.trim()).filter(Boolean),
            id: slug,
            slug,
            archived: false,
            addedAt: nowIso(),
          };
          const undoId = commit("Add item", { created: [item] });
          return { ok: true, undoId, itemId: item.id };
        },

        updateItem: (id, patch) => {
          const data = get().data;
          const item = data && itemById(data, id);
          if (!data || !item) return { ok: false, reason: "Item not found." };
          if (patch.name !== undefined && !patch.name.trim())
            return { ok: false, reason: "Enter the item name" };
          if (patch.copies !== undefined) {
            const check = canSetCopies(data, id, patch.copies);
            if (!check.ok) return fail(check);
          }
          const next: LibraryItem = {
            ...item,
            ...patch,
            parts: patch.parts ? patch.parts.map((p) => p.trim()).filter(Boolean) : item.parts,
          };
          return { ok: true, undoId: commit("Edit item", { items: [next] }) };
        },

        addPublicRequest: ({ itemId, contactId, note, delivery, shipTo }) => {
          const data = get().data;
          const item = data && itemById(data, itemId);
          if (!data || !item || item.archived)
            return { ok: false, reason: "This item can't be requested right now." };
          if (
            data.requests.some(
              (r) =>
                r.itemId === itemId &&
                r.contactId === contactId &&
                (r.status === "waiting" || r.status === "waitlisted"),
            )
          )
            return {
              ok: false,
              reason: "You've already asked for this item. We'll be in touch soon.",
            };
          if (delivery === "ship" && !shipTo?.trim())
            return { ok: false, reason: "Enter the address to ship it to" };
          const max = Math.max(
            1000,
            ...data.requests.map((r) => Number(r.id.replace(/\D/g, "")) || 0),
          );
          const free = getAvailability(data, itemId).free;
          const request: LoanRequest = {
            id: `R-${max + 1}`,
            itemId,
            contactId,
            note: note.trim().slice(0, 500),
            delivery,
            source: "website",
            shipTo: delivery === "ship" ? shipTo?.trim() : undefined,
            status: free > 0 ? "waiting" : "waitlisted",
            requestedAt: nowIso(),
            packedParts: [],
            reminders: [],
          };
          set({ data: { ...data, requests: [...data.requests, request] } });
          return { ok: true, ref: request.id, waitlisted: request.status === "waitlisted" };
        },

        setSettings: (settings) => {
          const data = get().data;
          if (!data) return { ok: false, reason: "Data not loaded." };
          if (
            !(settings.loanLimitPerPerson >= 1) ||
            !(settings.waitingTargetDays >= 0) ||
            !settings.extensionWeeks.length
          )
            return { ok: false, reason: "Enter whole numbers, and at least one extension option" };
          const entry: UndoEntry = {
            id: newId(),
            label: "Library rules",
            at: nowIso(),
            requests: [],
            items: [],
            createdItemIds: [],
          };
          // Settings undo: stash the old settings in a synthetic item-less entry.
          const prev = data.settings;
          set({
            data: { ...data, settings },
            undoStack: [...get().undoStack, { ...entry, label: JSON.stringify(prev) }].slice(
              -MAX_UNDO,
            ),
          });
          return { ok: true, undoId: entry.id };
        },

        setArchived: (id, archived) => {
          const data = get().data;
          const item = data && itemById(data, id);
          if (!data || !item) return { ok: false, reason: "Item not found." };
          if (item.archived === archived)
            return { ok: false, reason: archived ? "Already archived." : "Not archived." };
          return {
            ok: true,
            undoId: commit(archived ? "Archive item" : "Unarchive item", {
              items: [{ ...item, archived }],
            }),
          };
        },
      };
    },
    {
      name: "openfield-library",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ data: s.data, undoStack: s.undoStack }),
    },
  ),
);

/** Load saved data (or create it) once, in the browser. */
let started = false;
export function hydrateLibrary(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  Promise.resolve(useLibraryStore.persist.rehydrate()).then(() =>
    useLibraryStore.getState().ensureSeeded(),
  );
}
