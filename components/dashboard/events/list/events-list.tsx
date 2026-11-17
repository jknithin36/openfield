"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

import type { CenterSlug, Contact, EventFormat, EventsData, EventType, OFEvent } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { plural } from "@/lib/format";
import {
  EVENT_TYPE_LABEL,
  effectiveStatus,
  FORMAT_LABEL,
  seatsTaken,
  seatsText,
  thingsToDo,
  waitlistFor,
} from "@/lib/events/selectors";
import { CENTER_LABEL, options, parseOne, parseOptional } from "@/lib/library/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListPagination, paginate } from "@/components/dashboard/shared/list-pagination";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { Toolbar } from "@/components/dashboard/shared/toolbar";
import { useEvents } from "@/components/dashboard/shared/use-events";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";

const TABS = ["upcoming", "drafts", "past", "cancelled"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  upcoming: "Upcoming",
  drafts: "Drafts",
  past: "Past",
  cancelled: "Cancelled",
};
const EMPTY: Record<Tab, string> = {
  upcoming: "No upcoming events. Create one to get started.",
  drafts: "No drafts.",
  past: "No past events yet.",
  cancelled: "No cancelled events.",
};
const TYPES = Object.keys(EVENT_TYPE_LABEL) as EventType[];
const FORMATS = Object.keys(FORMAT_LABEL) as EventFormat[];
const CENTERS = Object.keys(CENTER_LABEL) as CenterSlug[];
const focus = "focus-visible:ring-3 focus-visible:ring-ring";

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", o).format(new Date(iso));
export const timeRange = (e: OFEvent) =>
  `${fmt(e.startsAt, { hour: "numeric", minute: "2-digit" })}–${fmt(e.endsAt, { hour: "numeric", minute: "2-digit" })}`.replace(
    /:00/g,
    "",
  );

export function EventsList() {
  const ev = useEvents();
  return ev ? (
    <Content data={ev.data} contacts={ev.contacts} />
  ) : (
    <PageHeader title="Upcoming events" description="Loading…" />
  );
}

function Content({ data, contacts }: { data: EventsData; contacts: Contact[] }) {
  const [now] = useState(() => new Date());
  const { searchParams } = useUrlState();
  const tab = parseOne(searchParams.get("status"), TABS, "upcoming");
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const type = parseOptional(searchParams.get("type"), TYPES);
  const format = parseOptional(searchParams.get("format"), FORMATS);
  const center = parseOptional(searchParams.get("center"), CENTERS);

  const inTab = (e: OFEvent, t: Tab) => {
    const s = effectiveStatus(e, now);
    return t === "upcoming"
      ? s === "published"
      : t === "drafts"
        ? s === "draft"
        : t === "past"
          ? s === "completed"
          : s === "cancelled";
  };
  const rows = data.events
    .filter((e) => inTab(e, tab))
    .filter(
      (e) =>
        (!type || e.type === type) &&
        (!format || e.format === format) &&
        (!center || e.center === center),
    )
    .filter((e) => !q || e.title.toLowerCase().includes(q))
    .sort((a, b) =>
      tab === "past" ? b.startsAt.localeCompare(a.startsAt) : a.startsAt.localeCompare(b.startsAt),
    );
  const counts = Object.fromEntries(
    TABS.map((t) => [t, data.events.filter((e) => inTab(e, t)).length]),
  ) as Record<Tab, number>;
  const { page, pageCount, pageRows } = paginate(rows, searchParams.get("page"));

  const exportCsv = () =>
    downloadCsv(`openfield-events-${tab}`, [
      ["Event", "Type", "Format", "Starts", "Seats", "Registered", "Waitlisted", "Status"],
      ...rows.map((e) => [
        e.title,
        EVENT_TYPE_LABEL[e.type],
        FORMAT_LABEL[e.format],
        e.startsAt,
        e.seats,
        seatsTaken(data, e.id),
        waitlistFor(data, e.id).length,
        effectiveStatus(e, now),
      ]),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Events" }, { label: "Upcoming events" }]}
        title="Upcoming events"
        count={`(${counts.upcoming})`}
        description="Events, registrations and what still needs doing."
        primaryAction={{
          label: "New event",
          href: "/dashboard/events/new",
          icon: <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />,
        }}
        moreActions={[{ label: "Export CSV", onSelect: exportCsv }]}
        tabs={{
          label: "Event status",
          current: tab,
          defaultValue: "upcoming",
          items: TABS.map((t) => ({ value: t, label: TAB_LABEL[t], count: counts[t] })),
        }}
      />

      <Toolbar
        searchLabel="Search events"
        searchPlaceholder="Event title"
        filters={[
          { key: "type", label: "Type", options: options(EVENT_TYPE_LABEL) },
          {
            key: "format",
            label: "Format",
            options: options({ online: "Online", "in-person": "In person", hybrid: "Hybrid" }),
          },
          { key: "center", label: "Topic", options: options(CENTER_LABEL) },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState>
          {q || type || format || center ? "No events match your search." : EMPTY[tab]}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3" aria-label={`${TAB_LABEL[tab]} events`}>
          {pageRows.map((e) => {
            const todo = thingsToDo(data, contacts, e, now);
            const live = effectiveStatus(e, now) === "published";
            return (
              <li key={e.id}>
                <Link
                  href={`/dashboard/events/${e.id}`}
                  className={`group flex items-stretch gap-4 rounded-lg border border-border bg-white p-3 outline-none hover:border-brand/40 hover:bg-brand-soft/30 sm:gap-5 sm:p-4 ${focus}`}
                >
                  {/* Date block, like a calendar page */}
                  <time
                    dateTime={e.startsAt}
                    className="flex w-16 shrink-0 flex-col items-center justify-center rounded-md bg-brand-soft py-2 text-brand sm:w-20"
                  >
                    <span className="text-xs font-semibold uppercase">
                      {fmt(e.startsAt, { weekday: "short" })}
                    </span>
                    <span className="text-2xl leading-none font-semibold tabular-nums">
                      {fmt(e.startsAt, { day: "numeric" })}
                    </span>
                    <span className="text-xs font-medium">
                      {fmt(e.startsAt, { month: "short" })}
                    </span>
                  </time>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <p className="text-[17px] font-medium text-ink group-hover:underline group-hover:underline-offset-4">
                        {e.title}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {EVENT_TYPE_LABEL[e.type]} ·{" "}
                        {e.format === "hybrid" ? "Hybrid" : FORMAT_LABEL[e.format]} · {timeRange(e)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 text-sm sm:justify-end">
                      <span className="text-neutral-700 tabular-nums">{seatsText(data, e)}</span>
                      {live &&
                        (todo === 0 ? (
                          <StatusText tone="success">Ready</StatusText>
                        ) : (
                          <StatusText tone="warning">
                            {plural(todo, "thing", "things")} to do
                          </StatusText>
                        ))}
                      {e.status === "cancelled" && <StatusText tone="danger">Cancelled</StatusText>}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <ListPagination page={page} pageCount={pageCount} total={rows.length} label="Event pages" />
    </div>
  );
}
