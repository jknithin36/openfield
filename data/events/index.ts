// Events demo data. DEMO ONLY — fictional events, people and places.
// Dates are relative to `now`; registrants are the library's contacts plus
// extra fictional people (for the big webinars and the conference).
import type {
  AccommodationRequest,
  AccommodationType,
  Contact,
  EventsData,
  EventSettings,
  OFEvent,
  Registration,
  RegistrationSource,
  Role,
} from "@/lib/types";
import { createContacts } from "@/data/library/contacts";

const DAY = 86400000;
export const OPENFIELD_VENUE = { name: "Openfield Center", address: "200 Main Street, Riverbend" };

export const DEFAULT_EVENT_SETTINGS: EventSettings = {
  leadTimeDays: {
    asl: 14,
    captions: 7,
    childcare: 7,
    "wheelchair-space": 3,
    "large-print": 3,
    "quiet-room": 3,
    other: 3,
  },
};

const FIRST = [
  "Alex",
  "Bea",
  "Carmen",
  "Dev",
  "Eli",
  "Fatima",
  "Gus",
  "Helena",
  "Ines",
  "Jae",
  "Kira",
  "Liam",
  "Mona",
  "Nico",
  "Oona",
  "Pablo",
  "Quinn",
  "Rosa",
  "Sanjay",
  "Tara",
];
const LAST = [
  "Abbott",
  "Banerjee",
  "Cole",
  "Dimitriou",
  "Ellis",
  "Ferreira",
  "Gill",
  "Hart",
  "Iqbal",
  "Jensen",
];
const ROLES: Role[] = [
  "parent",
  "teacher",
  "provider",
  "parent",
  "employer",
  "self-advocate",
  "parent",
  "teacher",
];

/** 200 extra fictional people (e001…). */
function extraContacts(): Contact[] {
  const out: Contact[] = [];
  for (let i = 0; i < 200; i++) {
    const name = `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`;
    const n = i + 1;
    const [f, l] = name.toLowerCase().split(" ");
    out.push({
      id: `e${String(n).padStart(3, "0")}`,
      name,
      role: ROLES[i % ROLES.length],
      email: `${f}.${l}${n}@example.com`,
      phone: `(555) 02${n % 10}-${String(1000 + n * 13).padStart(4, "0")}`,
      address: `${((n * 3) % 80) + 1} Harbor Lane, Riverbend`,
      region: "Riverbend",
      inRegion: true,
    });
  }
  return out;
}

