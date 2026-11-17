"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDay, formatWeekday } from "@/lib/format";
import { PICKUP_LOCATION, type ShipRow as Row, type ShipTab } from "@/lib/library/views";
import { ItemIcon } from "@/components/dashboard/item-icon";
import { PartsChecklist } from "@/components/dashboard/library/to-ship/parts-checklist";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const primary = `h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`;

export function ShipRow({
  row,
  tab,
  selected,
  onSelect,
  onToggle,
  onShip,
  onReady,
  onPickedUp,
}: {
  row: Row;
  tab: ShipTab;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onToggle: (part: string) => void;
  onShip: () => void;
  onReady: () => void;
  onPickedUp: () => void;
}) {
  const { request, item, contact } = row;
  const hintId = `${request.id}-hint`;
  const who = `${item.name} for ${contact.name}`;

  return (
    <li className="rounded-lg border border-border bg-white p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        {tab === "ship" && (
          <Checkbox
            checked={selected}
            onCheckedChange={(c) => onSelect(c === true)}
            aria-label={`Select ${who}`}
            className={`extend-touch-target mt-2.5 size-5 ${focus}`}
          />
        )}
        <ItemIcon item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-[17px] font-medium text-ink">
              {item.name}{" "}
              <span className="text-sm font-normal text-neutral-600 tabular-nums">
                {request.id}
              </span>
            </h2>
            {request.approvedAt && (
              <p className="text-sm text-neutral-600">
                Approved{" "}
                <time dateTime={request.approvedAt}>{formatWeekday(request.approvedAt)}</time>
              </p>
            )}
          </div>
          <p className="mt-1 text-[15px] text-neutral-700">
            {tab === "ship" ? (
              <>
                <span className="font-medium text-ink">To:</span> {contact.name}, {contact.address}
                {!contact.inRegion && " (outside the region)"}
              </>
            ) : (
              <>
                <span className="font-medium text-ink">Pickup:</span> {contact.name} · at{" "}
                {PICKUP_LOCATION}
              </>
            )}
          </p>

          <div className="mt-4">
            <PartsChecklist
              requestId={request.id}
              itemName={item.name}
              parts={row.parts}
              packed={row.packed}
              onToggle={onToggle}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-700">
              Due back:{" "}
              <time dateTime={row.dueAt} className="font-medium tabular-nums">
                {formatDay(row.dueAt)}
              </time>
            </p>
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              {tab === "ship" ? (
                <>
                  <Button
                    onClick={onShip}
                    disabled={!row.fullyPacked}
                    aria-describedby={row.fullyPacked ? undefined : hintId}
                    className={primary}
                  >
                    Mark shipped<span className="sr-only">: {who}</span>
                  </Button>
                  {!row.fullyPacked && (
                    <p id={hintId} className="text-sm text-neutral-600">
                      Tick all parts to mark as shipped
                    </p>
                  )}
                </>
              ) : request.readyForPickupAt ? (
                <>
                  <Button onClick={onPickedUp} className={primary}>
                    Mark picked up<span className="sr-only">: {who}</span>
                  </Button>
                  <p className="text-sm text-neutral-600">Ready at the front desk</p>
                </>
              ) : (
                <>
                  <Button
                    onClick={onReady}
                    disabled={!row.fullyPacked}
                    aria-describedby={row.fullyPacked ? undefined : hintId}
                    className={primary}
                  >
                    Mark ready for pickup<span className="sr-only">: {who}</span>
                  </Button>
                  {!row.fullyPacked && (
                    <p id={hintId} className="text-sm text-neutral-600">
                      Tick all parts first
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
