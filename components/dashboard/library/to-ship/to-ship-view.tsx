"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { PrinterIcon } from "@hugeicons/core-free-icons";

import { useLibraryStore } from "@/store/library";
import type { LibraryData } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { plural } from "@/lib/format";
import { requestById, itemById } from "@/lib/library/selectors";
import { csvDate, parseOne, PICKUP_LOCATION, SHIP_TABS, toShipView } from "@/lib/library/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { announce } from "@/components/dashboard/shared/announcer";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { useLibrary } from "@/components/dashboard/shared/use-library";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { BulkBar } from "@/components/dashboard/library/to-ship/bulk-bar";
import { ShipRow } from "@/components/dashboard/library/to-ship/ship-row";

export function ToShipView() {
  const data = useLibrary();
  return data ? (
    <ToShipContent data={data} />
  ) : (
    <PageHeader title="To ship" description="Loading…" />
  );
}

function ToShipContent({ data }: { data: LibraryData }) {
  const [now] = useState(() => new Date());
  const { searchParams } = useUrlState();
  const tab = parseOne(searchParams.get("tab"), SHIP_TABS, "ship");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { rows, counts, oldestDays } = useMemo(() => toShipView(data, tab, now), [data, tab, now]);
  const selectedIds = rows.filter((r) => selected.has(r.request.id)).map((r) => r.request.id);
  const total = counts.ship + counts.pickup;
  const store = () => useLibraryStore.getState();

  const unselect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });

  const shipSelected = () => {
    const res = store().markShippedMany(selectedIds);
    setSelected(new Set());
    const name = (id: string) => {
      const r = requestById(data, id);
      return (r && itemById(data, r.itemId)?.name) ?? id;
    };
    const parts: string[] = [];
    if (res.done.length)
      parts.push(`${plural(res.done.length, "item", "items")} marked as shipped.`);
    if (res.skipped.length)
      parts.push(
        `${plural(res.skipped.length, "item", "items")} skipped: not all parts ticked (${res.skipped.map((s) => name(s.id)).join(", ")})`,
      );
    const message = parts.join(" ");
    if (res.undoId)
      notifyResult(
        { ok: true, undoId: res.undoId },
        { success: message, undone: "Undone: items are back in To ship" },
      );
    else {
      announce(message);
      toast(message);
    }
  };

  const exportCsv = () =>
    downloadCsv(`openfield-to-ship-${tab}`, [
      [
        "Request",
        "Item",
        "Borrower",
        tab === "ship" ? "Address" : "Pickup at",
        "Parts packed",
        "Due back",
      ],
      ...rows.map((r) => [
        r.request.id,
        r.item.name,
        r.contact.name,
        tab === "ship" ? r.contact.address : PICKUP_LOCATION,
        `${r.packed.length} of ${r.parts.length}`,
        csvDate(r.dueAt),
      ]),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Library" }, { label: "To ship" }]}
        title="To ship"
        count={`(${total})`}
        description={
          total > 0
            ? `Approved items to pack and send. Oldest approved: ${plural(oldestDays, "day", "days")} ago.`
            : "Approved items to pack and send."
        }
        primaryAction={{
          label: "Print packing slips",
          href: `/dashboard/library/to-ship/print${tab === "pickup" ? "?tab=pickup" : ""}`,
          icon: <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} aria-hidden="true" />,
        }}
        moreActions={[{ label: "Export CSV", onSelect: exportCsv }]}
        tabs={{
          label: "Delivery method",
          param: "tab",
          current: tab,
          defaultValue: "ship",
          items: [
            { value: "ship", label: "Ship", count: counts.ship },
            { value: "pickup", label: "Pickup", count: counts.pickup },
          ],
        }}
      />

      {rows.length === 0 ? (
        <EmptyState>
          {tab === "ship"
            ? "Nothing to ship. Approved requests will show up here."
            : "No pickups waiting."}
        </EmptyState>
      ) : (
        <>
          {tab === "ship" && (
            <BulkBar
              total={rows.length}
              selected={selectedIds.length}
              onSelectAll={(all) =>
                setSelected(all ? new Set(rows.map((r) => r.request.id)) : new Set())
              }
              onShipSelected={shipSelected}
            />
          )}
          <ul
            className="flex flex-col gap-4"
            aria-label={tab === "ship" ? "Items to ship" : "Items for pickup"}
          >
            {rows.map((row) => {
              const id = row.request.id;
              const who = `${row.item.name} for ${row.contact.name}`;
              return (
                <ShipRow
                  key={id}
                  row={row}
                  tab={tab}
                  selected={selectedIds.includes(id)}
                  onSelect={(checked) =>
                    setSelected((s) => {
                      const n = new Set(s);
                      if (checked) n.add(id);
                      else n.delete(id);
                      return n;
                    })
                  }
                  onToggle={(part) => {
                    const r = store().togglePart(id, part);
                    if (!r.ok) notifyResult(r, { success: "" });
                  }}
                  onShip={() => {
                    unselect(id);
                    notifyResult(store().markShipped(id), {
                      success: "Marked as shipped. Moved to On loan.",
                      description: who,
                      undone: `Undone: ${who} is back in To ship`,
                    });
                  }}
                  onReady={() =>
                    notifyResult(store().markReadyForPickup(id), {
                      success: `${row.item.name} is ready for pickup.`,
                      undone: `Undone: ${row.item.name} is not ready yet`,
                    })
                  }
                  onPickedUp={() =>
                    notifyResult(store().markPickedUp(id), {
                      success: "Marked as picked up. Moved to On loan.",
                      description: who,
                      undone: `Undone: ${who} is back in Pickup`,
                    })
                  }
                />
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
