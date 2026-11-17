// Public library selectors: what visitors see. Pure. Every number is derived
// from the same store the dashboard uses, so the two can never disagree.
import type {
  CenterSlug,
  DeclineReason,
  ItemType,
  LibraryData,
  LibraryItem,
  LoanRequest,
} from "@/lib/types";
import { dayDiff, getAvailability, getNextReturnDate, getWaitlist } from "@/lib/library/selectors";
import { CENTER_LABEL } from "@/lib/library/views";

// ── Labels ──────────────────────────────────────────────────────────────────
export const TYPE_PLURAL: Record<ItemType, string> = {
  device: "Devices",
  kit: "Kits",
  book: "Books",
  video: "Videos",
  assessment: "Assessments",
};
export const TYPE_ONE: Record<ItemType, string> = {
  device: "Device",
  kit: "Kit",
  book: "Book",
  video: "Video",
  assessment: "Assessment",
};

export const AGE_BUCKETS = ["0-5", "6-12", "13-17", "adult"] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number];
export const AGE_LABEL: Record<AgeBucket, string> = {
  "0-5": "Ages 0–5",
  "6-12": "Ages 6–12",
  "13-17": "Ages 13–17",
  adult: "Adults",
};
const BUCKET_MAX: Record<AgeBucket, number> = { "0-5": 5, "6-12": 12, "13-17": 17, adult: 120 };

/** Youngest age an item suits: "3+" → 3, "Any age" → 0, "Adults" → 18. */
export function minAge(range: string): number {
  const n = /^(\d+)\+/.exec(range.trim());
  if (n) return Number(n[1]);
  return /any/i.test(range) ? 0 : 18;
}
export const inBucket = (item: LibraryItem, b: AgeBucket) => minAge(item.ageRange) <= BUCKET_MAX[b];
export const ageText = (range: string) =>
  /^\d+\+$/.test(range)
    ? `Ages ${range}`
    : range === "Any age"
      ? "Any age"
      : range === "Professionals"
        ? "For professionals"
        : "Adults";

// ── Availability ────────────────────────────────────────────────────────────
export type PublicAvailability = {
  available: boolean;
  free: number;
  waiting: number;
  /** Rough wait for someone joining the waitlist now. */
  weeks: number;
  /** "Available" or "All out — about 5 weeks wait" */
  text: string;
};

export function publicAvailability(
  data: LibraryData,
  item: LibraryItem,
  now: Date,
): PublicAvailability {
  const a = getAvailability(data, item.id);
  if (a.free > 0)
    return { available: true, free: a.free, waiting: a.waitlist, weeks: 0, text: "Available" };
  const next = getNextReturnDate(data, item.id);
  const untilFirst = next ? Math.max(0, dayDiff(now, next)) : item.loanDays;
  // Each round of loans frees every copy once; the newcomer waits behind everyone already waiting.
  const rounds = Math.floor(a.waitlist / Math.max(1, a.total));
  const days = untilFirst + rounds * item.loanDays + 3; // + a few days to check and ship
  const weeks = Math.max(1, Math.round(days / 7));
  return {
    available: false,
    free: 0,
    waiting: a.waitlist,
    weeks,
    text: `All out — about ${weeks} ${weeks === 1 ? "week" : "weeks"} wait`,
  };
}

// ── Search and filters ──────────────────────────────────────────────────────
export const SORTS = ["popular", "az", "available"] as const;
export type Sort = (typeof SORTS)[number];
export const SORT_LABEL: Record<Sort, string> = {
  popular: "Most popular",
  az: "A to Z",
  available: "Available first",
};

export type Filters = {
  q: string;
  types: ItemType[];
  centers: CenterSlug[];
  ages: AgeBucket[];
  availableOnly: boolean;
  sort: Sort;
};

const loanCount = (data: LibraryData, id: string) =>
  data.requests.filter((r) => r.itemId === id && (r.shippedAt || r.readyForPickupAt)).length;

const matchesQuery = (item: LibraryItem, q: string) => {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = [
    item.name,
    item.description,
    TYPE_ONE[item.type],
    CENTER_LABEL[item.center],
    ...item.parts,
  ]
    .join(" ")
    .toLowerCase();
  return terms.every((t) => hay.includes(t));
};

type Group = "types" | "centers" | "ages" | "availableOnly";
/** Items matching every filter except `skip` (for facet counts). */
function filtered(data: LibraryData, f: Filters, now: Date, skip?: Group): LibraryItem[] {
  return data.items.filter(
    (i) =>
      !i.archived &&
      matchesQuery(i, f.q) &&
      (skip === "types" || !f.types.length || f.types.includes(i.type)) &&
      (skip === "centers" || !f.centers.length || f.centers.includes(i.center)) &&
      (skip === "ages" || !f.ages.length || f.ages.some((b) => inBucket(i, b))) &&
      (skip === "availableOnly" || !f.availableOnly || getAvailability(data, i.id).free > 0),
  );
}

export function searchItems(data: LibraryData, f: Filters, now: Date): LibraryItem[] {
  const list = filtered(data, f, now);
  const free = (i: LibraryItem) => (getAvailability(data, i.id).free > 0 ? 0 : 1);
  return [...list].sort((a, b) =>
    f.sort === "az"
      ? a.name.localeCompare(b.name)
      : f.sort === "available"
        ? free(a) - free(b) || a.name.localeCompare(b.name)
        : loanCount(data, b.id) - loanCount(data, a.id) || a.name.localeCompare(b.name),
  );
}

