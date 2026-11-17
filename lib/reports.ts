// Reports for funders and the board. Pure: one model feeds the page, the CSV
// and the print view, so the three can never disagree.
import type {
  Contact,
  Course,
  EventsData,
  FamilyGuide,
  InboxRules,
  LibraryData,
  Message,
  Role,
} from "@/lib/types";
import { ACC_TYPE_LABEL, effectiveStatus } from "@/lib/events/selectors";
import { firstReplyHours, MSG_SOURCE_LABEL } from "@/lib/inbox/selectors";
import { helpfulPercent } from "@/lib/guides/selectors";
import { accessibilityGaps } from "@/lib/courses/selectors";
import { ROLE_LABEL } from "@/lib/library/views";

export const PERIODS = ["this-quarter", "last-quarter", "this-year", "custom"] as const;
export type PeriodKind = (typeof PERIODS)[number];
export const PERIOD_LABEL: Record<PeriodKind, string> = {
  "this-quarter": "This quarter",
  "last-quarter": "Last quarter",
  "this-year": "This year",
  custom: "Custom dates",
};

export type Range = { start: Date; end: Date; label: string };

const DAY = 86400000;
const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseDate = (s: string | null) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 ? date : null;
};

/** The date range for a period. `end` is exclusive. Null when custom dates are invalid. */
export function periodRange(
  kind: PeriodKind,
  now: Date,
  from?: string | null,
  to?: string | null,
): Range | null {
  const y = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3);
  if (kind === "this-quarter") {
    const start = new Date(y, q * 3, 1);
    return { start, end: new Date(y, q * 3 + 3, 1), label: `Q${q + 1} ${y}` };
  }
  if (kind === "last-quarter") {
    const start = new Date(y, q * 3 - 3, 1);
    return {
      start,
      end: new Date(y, q * 3, 1),
      label: `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`,
    };
  }
  if (kind === "this-year")
    return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1), label: String(y) };
  const a = parseDate(from ?? null);
  const b = parseDate(to ?? null);
  if (!a || !b || a > b) return null;
  return { start: a, end: new Date(b.getTime() + DAY), label: `${fmt(a)} to ${fmt(b)}` };
}

/** The same-length period just before, for "up 12%" comparisons. */
export function previousRange(r: Range): Range {
  const len = r.end.getTime() - r.start.getTime();
  return { start: new Date(r.start.getTime() - len), end: r.start, label: "the period before" };
}

const within = (iso: string | undefined, r: Range) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= r.start.getTime() && t < r.end.getTime();
};

export type Metric = {
  label: string;
  value: number | string;
  note?: string;
  change?: number | null;
};
export type Breakdown = {
  title: string;
  rows: Array<{ label: string; value: number; percent?: number }>;
};
export type ReportSection = {
  id: string;
  title: string;
  intro: string;
  metrics: Metric[];
  breakdowns: Breakdown[];
  footnote?: string;
};

export type ReportInput = {
  lib: LibraryData;
  ev: EventsData;
  contacts: Contact[];
  messages: Message[];
  courses: Course[];
  guides: FamilyGuide[];
  inboxRules: InboxRules;
  now: Date;
};

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const change = (cur: number, prev: number) =>
  prev ? Math.round(((cur - prev) / prev) * 100) : null;
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const hoursText = (h: number | null) =>
  h === null ? "No replies yet" : h < 24 ? `${Math.round(h)} hours` : `${(h / 24).toFixed(1)} days`;

/** People we actually helped in a range: a loan shipped, an event attended, or a message answered. */
function reached(i: ReportInput, r: Range): Set<string> {
  const ids = new Set<string>();
  for (const q of i.lib.requests)
    if (within(q.shippedAt ?? q.readyForPickupAt, r)) ids.add(q.contactId);
  const events = new Map(i.ev.events.map((e) => [e.id, e]));
  for (const g of i.ev.registrations)
    if (g.status === "attended" && within(events.get(g.eventId)?.startsAt, r)) ids.add(g.contactId);
  for (const m of i.messages)
    if (m.contactId && within(m.receivedAt, r) && m.replies.length) ids.add(m.contactId);
  return ids;
}

