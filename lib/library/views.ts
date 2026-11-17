// Page-level views of the library: join, filter, sort, label. Pure.
import type {
  CenterSlug,
  Contact,
  DeclineReason,
  ItemType,
  LibraryData,
  LibraryItem,
  LoanRequest,
  Role,
} from "@/lib/types";
import { formatWeekday } from "@/lib/format";
import {
  dayDiff,
  daysLate,
  getAvailability,
  getCopyAvailableIds,
  getDemand,
  getNextReturnDate,
  getWaitlist,
  isDueThisWeek,
  isExtended,
  isFullyPacked,
  isOverdue,
  partsToPack,
} from "@/lib/library/selectors";

// ── Labels ──────────────────────────────────────────────────────────────────
export const TYPE_LABEL: Record<ItemType, string> = {
  device: "Device",
  kit: "Kit",
  book: "Book",
  video: "Video",
  assessment: "Assessment",
};
export const ROLE_LABEL: Record<Role, string> = {
  parent: "Parent",
  teacher: "Teacher",
  provider: "Provider",
  employer: "Employer",
  "self-advocate": "Self-advocate",
};
export const CENTER_LABEL: Record<CenterSlug, string> = {
  autism: "Autism",
  "assistive-technology": "Assistive Technology",
  "early-childhood": "Early Childhood",
  "inclusive-learning": "Inclusive Learning",
  "life-transitions": "Life Transitions",
  "deaf-blind": "Deaf-Blind",
  "family-support": "Family Support",
};
export const DECLINE_REASONS: Array<{ value: DeclineReason; label: string }> = [
  { value: "not-eligible", label: "Not eligible (outside region)" },
  { value: "not-suitable", label: "Item not suitable for this need" },
  { value: "duplicate", label: "Duplicate request" },
  { value: "other", label: "Other" },
];
export const DECLINE_LABEL = Object.fromEntries(
  DECLINE_REASONS.map((r) => [r.value, r.label]),
) as Record<DeclineReason, string>;

export const options = <K extends string>(labels: Record<K, string>) =>
  (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

// ── Joined rows ─────────────────────────────────────────────────────────────
export type Joined = { request: LoanRequest; item: LibraryItem; contact: Contact };

export function join(data: LibraryData, rs: LoanRequest[]): Joined[] {
  const items = new Map(data.items.map((i) => [i.id, i]));
  const contacts = new Map(data.contacts.map((c) => [c.id, c]));
  return rs.flatMap((request) => {
    const item = items.get(request.itemId);
    const contact = contacts.get(request.contactId);
    return item && contact ? [{ request, item, contact }] : [];
  });
}

const matchesQuery = (q: string, j: Joined) => {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    j.request.id.toLowerCase().includes(s) ||
    j.item.name.toLowerCase().includes(s) ||
    j.contact.name.toLowerCase().includes(s)
  );
};

export const parseOne = <T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T => ((allowed as readonly string[]).includes(value ?? "") ? (value as T) : fallback);
export const parseOptional = <T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | null => ((allowed as readonly string[]).includes(value ?? "") ? (value as T) : null);

// ── Requests ────────────────────────────────────────────────────────────────
export const REQUEST_TABS = ["all", "waiting", "waitlisted", "approved", "declined"] as const;
export type RequestTab = (typeof REQUEST_TABS)[number];
export const REQUEST_TAB_LABEL: Record<RequestTab, string> = {
  all: "All",
  waiting: "Waiting",
  waitlisted: "Waitlisted",
  approved: "Approved",
  declined: "Declined",
};

export type RequestRow = Joined & { copyAvailable: boolean };

export function requestsView(
  data: LibraryData,
  f: { tab: RequestTab; q: string; type: ItemType | null; role: Role | null },
) {
  const flagged = getCopyAvailableIds(data);
  const inTab = (r: LoanRequest, tab: RequestTab) =>
    tab === "all"
      ? true
      : tab === "waiting"
        ? r.status === "waiting" || flagged.has(r.id)
        : r.status === tab;

  const rows: RequestRow[] = join(
    data,
    data.requests.filter((r) => inTab(r, f.tab)),
  )
    .filter(
      (j) =>
        (!f.type || j.item.type === f.type) &&
        (!f.role || j.contact.role === f.role) &&
        matchesQuery(f.q, j),
    )
    .map((j) => ({ ...j, copyAvailable: flagged.has(j.request.id) }))
    // "Copy available" first, then oldest first
    .sort(
      (a, b) =>
        Number(b.copyAvailable) - Number(a.copyAvailable) ||
        a.request.requestedAt.localeCompare(b.request.requestedAt),
    );

  const counts = Object.fromEntries(
    REQUEST_TABS.map((t) => [t, data.requests.filter((r) => inTab(r, t)).length]),
  ) as Record<RequestTab, number>;
  return { rows, counts };
}

