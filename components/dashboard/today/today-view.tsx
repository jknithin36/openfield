"use client";

import { useMemo, useState } from "react";

import {
  formatLongDate,
  getDueThisWeek,
  getEventsThisMonth,
  getHighDemand,
  getNeedsAction,
  getQuarterStats,
  getReadyToShip,
  plural,
  ROLE_ACCESS,
  type TodaySection,
} from "@/lib/today";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  useWorkspace,
  workView,
  type Workspace,
} from "@/components/dashboard/shared/use-workspace";
import { DueThisWeek } from "@/components/dashboard/today/due-this-week";
import { EventsThisMonth } from "@/components/dashboard/today/events-this-month";
import { HighDemand } from "@/components/dashboard/today/high-demand";
import { NeedsAction } from "@/components/dashboard/today/needs-action";
import { ReadyToShip } from "@/components/dashboard/today/ready-to-ship";
import { ThisQuarter } from "@/components/dashboard/today/this-quarter";

export function TodayView() {
  const w = useWorkspace();

  return w ? (
    <TodayContent w={w} />
  ) : (
    <div aria-busy="true">
      <PageHeader title="Today" description="Loading…" />
    </div>
  );
}

// Rendered only in the browser, after data loads, so `new Date()` never runs
// during prerender.
function TodayContent({ w }: { w: Workspace }) {
  const [now] = useState(() => new Date());
  const { lib, ev, role } = w;
  const access = ROLE_ACCESS[role];
  const show = (s: TodaySection) => access.sections.includes(s);

  const view = useMemo(
    () => ({
      lines: getNeedsAction(lib, ev, workView(w), now, access.actions),
      ship: getReadyToShip(lib),
      due: getDueThisWeek(lib, now),
      events: getEventsThisMonth(ev, now),
      demand: getHighDemand(lib, now),
      quarter: getQuarterStats(lib, ev, now),
    }),
    [w, lib, ev, now, access.actions],
  );

  const total = view.lines.reduce((sum, l) => sum + l.count, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={formatLongDate(now)}
        description={
          total === 0
            ? "You’re all caught up."
            : `${total} ${plural(total, "thing needs", "things need")} your attention`
        }
      />

      <NeedsAction lines={view.lines} />

      {(show("ship") || show("due")) && (
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          {show("ship") && <ReadyToShip rows={view.ship} now={now} />}
          {show("due") && <DueThisWeek rows={view.due} />}
        </div>
      )}

      {show("events") && <EventsThisMonth events={view.events} ev={ev} now={now} />}

      {(show("demand") || show("quarter")) && (
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          {show("demand") && <HighDemand items={view.demand} />}
          {show("quarter") && <ThisQuarter stats={view.quarter} />}
        </div>
      )}
    </div>
  );
}
