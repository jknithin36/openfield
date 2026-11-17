"use client";

import { Button } from "@/components/ui/button";
import { useLibraryStore } from "@/store/library";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { formatShortDate, plural, type DueRow } from "@/lib/today";
import { ItemIcon } from "@/components/dashboard/item-icon";
import { Section } from "@/components/dashboard/today/section";

export function DueThisWeek({ rows }: { rows: DueRow[] }) {
  const people = new Set(rows.map((r) => r.contactId)).size;

  // Logs a reminder on each loan (visible on the On loan page); undoable.
  const onRemind = () => {
    const res = useLibraryStore.getState().sendReminders(rows.map((r) => r.requestId));
    if (!res.undoId) return;
    notifyResult(
      { ok: true, undoId: res.undoId },
      {
        success: `Reminders sent to ${people} ${plural(people, "person", "people")}`,
        description: "Demo only — no emails were sent.",
        undone: "Reminders undone",
      },
    );
  };

  return (
    <Section
      id="due-this-week"
      title="Due back this week"
      action={
        rows.length > 0 ? (
          <Button
            variant="outline"
            onClick={onRemind}
            className="extend-touch-target h-9 px-3 focus-visible:ring-3 focus-visible:ring-ring"
          >
            Send reminders
            <span className="sr-only">
              {" "}
              to {people} {plural(people, "borrower", "borrowers")}
            </span>
          </Button>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <p className="text-base text-neutral-600">Nothing due back this week.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li
              key={row.requestId}
              className="flex items-center justify-between gap-4 py-3 first:pt-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ItemIcon item={row.item} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-ink">{row.itemName}</p>
                  <p className="text-sm text-neutral-600">{row.contactName}</p>
                </div>
              </div>
              <p className="shrink-0 text-sm text-neutral-700">
                Due{" "}
                <time dateTime={row.dueAt} className="font-medium tabular-nums">
                  {formatShortDate(row.dueAt)}
                </time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