export function buildReport(i: ReportInput, r: Range): ReportSection[] {
  const prev = previousRange(r);
  const byId = new Map(i.contacts.map((c) => [c.id, c]));

  // ── Reach ──
  const people = reached(i, r);
  const prevPeople = reached(i, prev);
  const roles = new Map<Role, number>();
  let outside = 0;
  for (const id of people) {
    const c = byId.get(id);
    if (!c) continue;
    roles.set(c.role, (roles.get(c.role) ?? 0) + 1);
    if (!c.inRegion) outside++;
  }
  const families = roles.get("parent") ?? 0;

  // ── Library ──
  const shipped = i.lib.requests.filter((q) => within(q.shippedAt ?? q.readyForPickupAt, r));
  const prevShipped = i.lib.requests.filter((q) => within(q.shippedAt ?? q.readyForPickupAt, prev));
  const received = i.lib.requests.filter((q) => within(q.requestedAt, r));
  const returned = i.lib.requests.filter((q) => within(q.returnedAt, r));
  const onTime = returned.filter(
    (q) =>
      q.dueAt &&
      q.returnedAt &&
      new Date(q.returnedAt) <= new Date(new Date(q.dueAt).getTime() + DAY),
  ).length;
  const items = new Map(i.lib.items.map((x) => [x.id, x]));
  const byItem = new Map<string, number>();
  for (const q of shipped) byItem.set(q.itemId, (byItem.get(q.itemId) ?? 0) + 1);

  // ── Events ──
  const held = i.ev.events.filter(
    (e) => effectiveStatus(e, i.now) === "completed" && within(e.startsAt, r),
  );
  const prevHeld = i.ev.events.filter(
    (e) => effectiveStatus(e, i.now) === "completed" && within(e.startsAt, prev),
  );
  const heldIds = new Set(held.map((e) => e.id));
  const regs = i.ev.registrations.filter((g) => heldIds.has(g.eventId));
  const attended = regs.filter((g) => g.status === "attended").length;
  const expected = regs.filter(
    (g) => g.status === "attended" || g.status === "no-show" || g.status === "registered",
  ).length;
  const prevAttended = i.ev.registrations.filter(
    (g) => prevHeld.some((e) => e.id === g.eventId) && g.status === "attended",
  ).length;
  const arranged = i.ev.accommodations.filter(
    (a) => a.status === "arranged" && within(a.arrangedAt, r),
  );
  const accTypes = new Map<string, number>();
  for (const a of arranged)
    accTypes.set(ACC_TYPE_LABEL[a.type], (accTypes.get(ACC_TYPE_LABEL[a.type]) ?? 0) + 1);

  // ── Learning (enrolment data is all-time in this template) ──
  const live = i.courses.filter((c) => c.status === "published");
  const enrolled = i.courses.reduce((n, c) => n + c.enrollments, 0);
  const completed = i.courses.reduce((n, c) => n + c.completions, 0);
  const byAud = new Map<Role, number>();
  for (const c of i.courses)
    for (const [a, n] of Object.entries(c.completionsByAudience ?? {}))
      byAud.set(a as Role, (byAud.get(a as Role) ?? 0) + (n ?? 0));

  // ── Families ──
  const guides = i.guides.filter((g) => g.status === "published");
  const yes = guides.reduce((n, g) => n + g.helpfulYes, 0);
  const no = guides.reduce((n, g) => n + g.helpfulNo, 0);
  const reviewed = i.guides.filter(
    (g) => within(g.lastReviewedAt, r) || (g.reviewNotes ?? []).some((n) => within(n.at, r)),
  ).length;

  // ── Response ──
  const msgs = i.messages.filter((m) => within(m.receivedAt, r));
  const prevMsgs = i.messages.filter((m) => within(m.receivedAt, prev));
  const replyHours = msgs.map(firstReplyHours).filter((h): h is number => h !== null);
  const inTarget = replyHours.filter((h) => h <= i.inboxRules.replyTargetDays * 24).length;
  const bySource = new Map<string, number>();
  for (const m of msgs)
    bySource.set(MSG_SOURCE_LABEL[m.source], (bySource.get(MSG_SOURCE_LABEL[m.source]) ?? 0) + 1);

  const sortRows = (m: Map<string, number>, total?: number) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, percent: total ? pct(value, total) : undefined }));

  return [
    {
      id: "reach",
      title: "Reach",
      intro: "People we helped: a loan sent, an event attended, or a message answered.",
      metrics: [
        {
          label: "People helped",
          value: people.size,
          change: change(people.size, prevPeople.size),
        },
        { label: "Families", value: families, note: "parents and carers" },
        {
          label: "From outside the region",
          value: outside,
          note: `${pct(outside, people.size)}% of people helped`,
        },
      ],
      breakdowns: [
        {
          title: "Who we reached",
          rows: sortRows(
            new Map([...roles.entries()].map(([k, v]) => [`${ROLE_LABEL[k]}s`, v])),
            people.size,
          ),
        },
      ],
    },
    {
      id: "library",
      title: "Lending library",
      intro: "Equipment and books sent out to families and schools.",
      metrics: [
        {
          label: "Items lent",
          value: shipped.length,
          change: change(shipped.length, prevShipped.length),
        },
        { label: "Requests received", value: received.length },
        {
          label: "Returned on time",
          value: returned.length ? `${pct(onTime, returned.length)}%` : "None returned",
          note: returned.length ? `${onTime} of ${returned.length} returns` : undefined,
        },
      ],
      breakdowns: [
        {
          title: "Most borrowed",
          rows: sortRows(
            new Map([...byItem.entries()].map(([k, v]) => [items.get(k)?.name ?? k, v])),
          ).slice(0, 5),
        },
      ],
    },
    {
      id: "events",
      title: "Events",
      intro: "Workshops, webinars and family nights that took place.",
      metrics: [
        { label: "Events held", value: held.length },
        { label: "People attended", value: attended, change: change(attended, prevAttended) },
        {
          label: "Attendance",
          value: expected ? `${pct(attended, expected)}%` : "No events",
          note: expected ? "of people registered" : undefined,
        },
        { label: "Accommodations arranged", value: arranged.length },
      ],
      breakdowns: [{ title: "Accommodations arranged", rows: sortRows(accTypes) }],
    },
    {
      id: "learning",
      title: "Learning",
      intro: "Free online courses.",
      metrics: [
        { label: "Courses published", value: live.length },
        { label: "Enrolments", value: enrolled.toLocaleString() },
        {
          label: "Completed",
          value: completed.toLocaleString(),
          note: `${pct(completed, enrolled)}% of enrolments`,
        },
        {
          label: "Courses fully accessible",
          value: `${pct(live.filter((c) => !accessibilityGaps(c).length).length, live.length)}%`,
        },
      ],
      breakdowns: [
        {
          title: "Completions by audience",
          rows: sortRows(
            new Map([...byAud.entries()].map(([k, v]) => [`${ROLE_LABEL[k]}s`, v])),
            completed,
          ),
        },
      ],
      footnote:
        "Course numbers are since launch. Enrolment dates aren't recorded in this template.",
    },
    {
      id: "families",
      title: "Family guides",
      intro: "Plain-language guides for each stage of life.",
      metrics: [
        { label: "Guides published", value: guides.length },
        {
          label: "Times read",
          value: guides.reduce((n, g) => n + g.views, 0).toLocaleString(),
          note: "since launch",
        },
        { label: "Found them helpful", value: yes + no ? `${pct(yes, yes + no)}%` : "No feedback" },
        { label: "Reviewed in this period", value: reviewed },
      ],
      breakdowns: [
        {
          title: "Most helpful guides",
          rows: guides
            .map((g) => ({ label: g.title, value: helpfulPercent(g) ?? 0 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((x) => ({ ...x, percent: x.value })),
        },
      ],
    },
    {
      id: "response",
      title: "Response times",
      intro: "How quickly people heard back from us.",
      metrics: [
        {
          label: "Messages received",
          value: msgs.length,
          change: change(msgs.length, prevMsgs.length),
        },
        { label: "Typical first reply", value: hoursText(median(replyHours)), note: "median" },
        {
          label: `Answered within ${i.inboxRules.replyTargetDays} days`,
          value: replyHours.length ? `${pct(inTarget, replyHours.length)}%` : "No replies yet",
        },
        { label: "Still open", value: msgs.filter((m) => m.status !== "resolved").length },
      ],
      breakdowns: [{ title: "How messages came in", rows: sortRows(bySource, msgs.length) }],
    },
  ];
}

export function reportCsv(sections: ReportSection[], range: Range): Array<Array<string | number>> {
  const rows: Array<Array<string | number>> = [
    ["Section", "Measure", "Value", "Note"],
    ["Period", range.label, "", ""],
  ];
  for (const s of sections) {
    for (const m of s.metrics)
      rows.push([
        s.title,
        m.label,
        m.value,
        [
          m.note,
          m.change != null ? `${m.change >= 0 ? "+" : ""}${m.change}% on the period before` : "",
        ]
          .filter(Boolean)
          .join("; "),
      ]);
    for (const b of s.breakdowns)
      for (const row of b.rows)
        rows.push([
          s.title,
          `${b.title}: ${row.label}`,
          row.value,
          row.percent != null ? `${row.percent}%` : "",
        ]);
  }
  return rows;
}
