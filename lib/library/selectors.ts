// Derived library facts. Pure functions of (data, now) — nothing is stored
// by hand, so every page, badge and count agrees.
import type { Contact, LibraryData, LibraryItem, LoanRequest, RequestStatus } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

/** Statuses that hold a physical copy (not available to lend). */
export const HOLDS_COPY: RequestStatus[] = ["approved", "on-loan", "returned", "in-repair"];
/** Statuses that count toward a person's loan limit. */
export const ACTIVE_LOAN: RequestStatus[] = ["approved", "on-loan"];

export const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

/** Whole calendar days from `a` to `b` (positive if b is later). */
export const dayDiff = (a: string | Date, b: string | Date) =>
  Math.round((startOfDay(new Date(b)).getTime() - startOfDay(new Date(a)).getTime()) / DAY);

// ── Lookups ─────────────────────────────────────────────────────────────────
export const itemById = (data: LibraryData, id: string): LibraryItem | undefined =>
  data.items.find((i) => i.id === id);
export const contactById = (data: LibraryData, id: string): Contact | undefined =>
  data.contacts.find((c) => c.id === id);
export const requestById = (data: LibraryData, id: string): LoanRequest | undefined =>
  data.requests.find((r) => r.id === id);

// ── Availability ────────────────────────────────────────────────────────────
export type Availability = { total: number; inUse: number; free: number; waitlist: number };

export function getAvailability(data: LibraryData, itemId: string): Availability {
  const item = itemById(data, itemId);
  const forItem = data.requests.filter((r) => r.itemId === itemId);
  const inUse = forItem.filter((r) => HOLDS_COPY.includes(r.status)).length;
  const total = item?.copies ?? 0;
  return {
    total,
    inUse,
    free: Math.max(0, total - inUse),
    waitlist: forItem.filter((r) => r.status === "waitlisted").length,
  };
}

/** Waitlisted requests for an item, oldest first. */
export function getWaitlist(data: LibraryData, itemId: string): LoanRequest[] {
  return data.requests
    .filter((r) => r.itemId === itemId && r.status === "waitlisted")
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
}

/**
 * "Copy available": for each item with a free copy, the oldest waitlisted
 * request is flagged (one per free copy).
 */
export function getCopyAvailableIds(data: LibraryData): Set<string> {
  const flagged = new Set<string>();
  for (const item of data.items) {
    if (item.archived) continue;
    const { free } = getAvailability(data, item.id);
    getWaitlist(data, item.id)
      .slice(0, free)
      .forEach((r) => flagged.add(r.id));
  }
  return flagged;
}

/** Earliest due date among copies currently out on loan. */
export function getNextReturnDate(data: LibraryData, itemId: string): string | null {
  return (
    data.requests
      .filter((r) => r.itemId === itemId && r.status === "on-loan" && r.dueAt)
      .map((r) => r.dueAt!)
      .sort()[0] ?? null
  );
}

// ── People ──────────────────────────────────────────────────────────────────
export const activeLoansFor = (data: LibraryData, contactId: string) =>
  data.requests.filter((r) => r.contactId === contactId && ACTIVE_LOAN.includes(r.status)).length;

export const pastLoansFor = (data: LibraryData, contactId: string) =>
  data.requests.filter(
    (r) => r.contactId === contactId && ["returned", "in-repair", "closed"].includes(r.status),
  ).length;

export function getEligibilityWarnings(data: LibraryData, contact: Contact): string[] {
  const warnings: string[] = [];
  if (!contact.inRegion) warnings.push("Lives outside the Riverbend region");
  const active = activeLoansFor(data, contact.id);
  const limit = data.settings.loanLimitPerPerson;
  if (active >= limit) warnings.push(`Already has ${active} items on loan (limit ${limit})`);
  return warnings;
}

// ── Loans ───────────────────────────────────────────────────────────────────
export const isOverdue = (r: LoanRequest, now: Date) =>
  r.status === "on-loan" && !!r.dueAt && dayDiff(r.dueAt, now) > 0;