export function createEventsData(now: Date = new Date()): EventsData {
  const at = (days: number, hour: number, min = 0) => {
    const d = new Date(now.getTime() + days * DAY);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  };
  const ready = (v: boolean, m: boolean, r: boolean) => ({
    venueConfirmed: v,
    materialsReady: m,
    remindersSent: r,
  });
  const base = {
    center: null,
    price: 0,
    accessibilityProvided: [] as OFEvent["accessibilityProvided"],
  };

  const events: OFEvent[] = [
    {
      ...base,
      id: "ev-family-night",
      slug: "family-night-iep-meetings",
      title: "Family night: IEP meetings",
      type: "family-night",
      center: "family-support",
      status: "published",
      startsAt: at(17, 18),
      endsAt: at(17, 20),
      format: "in-person",
      venue: OPENFIELD_VENUE,
      seats: 40,
      summary: "An evening for parents to share tips on IEP meetings, with childcare provided.",
      description:
        "Bring your questions. Parents who've been through it share what helped, and our family team answers questions. Free childcare and a light dinner.",
      accessibilityProvided: ["wheelchair-access", "childcare", "quiet-room"],
      readiness: ready(true, false, false),
    },
    {
      ...base,
      id: "ev-iep-webinar",
      slug: "getting-ready-for-an-iep-meeting",
      title: "Getting ready for an IEP meeting",
      type: "webinar",
      center: "inclusive-learning",
      status: "published",
      startsAt: at(5, 19),
      endsAt: at(5, 20),
      format: "online",
      onlineLink: "https://meet.example.com/openfield-iep",
      seats: 200,
      summary: "What to bring, which questions to ask, and your rights.",
      description: "A one-hour webinar with live Q&A. A recording and slides are sent afterwards.",
      accessibilityProvided: ["captions"],
      readiness: ready(true, false, true),
    },
    {
      ...base,
      id: "ev-try-it-day",
      slug: "try-it-day-communication-devices",
      title: "Try-it day: communication devices",
      type: "workshop",
      center: "assistive-technology",
      status: "published",
      startsAt: at(9, 10),
      endsAt: at(9, 13),
      format: "in-person",
      venue: OPENFIELD_VENUE,
      seats: 25,
      summary: "Try devices with our specialists before you borrow one.",
      description:
        "Hands-on time with communication tablets, switches and eye-gaze. Our specialists help you find what fits.",
      accessibilityProvided: ["wheelchair-access", "large-print"],
      readiness: ready(true, true, true),
    },
    {
      ...base,
      id: "ev-conference",
      slug: "openfield-annual-conference",
      title: "Openfield Annual Conference",
      type: "conference",
      center: null,
      status: "published",
      startsAt: at(40, 9),
      endsAt: at(41, 17),
      format: "hybrid",
      venue: { name: "Riverbend Civic Hall", address: "1 Civic Square, Riverbend" },
      onlineLink: "https://live.example.com/openfield-conference",
      seats: 300,
      price: 25,
      summary: "Two days of talks and workshops on autism and disability.",
      description:
        "Keynotes, practical workshops and time to meet other families and professionals. Join in person or online.",
      accessibilityProvided: ["captions", "asl", "wheelchair-access", "quiet-room", "large-print"],
      readiness: ready(true, false, false),
    },
    {
      ...base,
      id: "ev-transition-webinar",
      slug: "planning-for-life-after-high-school",
      title: "Planning for life after high school",
      type: "webinar",
      center: "life-transitions",
      status: "published",
      startsAt: at(24, 18, 30),
      endsAt: at(24, 19, 30),
      format: "online",
      onlineLink: "https://meet.example.com/openfield-transition",
      seats: 150,
      summary: "Work, college and benefits: a plan for the years after 18.",
      description:
        "A practical overview with a transition planner and a young adult who's been through it.",
      accessibilityProvided: ["captions"],
      readiness: ready(true, true, false),
    },
    {
      ...base,
      id: "ev-calm-spaces",
      slug: "calm-spaces-at-home",
      title: "Calm spaces at home",
      type: "workshop",
      center: "autism",
      status: "published",
      startsAt: at(12, 10),
      endsAt: at(12, 12),
      format: "in-person",
      venue: OPENFIELD_VENUE,
      seats: 20,
      summary: "Set up a calm-down corner that works for your child.",
      description: "A hands-on workshop using items from our Sensory and Calm-Down kits.",
      accessibilityProvided: ["wheelchair-access", "quiet-room"],
      readiness: ready(false, true, false),
    },
    {
      ...base,
      id: "ev-sign-families",
      slug: "sign-language-for-families",
      title: "Sign language for families",
      type: "workshop",
      center: "deaf-blind",
      status: "draft",
      startsAt: at(50, 17),
      endsAt: at(50, 19),
      format: "in-person",
      venue: OPENFIELD_VENUE,
      seats: 15,
      summary: "Everyday signs for the whole family.",
      description: "A relaxed first lesson for families. Children welcome.",
      accessibilityProvided: ["asl", "wheelchair-access"],
      readiness: ready(false, false, false),
    },
    {
      ...base,
      id: "ev-dads-coffee",
      slug: "coffee-morning-for-dads",
      title: "Coffee morning for dads",
      type: "family-night",
      center: "family-support",
      status: "cancelled",
      startsAt: at(20, 9, 30),
      endsAt: at(20, 11),
      format: "in-person",
      venue: OPENFIELD_VENUE,
      seats: 20,
      summary: "An informal morning for dads and male carers.",
      description: "Coffee, pastries and conversation.",
      cancelReason: "The room is unavailable that day. We'll set a new date soon.",
      readiness: ready(false, false, false),
    },
    {
      ...base,
      id: "ev-visual-supports",
      slug: "visual-supports-in-the-classroom-workshop",
      title: "Visual supports in the classroom",
      type: "workshop",
      center: "inclusive-learning",
      status: "completed",
      startsAt: at(-14, 15, 30),
      endsAt: at(-14, 17, 30),
      format: "in-person",
      venue: OPENFIELD_VENUE,
      seats: 30,
      summary: "Make and use visual supports for your students.",
      description: "For teachers and classroom assistants.",
      accessibilityProvided: ["wheelchair-access", "large-print"],
      readiness: ready(true, true, true),
      followUp: {
        sentAt: at(-13, 10),
        resourcesUrl: "https://example.com/resources/visual-supports",
      },
    },
    {
      ...base,
      id: "ev-at-open-house",
      slug: "assistive-tech-open-house",
      title: "Assistive tech open house",
      type: "family-night",
      center: "assistive-technology",
      status: "completed",
      startsAt: at(-6, 17),
      endsAt: at(-6, 19),
      format: "in-person",
      venue: OPENFIELD_VENUE,
      seats: 40,
      summary: "Drop in and try devices from our library.",
      description: "An informal evening for families and professionals.",
      accessibilityProvided: ["wheelchair-access", "quiet-room"],
      readiness: ready(true, true, true),
    },
  ];

  const people = [...createContacts(), ...extraContacts()];
  const registrations: Registration[] = [];
  const accommodations: AccommodationRequest[] = [];
  let rn = 0;
  let an = 0;
  const sources: RegistrationSource[] = [
    "website",
    "website",
    "website",
    "phone",
    "website",
    "staff",
  ];

  /** Add registrations for an event from the people list (no duplicates). */
  const register = (
    eventId: string,
    startIdx: number,
    count: number,
    status: Registration["status"],
    daysBeforeEvent: (k: number) => number,
    eventStart: string,
  ) => {
    const ids: string[] = [];
    for (let k = 0; k < count; k++) {
      const person = people[(startIdx + k) % people.length];
      const regAt = new Date(new Date(eventStart).getTime() - daysBeforeEvent(k) * DAY);
      const id = `REG-${String(++rn).padStart(4, "0")}`;
      registrations.push({
        id,
        eventId,
        contactId: person.id,
        status,
        registeredAt: (regAt > now ? now : regAt).toISOString(),
        source: sources[k % sources.length],
        ...(status === "attended" ? { checkedInAt: eventStart } : {}),
        ...(status === "cancelled" ? { cancelledAt: at(-2, 11) } : {}),
      });
      ids.push(id);
    }
    return ids;
  };
  const acc = (
    registrationId: string,
    type: AccommodationType,
    details: string,
    status: AccommodationRequest["status"],
    note?: string,
  ) =>
    accommodations.push({
      id: `ACC-${String(++an).padStart(3, "0")}`,
      registrationId,
      type,
      details,
      status,
      ...(status === "arranged" ? { arrangedAt: at(-3, 14), arrangedBy: "Sam Morgan" } : {}),
      ...(note ? { note } : {}),
    });
  const ev = (id: string) => events.find((e) => e.id === id)!;
  // Spread registration dates: first ones weeks ago, the last ones this week.
  const spread = (total: number, from: number) => (k: number) =>
    Math.max(0, from - Math.round((k / total) * from));

  // Family night — nearly full (38 / 40); 2 ASL not arranged; childcare arranged
  const fn = register(
    "ev-family-night",
    0,
    38,
    "registered",
    spread(38, 35),
    ev("ev-family-night").startsAt,
  );
  acc(fn[3], "asl", "Interpreter for a Deaf parent", "requested");
  acc(fn[11], "asl", "Interpreter for a Deaf parent and grandparent", "requested");
  acc(fn[5], "childcare", "2 children, ages 4 and 7", "arranged");
  acc(fn[17], "wheelchair-space", "Space for a power chair", "arranged");

  // IEP webinar — 86 / 200; captions request overdue (deadline passed)
  const iep = register(
    "ev-iep-webinar",
    60,
    86,
    "registered",
    spread(86, 30),
    ev("ev-iep-webinar").startsAt,
  );
  acc(iep[8], "captions", "Live captions; hard of hearing", "requested");
  acc(iep[20], "large-print", "Slides in large print before the session", "arranged");

  // Try-it day — full (25 / 25) with 5 waitlisted
  const tid = register(
    "ev-try-it-day",
    20,
    25,
    "registered",
    spread(25, 30),
    ev("ev-try-it-day").startsAt,
  );
  register("ev-try-it-day", 150, 5, "waitlisted", (k) => 6 - k, ev("ev-try-it-day").startsAt);
  acc(tid[2], "wheelchair-space", "Wheelchair user", "arranged");
  acc(tid[9], "wheelchair-space", "Wheelchair user and carer", "arranged");

  // Conference — 120 / 300
  const conf = register(
    "ev-conference",
    100,
    120,
    "registered",
    spread(120, 60),
    ev("ev-conference").startsAt,
  );
  acc(conf[4], "asl", "ASL for both days", "arranged");
  acc(conf[30], "quiet-room", "Access to a quiet room between sessions", "requested");

  // Transition webinar — 54 / 150
  register(
    "ev-transition-webinar",
    40,
    54,
    "registered",
    spread(54, 25),
    ev("ev-transition-webinar").startsAt,
  );

  // Calm spaces — 12 / 20
  const calm = register(
    "ev-calm-spaces",
    30,
    12,
    "registered",
    spread(12, 14),
    ev("ev-calm-spaces").startsAt,
  );
  acc(calm[1], "childcare", "1 child, age 5", "requested");

  // Cancelled event — everyone cancelled
  register("ev-dads-coffee", 120, 8, "cancelled", spread(8, 10), ev("ev-dads-coffee").startsAt);

  // Completed — visual supports: 22 attended, 6 no-show (marked)
  const vs = ev("ev-visual-supports").startsAt;
  const vsa = register("ev-visual-supports", 2, 22, "attended", spread(22, 20), vs);
  register("ev-visual-supports", 24, 6, "no-show", spread(6, 15), vs);
  acc(vsa[0], "large-print", "Large-print handouts", "arranged");

  // Completed — open house: 27 attended, 7 not checked in (no-shows not marked yet)
  const oh = ev("ev-at-open-house").startsAt;
  register("ev-at-open-house", 70, 27, "attended", spread(27, 18), oh);
  register("ev-at-open-house", 97, 7, "registered", spread(7, 12), oh);

  return {
    events,
    registrations,
    accommodations,
    contacts: extraContacts(),
    settings: DEFAULT_EVENT_SETTINGS,
  };
}
