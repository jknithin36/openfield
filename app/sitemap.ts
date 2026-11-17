import type { MetadataRoute } from "next";

import { CENTERS } from "@/data/centers";
import { createGuides } from "@/data/content";
import { createEventsData } from "@/data/events";
import { STAGES } from "@/lib/families/public";
import { STATIC_COURSES } from "@/lib/learn/static-courses";
import { STATIC_ITEMS } from "@/lib/library/static-items";
import { SITE_URL } from "@/lib/site";

// Slugs don't depend on dates, so a fixed date keeps this deterministic.
const FIXED = new Date("2026-01-01T12:00:00Z");

const PAGES = [
  "",
  "/centers",
  "/learn",
  "/library",
  "/library/how-it-works",
  "/events",
  "/families",
  "/about",
  "/about/team",
  "/about/impact",
  "/about/funding",
  "/about/careers",
  "/contact",
  "/donate",
  "/accessibility",
  "/privacy",
  "/terms",
  "/sitemap",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    priority,
  });
  return [
    ...PAGES.map((p) => url(p, p === "" ? 1 : 0.8)),
    ...CENTERS.map((c) => url(`/centers/${c.slug}`, 0.8)),
    ...STATIC_COURSES.map((c) => url(`/learn/${c.slug}`, 0.7)),
    ...STATIC_ITEMS.filter((i) => !i.archived).map((i) => url(`/library/${i.slug}`)),
    ...createEventsData(FIXED)
      .events.filter((e) => e.status === "published")
      .map((e) => url(`/events/${e.slug}`)),
    ...STAGES.map((s) => url(`/families/stage/${s}`)),
    ...createGuides(FIXED)
      .filter((g) => g.status === "published")
      .map((g) => url(`/families/${g.slug}`, 0.7)),
  ];
}
