// Item names and slugs for metadata and static params. Slugs and names don't
// depend on dates, so a fixed date keeps this deterministic at build time.
import { createItems } from "@/data/library/items";
import { makeDates } from "@/data/library/dates";

export const STATIC_ITEMS = createItems(makeDates(new Date("2026-01-01T12:00:00Z")));
export const staticItem = (slug: string) => STATIC_ITEMS.find((i) => i.slug === slug);
