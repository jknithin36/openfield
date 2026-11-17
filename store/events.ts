"use client";

// Events store: validated transitions, undo stack, persistence, reset.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createEventsData } from "@/data/events";
import {
  canArrange,
  canCancelEvent,
  canCancelRegistration,
  canCheckIn,
  canLowerSeats,
  canMarkNoShows,
  canMarkUnable,
  canPromote,
  canPublish,
  canRegister,
  canSendFollowUp,
  validateEvent,
  type EventInput,
} from "@/lib/events/rules";
import {
  eventById,
  partySize,
  registrationById,
  registrationsFor,
  seatsTaken,
  waitlistFor,
} from "@/lib/events/selectors";
import {
  applyChange,
  fail,
  MAX_UNDO,
  newId,
  nowIso,
  revertEntry,
  type Change,
  type UndoEntry,
} from "@/lib/store-kit";
import type {
  AccommodationRequest,
  AccommodationType,
  ActionResult,
  Contact,
  EventsData,
  EventSettings,
  OFEvent,
  Registration,
  RegistrationSource,
  Role,
} from "@/lib/types";

export const CURRENT_STAFF = "Sam Morgan";

export type NewPerson = { name: string; role: Role; email?: string; phone?: string };

type Result = ActionResult & { id?: string; message?: string };

