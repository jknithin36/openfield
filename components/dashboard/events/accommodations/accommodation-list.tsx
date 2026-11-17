"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEventsStore } from "@/store/events";
import type { AccommodationStatus, Contact, EventsData } from "@/lib/types";
import { formatDay, formatMonthDay } from "@/lib/format";
import {
  ACC_TYPE_LABEL,
  accommodationRows,
  deadlineWording,
  isUpcoming,
  needsArranging,
  type AccRow,
} from "@/lib/events/selectors";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { NoteConfirmForm } from "@/components/dashboard/library/on-loan/lost-form";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focus}`;

export type AccTab = "to-arrange" | "arranged" | "unable";

export function accommodationsForTab(
  data: EventsData,
  contacts: Contact[],
  tab: AccTab,
  now: Date,
  eventId?: string,
): AccRow[] {
  const status: Record<AccTab, AccommodationStatus> = {
    "to-arrange": "requested",
    arranged: "arranged",
    unable: "unable",
  };
  return accommodationRows(data, contacts)
    .filter((r) => !eventId || r.event.id === eventId)
    .filter((r) =>
      tab === "to-arrange"
        ? needsArranging(r, now)
        : r.acc.status === status[tab] &&
          (eventId || isUpcoming(r.event, now) || r.acc.status !== "requested"),
    )
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
}

/** Requests grouped by event (soonest first), most urgent deadline first. */
export function AccommodationList({
  data,
  contacts,
  rows,
  now,
  tab,
  showEventHeadings = true,
}: {
  data: EventsData;
  contacts: Contact[];
  rows: AccRow[];
  now: Date;
  tab: AccTab;
  showEventHeadings?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  if (rows.length === 0)
    return (
      <EmptyState>
        {tab === "to-arrange"
          ? "Nothing to arrange. Every request is sorted."
          : tab === "arranged"
            ? "Nothing arranged yet."
            : "No requests marked as unable."}
      </EmptyState>
    );

  const groups = [...new Map(rows.map((r) => [r.event.id, r.event])).values()].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
  const store = () => useEventsStore.getState();
  void data;
  void contacts;

  return (
    <div className="flex flex-col gap-8">
      {groups.map((ev) => {
        const groupRows = rows.filter((r) => r.event.id === ev.id);
        const sel = groupRows.filter((r) => selected.has(r.acc.id));
        const sameType = sel.length > 1 && sel.every((r) => r.acc.type === sel[0].acc.type);
        return (
          <section key={ev.id} aria-labelledby={`acc-${ev.id}`}>
            {showEventHeadings && (
              <h2 id={`acc-${ev.id}`} className="text-lg font-medium text-ink">
                <Link href={`/dashboard/events/${ev.id}?tab=accommodations`} className={link}>
                  {ev.title}
                </Link>{" "}
                <span className="text-[15px] font-normal text-neutral-600">
                  · <time dateTime={ev.startsAt}>{formatDay(ev.startsAt)}</time>
                </span>
              </h2>
            )}
            {tab === "to-arrange" && sel.length > 1 && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-neutral-50 px-4 py-2 ring-1 ring-border">
                <p className="text-[15px] font-medium text-ink">{sel.length} selected</p>
                {sameType ? (
                  <Button
                    onClick={() => {
                      const res = store().arrangeMany(sel.map((r) => r.acc.id));
                      if (
                        notifyResult(res, {
                          success: `${sel.length} ${ACC_TYPE_LABEL[sel[0].acc.type].toLowerCase()} requests marked arranged.`,
                          undone: "Undone",
                        })
                      )
                        setSelected(new Set());
                    }}
                    className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
                  >
                    Mark {sel.length} arranged
                  </Button>
                ) : (
                  <p className="text-sm text-neutral-700">
                    Select requests of the same type to arrange them together.
                  </p>
                )}
              </div>
            )}
            <ul className="mt-3 flex flex-col gap-3">
              {groupRows.map((row) => (
                <AccItem
                  key={row.acc.id}
                  row={row}
                  now={now}
                  tab={tab}
                  selected={selected.has(row.acc.id)}
                  onSelect={(c) =>
                    setSelected((s) => {
                      const n = new Set(s);
                      if (c) n.add(row.acc.id);
                      else n.delete(row.acc.id);
                      return n;
                    })
                  }
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function AccItem({
  row,
  now,
  tab,
  selected,
  onSelect,
}: {
  row: AccRow;
  now: Date;
  tab: AccTab;
  selected: boolean;
  onSelect: (c: boolean) => void;
}) {
  const [mode, setMode] = useState<"view" | "arrange" | "unable">("view");
  const [note, setNote] = useState("");
  const { acc, contact } = row;
  const label = ACC_TYPE_LABEL[acc.type];
  const dl = deadlineWording(row.deadline, now);
  const who = `${label} for ${contact.name}`;
  const store = () => useEventsStore.getState();

  return (
    <li className="rounded-lg border border-border bg-white p-4">
      <div className="flex gap-3">
        {tab === "to-arrange" && (
          <Checkbox
            checked={selected}
            onCheckedChange={(c) => onSelect(c === true)}
            aria-label={`Select ${who}`}
            className={`mt-1 size-5 ${focus}`}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-[16px] font-medium text-ink">{label}</h3>
            {tab === "to-arrange" ? (
              <StatusText
                tone={dl.overdue ? "danger" : dl.soon ? "warning" : "neutral"}
                icon={dl.overdue || dl.soon}
              >
                <time dateTime={row.deadline}>{dl.text}</time>
              </StatusText>
            ) : tab === "arranged" ? (
              <StatusText tone="success">
                Arranged{acc.arrangedAt ? ` ${formatMonthDay(acc.arrangedAt)}` : ""}
                {acc.arrangedBy ? ` by ${acc.arrangedBy}` : ""}
              </StatusText>
            ) : (
              <StatusText tone="danger">Couldn&apos;t arrange</StatusText>
            )}
          </div>
          {acc.details && <p className="mt-1 text-[15px] text-neutral-800">{acc.details}</p>}
          <p className="mt-1 text-sm text-neutral-700">
            For{" "}
            <Link href={`/dashboard/contacts/${contact.id}`} className={link}>
              {contact.name}
            </Link>
          </p>
          {acc.note && <p className="mt-1 text-sm text-neutral-700">Note: {acc.note}</p>}

          {tab === "to-arrange" && mode === "view" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={() => setMode("arrange")}
                className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
              >
                Mark arranged<span className="sr-only">: {who}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setMode("unable")}
                className={`h-11 px-4 ${focus}`}
              >
                Can&apos;t arrange<span className="sr-only">: {who}</span>
              </Button>
            </div>
          )}
          {mode === "arrange" && (
            <form
              className="mt-3 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                notifyResult(store().arrange(acc.id, note), {
                  success: `${who} marked arranged.`,
                  undone: "Undone",
                });
              }}
            >
              <Label htmlFor={`${acc.id}-note`} className="text-sm font-medium text-ink">
                Note (optional)
              </Label>
              <p id={`${acc.id}-hint`} className="text-sm text-neutral-600">
                For example, the interpreter&apos;s name.
              </p>
              <Input
                id={`${acc.id}-note`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-describedby={`${acc.id}-hint`}
                className={`h-11 bg-background text-base ${focus}`}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
                >
                  Save as arranged
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode("view")}
                  className={`h-11 px-4 ${focus}`}
                >
                  Go back
                </Button>
              </div>
            </form>
          )}
          {mode === "unable" && (
            <div className="mt-3">
              <NoteConfirmForm
                id={`${acc.id}-unable`}
                intro={
                  <>
                    Let {contact.name} know.{" "}
                    <Link href={`/dashboard/contacts/${contact.id}`} className={link}>
                      Contact person
                    </Link>
                  </>
                }
                label="Why can't it be arranged?"
                requiredMessage="Write a note about why it can't be arranged"
                confirmLabel="Save as unable"
                onConfirm={(n) =>
                  notifyResult(store().markUnable(acc.id, n), {
                    success: `${who} marked as unable to arrange.`,
                    undone: "Undone",
                  })
                }
                onCancel={() => setMode("view")}
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
