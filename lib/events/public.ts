// Public event details and selectors. Pure. Extra details (who it's for,
// speakers, getting there) live here by event id, so saved demo data never
// needs migrating. DEMO ONLY — every speaker is fictional.
import type {
  AccommodationType,
  CenterSlug,
  EventFormat,
  EventsData,
  EventType,
  OFEvent,
  Role,
} from "@/lib/types";
import { effectiveStatus, seatsLeft } from "@/lib/events/selectors";

export type EventExtras = {
  audiences: Role[];
  whatYouGet: string[];
  speakers: Array<{ name: string; role: string }>;
  gettingThere?: string;
  recordingUrl?: string;
};

const VENUE_DIRECTIONS =
  "Free parking behind the building, with 6 accessible spaces by the door. Step-free entrance on Main Street. The number 4 bus stops outside. Accessible toilets on every floor.";

const EXTRAS: Record<string, Partial<EventExtras>> = {
  "ev-family-night": {
    audiences: ["parent"],
    whatYouGet: [
      "Tips from parents who've been through IEP meetings",
      "Time to ask our family team your questions",
      "Free childcare and a light dinner",
    ],
    speakers: [
      { name: "Tom Becker", role: "Family support worker, Openfield" },
      { name: "Alicia Moreno", role: "Parent of two autistic children" },
    ],
  },
  "ev-iep-webinar": {
    audiences: ["parent", "teacher"],
    whatYouGet: [
      "A checklist of what to bring",
      "Questions to ask at the meeting",
      "The recording and slides afterwards",
    ],
    speakers: [{ name: "Hannah Brooks", role: "Inclusive education lead, Openfield" }],
  },
  "ev-try-it-day": {
    audiences: ["parent", "teacher", "provider"],
    whatYouGet: [
      "Hands-on time with communication devices",
      "Advice on which device might suit",
      "Help to request a loan from our library",
    ],
    speakers: [{ name: "Jonah Reyes", role: "Assistive technology specialist, Openfield" }],
  },
  "ev-conference": {
    audiences: ["parent", "teacher", "provider", "employer", "self-advocate"],
    whatYouGet: [
      "Two days of talks and practical workshops",
      "Lunch and refreshments",
      "A certificate of attendance for professionals",
    ],
    speakers: [
      { name: "Dr. Imani Clarke", role: "Researcher, fictional Riverbend University" },
      { name: "Sasha Klein", role: "Autistic self-advocate" },
      { name: "Priya Anand", role: "Autism specialist, Openfield" },
    ],
  },
  "ev-transition-webinar": {
    audiences: ["parent", "self-advocate"],
    whatYouGet: [
      "A simple timeline for the years after 14",
      "What changes at 18",
      "The recording afterwards",
    ],
    speakers: [
      { name: "Sofia Marín", role: "Transition planner, Openfield" },
      { name: "Leo Grant", role: "Young adult who's been through it" },
    ],
  },
  "ev-calm-spaces": {
    audiences: ["parent"],
    whatYouGet: [
      "Ideas for a calm-down corner",
      "Time to try items from our Sensory and Calm-Down kits",
      "A take-home checklist",
    ],
    speakers: [{ name: "Priya Anand", role: "Autism specialist, Openfield" }],
  },
  "ev-visual-supports": {
    audiences: ["teacher"],
    whatYouGet: ["Visual supports you can use the next day"],
    speakers: [{ name: "Hannah Brooks", role: "Inclusive education lead, Openfield" }],
    recordingUrl: "/learn/visual-supports-in-the-classroom",
  },
};

const BY_TYPE: Record<EventType, Pick<EventExtras, "audiences" | "whatYouGet">> = {
  conference: {
    audiences: ["parent", "teacher", "provider"],
    whatYouGet: ["Talks and workshops", "Time to meet others"],
  },
  webinar: {
    audiences: ["parent", "teacher"],
    whatYouGet: ["A live talk with time for questions", "The recording afterwards"],
  },
  workshop: {
    audiences: ["parent", "teacher"],
    whatYouGet: ["Hands-on practice", "Ideas to take home"],
  },
  "family-night": {
    audiences: ["parent"],
    whatYouGet: ["Time with other families", "Answers from our family team"],
  },
};

export function eventExtras(e: OFEvent): EventExtras {
  const x = EXTRAS[e.id] ?? {};
  return {
    audiences: x.audiences ?? BY_TYPE[e.type].audiences,
    whatYouGet: x.whatYouGet ?? BY_TYPE[e.type].whatYouGet,
    speakers: x.speakers ?? [],
    gettingThere: e.format === "online" ? undefined : (x.gettingThere ?? VENUE_DIRECTIONS),
    recordingUrl: x.recordingUrl,
  };
}

