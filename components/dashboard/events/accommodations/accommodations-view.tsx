"use client";

import { useState } from "react";

import type { Contact, EventsData } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { ACC_TYPE_LABEL } from "@/lib/events/selectors";
import { parseOne } from "@/lib/library/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { useEvents } from "@/components/dashboard/shared/use-events";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import {
  AccommodationList,
  accommodationsForTab,
  type AccTab,
} from "@/components/dashboard/events/accommodations/accommodation-list";

const TABS = ["to-arrange", "arranged", "unable"] as const;
const LABEL: Record<AccTab, string> = {
  "to-arrange": "To arrange",
  arranged: "Arranged",
  unable: "Unable",
};

export function AccommodationsView() {
  const ev = useEvents();
  return ev ? (
    <Content data={ev.data} contacts={ev.contacts} />
  ) : (
    <PageHeader title="Accommodations" description="Loading…" />
  );
}

function Content({ data, contacts }: { data: EventsData; contacts: Contact[] }) {
  const [now] = useState(() => new Date());
  const { searchParams } = useUrlState();
  const tab = parseOne(searchParams.get("tab"), TABS, "to-arrange");
  const rows = accommodationsForTab(data, contacts, tab, now);
  const count = (t: AccTab) => accommodationsForTab(data, contacts, t, now).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Events", href: "/dashboard/events" }, { label: "Accommodations" }]}
        title="Accommodations"
        count={`(${count("to-arrange")} to arrange)`}
        description="Interpreters, captions, access and childcare people asked for."
        moreActions={[
          {
            label: "Export CSV",
            onSelect: () =>
              downloadCsv(`openfield-accommodations-${tab}`, [
                ["Event", "Event date", "Type", "Details", "Person", "Book by", "Status", "Note"],
                ...rows.map((r) => [
                  r.event.title,
                  r.event.startsAt.slice(0, 10),
                  ACC_TYPE_LABEL[r.acc.type],
                  r.acc.details,
                  r.contact.name,
                  r.deadline.slice(0, 10),
                  r.acc.status,
                  r.acc.note ?? "",
                ]),
              ]),
          },
        ]}
        tabs={{
          label: "Accommodation status",
          param: "tab",
          current: tab,
          defaultValue: "to-arrange",
          items: TABS.map((t) => ({ value: t, label: LABEL[t], count: count(t) })),
        }}
      />
      <AccommodationList data={data} contacts={contacts} rows={rows} now={now} tab={tab} />
    </div>
  );
}
