// About page selectors. Pure. Impact numbers wrap the dashboard Reports
// builder, so About, Impact and Reports always agree for the same period.
import type {
  CenterPerson,
  Course,
  EventsData,
  FamilyGuide,
  FundingKind,
  FundingYear,
  InboxRules,
  LibraryData,
  Message,
  Staff,
  Contact,
} from "@/lib/types";
import { buildReport, isoDate, periodRange, type Range, type ReportSection } from "@/lib/reports";
import { effectiveStatus } from "@/lib/events/selectors";
import { dayDiff } from "@/lib/library/selectors";
import { ABOUT } from "@/data/about";
import { CENTERS } from "@/data/centers";

export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

/** Whole-number percentages that always add up to exactly 100 (largest remainder). */
export function percents(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (!total) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  raw
    .map((r, i) => ({ i, rem: r - Math.floor(r) }))
    .sort((a, b) => b.rem - a.rem)
    .forEach(({ i }) => {
      if (left-- > 0) out[i]++;
    });
  return out;
}

// ── Services ────────────────────────────────────────────────────────────────
export function getServiceCounts(
  lib: LibraryData,
  courses: Course[],
  ev: EventsData,
  guides: FamilyGuide[],
  now: Date,
) {
  return {
    copies: lib.items.filter((i) => !i.archived).reduce((n, i) => n + i.copies, 0),
    items: lib.items.filter((i) => !i.archived).length,
    courses: courses.filter((c) => c.status === "published").length,
    events: ev.events.filter((e) => effectiveStatus(e, now) === "published").length,
    guides: guides.filter((g) => g.status === "published").length,
  };
}

// ── Impact (wraps Reports) ──────────────────────────────────────────────────
export type ImpactYear = "this-year" | "last-year";
export type ImpactInput = {
  lib: LibraryData;
  ev: EventsData;
  contacts: Contact[];
  messages: Message[];
  courses: Course[];
  guides: FamilyGuide[];
  inboxRules: InboxRules;
  now: Date;
};

export function impactRange(which: ImpactYear, now: Date): Range {
  if (which === "this-year") return periodRange("this-year", now)!;
  const y = now.getFullYear() - 1;
  return periodRange("custom", now, isoDate(new Date(y, 0, 1)), isoDate(new Date(y, 11, 31)))!;
}

export type YearImpact = {
  range: Range;
  sections: ReportSection[];
  /** Days from request to approval, for loans approved in the period. */
  averageWaitDays: number | null;
  certificates: number;
  empty: boolean;
};

export function getYearImpact(i: ImpactInput, which: ImpactYear): YearImpact {
  const range = impactRange(which, i.now);
  const sections = buildReport(i, range);
  const inRange = (iso?: string) =>
    !!iso && new Date(iso) >= range.start && new Date(iso) < range.end;
  const waits = i.lib.requests
    .filter((r) => inRange(r.approvedAt))
    .map((r) => dayDiff(r.requestedAt, r.approvedAt!));
  const people = sections[0].metrics[0].value;
  return {
    range,
    sections,
    averageWaitDays: waits.length
      ? Math.round((waits.reduce((a, b) => a + b, 0) / waits.length) * 10) / 10
      : null,
    certificates: i.courses
      .filter((c) => c.status === "published" && c.certificate)
      .reduce((n, c) => n + c.completions, 0),
    empty: people === 0 && sections[1].metrics[0].value === 0,
  };
}

/** A metric's value from a report, by section id and label. */
export const metric = (sections: ReportSection[], id: string, label: string) =>
  sections.find((s) => s.id === id)?.metrics.find((m) => m.label === label)?.value ?? 0;

// ── Funding ─────────────────────────────────────────────────────────────────
export const KIND_LABEL: Record<FundingKind, string> = {
  government: "Government",
  foundation: "Foundations and trusts",
  individual: "Individual donors",
  earned: "Earned income",
};
export const COST_LABEL: Record<keyof FundingYear["costs"], string> = {
  library: "Lending library",
  training: "Courses and training",
  events: "Events",
  familySupport: "Family support",
  admin: "Running the organization",
};

export function getFundingSummary(year?: number) {
  const f = ABOUT.funding.find((x) => x.year === year) ?? ABOUT.funding[0];
  const total = f.sources.reduce((n, s) => n + s.amount, 0);
  const kinds = (Object.keys(KIND_LABEL) as FundingKind[])
    .map((k) => ({
      kind: k,
      label: KIND_LABEL[k],
      amount: f.sources.filter((s) => s.kind === k).reduce((n, s) => n + s.amount, 0),
    }))
    .filter((k) => k.amount);
  const kindPct = percents(kinds.map((k) => k.amount));
  const costKeys = Object.keys(COST_LABEL) as Array<keyof FundingYear["costs"]>;
  const costs = costKeys.map((k) => ({ key: k, label: COST_LABEL[k], amount: f.costs[k] }));
  const spent = costs.reduce((n, c) => n + c.amount, 0);
  const costPct = percents(costs.map((c) => c.amount));
  return {
    year: f.year,
    years: ABOUT.funding.map((x) => x.year),
    total,
    sources: f.sources.map((s) => ({ ...s, pct: Math.round((s.amount / total) * 1000) / 10 })),
    kinds: kinds.map((k, i) => ({ ...k, pct: kindPct[i] })),
    spent,
    costs: costs.map((c, i) => ({ ...c, pct: costPct[i] })),
    /** Cents of every $1 spent that go directly to services. */
    servicesCents: Math.round(((spent - f.costs.admin) / spent) * 100),
  };
}

// ── Team ────────────────────────────────────────────────────────────────────
export const TEAM_GROUPS = [
  "Leadership",
  "Library",
  "Events",
  "Family support",
  "Learning",
] as const;
export type TeamGroup = (typeof TEAM_GROUPS)[number];
export type PublicPerson = { name: string; role: string; bio: string };

const groupFor = (role: string): TeamGroup =>
  /library/i.test(role)
    ? "Library"
    : /interpret|event/i.test(role)
      ? "Events"
      : /training|education|learning|content/i.test(role)
        ? "Learning"
        : /director|lead\b|chief/i.test(role)
          ? "Leadership"
          : "Family support";

/** Active dashboard staff (from Settings) plus the topic teams, grouped. Inactive staff are hidden. */
export function getActiveStaffByTeam(
  staff: Staff[],
  centers: Array<{ team: CenterPerson[] }> = CENTERS,
): Array<{ group: TeamGroup; people: PublicPerson[] }> {
  const TEAM_GROUP: Record<Staff["team"], TeamGroup> = {
    admin: "Leadership",
    library: "Library",
    events: "Events",
    family: "Family support",
    content: "Learning",
  };
  const people = new Map<string, PublicPerson & { group: TeamGroup }>();
  for (const s of staff.filter((x) => x.active)) {
    const extra = ABOUT.staffBios[s.id];
    people.set(s.name, {
      name: s.name,
      role: extra?.role ?? `${TEAM_GROUP[s.team]} team`,
      bio: extra?.bio ?? "",
      group: TEAM_GROUP[s.team],
    });
  }
  for (const c of centers)
    for (const p of c.team)
      if (!people.has(p.name)) people.set(p.name, { ...p, group: groupFor(p.role) });
  return TEAM_GROUPS.map((group) => ({
    group,
    people: [...people.values()]
      .filter((p) => p.group === group)
      .map(({ name, role, bio }) => ({ name, role, bio })),
  })).filter((g) => g.people.length);
}
