"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLibraryStore } from "@/store/library";
import type { LibraryData } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { formatDay, relativeDay } from "@/lib/format";
import {
  csvDate,
  parseOne,
  RETURN_TAB_LABEL,
  RETURN_TABS,
  returnsView,
  type Joined,
  type ReturnTab,
} from "@/lib/library/views";
import { ItemIcon } from "@/components/dashboard/item-icon";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { useLibrary } from "@/components/dashboard/shared/use-library";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { NoteConfirmForm } from "@/components/dashboard/library/on-loan/lost-form";
import { ReturnCheckForm } from "@/components/dashboard/library/returns/return-check-form";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const EMPTY: Record<ReturnTab, string> = {
  "to-check": "Nothing to check. Returned items will show up here.",
  "in-repair": "Nothing is in repair.",
  done: "No checks in the last 30 days.",
};

export function ReturnsView() {
  const data = useLibrary();
  return data ? (
    <ReturnsContent data={data} />
  ) : (
    <PageHeader title="Returns & cleaning" description="Loading…" />
  );
}

function ReturnsContent({ data }: { data: LibraryData }) {
  const [now] = useState(() => new Date());
  const { searchParams } = useUrlState();
  const tab = parseOne(searchParams.get("tab"), RETURN_TABS, "to-check");
  const { rows, counts } = useMemo(() => returnsView(data, tab, now), [data, tab, now]);
  const store = () => useLibraryStore.getState();

  const exportCsv = () =>
    downloadCsv(`openfield-returns-${tab}`, [
      ["Request", "Item", "Borrower", "Returned", "Condition", "Cleaned", "Notes", "Checked by"],
      ...rows.map(({ request: r, item, contact }) => [
        r.id,
        item.name,
        contact.name,
        csvDate(r.returnedAt),
        r.returnCheck?.condition ?? "",
        r.returnCheck ? (r.returnCheck.cleaned ? "Yes" : "No") : "",
        r.returnCheck?.notes ?? "",
        r.returnCheck?.checkedBy ?? "",
      ]),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Library" }, { label: "Returns & cleaning" }]}
        title="Returns & cleaning"
        count={`(${counts["to-check"]} to check)`}
        description="Check and clean returned items before they're lent again."
        moreActions={[{ label: "Export CSV", onSelect: exportCsv }]}
        tabs={{
          label: "Return status",
          param: "tab",
          current: tab,
          defaultValue: "to-check",
          items: RETURN_TABS.map((t) => ({
            value: t,
            label: RETURN_TAB_LABEL[t],
            count: counts[t],
          })),
        }}
      />

      {rows.length === 0 ? (
        <EmptyState>{EMPTY[tab]}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-4" aria-label={RETURN_TAB_LABEL[tab]}>
          {rows.map((row) => (
            <ReturnRow
              key={row.request.id}
              row={row}
              tab={tab}
              data={data}
              now={now}
              store={store}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReturnRow({
  row,
  tab,
  data,
  now,
  store,
}: {
  row: Joined;
  tab: ReturnTab;
  data: LibraryData;
  now: Date;
  store: () => ReturnType<typeof useLibraryStore.getState>;
}) {
  const { request, item, contact } = row;
  const [retiring, setRetiring] = useState(false);
  const check = request.returnCheck;

  return (
    <li className="rounded-lg border border-border bg-white p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <ItemIcon item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-[17px] font-medium text-ink">
              {item.name}{" "}
              <span className="text-sm font-normal text-neutral-600 tabular-nums">
                {request.id}
              </span>
            </h2>
            {request.returnedAt && (
              <p className="text-sm text-neutral-600">
                Returned <time dateTime={request.returnedAt}>{formatDay(request.returnedAt)}</time>{" "}
                ({relativeDay(request.returnedAt, now)})
              </p>
            )}
          </div>
          <p className="mt-1 text-[15px] text-neutral-700">Borrower: {contact.name}</p>

          <div className="mt-4">
            {tab === "to-check" && (
              <ReturnCheckForm
                data={data}
                row={row}
                onShelve={(c) =>
                  notifyResult(store().backOnShelf(request.id, c), {
                    success: `${item.name} is back on the shelf.`,
                    undone: `Undone: ${item.name} is back in To check`,
                  })
                }
                onRepair={(c) =>
                  notifyResult(store().sendToRepair(request.id, c), {
                    success: `${item.name} sent to repair.`,
                    undone: `Undone: ${item.name} is back in To check`,
                  })
                }
              />
            )}

            {tab === "in-repair" && (
              <div className="flex flex-col gap-3">
                {check?.notes && (
                  <p className="text-[15px] text-neutral-800">
                    <span className="font-medium text-ink">Repair notes:</span> {check.notes}
                  </p>
                )}
                {retiring ? (
                  <NoteConfirmForm
                    id={`${request.id}-retire`}
                    intro={<>Retire {item.name}? This removes one copy from the catalog.</>}
                    label="Why is it being retired?"
                    requiredMessage="Write a note about why the item is being retired"
                    confirmLabel="Retire item"
                    onConfirm={(note) => {
                      if (
                        notifyResult(store().retireFromRepair(request.id, note), {
                          success: `${item.name} retired. Copies reduced by 1.`,
                          undone: `Undone: ${item.name} is back in repair`,
                        })
                      )
                        setRetiring(false);
                    }}
                    onCancel={() => setRetiring(false)}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() =>
                        notifyResult(store().finishRepair(request.id), {
                          success: `${item.name} repaired and back on the shelf.`,
                          undone: `Undone: ${item.name} is back in repair`,
                        })
                      }
                      className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
                    >
                      Repaired, back on shelf<span className="sr-only">: {item.name}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRetiring(true)}
                      className={`h-11 px-4 ${focus}`}
                    >
                      Retire item<span className="sr-only">: {item.name}</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {tab === "done" && check && (
              <dl className="grid gap-x-6 gap-y-1 text-[15px] sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="text-neutral-600">Condition:</dt>
                  <dd>
                    <StatusText tone={check.condition === "good" ? "success" : "warning"}>
                      {check.condition === "good" ? "Good" : "Needed repair"}
                    </StatusText>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-neutral-600">Cleaned:</dt>
                  <dd>{check.cleaned ? "Yes" : "No"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-neutral-600">Parts:</dt>
                  <dd>
                    {check.partsReturned.length
                      ? `${check.partsReturned.length} of ${item.parts.length} returned`
                      : "Not recorded"}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-neutral-600">Checked:</dt>
                  <dd>
                    {check.checkedAt ? (
                      <time dateTime={check.checkedAt}>{formatDay(check.checkedAt)}</time>
                    ) : (
                      "—"
                    )}
                    {check.checkedBy ? ` by ${check.checkedBy}` : ""}
                  </dd>
                </div>
                {check.notes && (
                  <div className="flex gap-2 sm:col-span-2">
                    <dt className="text-neutral-600">Notes:</dt>
                    <dd>{check.notes}</dd>
                  </div>
                )}
                {request.retireNote && (
                  <div className="flex gap-2 sm:col-span-2">
                    <dt className="text-neutral-600">Retired:</dt>
                    <dd>{request.retireNote}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
