// Relative-date helpers so the demo always looks fresh.
const DAY = 24 * 60 * 60 * 1000;

export function makeDates(now: Date) {
  const at = (days: number, hour = 10) => {
    const d = new Date(now.getTime() + days * DAY);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  return {
    daysAgo: (n: number, hour?: number) => at(-n, hour),
    daysFromNow: (n: number, hour?: number) => at(n, hour),
  };
}

export type Dates = ReturnType<typeof makeDates>;