type EventsState = {
  data: EventsData | null;
  undoStack: UndoEntry[];
  hydrated: boolean;
  ensureSeeded: () => void;
  resetDemoData: () => void;
  undo: (undoId: string) => boolean;

  createEvent: (input: EventInput, publish: boolean) => Result;
  updateEvent: (id: string, input: EventInput) => Result;
  publishEvent: (id: string) => ActionResult;
  duplicateEvent: (id: string) => Result;
  cancelEvent: (id: string, reason: string) => ActionResult;
  toggleReadiness: (id: string, key: keyof OFEvent["readiness"]) => ActionResult;

  addRegistration: (
    eventId: string,
    who: { contactId: string } | { person: NewPerson },
    source: RegistrationSource,
    accommodations?: Array<{ type: AccommodationType; details: string }>,
    opts?: { guests?: number; notes?: string },
  ) => Result & { ref?: string };
  cancelRegistration: (regId: string) => Result;
  promote: (regId: string) => ActionResult;
  checkIn: (regId: string) => ActionResult;
  walkIn: (eventId: string, person: NewPerson) => Result;
  markNoShows: (eventId: string) => Result;
  sendFollowUp: (eventId: string, resourcesUrl?: string) => ActionResult;

  arrange: (accId: string, note?: string) => ActionResult;
  arrangeMany: (accIds: string[]) => ActionResult & { count?: number };
  markUnable: (accId: string, note: string) => ActionResult;

  setSettings: (settings: EventSettings) => ActionResult;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "event";

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => {
      const commit = (label: string, change: Change): string => {
        const { next, entry } = applyChange(get().data!, label, change);
        set({ data: next, undoStack: [...get().undoStack, entry].slice(-MAX_UNDO) });
        return entry.id;
      };
      const newContact = (p: NewPerson): Contact => ({
        id: `p${newId()}`,
        name: p.name.trim(),
        role: p.role,
        email: p.email?.trim() ?? "",
        phone: p.phone?.trim() ?? "",
        address: "",
        region: "Riverbend",
        inRegion: true,
      });

      return {
        data: null,
        undoStack: [],
        hydrated: false,
        ensureSeeded: () => {
          if (!get().data) set({ data: createEventsData(new Date()) });
          set({ hydrated: true });
        },
        resetDemoData: () => set({ data: createEventsData(new Date()), undoStack: [] }),
        undo: (undoId) => {
          const entry = get().undoStack.find((e) => e.id === undoId);
          const data = get().data;
          if (!entry || !data) return false;
          set({
            data: revertEntry(data, entry),
            undoStack: get().undoStack.filter((e) => e.id !== undoId),
          });
          return true;
        },

        // ── Events ──────────────────────────────────────────────────────────
        createEvent: (input, publish) => {
          const data = get().data;
          if (!data) return { ok: false, reason: "Data not loaded." };
          const errs = validateEvent(input);
          if (errs.length) return { ok: false, reason: errs[0].message };
          let slug = slugify(input.title);
          while (data.events.some((e) => e.slug === slug)) slug = `${slug}-2`;
          const ev: OFEvent = {
            ...input,
            title: input.title.trim(),
            id: `ev-${newId()}`,
            slug,
            status: publish ? "published" : "draft",
            readiness: { venueConfirmed: false, materialsReady: false, remindersSent: false },
          };
          const undoId = commit(publish ? "Publish event" : "Save draft", {
            created: { events: [ev] },
          });
          return { ok: true, undoId, id: ev.id };
        },
        updateEvent: (id, input) => {
          const data = get().data;
          const ev = data && eventById(data, id);
          if (!data || !ev) return { ok: false, reason: "Event not found." };
          const errs = validateEvent(input);
          if (errs.length) return { ok: false, reason: errs[0].message };
          const seats = canLowerSeats(data, id, input.seats);
          if (!seats.ok) return fail(seats);
          return {
            ok: true,
            undoId: commit("Edit event", {
              updated: { events: [{ ...ev, ...input, title: input.title.trim() }] },
            }),
            id,
          };
        },
        publishEvent: (id) => {
          const data = get().data;
          const ev = data && eventById(data, id);
          if (!ev) return { ok: false, reason: "Event not found." };
          const r = canPublish(ev);
          if (!r.ok) return fail(r);
          return {
            ok: true,
            undoId: commit("Publish event", {
              updated: { events: [{ ...ev, status: "published" }] },
            }),
          };
        },
        duplicateEvent: (id) => {
          const data = get().data;
          const ev = data && eventById(data, id);
          if (!data || !ev) return { ok: false, reason: "Event not found." };
          const copy: OFEvent = {
            ...ev,
            id: `ev-${newId()}`,
            slug: `${ev.slug}-copy-${data.events.length}`,
            title: `${ev.title} (copy)`,
            status: "draft",
            readiness: { venueConfirmed: false, materialsReady: false, remindersSent: false },
            followUp: undefined,
            cancelReason: undefined,
          };
          return {
            ok: true,
            undoId: commit("Duplicate event", { created: { events: [copy] } }),
            id: copy.id,
          };
        },
        cancelEvent: (id, reason) => {
          const data = get().data;
          const ev = data && eventById(data, id);
          if (!data || !ev) return { ok: false, reason: "Event not found." };
          const r = canCancelEvent(ev, reason, new Date());
          if (!r.ok) return fail(r);
          const at = nowIso();
          const regs = registrationsFor(data, id)
            .filter((x) => x.status === "registered" || x.status === "waitlisted")
            .map((x) => ({ ...x, status: "cancelled" as const, cancelledAt: at }));
          return {
            ok: true,
            undoId: commit("Cancel event", {
              updated: {
                events: [{ ...ev, status: "cancelled", cancelReason: reason.trim() }],
                registrations: regs,
              },
            }),
          };
        },
        toggleReadiness: (id, key) => {
          const ev = get().data && eventById(get().data!, id);
          if (!ev) return { ok: false, reason: "Event not found." };
          return {
            ok: true,
            undoId: commit("Update checklist", {
              updated: {
                events: [{ ...ev, readiness: { ...ev.readiness, [key]: !ev.readiness[key] } }],
              },
            }),
          };
        },

        // ── Registrations ───────────────────────────────────────────────────
        addRegistration: (eventId, who, source, accs = [], opts = {}) => {
          const data = get().data;
          const ev = data ? eventById(data, eventId) : undefined;
          if (!data) return { ok: false, reason: "Data not loaded." };
          const r = canRegister(ev, new Date());
          if (!r.ok || !ev) return fail(r);
          let contactId: string;
          const created: Change["created"] = {};
          if ("contactId" in who) contactId = who.contactId;
          else {
            if (!who.person.name.trim()) return { ok: false, reason: "Enter the person's name" };
            const c = newContact(who.person);
            contactId = c.id;
            created.contacts = [c];
          }
          if (
            data.registrations.some(
              (x) => x.eventId === eventId && x.contactId === contactId && x.status !== "cancelled",
            )
          )
            return { ok: false, reason: "This person is already registered." };
          const guests = Math.max(0, Math.min(opts.guests ?? 0, data.settings.maxGuests ?? 3));
          const full = seatsTaken(data, eventId) + 1 + guests > ev.seats;
          const lastRef = Math.max(
            1000,
            ...data.registrations.map((x) => Number(x.ref?.replace(/\D/g, "")) || 0),
          );
          const reg: Registration = {
            id: `REG-${newId()}`,
            eventId,
            contactId,
            status: full ? "waitlisted" : "registered",
            registeredAt: nowIso(),
            source,
            ...(guests ? { guests } : {}),
            ...(opts.notes?.trim() ? { notes: opts.notes.trim().slice(0, 1000) } : {}),
            ...(source === "website" ? { ref: `E-${lastRef + 1}` } : {}),
          };
          created.registrations = [reg];
          const accRecs: AccommodationRequest[] = accs
            .filter((a) => a.details.trim() || a.type !== "other")
            .map((a) => ({
              id: `ACC-${newId()}`,
              registrationId: reg.id,
              type: a.type,
              details: a.details.trim(),
              status: "requested",
            }));
          if (accRecs.length) created.accommodations = accRecs;
          return {
            ok: true,
            undoId: commit("Add registration", { created }),
            id: reg.id,
            ref: reg.ref,
            message: full ? "The event is full, so they were added to the waitlist." : undefined,
          };
        },
        cancelRegistration: (regId) => {
          const data = get().data;
          const reg = data && registrationById(data, regId);
          if (!data || !reg) return { ok: false, reason: "Registration not found." };
          const r = canCancelRegistration(reg);
          if (!r.ok) return fail(r);
          const updated: Registration[] = [{ ...reg, status: "cancelled", cancelledAt: nowIso() }];
          let message: string | undefined;
          // Freed seats go to the oldest people on the waitlist whose party fits.
          if (reg.status === "registered") {
            const ev = eventById(data, reg.eventId);
            let free = (ev?.seats ?? 0) - (seatsTaken(data, reg.eventId) - partySize(reg));
            for (const next of waitlistFor(data, reg.eventId)) {
              if (partySize(next) > free) continue;
              updated.push({ ...next, status: "registered" });
              free -= partySize(next);
              message ??= next.contactId;
              if (free <= 0) break;
            }
          }
          return {
            ok: true,
            undoId: commit("Cancel registration", { updated: { registrations: updated } }),
            message,
          };
        },
        promote: (regId) => {
          const data = get().data;
          const reg = data && registrationById(data, regId);
          if (!data || !reg) return { ok: false, reason: "Registration not found." };
          const r = canPromote(data, reg);
          if (!r.ok) return fail(r);
          return {
            ok: true,
            undoId: commit("Move from waitlist", {
              updated: { registrations: [{ ...reg, status: "registered" }] },
            }),
          };
        },
        checkIn: (regId) => {
          const data = get().data;
          const reg = data && registrationById(data, regId);
          if (!data || !reg) return { ok: false, reason: "Registration not found." };
          const r = canCheckIn(data, reg);
          if (!r.ok) return fail(r);
          return {
            ok: true,
            undoId: commit("Check in", {
              updated: { registrations: [{ ...reg, status: "attended", checkedInAt: nowIso() }] },
            }),
          };
        },
        walkIn: (eventId, person) => {
          const data = get().data;
          const ev = data && eventById(data, eventId);
          if (!data || !ev) return { ok: false, reason: "Event not found." };
          if (!person.name.trim()) return { ok: false, reason: "Enter the person's name" };
          const c = newContact(person);
          const at = nowIso();
          const reg: Registration = {
            id: `REG-${newId()}`,
            eventId,
            contactId: c.id,
            status: "attended",
            registeredAt: at,
            checkedInAt: at,
            source: "staff",
            notes: "Walk-in",
          };
          return {
            ok: true,
            undoId: commit("Walk-in", { created: { contacts: [c], registrations: [reg] } }),
            id: reg.id,
          };
        },
        markNoShows: (eventId) => {
          const data = get().data;
          const ev = data && eventById(data, eventId);
          if (!data || !ev) return { ok: false, reason: "Event not found." };
          const r = canMarkNoShows(ev, new Date());
          if (!r.ok) return fail(r);
          const regs = registrationsFor(data, eventId)
            .filter((x) => x.status === "registered")
            .map((x) => ({ ...x, status: "no-show" as const }));
          if (!regs.length)
            return { ok: false, reason: "Everyone has been checked in or marked already." };
          return {
            ok: true,
            undoId: commit("Mark no-shows", { updated: { registrations: regs } }),
            message: String(regs.length),
          };
        },
        sendFollowUp: (eventId, resourcesUrl) => {
          const ev = get().data && eventById(get().data!, eventId);
          if (!ev) return { ok: false, reason: "Event not found." };
          const r = canSendFollowUp(ev, new Date());
          if (!r.ok) return fail(r);
          return {
            ok: true,
            undoId: commit("Send follow-up", {
              updated: {
                events: [
                  {
                    ...ev,
                    followUp: { sentAt: nowIso(), resourcesUrl: resourcesUrl?.trim() || undefined },
                  },
                ],
              },
            }),
          };
        },

        // ── Accommodations ──────────────────────────────────────────────────
        arrange: (accId, note) => {
          const a = get().data?.accommodations.find((x) => x.id === accId);
          if (!a) return { ok: false, reason: "Request not found." };
          const r = canArrange(a);
          if (!r.ok) return fail(r);
          return {
            ok: true,
            undoId: commit("Mark arranged", {
              updated: {
                accommodations: [
                  {
                    ...a,
                    status: "arranged",
                    arrangedAt: nowIso(),
                    arrangedBy: CURRENT_STAFF,
                    note: note?.trim() || a.note,
                  },
                ],
              },
            }),
          };
        },
        arrangeMany: (accIds) => {
          const data = get().data;
          if (!data) return { ok: false, reason: "Data not loaded." };
          const at = nowIso();
          const recs = data.accommodations
            .filter((a) => accIds.includes(a.id) && canArrange(a).ok)
            .map((a) => ({
              ...a,
              status: "arranged" as const,
              arrangedAt: at,
              arrangedBy: CURRENT_STAFF,
            }));
          if (!recs.length) return { ok: false, reason: "Nothing to arrange." };
          return {
            ok: true,
            undoId: commit(`Mark ${recs.length} arranged`, { updated: { accommodations: recs } }),
            count: recs.length,
          };
        },
        markUnable: (accId, note) => {
          const a = get().data?.accommodations.find((x) => x.id === accId);
          if (!a) return { ok: false, reason: "Request not found." };
          const r = canMarkUnable(a, note);
          if (!r.ok) return fail(r);
          return {
            ok: true,
            undoId: commit("Can't arrange", {
              updated: { accommodations: [{ ...a, status: "unable", note: note.trim() }] },
            }),
          };
        },

        setSettings: (settings) => {
          if (!get().data) return { ok: false, reason: "Data not loaded." };
          return { ok: true, undoId: commit("Change event rules", { fields: { settings } }) };
        },
      };
    },
    {
      name: "openfield-events",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ data: s.data, undoStack: s.undoStack }),
    },
  ),
);

let started = false;
export function hydrateEvents(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  Promise.resolve(useEventsStore.persist.rehydrate()).then(() =>
    useEventsStore.getState().ensureSeeded(),
  );
}
