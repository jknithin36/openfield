// Contact selectors: "everything we know about this person, in one place".
import type { Contact, EventsData, LibraryData, Message } from "@/lib/types";
import { dayDiff } from "@/lib/library/selectors";
import { effectiveStatus } from "@/lib/events/selectors";

export type TimelineKind =
  "request" | "loan" | "return" | "registration" | "attendance" | "message" | "note";
export const TIMELINE_LABEL: Record<TimelineKind, string> = {
  request: "Request",
  loan: "Loan",
  return: "Return",
  registration: "Registration",
  attendance: "Attendance",
  message: "Message",
  note: "Note",
};

export type TimelineEntry = {
  id: string;
  kind: TimelineKind;
  at: string;
  title: string;
  detail?: string;
  href?: string;
};

/** One merged, newest-first history across Library, Events, Inbox and notes. */
export function timeline(
  c: Contact,
  lib: LibraryData,
  ev: EventsData,
  messages: Message[],
): TimelineEntry[] {
  const items = new Map(lib.items.map((i) => [i.id, i.name]));
  const events = new Map(ev.events.map((e) => [e.id, e.title]));
  const out: TimelineEntry[] = [];
  for (const r of lib.requests.filter((x) => x.contactId === c.id)) {
    const name = items.get(r.itemId) ?? r.itemId;
    out.push({
      id: `${r.id}-req`,
      kind: "request",
      at: r.requestedAt,
      title: `Requested ${name}`,
      detail: r.id,
      href: `/dashboard/library/catalog/${r.itemId}`,
    });
    if (r.shippedAt)
      out.push({
        id: `${r.id}-loan`,
        kind: "loan",
        at: r.shippedAt,
        title: `Borrowed ${name}`,
        detail: r.id,
        href: r.status === "on-loan" ? `/dashboard/library/on-loan?id=${r.id}` : undefined,
      });
    if (r.returnedAt)
      out.push({
        id: `${r.id}-ret`,
        kind: "return",
        at: r.returnedAt,
        title: `Returned ${name}`,
        detail: r.returnCheck?.condition === "needs-repair" ? "Needed repair" : undefined,
      });
    if (r.status === "lost")
      out.push({
        id: `${r.id}-lost`,
        kind: "return",
        at: r.dueAt ?? r.requestedAt,
        title: `${name} marked lost`,
        detail: r.lostNote,
      });
  }
  for (const r of ev.registrations.filter((x) => x.contactId === c.id)) {
    const title = events.get(r.eventId) ?? "an event";
    out.push({
      id: `${r.id}-reg`,
      kind: "registration",
      at: r.registeredAt,
      title: `${r.status === "waitlisted" ? "Joined the waitlist for" : r.status === "cancelled" ? "Registered (later cancelled) for" : "Registered for"} ${title}`,
      href: `/dashboard/events/${r.eventId}?tab=registrations&reg=${r.id}`,
    });
    if (r.status === "attended" && r.checkedInAt)
      out.push({
        id: `${r.id}-att`,
        kind: "attendance",
        at: r.checkedInAt,
        title: `Attended ${title}`,
      });
    if (r.status === "no-show")
      out.push({
        id: `${r.id}-ns`,
        kind: "attendance",
        at: ev.events.find((e) => e.id === r.eventId)?.startsAt ?? r.registeredAt,
        title: `Didn't come to ${title}`,
      });
  }
  for (const m of messages.filter((x) => x.contactId === c.id)) {
    out.push({
      id: m.id,
      kind: "message",
      at: m.receivedAt,
      title: m.subject,
      detail: m.source === "phone" ? "Phone call" : "Message",
      href: `/dashboard/inbox?id=${m.id}`,
    });
  }
  for (const n of c.notes ?? [])
    out.push({
      id: n.id,
      kind: "note",
      at: n.at,
      title: "Internal note",
      detail: `${n.by}: ${n.body}`,
    });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export function rightNow(
  c: Contact,
  lib: LibraryData,
  ev: EventsData,
  messages: Message[],
  now: Date,
) {
  const items = new Map(lib.items.map((i) => [i.id, i.name]));
  const events = new Map(ev.events.map((e) => [e.id, e]));
  const mine = lib.requests.filter((r) => r.contactId === c.id);
  const regs = ev.registrations.filter((r) => r.contactId === c.id);
  return {
    loans: mine
      .filter((r) => r.status === "on-loan" || r.status === "approved")
      .map((r) => ({
        r,
        name: items.get(r.itemId) ?? r.itemId,
        overdue: r.status === "on-loan" && !!r.dueAt && dayDiff(r.dueAt, now) > 0,
      })),
    waiting: mine
      .filter((r) => r.status === "waiting" || r.status === "waitlisted")
      .map((r) => ({ r, name: items.get(r.itemId) ?? r.itemId })),
    registrations: regs
      .filter(
        (r) =>
          (r.status === "registered" || r.status === "waitlisted") &&
          events.get(r.eventId) &&
          effectiveStatus(events.get(r.eventId)!, now) === "published",
      )
      .map((r) => ({ r, event: events.get(r.eventId)! })),
    messages: messages.filter((m) => m.contactId === c.id && m.status !== "resolved"),
    accommodations: ev.accommodations
      .filter(
        (a) =>
          a.status === "requested" &&
          regs.some((r) => r.id === a.registrationId && r.status !== "cancelled"),
      )
      .map((a) => ({ a, event: events.get(regs.find((r) => r.id === a.registrationId)!.eventId) })),
  };
}

export const activeLoanCount = (contactId: string, lib: LibraryData) =>
  lib.requests.filter(
    (r) => r.contactId === contactId && (r.status === "on-loan" || r.status === "approved"),
  ).length;

export const upcomingEventCount = (contactId: string, ev: EventsData, now: Date) =>
  ev.registrations.filter(
    (r) =>
      r.contactId === contactId &&
      r.status === "registered" &&
      ev.events.some((e) => e.id === r.eventId && effectiveStatus(e, now) === "published"),
  ).length;

/** Most recent touchpoint: "Feb 1, message". */
export function lastContact(
  c: Contact,
  lib: LibraryData,
  ev: EventsData,
  messages: Message[],
): { at: string; what: string } | null {
  const t = timeline(c, lib, ev, messages)[0];
  return t ? { at: t.at, what: t.kind === "note" ? "note" : t.kind } : null;
}

/** Same email or phone as someone else. */
export function findDuplicate(
  contacts: Contact[],
  email: string,
  phone: string,
  ignoreId?: string,
): Contact | undefined {
  const e = email.trim().toLowerCase();
  const p = phone.replace(/\D/g, "");
  return contacts.find(
    (c) =>
      c.id !== ignoreId &&
      ((e && c.email.toLowerCase() === e) || (p.length >= 7 && c.phone.replace(/\D/g, "") === p)),
  );
}