/** Days late (0 if not overdue). */
export const daysLate = (r: LoanRequest, now: Date) =>
  r.status === "on-loan" && r.dueAt ? Math.max(0, dayDiff(r.dueAt, now)) : 0;

export const isDueThisWeek = (r: LoanRequest, now: Date) => {
  if (r.status !== "on-loan" || !r.dueAt) return false;
  const inDays = dayDiff(now, r.dueAt);
  return inDays >= 0 && inDays < 7;
};

export const isExtended = (r: LoanRequest) => (r.extensionCount ?? 0) > 0;

export const isOverWaitingTarget = (data: LibraryData, r: LoanRequest, now: Date) =>
  r.status === "waiting" && dayDiff(r.requestedAt, now) > data.settings.waitingTargetDays;

// ── Counts (sidebar, Today, tabs) ───────────────────────────────────────────
export type LibraryCounts = {
  waiting: number;
  waitingOverTarget: number;
  waitlisted: number;
  approved: number;
  approvedShip: number;
  approvedPickup: number;
  onLoan: number;
  overdue: number;
  dueThisWeek: number;
  extended: number;
  returnsToCheck: number;
  inRepair: number;
  declined: number;
  lost: number;
  copyAvailable: number;
};

export function getCounts(data: LibraryData, now: Date): LibraryCounts {
  const rs = data.requests;
  const is = (s: RequestStatus) => rs.filter((r) => r.status === s);
  const approved = is("approved");
  const onLoan = is("on-loan");
  return {
    waiting: is("waiting").length,
    waitingOverTarget: rs.filter((r) => isOverWaitingTarget(data, r, now)).length,
    waitlisted: is("waitlisted").length,
    approved: approved.length,
    approvedShip: approved.filter((r) => r.delivery === "ship").length,
    approvedPickup: approved.filter((r) => r.delivery === "pickup").length,
    onLoan: onLoan.length,
    overdue: onLoan.filter((r) => isOverdue(r, now)).length,
    dueThisWeek: onLoan.filter((r) => isDueThisWeek(r, now)).length,
    extended: onLoan.filter(isExtended).length,
    returnsToCheck: is("returned").length,
    inRepair: is("in-repair").length,
    declined: is("declined").length,
    lost: is("lost").length,
    copyAvailable: getCopyAvailableIds(data).size,
  };
}

// ── Packing ─────────────────────────────────────────────────────────────────
export const RETURN_LABEL = "Return label";

export function partsToPack(item: LibraryItem, r: LoanRequest): string[] {
  return r.delivery === "ship" ? [...item.parts, RETURN_LABEL] : [...item.parts];
}

export function isFullyPacked(item: LibraryItem, r: LoanRequest): boolean {
  const packed = new Set(r.packedParts);
  return partsToPack(item, r).every((p) => packed.has(p));
}

// ── Demand (catalog + item detail) ──────────────────────────────────────────
export type Demand = {
  timesLoaned12m: number;
  avgWaitWeeks: number | null;
  /** Loans started per month, oldest → newest, last 12 months. */
  byMonth: Array<{ month: string; label: string; count: number }>;
};

export function getDemand(data: LibraryData, itemId: string, now: Date): Demand {
  const yearAgo = new Date(now);
  yearAgo.setFullYear(now.getFullYear() - 1);
  const loans = data.requests.filter(
    (r) => r.itemId === itemId && r.shippedAt && new Date(r.shippedAt) >= yearAgo,
  );
  const waits = data.requests
    .filter((r) => r.itemId === itemId && r.approvedAt)
    .map((r) => dayDiff(r.requestedAt, r.approvedAt!) / 7);
  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    return {
      month: key,
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(m),
      count: loans.filter((r) => r.shippedAt!.startsWith(key)).length,
    };
  });
  return {
    timesLoaned12m: loans.length,
    avgWaitWeeks: waits.length
      ? Math.round((waits.reduce((a, b) => a + b, 0) / waits.length) * 10) / 10
      : null,
    byMonth,
  };
}
