// Pure helpers for the "Today" page. Every number is derived from the stores.
import type {
  ContentRules,
  Contact,
  Course,
  EventsData,
  FamilyGuide,
  InboxRules,
  Message,
  OFEvent,
} from "@/lib/types";
import { isOverTarget } from "@/lib/inbox/selectors";
import { needsReview } from "@/lib/guides/selectors";
import { missingCaptions } from "@/lib/courses/selectors";
import {
  ACC_TYPE_PLURAL,
  accommodationRows,
  deadlineWording,
  effectiveStatus,
  needsArranging,
  thingsToDo,
} from "@/lib/events/selectors";
import type { DashboardRole } from "@/store/dashboard";
import type { LibraryData, LibraryItem, Role } from "@/lib/types";

export type EventsView = { data: EventsData; contacts: Contact[] };
/** Inbox and content, already filtered to what the current role can see. */
export type WorkView = {
  messages: Message[];
  courses: Course[];
  guides: FamilyGuide[];
  inboxRules: InboxRules;
  contentRules: ContentRules;
};
import { formatMonthDay } from "@/lib/format";
import {
  dayDiff,
  getAvailability,
  getCopyAvailableIds,
  getDemand,
  isDueThisWeek,
  isFullyPacked,
  isOverdue,
  isOverWaitingTarget,
  startOfDay,
} from "@/lib/library/selectors";
import { join } from "@/lib/library/views";

export { toCsv } from "@/lib/csv";
export {
  formatDay as formatShortDate,
  formatLongDay as formatLongDate,
  formatMonthDay,
  relativeDay,
} from "@/lib/format";

const DAY = 24 * 60 * 60 * 1000;
/** One of each, for "1 captioner not arranged". */
const ACC_ONE: Record<keyof typeof ACC_TYPE_PLURAL, string> = {
  asl: "ASL interpreter",
  captions: "Captioner",
  "wheelchair-space": "Wheelchair space",
  childcare: "Childcare place",
  "large-print": "Large-print copy",
  "quiet-room": "Quiet room",
  other: "Other support request",
};
/** "Captioners" → "captioners", but "ASL interpreters" stays as is. */
const lowerFirst = (s: string) =>
  /^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);

export type ActionCategory = "library" | "inbox" | "events" | "guides";
export type TodaySection = "ship" | "due" | "events" | "demand" | "quarter";

/** Which "Needs action" lines and sections each role sees. */
export const ROLE_ACCESS: Record<
  DashboardRole,
  { actions: ActionCategory[]; sections: TodaySection[] }
> = {
  admin: {
    actions: ["library", "inbox", "events", "guides"],
    sections: ["ship", "due", "events", "demand", "quarter"],
  },
  library: { actions: ["library", "inbox"], sections: ["ship", "due", "demand"] },
  events: { actions: ["events", "inbox"], sections: ["events"] },
  content: { actions: ["guides", "inbox"], sections: [] },
};

export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

// ── Needs action ────────────────────────────────────────────────────────────
export type ActionLine = {
  key: string;
  category: ActionCategory;
  count: number;
  text: string;
  href: string;
  linkLabel: string;
  /** Oldest waiting timestamp, for sorting (oldest first). */
  since: number;
};