export function oldestWaitingDays(data: LibraryData, now: Date): number {
  const ds = data.requests
    .filter((r) => r.status === "waiting")
    .map((r) => dayDiff(r.requestedAt, now));
  return ds.length ? Math.max(...ds) : 0;
}

export function nextWaitingId(data: LibraryData, excludeId: string): string | null {
  const flagged = getCopyAvailableIds(data);
  return (
    data.requests
      .filter((r) => (r.status === "waiting" || flagged.has(r.id)) && r.id !== excludeId)
      .sort(
        (a, b) =>
          Number(flagged.has(b.id)) - Number(flagged.has(a.id)) ||
          a.requestedAt.localeCompare(b.requestedAt),
      )[0]?.id ?? null
  );
}

export const copiesText = (data: LibraryData, itemId: string) => {
  const a = getAvailability(data, itemId);
  return `${a.free} of ${a.total} free${a.free === 0 && a.waitlist ? ` (${a.waitlist} waiting)` : ""}`;
};

// ── To ship ─────────────────────────────────────────────────────────────────
export const SHIP_TABS = ["ship", "pickup"] as const;
export type ShipTab = (typeof SHIP_TABS)[number];
export const PICKUP_LOCATION = "Openfield Center front desk";
export const OPENFIELD_ADDRESS = "Openfield Center, 200 Main Street, Riverbend";
export const OPENFIELD_PHONE = "(555) 014-2200";

export type ShipRow = Joined & {
  parts: string[];
  packed: string[];
  fullyPacked: boolean;
  dueAt: string;
};

export function toShipView(data: LibraryData, tab: ShipTab, now: Date) {
  const approved = data.requests.filter((r) => r.status === "approved");
  const rows: ShipRow[] = join(
    data,
    approved.filter((r) => r.delivery === tab),
  )
    .sort((a, b) => (a.request.approvedAt ?? "").localeCompare(b.request.approvedAt ?? ""))
    .map((j) => {
      const parts = partsToPack(j.item, j.request);
      const packed = j.request.packedParts.filter((p) => parts.includes(p));
      return {
        ...j,
        parts,
        packed,
        fullyPacked: isFullyPacked(j.item, j.request),
        dueAt: new Date(now.getTime() + j.item.loanDays * 86400000).toISOString(),
      };
    });
  const counts = {
    ship: approved.filter((r) => r.delivery === "ship").length,
    pickup: approved.filter((r) => r.delivery === "pickup").length,
  };
  const ages = approved.filter((r) => r.approvedAt).map((r) => dayDiff(r.approvedAt!, now));
  return { rows, counts, oldestDays: ages.length ? Math.max(...ages) : 0 };
}

// ── On loan ─────────────────────────────────────────────────────────────────
export const LOAN_TABS = ["all", "overdue", "due-week", "extended"] as const;
export type LoanTab = (typeof LOAN_TABS)[number];
export const LOAN_TAB_LABEL: Record<LoanTab, string> = {
  all: "All",
  overdue: "Overdue",
  "due-week": "Due this week",
  extended: "Extended",
};

export type LoanRow = Joined & { late: number };

export function loansView(
  data: LibraryData,
  f: { tab: LoanTab; q: string; type: ItemType | null },
  now: Date,
) {
  const onLoan = data.requests.filter((r) => r.status === "on-loan");
  const inTab = (r: LoanRequest, tab: LoanTab) =>
    tab === "all"
      ? true
      : tab === "overdue"
        ? isOverdue(r, now)
        : tab === "due-week"
          ? isDueThisWeek(r, now)
          : isExtended(r);
  const rows: LoanRow[] = join(
    data,
    onLoan.filter((r) => inTab(r, f.tab)),
  )
    .filter((j) => (!f.type || j.item.type === f.type) && matchesQuery(f.q, j))
    .map((j) => ({ ...j, late: daysLate(j.request, now) }))
    .sort(
      (a, b) => b.late - a.late || (a.request.dueAt ?? "").localeCompare(b.request.dueAt ?? ""),
    );
  const counts = Object.fromEntries(
    LOAN_TABS.map((t) => [t, onLoan.filter((r) => inTab(r, t)).length]),
  ) as Record<LoanTab, number>;
  return { rows, counts };
}

/** "2 times, last Fri" or null. */
export function reminderSummary(r: LoanRequest): string | null {
  if (!r.reminders.length) return null;
  const last = r.reminders[r.reminders.length - 1];
  const n = r.reminders.length;
  return `${n} ${n === 1 ? "time" : "times"}, last ${formatWeekday(last.at)}`;
}

// ── Returns & cleaning ──────────────────────────────────────────────────────
export const RETURN_TABS = ["to-check", "in-repair", "done"] as const;
export type ReturnTab = (typeof RETURN_TABS)[number];
export const RETURN_TAB_LABEL: Record<ReturnTab, string> = {
  "to-check": "To check",
  "in-repair": "In repair",
  done: "Done (last 30 days)",
};

