// Derived event facts. Pure functions of (data, contacts, now). Seats taken,
// waitlist order, readiness, deadlines and counts are never stored.
import type {
  AccommodationRequest,
  AccommodationType,
  Contact,
  EventsData,
  EventStatus,
  OFEvent,
  Registration,
  Role,
} from "@/lib/types";
import { dayDiff } from "@/lib/library/selectors";
import { formatMonthDay, plural } from "@/lib/format";

const DAY = 86400000;

// ── Labels ──────────────────────────────────────────────────────────────────
export const EVENT_TYPE_LABEL = {
  conference: "Conference",
  webinar: "Webinar",
  workshop: "Workshop",
  "family-night": "Family night",
} as const;
export const FORMAT_LABEL = {
  online: "Online",
  "in-person": "In person",
  hybrid: "Hybrid (in person and online)",
} as const;
export const ACCESS_LABEL = {
  captions: "Live captions",
  asl: "ASL interpreters",
  "wheelchair-access": "Wheelchair access",
  "quiet-room": "Quiet room",
  childcare: "Childcare",
  "large-print": "Large print",
} as const;
export const ACC_TYPE_LABEL: Record<AccommodationType, string> = {
  asl: "ASL interpreter",
  captions: "Live captions",
  "wheelchair-space": "Wheelchair space",
  childcare: "Childcare",
  "large-print": "Large print",
  "quiet-room": "Quiet room",
  other: "Other support",
};
/** Plural noun for readiness lines: "ASL interpreters: 2 needed". */
export const ACC_TYPE_PLURAL: Record<AccommodationType, string> = {
  asl: "ASL interpreters",
  captions: "Captioners",
  "wheelchair-space": "Wheelchair spaces",
  childcare: "Childcare places",
  "large-print": "Large-print materials",
  "quiet-room": "Quiet room",
  other: "Other support",
};
export const REG_STATUS_LABEL = {
  registered: "Registered",
  waitlisted: "On the waitlist",
  attended: "Attended",
  "no-show": "Didn't come",
  cancelled: "Cancelled",
} as const;
export const SOURCE_LABEL = { website: "Website", phone: "Phone", staff: "Staff" } as const;
const ROLE_NAMES: Record<Role, string> = {
  parent: "Parents",
  teacher: "Teachers",
  provider: "Providers",
  employer: "Employers",
  "self-advocate": "Self-advocates",
};

// ── Lookups ─────────────────────────────────────────────────────────────────
/** Library contacts + people added from Events. */
export const allContacts = (libraryContacts: Contact[], data: EventsData): Contact[] => {
  const seen = new Set(libraryContacts.map((c) => c.id));
  return [...libraryContacts, ...data.contacts.filter((c) => !seen.has(c.id))];
};
export const eventById = (data: EventsData, id: string) => data.events.find((e) => e.id === id);
export const registrationById = (data: EventsData, id: string) =>
  data.registrations.find((r) => r.id === id);

// ── Status ──────────────────────────────────────────────────────────────────
/** A published event whose end has passed counts as completed. */
export function effectiveStatus(e: OFEvent, now: Date): EventStatus {
  if (e.status === "published" && new Date(e.endsAt) < now) return "completed";
  return e.status;
}
export const isUpcoming = (e: OFEvent, now: Date) => effectiveStatus(e, now) === "published";
export const isEventDay = (e: OFEvent, now: Date) =>
  dayDiff(now, e.startsAt) <= 0 && new Date(e.endsAt).getTime() + DAY / 2 >= now.getTime();

// ── Seats & registrations ───────────────────────────────────────────────────
export const registrationsFor = (data: EventsData, eventId: string) =>
  data.registrations.filter((r) => r.eventId === eventId);

/** Registered + attended hold a seat. */
/** Seats in use: each booking counts itself plus any guests. */
export const partySize = (r: Pick<Registration, "guests">) => 1 + (r.guests ?? 0);
export const seatsTaken = (data: EventsData, eventId: string) =>
  registrationsFor(data, eventId)
    .filter((r) => r.status === "registered" || r.status === "attended")
    .reduce((n, r) => n + partySize(r), 0);

export const seatsLeft = (data: EventsData, e: OFEvent) =>
  Math.max(0, e.seats - seatsTaken(data, e.id));

/** Waitlisted registrations, oldest first (position = index + 1). */
export const waitlistFor = (data: EventsData, eventId: string) =>
  registrationsFor(data, eventId)
    .filter((r) => r.status === "waitlisted")
    .sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));

export function seatsText(data: EventsData, e: OFEvent): string {
  const w = waitlistFor(data, e.id).length;
  return `${seatsTaken(data, e.id)} / ${e.seats}${w ? ` · ${w} waitlisted` : ""}`;
}

// ── Accommodations ──────────────────────────────────────────────────────────
export type AccRow = {
  acc: AccommodationRequest;
  registration: Registration;
  event: OFEvent;
  contact: Contact;
  deadline: string;
};

export function accommodationRows(data: EventsData, contacts: Contact[]): AccRow[] {
  const regs = new Map(data.registrations.map((r) => [r.id, r]));
  const evs = new Map(data.events.map((e) => [e.id, e]));
  const people = new Map(contacts.map((c) => [c.id, c]));
  return data.accommodations.flatMap((acc) => {
    const registration = regs.get(acc.registrationId);
    const event = registration && evs.get(registration.eventId);
    const contact = registration && people.get(registration.contactId);
    if (!registration || !event || !contact) return [];
    const deadline = new Date(
      new Date(event.startsAt).getTime() - data.settings.leadTimeDays[acc.type] * DAY,
    ).toISOString();
    return [{ acc, registration, event, contact, deadline }];
  });
}