export function getNeedsAction(
  lib: LibraryData,
  ev: EventsView,
  work: WorkView,
  now: Date,
  allowed: ActionCategory[],
): ActionLine[] {
  const lines: ActionLine[] = [];
  const min = (ds: string[]) => Math.min(...ds.map((d) => new Date(d).getTime()));
  const target = lib.settings.waitingTargetDays;

  const copyAvailable = [...getCopyAvailableIds(lib)];
  if (copyAvailable.length)
    lines.push({
      key: "copy-available",
      category: "library",
      count: copyAvailable.length,
      text: `${copyAvailable.length} waitlisted ${plural(copyAvailable.length, "request has", "requests have")} a copy available`,
      href: "/dashboard/library/requests",
      linkLabel: "Review",
      since: 0,
    });

  const waiting = lib.requests.filter((r) => isOverWaitingTarget(lib, r, now));
  if (waiting.length)
    lines.push({
      key: "waiting",
      category: "library",
      count: waiting.length,
      text: `${waiting.length} library ${plural(waiting.length, "request", "requests")} waiting more than ${target} days`,
      href: "/dashboard/library/requests",
      linkLabel: "Review",
      since: min(waiting.map((r) => r.requestedAt)),
    });

  const overdue = lib.requests.filter((r) => isOverdue(r, now));
  if (overdue.length) {
    const oldest = Math.max(...overdue.map((r) => dayDiff(r.dueAt!, now)));
    lines.push({
      key: "overdue",
      category: "library",
      count: overdue.length,
      text: `${overdue.length} ${plural(overdue.length, "loan", "loans")} overdue (oldest: ${oldest} ${plural(oldest, "day", "days")})`,
      href: "/dashboard/library/on-loan?status=overdue",
      linkLabel: "Review",
      since: min(overdue.map((r) => r.dueAt!)),
    });
  }

  const toCheck = lib.requests.filter((r) => r.status === "returned");
  if (toCheck.length)
    lines.push({
      key: "returns",
      category: "library",
      count: toCheck.length,
      text: `${toCheck.length} returned ${plural(toCheck.length, "item needs", "items need")} checking`,
      href: "/dashboard/library/returns",
      linkLabel: "Open",
      since: min(toCheck.map((r) => r.returnedAt ?? r.requestedAt)),
    });

  // Accommodations still to arrange whose booking deadline is near or past
  const urgent = accommodationRows(ev.data, ev.contacts).filter(
    (r) => needsArranging(r, now) && deadlineWording(r.deadline, now).soon,
  );
  const groups = new Map<string, typeof urgent>();
  for (const r of urgent)
    groups.set(`${r.event.id}|${r.acc.type}`, [
      ...(groups.get(`${r.event.id}|${r.acc.type}`) ?? []),
      r,
    ]);
  for (const [key, rs] of groups) {
    const first = rs[0];
    const dl = deadlineWording(first.deadline, now);
    lines.push({
      key: `acc-${key}`,
      category: "events",
      count: rs.length,
      text: `${rs.length} ${lowerFirst(rs.length === 1 ? ACC_ONE[first.acc.type] : ACC_TYPE_PLURAL[first.acc.type])} not arranged for ${first.event.title} (${formatMonthDay(first.event.startsAt)}) — ${dl.overdue ? dl.text.toLowerCase() : dl.text.replace(/^Book/, "book")}`,
      href: `/dashboard/events/accommodations`,
      linkLabel: "Arrange",
      since: new Date(first.deadline).getTime(),
    });
  }

  // Published events in the next 7 days that aren't ready
  for (const e of ev.data.events) {
    if (effectiveStatus(e, now) !== "published" || dayDiff(now, e.startsAt) > 7) continue;
    const todo = thingsToDo(ev.data, ev.contacts, e, now);
    if (!todo) continue;
    const days = dayDiff(now, e.startsAt);
    lines.push({
      key: `ready-${e.id}`,
      category: "events",
      count: todo,
      text: `${e.title} is ${days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}: ${todo} ${plural(todo, "thing", "things")} to do`,
      href: `/dashboard/events/${e.id}`,
      linkLabel: "Open",
      since: new Date(e.startsAt).getTime(),
    });
  }

  const unanswered = work.messages.filter((m) => m.status === "unanswered");
  if (unanswered.length) {
    const late = unanswered.filter((m) => isOverTarget(m, work.inboxRules, now)).length;
    const oldest = Math.max(...unanswered.map((m) => dayDiff(m.receivedAt, now)));
    lines.push({
      key: "inbox",
      category: "inbox",
      count: unanswered.length,
      text: late
        ? `${unanswered.length} ${plural(unanswered.length, "message", "messages")} unanswered, ${late} past the ${work.inboxRules.replyTargetDays}-day target`
        : `${unanswered.length} ${plural(unanswered.length, "message", "messages")} unanswered (oldest: ${oldest} ${plural(oldest, "day", "days")})`,
      href: "/dashboard/inbox",
      linkLabel: "Open",
      since: min(unanswered.map((m) => m.receivedAt)),
    });
  }

  const review = work.guides.filter((g) => needsReview(g, work.contentRules, now));
  if (review.length)
    lines.push({
      key: "guides",
      category: "guides",
      count: review.length,
      text: `${review.length} family ${plural(review.length, "guide needs", "guides need")} review`,
      href: "/dashboard/family-guides?status=needs-review",
      linkLabel: "Review",
      since: min(review.map((g) => g.lastReviewedAt)),
    });

  const noCaptions = work.courses.filter((c) => c.status === "published" && missingCaptions(c));
  if (noCaptions.length)
    lines.push({
      key: "captions",
      category: "guides",
      count: noCaptions.length,
      text: `${noCaptions.length} published ${plural(noCaptions.length, "course is", "courses are")} missing captions`,
      href: "/dashboard/courses?a11y=gaps",
      linkLabel: "Fix",
      since: Number.POSITIVE_INFINITY,
    });

  return lines
    .filter((l) => l.count > 0 && allowed.includes(l.category))
    .sort((a, b) => a.since - b.since);
}

// ── Ready to ship (approved, shipping) ──────────────────────────────────────
export type ShipRow = {
  requestId: string;
  item: Pick<LibraryItem, "id" | "type">;
  fullyPacked: boolean;
  itemName: string;
  contactName: string;
  approvedAt: string;
};

