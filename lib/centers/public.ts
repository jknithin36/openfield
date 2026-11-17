// Topic page selectors. Pure. Everything is derived from the same stores the
// dashboard uses, so counts and availability are always current.
import type {
  Center,
  CenterSlug,
  Course,
  EventsData,
  FamilyGuide,
  LibraryData,
  LibraryItem,
  MessageTopic,
  OFEvent,
} from "@/lib/types";
import { effectiveStatus } from "@/lib/events/selectors";
import { CENTERS } from "@/data/centers";

export { CENTERS };
export const getCenter = (slug: string): Center | undefined => CENTERS.find((c) => c.slug === slug);

/** Which Inbox topic a question from a topic page lands in (so the right team sees it). */
export const CENTER_TOPIC: Record<CenterSlug, MessageTopic> = {
  autism: "family-support",
  "assistive-technology": "library",
  "early-childhood": "family-support",
  "inclusive-learning": "training",
  "life-transitions": "family-support",
  "deaf-blind": "accessibility",
  "family-support": "family-support",
};

export type CenterSources = {
  lib: LibraryData;
  courses: Course[];
  ev: EventsData;
  guides: FamilyGuide[];
  now: Date;
};

const loans = (lib: LibraryData, id: string) =>
  lib.requests.filter((r) => r.itemId === id && (r.shippedAt || r.readyForPickupAt)).length;

export const getCenterCourses = (s: CenterSources, slug: CenterSlug): Course[] =>
  s.courses
    .filter((c) => c.status === "published" && c.center === slug)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.enrollments - a.enrollments);

export const getCenterItems = (s: CenterSources, slug: CenterSlug): LibraryItem[] =>
  s.lib.items
    .filter((i) => !i.archived && i.center === slug)
    .sort((a, b) => loans(s.lib, b.id) - loans(s.lib, a.id) || a.name.localeCompare(b.name));

export const getCenterEvents = (s: CenterSources, slug: CenterSlug): OFEvent[] =>
  s.ev.events
    .filter((e) => e.center === slug && effectiveStatus(e, s.now) === "published")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

/** Guides have no topic of their own, so each topic picks its guides by slug. */
export const getCenterGuides = (s: CenterSources, center: Center): FamilyGuide[] =>
  (center.featuredGuideSlugs ?? [])
    .map((slug) => s.guides.find((g) => g.slug === slug && g.status === "published"))
    .filter((g): g is FamilyGuide => !!g);

export function getCenterCounts(s: CenterSources, slug: CenterSlug) {
  return {
    courses: getCenterCourses(s, slug).length,
    items: getCenterItems(s, slug).length,
    events: getCenterEvents(s, slug).length,
  };
}

/** "12 courses · 8 items to borrow · 2 upcoming events" (zeros left out). */
export function countsText(c: { courses: number; items: number; events: number }): string {
  return [
    c.courses && `${c.courses} ${c.courses === 1 ? "course" : "courses"}`,
    c.items && `${c.items} ${c.items === 1 ? "item" : "items"} to borrow`,
    c.events && `${c.events} upcoming ${c.events === 1 ? "event" : "events"}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export type Popular = { label: string; href: string; kind: "course" | "item" };

/** One real resource: the most-enrolled published course, or the most-borrowed item if there are no courses. */
export function getPopularForCenter(s: CenterSources, slug: CenterSlug): Popular | null {
  const course = [...getCenterCourses(s, slug)].sort((a, b) => b.enrollments - a.enrollments)[0];
  if (course) return { label: course.title, href: `/learn/${course.slug}`, kind: "course" };
  const item = getCenterItems(s, slug)[0];
  return item ? { label: item.name, href: `/library/${item.slug}`, kind: "item" } : null;
}