/** How many results each option would give, with the other filters applied. */
export function facetCounts(data: LibraryData, f: Filters, now: Date) {
  const byType = filtered(data, f, now, "types");
  const byCenter = filtered(data, f, now, "centers");
  const byAge = filtered(data, f, now, "ages");
  const byAvail = filtered(data, f, now, "availableOnly");
  return {
    types: Object.fromEntries(
      (Object.keys(TYPE_PLURAL) as ItemType[]).map((t) => [
        t,
        byType.filter((i) => i.type === t).length,
      ]),
    ) as Record<ItemType, number>,
    centers: Object.fromEntries(
      (Object.keys(CENTER_LABEL) as CenterSlug[]).map((c) => [
        c,
        byCenter.filter((i) => i.center === c).length,
      ]),
    ) as Record<CenterSlug, number>,
    ages: Object.fromEntries(
      AGE_BUCKETS.map((b) => [b, byAge.filter((i) => inBucket(i, b)).length]),
    ) as Record<AgeBucket, number>,
    available: byAvail.filter((i) => getAvailability(data, i.id).free > 0).length,
  };
}

/** Most-loaned items that are still lendable. */
export const popularItems = (data: LibraryData, n: number): LibraryItem[] =>
  data.items
    .filter((i) => !i.archived)
    .sort((a, b) => loanCount(data, b.id) - loanCount(data, a.id) || a.name.localeCompare(b.name))
    .slice(0, n);

/** Same topic first, then same type; never the item itself or archived ones. */
export const similarItems = (data: LibraryData, item: LibraryItem, n: number): LibraryItem[] =>
  data.items
    .filter(
      (i) => !i.archived && i.id !== item.id && (i.center === item.center || i.type === item.type),
    )
    .sort(
      (a, b) =>
        Number(b.center === item.center) - Number(a.center === item.center) ||
        loanCount(data, b.id) - loanCount(data, a.id),
    )
    .slice(0, n);

export const itemBySlug = (data: LibraryData, slug: string) =>
  data.items.find((i) => i.slug === slug && !i.archived);

// ── Checking a request ──────────────────────────────────────────────────────
/** Both must match; the caller shows one generic error otherwise. */
export function findRequestByRefAndEmail(
  data: LibraryData,
  contacts: { id: string; email: string }[],
  ref: string,
  email: string,
): LoanRequest | null {
  const r = data.requests.find(
    (x) =>
      x.id.toLowerCase() ===
      ref
        .trim()
        .toLowerCase()
        .replace(/^r(\d)/, "r-$1"),
  );
  if (!r) return null;
  const c = contacts.find((x) => x.id === r.contactId);
  return c && c.email.trim().toLowerCase() === email.trim().toLowerCase() ? r : null;
}

export const waitlistPosition = (data: LibraryData, r: LoanRequest) =>
  getWaitlist(data, r.itemId).findIndex((x) => x.id === r.id) + 1;

export const PUBLIC_STATUS: Record<LoanRequest["status"], string> = {
  waiting: "We're looking at your request",
  waitlisted: "You're on the waitlist",
  approved: "Approved — we're getting it ready",
  "on-loan": "On loan to you",
  returned: "Returned — thank you",
  "in-repair": "Returned — thank you",
  closed: "Returned — thank you",
  declined: "We couldn't lend this item",
  lost: "Closed",
};

export const KIND_DECLINE: Record<DeclineReason, string> = {
  "not-eligible":
    "Our library is for people who live or work in our region, so we can't lend to this address. Our free courses and family guides are open to everyone.",
  "not-suitable":
    "We don't think this item is the right fit for what you described. Please call us and we'll help you find something that is.",
  duplicate: "You'd already asked for this item, so we've kept your other request instead.",
  other:
    "We couldn't lend this item this time. Please call us and we'll explain and help you find another option.",
};

export type Step = {
  label: string;
  at?: string;
  state: "done" | "current" | "upcoming";
  note?: string;
};

/** Received → Approved → Shipped / Ready → Due back → Returned, from the request's own dates. */
export function requestTimeline(r: LoanRequest): Step[] {
  const out = r.delivery === "pickup" ? "Ready to pick up" : "Shipped";
  const outAt = r.delivery === "pickup" ? r.readyForPickupAt : r.shippedAt;
  const back = r.returnedAt ?? r.closedAt;
  const steps: Step[] = [
    { label: "Request received", at: r.requestedAt, state: "done" },
    { label: "Approved", at: r.approvedAt, state: r.approvedAt ? "done" : "upcoming" },
    { label: out, at: outAt ?? r.shippedAt, state: outAt || r.shippedAt ? "done" : "upcoming" },
    {
      label: "Due back",
      at: r.dueAt,
      state: back ? "done" : r.status === "on-loan" ? "current" : "upcoming",
    },
    { label: "Returned", at: back, state: back ? "done" : "upcoming" },
  ];
  // The first step not yet done is the current one.
  const i = steps.findIndex((s) => s.state !== "done");
  if (i >= 0 && !steps.some((s) => s.state === "current"))
    steps[i] = { ...steps[i], state: "current" };
  return steps;
}
