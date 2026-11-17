import Link from "next/link";

import type { EventsView } from "@/lib/today";
import type { OFEvent } from "@/lib/types";
import { formatShortDate } from "@/lib/today";
import { readinessLines, seatsTaken, waitlistFor } from "@/lib/events/selectors";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { Bar } from "@/components/dashboard/today/bar";
import { Section, textLink } from "@/components/dashboard/today/section";

export function EventsThisMonth({
  events,
  ev,
  now,
}: {
  events: OFEvent[];
  ev: EventsView;
  now: Date;
}) {
  return (
    <Section id="events" title="Events in the next 30 days">
      {events.length === 0 ? (
        <p className="text-base text-neutral-600">No events in the next 30 days.</p>
      ) : (
        <ul className="divide-y divide-border">
          {events.map((e) => {
            const taken = seatsTaken(ev.data, e.id);
            const waiting = waitlistFor(ev.data, e.id).length;
            const acc = readinessLines(ev.data, ev.contacts, e, now).filter(
              (l) => l.kind === "accommodation",
            );
            return (
              <li
                key={e.id}
                className="grid gap-1 py-3.5 first:pt-0 sm:grid-cols-[8rem_minmax(0,1fr)_10rem] sm:items-start sm:gap-6"
              >
                <time
                  dateTime={e.startsAt}
                  className="text-sm font-medium text-neutral-700 tabular-nums sm:pt-0.5"
                >
                  {formatShortDate(e.startsAt)}
                </time>
                <div className="min-w-0">
                  <Link href={`/dashboard/events/${e.id}`} className={`${textLink} text-[15px]`}>
                    {e.title}
                  </Link>
                  {acc.length > 0 && (
                    <ul className="mt-1.5 flex flex-col gap-1 text-sm">
                      {acc.map((l) => (
                        <li key={l.label}>
                          <StatusText tone={l.done ? "success" : "danger"}>{l.label}</StatusText>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-sm text-neutral-700 tabular-nums sm:text-right">
                    {taken} / {e.seats} registered
                    {taken >= e.seats && (
                      <span className="font-medium text-ink">
                        {" "}
                        · Full{waiting ? `, ${waiting} waiting` : ""}
                      </span>
                    )}
                  </p>
                  <Bar value={taken} max={e.seats} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