export function getReadyToShip(lib: LibraryData): ShipRow[] {
  return join(
    lib,
    lib.requests.filter((r) => r.status === "approved" && r.delivery === "ship"),
  )
    .sort((a, b) => (a.request.approvedAt ?? "").localeCompare(b.request.approvedAt ?? ""))
    .map(({ request, item, contact }) => ({
      requestId: request.id,
      item,
      fullyPacked: isFullyPacked(item, request),
      itemName: item.name,
      contactName: contact.name,
      approvedAt: request.approvedAt ?? request.requestedAt,
    }));
}

// ── Due back this week ──────────────────────────────────────────────────────
export type DueRow = {
  requestId: string;
  item: Pick<LibraryItem, "id" | "type">;
  itemName: string;
  contactId: string;
  contactName: string;
  dueAt: string;
};

export function getDueThisWeek(lib: LibraryData, now: Date): DueRow[] {
  return join(
    lib,
    lib.requests.filter((r) => isDueThisWeek(r, now)),
  )
    .sort((a, b) => a.request.dueAt!.localeCompare(b.request.dueAt!))
    .map(({ request, item, contact }) => ({
      requestId: request.id,
      item,
      itemName: item.name,
      contactId: contact.id,
      contactName: contact.name,
      dueAt: request.dueAt!,
    }));
}

// ── Events in the next 30 days ──────────────────────────────────────────────
export function getEventsThisMonth(ev: EventsView, now: Date): OFEvent[] {
  const from = startOfDay(now).getTime();
  const to = from + 30 * DAY;
  return ev.data.events
    .filter((e) => effectiveStatus(e, now) === "published")
    .filter((e) => {
      const t = new Date(e.startsAt).getTime();
      return t >= from && t < to;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

// ── High demand ─────────────────────────────────────────────────────────────
export type DemandRow = {
  id: string;
  name: string;
  copies: number;
  waiting: number;
  avgWaitWeeks: number;
};

export function getHighDemand(lib: LibraryData, now: Date): DemandRow[] {
  return lib.items
    .filter((i) => !i.archived)
    .map((i) => ({
      id: i.id,
      name: i.name,
      copies: i.copies,
      waiting: getAvailability(lib, i.id).waitlist,
      avgWaitWeeks: Math.round(getDemand(lib, i.id, now).avgWaitWeeks ?? 0),
    }))
    .filter((r) => r.waiting > 0)
    .sort((a, b) => b.waiting - a.waiting);
}

// ── This quarter ────────────────────────────────────────────────────────────
export type QuarterStats = {
  label: string;
  itemsLoaned: number;
  familiesReached: number;
  /** People who came to an event this quarter. */
  eventAttendance: number;
  reachByRole: Array<{ role: Role; label: string; percent: number }>;
};

const ROLE_NAMES: Record<Role, string> = {
  parent: "Parents",
  teacher: "Teachers",
  provider: "Providers",
  employer: "Employers",
  "self-advocate": "Self-advocates",
};

export function getQuarterStats(lib: LibraryData, ev: EventsView, now: Date): QuarterStats {
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), q * 3, 1).getTime();
  const loaned = join(
    lib,
    lib.requests.filter((r) => r.shippedAt && new Date(r.shippedAt).getTime() >= start),
  );
  const reached = new Map(loaned.map((j) => [j.contact.id, j.contact]));
  const counts = new Map<Role, number>();
  for (const c of reached.values()) counts.set(c.role, (counts.get(c.role) ?? 0) + 1);
  const total = reached.size || 1;
  return {
    label: `Q${q + 1} ${now.getFullYear()}`,
    itemsLoaned: loaned.length,
    familiesReached: [...reached.values()].filter((c) => c.role === "parent").length,
    eventAttendance: ev.data.registrations.filter((g) => {
      if (g.status !== "attended") return false;
      const e = ev.data.events.find((x) => x.id === g.eventId);
      return (
        !!e &&
        new Date(e.startsAt).getTime() >= start &&
        new Date(e.startsAt).getTime() <= now.getTime()
      );
    }).length,
    reachByRole: [...counts.entries()]
      .map(([role, n]) => ({
        role,
        label: ROLE_NAMES[role],
        percent: Math.round((n / total) * 100),
      }))
      .sort((a, b) => b.percent - a.percent),
  };
}

export function quarterReportRows(stats: QuarterStats) {
  return [
    ["Metric", "Value"],
    ["Quarter", stats.label],
    ["Items loaned", stats.itemsLoaned],
    ["Families reached", stats.familiesReached],
    ["People at events", stats.eventAttendance],
    ...stats.reachByRole.map((r) => [`Reached: ${r.label}`, `${r.percent}%`]),
  ];
}
