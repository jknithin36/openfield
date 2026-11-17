"use client";

import { useRef } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { useLibraryStore } from "@/store/library";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { relativeDay, type ShipRow } from "@/lib/today";
import { ItemIcon } from "@/components/dashboard/item-icon";
import { Section, textLink } from "@/components/dashboard/today/section";

export function ReadyToShip({ rows, now }: { rows: ShipRow[]; now: Date }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  const onShip = (row: ShipRow) => {
    const result = useLibraryStore.getState().markShipped(row.requestId);
    // The row disappears, so move focus somewhere sensible.
    if (result.ok) headingRef.current?.focus();
    notifyResult(result, {
      success: "Marked as shipped. Moved to On loan.",
      description: `${row.itemName} for ${row.contactName}`,
      undone: `Undone: ${row.itemName} is back in Ready to ship`,
    });
  };

  return (
    <Section
      id="ready-to-ship"
      title="Ready to ship today"
      headingRef={headingRef}
      action={
        <Link
          href="/dashboard/library/to-ship"
          className={`${textLink} inline-flex items-center gap-1 text-sm`}
        >
          See all to ship
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-4"
            aria-hidden="true"
          />
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="text-base text-neutral-600">Nothing to ship right now.</p>
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
                  <p className="text-sm text-neutral-600">
                    {row.contactName} · approved{" "}
                    <time dateTime={row.approvedAt}>{relativeDay(row.approvedAt, now)}</time>
                  </p>
                </div>
              </div>
              {row.fullyPacked ? (
                <Button
                  variant="outline"
                  onClick={() => onShip(row)}
                  className="extend-touch-target h-9 shrink-0 px-3 focus-visible:ring-3 focus-visible:ring-ring"
                >
                  Mark shipped
                  <span className="sr-only">
                    : {row.itemName} for {row.contactName}
                  </span>
                </Button>
              ) : (
                <Link href="/dashboard/library/to-ship" className={`${textLink} shrink-0 text-sm`}>
                  Pack items
                  <span className="sr-only">
                    : {row.itemName} for {row.contactName}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
