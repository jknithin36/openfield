// Shared date/number wording for the dashboard. Pure.
import { dayDiff } from "@/lib/library/selectors";

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "Wed, Feb 4" */
export const formatDay = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(
    new Date(iso),
  );

/** "Feb 4" */
export const formatMonthDay = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));

/** "Wed" */
export const formatWeekday = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(iso));

/** "Tuesday, February 3" */
export const formatLongDay = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(d);

/** Past: "today" / "yesterday" / "3 days ago". Future: "tomorrow" / "in 3 days". */
export function relativeDay(iso: string, now: Date): string {
  const diff = dayDiff(now, iso); // positive = future
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}

/** For due dates: "9 days late" / "due today" / "in 3 days". */
export function dueWording(dueIso: string, now: Date): { late: boolean; text: string } {
  const diff = dayDiff(now, dueIso);
  if (diff < 0) return { late: true, text: `${plural(-diff, "day", "days")} late` };
  if (diff === 0) return { late: false, text: "due today" };
  return { late: false, text: diff === 1 ? "in 1 day" : `in ${diff} days` };
}
