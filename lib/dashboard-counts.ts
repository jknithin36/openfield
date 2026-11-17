// Live sidebar badges, derived from the stores (never hand-typed).
import type { LibraryData } from "@/lib/types";
import { getCounts } from "@/lib/library/selectors";
import { eventCounts } from "@/lib/events/selectors";
import { needsReview } from "@/lib/guides/selectors";
import { getNeedsAction, ROLE_ACCESS, type EventsView, type WorkView } from "@/lib/today";
import type { DashboardRole } from "@/store/dashboard";

export type Badge = { count: number; /** read after the item name */ sr: string };

export function getNavCounts(
  lib: LibraryData,
  ev: EventsView,
  work: WorkView,
  role: DashboardRole,
  now: Date,
): Record<string, Badge> {
  const c = getCounts(lib, now);
  const notBooked = eventCounts(ev.data, ev.contacts, now).toArrange;
  const needs = getNeedsAction(lib, ev, work, now, ROLE_ACCESS[role].actions).reduce(
    (sum, l) => sum + l.count,
    0,
  );
  return {
    "": { count: needs, sr: "need attention" },
    "library/requests": { count: c.waiting + c.copyAvailable, sr: "waiting" },
    "library/to-ship": { count: c.approved, sr: "to ship" },
    "library/on-loan": { count: c.overdue, sr: "overdue" },
    "library/returns": { count: c.returnsToCheck, sr: "to check" },
    "events/accommodations": { count: notBooked, sr: "to arrange" },
    inbox: {
      count: work.messages.filter((m) => m.status === "unanswered").length,
      sr: "unanswered",
    },
    "family-guides": {
      count: work.guides.filter((g) => needsReview(g, work.contentRules, now)).length,
      sr: "need review",
    },
  };
}