export function returnsView(data: LibraryData, tab: ReturnTab, now: Date) {
  const recentDone = (r: LoanRequest) =>
    r.status === "closed" &&
    !!r.returnCheck?.checkedAt &&
    dayDiff(r.returnCheck.checkedAt, now) <= 30;
  const inTab = (r: LoanRequest, t: ReturnTab) =>
    t === "to-check"
      ? r.status === "returned"
      : t === "in-repair"
        ? r.status === "in-repair"
        : recentDone(r);
  const rows = join(
    data,
    data.requests.filter((r) => inTab(r, tab)),
  ).sort((a, b) =>
    tab === "done"
      ? (b.request.returnCheck?.checkedAt ?? "").localeCompare(
          a.request.returnCheck?.checkedAt ?? "",
        )
      : (a.request.returnedAt ?? "").localeCompare(b.request.returnedAt ?? ""),
  );
  const counts = Object.fromEntries(
    RETURN_TABS.map((t) => [t, data.requests.filter((r) => inTab(r, t)).length]),
  ) as Record<ReturnTab, number>;
  return { rows, counts };
}

// ── Catalog ─────────────────────────────────────────────────────────────────
export const CATALOG_TABS = [
  "all",
  "device",
  "kit",
  "book",
  "video",
  "assessment",
  "archived",
] as const;
export type CatalogTab = (typeof CATALOG_TABS)[number];
export const CATALOG_TAB_LABEL: Record<CatalogTab, string> = {
  all: "All",
  device: "Devices",
  kit: "Kits",
  book: "Books",
  video: "Videos",
  assessment: "Assessments",
  archived: "Archived",
};
export const AVAILABILITY_FILTER = {
  available: "Available now",
  "all-out": "All out",
  waitlist: "Has waitlist",
} as const;
export type AvailabilityFilter = keyof typeof AVAILABILITY_FILTER;
export const SORTS = { name: "Name", waiting: "Most waiting", loaned: "Most loaned" } as const;
export type CatalogSort = keyof typeof SORTS;

export type CatalogRow = {
  item: LibraryItem;
  free: number;
  waitlist: number;
  nextBack: string | null;
  timesLoaned: number;
  avgWaitWeeks: number | null;
};

export function catalogView(
  data: LibraryData,
  f: {
    tab: CatalogTab;
    q: string;
    center: CenterSlug | null;
    avail: AvailabilityFilter | null;
    sort: CatalogSort;
  },
  now: Date,
) {
  const all: CatalogRow[] = data.items.map((item) => {
    const a = getAvailability(data, item.id);
    const demand = getDemand(data, item.id, now);
    return {
      item,
      free: a.free,
      waitlist: a.waitlist,
      nextBack: getNextReturnDate(data, item.id),
      timesLoaned: demand.timesLoaned12m,
      avgWaitWeeks: demand.avgWaitWeeks,
    };
  });
  const inTab = (r: CatalogRow, t: CatalogTab) =>
    t === "archived" ? r.item.archived : !r.item.archived && (t === "all" || r.item.type === t);
  const q = f.q.trim().toLowerCase();
  const rows = all
    .filter((r) => inTab(r, f.tab))
    .filter((r) => !f.center || r.item.center === f.center)
    .filter((r) =>
      !f.avail
        ? true
        : f.avail === "available"
          ? r.free > 0
          : f.avail === "all-out"
            ? r.free === 0
            : r.waitlist > 0,
    )
    .filter((r) => !q || r.item.name.toLowerCase().includes(q))
    .sort((a, b) =>
      f.sort === "waiting"
        ? b.waitlist - a.waitlist || a.item.name.localeCompare(b.item.name)
        : f.sort === "loaned"
          ? b.timesLoaned - a.timesLoaned || a.item.name.localeCompare(b.item.name)
          : a.item.name.localeCompare(b.item.name),
    );
  const counts = Object.fromEntries(
    CATALOG_TABS.map((t) => [t, all.filter((r) => inTab(r, t)).length]),
  ) as Record<CatalogTab, number>;
  return { rows, counts, activeItems: all.filter((r) => !r.item.archived).length };
}

/** Copies in use for an item, grouped for the item detail page. */
export function copiesRightNow(data: LibraryData, itemId: string) {
  const forItem = join(
    data,
    data.requests.filter((r) => r.itemId === itemId),
  );
  return {
    out: forItem.filter((j) => ["approved", "on-loan"].includes(j.request.status)),
    returns: forItem.filter((j) => ["returned", "in-repair"].includes(j.request.status)),
    free: getAvailability(data, itemId).free,
    waitlist: join(data, getWaitlist(data, itemId)),
    history: forItem
      .filter((j) => ["closed", "lost"].includes(j.request.status))
      .sort((a, b) =>
        (b.request.closedAt ?? b.request.requestedAt).localeCompare(
          a.request.closedAt ?? a.request.requestedAt,
        ),
      ),
  };
}

// ── CSV rows ────────────────────────────────────────────────────────────────
export const csvDate = (iso?: string) => (iso ? iso.slice(0, 10) : "");