/** Still needs arranging: requested, for a live registration of an upcoming event. */
export const needsArranging = (row: AccRow, now: Date) =>
  row.acc.status === "requested" &&
  (row.registration.status === "registered" || row.registration.status === "waitlisted") &&
  isUpcoming(row.event, now);

/** "Book by Feb 6 (in 3 days)" or "Booking deadline passed 2 days ago". */
export function deadlineWording(
  deadline: string,
  now: Date,
): { overdue: boolean; soon: boolean; text: string } {
  const diff = dayDiff(now, deadline);
  if (diff < 0)
    return {
      overdue: true,
      soon: true,
      text: `Booking deadline passed ${plural(-diff, "day", "days")} ago`,
    };
  if (diff === 0)
    return { overdue: false, soon: true, text: `Book by today (${formatMonthDay(deadline)})` };
  return {
    overdue: false,
    soon: diff <= 7,
    text: `Book by ${formatMonthDay(deadline)} (in ${plural(diff, "day", "days")})`,
  };
}

// ── Readiness ───────────────────────────────────────────────────────────────
export type ReadinessLine =
  | { kind: "check"; key: keyof OFEvent["readiness"]; label: string; done: boolean }
  | { kind: "accommodation"; type: AccommodationType; label: string; done: boolean };

export const READINESS_LABEL: Record<keyof OFEvent["readiness"], string> = {
  venueConfirmed: "Venue confirmed",
  materialsReady: "Materials ready",
  remindersSent: "Reminders sent",
};

export function readinessLines(
  data: EventsData,
  contacts: Contact[],
  e: OFEvent,
  now: Date,
): ReadinessLine[] {
  const checks: ReadinessLine[] = (
    Object.keys(READINESS_LABEL) as Array<keyof OFEvent["readiness"]>
  )
    .filter((k) => !(k === "venueConfirmed" && e.format === "online"))
    .map((k) => ({ kind: "check", key: k, label: READINESS_LABEL[k], done: e.readiness[k] }));
  const rows = accommodationRows(data, contacts).filter(
    (r) =>
      r.event.id === e.id &&
      (r.registration.status === "registered" || r.registration.status === "waitlisted"),
  );
  const types = [...new Set(rows.map((r) => r.acc.type))];
  const acc: ReadinessLine[] = types.map((type) => {
    const ofType = rows.filter((r) => r.acc.type === type);
    const open = ofType.filter((r) => r.acc.status === "requested");
    const label = open.length
      ? `${ACC_TYPE_PLURAL[type]}: ${open.length} needed, not arranged — ${deadlineWording(open[0].deadline, now).text.replace(/^Book/, "book")}`
      : `${ACC_TYPE_PLURAL[type]}: ${ofType.length} arranged`;
    return { kind: "accommodation", type, label, done: open.length === 0 };
  });
  return [...checks, ...acc];
}

/** 0 = Ready. */
export const thingsToDo = (data: EventsData, contacts: Contact[], e: OFEvent, now: Date) =>
  readinessLines(data, contacts, e, now).filter((l) => !l.done).length;

// ── People & attendance ─────────────────────────────────────────────────────
export function reachByRole(regs: Registration[], contacts: Contact[]) {
  const people = new Map(contacts.map((c) => [c.id, c]));
  const counts = new Map<Role, number>();
  for (const r of regs) {
    const c = people.get(r.contactId);
    if (c) counts.set(c.role, (counts.get(c.role) ?? 0) + 1);
  }
  const total = regs.length || 1;
  return [...counts.entries()]
    .map(([role, n]) => ({
      role,
      label: ROLE_NAMES[role],
      count: n,
      percent: Math.round((n / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export function attendance(data: EventsData, eventId: string) {
  const regs = registrationsFor(data, eventId);
  const attended = regs.filter((r) => r.status === "attended").length;
  const noShow = regs.filter((r) => r.status === "no-show").length;
  const notCheckedIn = regs.filter((r) => r.status === "registered").length;
  const expected = attended + noShow + notCheckedIn;
  return {
    attended,
    noShow,
    notCheckedIn,
    expected,
    percent: expected ? Math.round((attended / expected) * 100) : 0,
  };
}

// ── Counts (sidebar, Today, tabs) ───────────────────────────────────────────
export function eventCounts(data: EventsData, contacts: Contact[], now: Date) {
  const st = (e: OFEvent) => effectiveStatus(e, now);
  const upcoming = data.events.filter((e) => st(e) === "published");
  return {
    upcoming: upcoming.length,
    drafts: data.events.filter((e) => st(e) === "draft").length,
    past: data.events.filter((e) => st(e) === "completed").length,
    cancelled: data.events.filter((e) => st(e) === "cancelled").length,
    toArrange: accommodationRows(data, contacts).filter((r) => needsArranging(r, now)).length,
    notReadySoon: upcoming.filter(
      (e) => dayDiff(now, e.startsAt) <= 7 && thingsToDo(data, contacts, e, now) > 0,
    ).length,
  };
}

export function registeredThisWeek(
  data: EventsData,
  eventId: string,
  now: Date,
  source?: Registration["source"],
) {
  return registrationsFor(data, eventId).filter(
    (r) =>
      r.status !== "cancelled" &&
      dayDiff(r.registeredAt, now) < 7 &&
      (!source || r.source === source),
  ).length;
}
