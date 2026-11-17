// The home page helper: plain-language answers to common questions, built
// from the same live data as the site. No AI service and nothing is sent
// anywhere. When it isn't sure, it points to a real person.
import type {
  Course,
  EventsData,
  FamilyGuide,
  LibraryData,
  OrganizationSettings,
} from "@/lib/types";
import { effectiveStatus, seatsLeft } from "@/lib/events/selectors";
import { publicAvailability } from "@/lib/library/public";

export type HelperLink = { label: string; href: string };
export type HelperReply = { text: string; links: HelperLink[] };
export type HelperSources = {
  lib: LibraryData;
  courses: Course[];
  ev: EventsData;
  guides: FamilyGuide[];
  org: OrganizationSettings;
  now: Date;
};

export const SUGGESTIONS = [
  "Can I borrow a communication device?",
  "Find a free course",
  "What events are coming up?",
  "I need to talk to a person",
] as const;

const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(
    new Date(iso),
  );

const words = (q: string) =>
  q
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

const STOP = new Set([
  "can",
  "the",
  "and",
  "for",
  "you",
  "your",
  "how",
  "what",
  "where",
  "when",
  "does",
  "have",
  "borrow",
  "find",
  "free",
  "course",
  "courses",
  "event",
  "events",
  "need",
  "with",
  "about",
  "there",
  "any",
  "get",
  "want",
  "help",
  "please",
  "this",
  "that",
  "are",
  "who",
]);

/** Best matches by shared words (ignoring filler words). */
function match<T>(list: T[], text: (x: T) => string, q: string, n: number): T[] {
  const terms = words(q).filter((w) => !STOP.has(w));
  if (!terms.length) return [];
  return list
    .map((x) => {
      const hay = text(x).toLowerCase();
      return { x, score: terms.filter((t) => hay.includes(t.replace(/s$/, ""))).length };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((r) => r.x);
}

const has = (q: string, re: RegExp) => re.test(q.toLowerCase());

export function answer(question: string, s: HelperSources): HelperReply {
  const q = question.trim();
  const phone = `${s.org.phone} (${s.org.hours})`;

  if (!q || has(q, /^(hi|hello|hey|good (morning|afternoon|evening))\b/))
    return {
      text: "Hello. I can help you find library items, free courses, events and family guides. What are you looking for?",
      links: [],
    };

  if (has(q, /\b(person|human|someone|call|phone|talk|speak|contact|email|hours|open)\b/))
    return {
      text: `You can call us on ${phone}, or send a message and we'll reply within 2 working days.`,
      links: [
        { label: "Contact us", href: "/contact" },
        { label: "Visit or call", href: "/contact#ways-h" },
      ],
    };

  if (has(q, /\b(status|my request|reference|r-\d+)\b/))
    return {
      text: "You can check a library request with your reference number and email address.",
      links: [{ label: "Check a library request", href: "/library/request/status" }],
    };

  if (has(q, /\b(booking|cancel|my place|e-\d+)\b/))
    return {
      text: "You can see or cancel an event booking with your reference and email address.",
      links: [{ label: "Manage your booking", href: "/events/booking" }],
    };

  if (has(q, /\b(event|events|webinar|workshop|conference|family night|coming up)\b/)) {
    const upcoming = s.ev.events
      .filter((e) => effectiveStatus(e, s.now) === "published")
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const found = match(upcoming, (e) => `${e.title} ${e.summary}`, q, 3);
    const list = (found.length ? found : upcoming).slice(0, 3);
    if (!list.length)
      return {
        text: "There are no upcoming events right now.",
        links: [{ label: "Past events", href: "/events?when=past" }],
      };
    return {
      text: `Here ${list.length === 1 ? "is" : "are"} ${found.length ? "the closest match" : "what's coming up next"}:`,
      links: [
        ...list.map((e) => {
          const left = seatsLeft(s.ev, e);
          return {
            label: `${e.title}, ${fmtDay(e.startsAt)}${left === 0 ? " (full, waitlist open)" : ""}`,
            href: `/events/${e.slug}`,
          };
        }),
        { label: "See all events", href: "/events" },
      ],
    };
  }

  if (has(q, /\b(course|courses|learn|training|lesson|certificate|class)\b/)) {
    const live = s.courses.filter((c) => c.status === "published");
    const found = match(
      live,
      (c) => `${c.title} ${c.summary} ${(c.outcomes ?? []).join(" ")}`,
      q,
      3,
    );
    const list = found.length
      ? found
      : [...live].sort((a, b) => b.enrollments - a.enrollments).slice(0, 3);
    return {
      text: `All our courses are free, with no account needed. ${found.length ? "These look closest:" : "Popular ones:"}`,
      links: [
        ...list.map((c) => ({ label: c.title, href: `/learn/${c.slug}` })),
        { label: `See all ${live.length} courses`, href: "/learn" },
      ],
    };
  }

  if (
    has(
      q,
      /\b(guide|guides|diagnosis|diagnosed|iep|school|teen|turning 18|parent|family|benefits)\b/,
    )
  ) {
    const live = s.guides.filter((g) => g.status === "published");
    const found = match(live, (g) => `${g.title} ${g.summary} ${g.body}`, q, 3);
    if (found.length)
      return {
        text: "These short guides might help:",
        links: [
          ...found.map((g) => ({
            label: `${g.title} (${g.readMinutes} min read)`,
            href: `/families/${g.slug}`,
          })),
          { label: "All family guides", href: "/families" },
        ],
      };
    return {
      text: `Our family team can help. Call ${phone}, or browse our plain-language guides.`,
      links: [{ label: "Help for families", href: "/families" }],
    };
  }

  // Library: anything that looks like an item, or borrowing words.
  const items = s.lib.items.filter((i) => !i.archived);
  const foundItems = match(
    items,
    (i) => `${i.name} ${i.description} ${i.parts.join(" ")} ${i.type}`,
    q,
    3,
  );
  if (
    foundItems.length ||
    has(q, /\b(borrow|lend|loan|library|device|tablet|kit|book|equipment)\b/)
  ) {
    if (!foundItems.length)
      return {
        text: `You can borrow devices, kits and books for free if you live or work in the ${s.org.regionName} region. We ship them to you and pay for the return.`,
        links: [
          { label: "Browse the library", href: "/library" },
          { label: "How borrowing works", href: "/library/how-it-works" },
        ],
      };
    return {
      text: "Here's what I found in the library:",
      links: [
        ...foundItems.map((i) => ({
          label: `${i.name}: ${publicAvailability(s.lib, i, s.now).text}`,
          href: `/library/${i.slug}`,
        })),
        { label: "How borrowing works", href: "/library/how-it-works" },
      ],
    };
  }

  return {
    text: `I'm not sure about that one. A person can help: call ${phone}, or send us a message.`,
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Find help by topic", href: "/centers" },
    ],
  };
}