// ── Words ───────────────────────────────────────────────────────────────────
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", o).format(new Date(iso));
export const dayText = (e: OFEvent) =>
  fmt(e.startsAt, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
export const timeText = (e: OFEvent) =>
  `${fmt(e.startsAt, { hour: "numeric", minute: "2-digit" })}–${fmt(e.endsAt, { hour: "numeric", minute: "2-digit" })}`.replace(
    /:00/g,
    "",
  );
export const formatWords: Record<EventFormat, string> = {
  online: "Online",
  "in-person": "In person",
  hybrid: "In person and online",
};
export const whereText = (e: OFEvent) =>
  e.format === "online"
    ? "Online"
    : e.format === "hybrid"
      ? `${e.venue?.name ?? "Our center"} and online`
      : (e.venue?.name ?? "To be confirmed");
export const priceText = (e: OFEvent) => (e.price ? `$${e.price}` : "Free");
export const monthKey = (e: OFEvent) => fmt(e.startsAt, { month: "long", year: "numeric" });

/** "Full — join the waitlist", "4 places left" only when it's getting full, else null. */
export function placesWords(data: EventsData, e: OFEvent): { text: string | null; full: boolean } {
  const left = seatsLeft(data, e);
  if (left === 0) return { text: "Full — join the waitlist", full: true };
  if (left < e.seats * 0.25)
    return { text: `${left} ${left === 1 ? "place" : "places"} left`, full: false };
  return { text: null, full: false };
}

/** The latest date to ask for an accommodation, from Settings lead times. */
export function bookByDate(e: OFEvent, leadDays: Record<AccommodationType, number>): string {
  const most = Math.max(...Object.values(leadDays));
  return new Date(new Date(e.startsAt).getTime() - most * 86400000).toISOString();
}

// ── Filters ─────────────────────────────────────────────────────────────────
export type EventFilters = {
  q: string;
  types: EventType[];
  formats: EventFormat[];
  centers: CenterSlug[];
  audiences: Role[];
  free: boolean;
  places: boolean;
  when: "upcoming" | "past";
};

type Group = "types" | "formats" | "centers" | "audiences" | "free" | "places";
function filtered(data: EventsData, f: EventFilters, now: Date, skip?: Group) {
  const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  return data.events.filter((e) => {
    const st = effectiveStatus(e, now);
    if (f.when === "upcoming" ? st !== "published" : st !== "completed") return false;
    const x = eventExtras(e);
    const hay = [e.title, e.summary, e.description].join(" ").toLowerCase();
    return (
      terms.every((t) => hay.includes(t)) &&
      (skip === "types" || !f.types.length || f.types.includes(e.type)) &&
      (skip === "formats" || !f.formats.length || f.formats.includes(e.format)) &&
      (skip === "centers" ||
        !f.centers.length ||
        (e.center !== null && f.centers.includes(e.center))) &&
      (skip === "audiences" ||
        !f.audiences.length ||
        x.audiences.some((a) => f.audiences.includes(a))) &&
      (skip === "free" || !f.free || !e.price) &&
      (skip === "places" || !f.places || seatsLeft(data, e) > 0)
    );
  });
}

export function searchEvents(data: EventsData, f: EventFilters, now: Date): OFEvent[] {
  const list = filtered(data, f, now);
  return list.sort((a, b) =>
    f.when === "past" ? b.startsAt.localeCompare(a.startsAt) : a.startsAt.localeCompare(b.startsAt),
  );
}

export function eventFacets(data: EventsData, f: EventFilters, now: Date) {
  const count = <K extends string>(
    skip: Group,
    keys: readonly K[],
    test: (e: OFEvent, k: K) => boolean,
  ) => {
    const base = filtered(data, f, now, skip);
    return Object.fromEntries(
      keys.map((k) => [k, base.filter((e) => test(e, k)).length]),
    ) as Record<K, number>;
  };
  return {
    types: count(
      "types",
      ["webinar", "workshop", "family-night", "conference"] as EventType[],
      (e, k) => e.type === k,
    ),
    formats: count(
      "formats",
      ["online", "in-person", "hybrid"] as EventFormat[],
      (e, k) => e.format === k,
    ),
    centers: count(
      "centers",
      [
        "autism",
        "assistive-technology",
        "early-childhood",
        "inclusive-learning",
        "life-transitions",
        "deaf-blind",
      ] as CenterSlug[],
      (e, k) => e.center === k,
    ),
    audiences: count(
      "audiences",
      ["parent", "teacher", "provider", "employer", "self-advocate"] as Role[],
      (e, k) => eventExtras(e).audiences.includes(k),
    ),
    free: filtered(data, f, now, "free").filter((e) => !e.price).length,
    places: filtered(data, f, now, "places").filter((e) => seatsLeft(data, e) > 0).length,
  };
}

// ── Calendar file ───────────────────────────────────────────────────────────
const icsDate = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
const esc = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function eventIcs(e: OFEvent, siteUrl: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Openfield//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.id}@openfield.example`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(e.startsAt)}`,
    `DTEND:${icsDate(e.endsAt)}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(`${e.summary}\n${siteUrl}/events/${e.slug}`)}`,
    `LOCATION:${esc(e.format === "online" ? "Online (link sent after you register)" : `${e.venue?.name ?? ""}, ${e.venue?.address ?? ""}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(e: OFEvent) {
  const blob = new Blob([eventIcs(e, window.location.origin)], {
    type: "text/calendar;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${e.slug}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}
