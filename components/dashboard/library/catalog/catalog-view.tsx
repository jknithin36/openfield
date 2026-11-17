"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLibraryStore } from "@/store/library";
import type { CenterSlug, LibraryData } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { formatMonthDay, plural } from "@/lib/format";
import {
  AVAILABILITY_FILTER,
  CATALOG_TAB_LABEL,
  CATALOG_TABS,
  catalogView,
  CENTER_LABEL,
  options,
  parseOne,
  parseOptional,
  SORTS,
  TYPE_LABEL,
  type AvailabilityFilter,
  type CatalogSort,
  type CatalogTab,
} from "@/lib/library/views";
import { ItemIcon } from "@/components/dashboard/item-icon";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/shared/data-table";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListPagination, paginate } from "@/components/dashboard/shared/list-pagination";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { Toolbar } from "@/components/dashboard/shared/toolbar";
import { useLibrary } from "@/components/dashboard/shared/use-library";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { ItemForm } from "@/components/dashboard/library/catalog/item-form";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const EMPTY: Record<CatalogTab, string> = {
  all: "The catalog is empty.",
  device: "No devices.",
  kit: "No kits.",
  book: "No books.",
  video: "No videos.",
  assessment: "No assessments.",
  archived: "Nothing is archived.",
};
const CENTERS = Object.keys(CENTER_LABEL) as CenterSlug[];
const AVAIL = Object.keys(AVAILABILITY_FILTER) as AvailabilityFilter[];
const SORT_KEYS = Object.keys(SORTS) as CatalogSort[];

export function CatalogView() {
  const data = useLibrary();
  return data ? (
    <CatalogContent data={data} />
  ) : (
    <PageHeader title="Catalog" description="Loading…" />
  );
}

function CatalogContent({ data }: { data: LibraryData }) {
  const [now] = useState(() => new Date());
  const router = useRouter();
  const { searchParams, setParams } = useUrlState();
  const addTrigger = useRef<HTMLElement | null>(null);

  const tab = parseOne(searchParams.get("tab"), CATALOG_TABS, "all");
  const q = searchParams.get("q") ?? "";
  const center = parseOptional(searchParams.get("center"), CENTERS);
  const avail = parseOptional(searchParams.get("avail"), AVAIL);
  const sort = parseOne(searchParams.get("sort"), SORT_KEYS, "name");
  const adding = searchParams.get("new") === "1";

  const { rows, counts, activeItems } = useMemo(
    () => catalogView(data, { tab, q, center, avail, sort }, now),
    [data, tab, q, center, avail, sort, now],
  );
  const { page, pageCount, pageRows } = paginate(rows, searchParams.get("page"));

  const exportCsv = () =>
    downloadCsv(`openfield-catalog-${tab}`, [
      [
        "Item",
        "Type",
        "Topic",
        "Copies",
        "Free",
        "Waitlist",
        "Avg wait (weeks)",
        "Times loaned (12 months)",
        "Archived",
      ],
      ...rows.map((r) => [
        r.item.name,
        TYPE_LABEL[r.item.type],
        CENTER_LABEL[r.item.center],
        r.item.copies,
        r.free,
        r.waitlist,
        r.avgWaitWeeks ?? "",
        r.timesLoaned,
        r.item.archived ? "Yes" : "No",
      ]),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Library" }, { label: "Catalog" }]}
        title="Catalog"
        count={`(${plural(activeItems, "item", "items")})`}
        description="Every item in the library, with copies and waitlists."
        primaryAction={{
          label: "Add item",
          onClick: () => {
            addTrigger.current = document.activeElement as HTMLElement | null;
            setParams({ new: "1" });
          },
          icon: <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />,
        }}
        moreActions={[{ label: "Export CSV", onSelect: exportCsv }]}
        tabs={{
          label: "Item type",
          param: "tab",
          current: tab,
          defaultValue: "all",
          items: CATALOG_TABS.map((t) => ({
            value: t,
            label: CATALOG_TAB_LABEL[t],
            count: counts[t],
          })),
        }}
      />

      <Toolbar
        searchLabel="Search the catalog"
        searchPlaceholder="Item name"
        filters={[
          { key: "center", label: "Topic", options: options(CENTER_LABEL) },
          { key: "avail", label: "Availability", options: options(AVAILABILITY_FILTER) },
        ]}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" className={`h-11 gap-1.5 px-3 font-normal ${focus}`} />
            }
          >
            Sort: <span className="font-medium">{SORTS[sort]}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              aria-hidden="true"
              className="size-3.5 opacity-70"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={(v) =>
                  setParams({ sort: v === "name" ? null : String(v), page: null })
                }
              >
                {SORT_KEYS.map((k) => (
                  <DropdownMenuRadioItem key={k} value={k}>
                    {SORTS[k]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Toolbar>

      <DataTable
        caption={`Library catalog, sorted by ${SORTS[sort].toLowerCase()}`}
        rows={pageRows}
        rowKey={(r) => r.item.id}
        openText={(r) => r.item.name}
        openLabel={(r) => `Open ${r.item.name}`}
        onOpen={(r) => router.push(`/dashboard/library/catalog/${r.item.id}`)}
        empty={
          <EmptyState>
            {q || center || avail ? "No items match your search." : EMPTY[tab]}
          </EmptyState>
        }
        columns={[
          {
            header: "Item",
            cell: (r) => (
              <span className="flex items-center gap-2 text-sm text-neutral-600">
                <ItemIcon item={r.item} size="sm" className="size-6 rounded-md" />
                {TYPE_LABEL[r.item.type]}
                {r.item.archived && " · Archived"}
              </span>
            ),
          },
          { header: "Topic", cell: (r) => CENTER_LABEL[r.item.center] },
          {
            header: "Copies",
            cell: (r) => (
              <span className="tabular-nums">{plural(r.item.copies, "copy", "copies")}</span>
            ),
          },
          {
            header: "Available",
            cell: (r) =>
              r.free > 0 ? (
                <span className="tabular-nums">{r.free} free</span>
              ) : (
                <StatusText tone="warning" icon={false}>
                  None free
                  {r.nextBack ? (
                    <>
                      {" "}
                      — next back <time dateTime={r.nextBack}>{formatMonthDay(r.nextBack)}</time>
                    </>
                  ) : (
                    ""
                  )}
                </StatusText>
              ),
          },
          {
            header: "Waitlist",
            cell: (r) =>
              r.waitlist ? (
                <span className="tabular-nums">
                  {r.waitlist} waiting
                  {r.avgWaitWeeks !== null ? ` · avg ${Math.round(r.avgWaitWeeks)} wks` : ""}
                </span>
              ) : (
                <span aria-label="No waitlist">—</span>
              ),
          },
          {
            header: "Times loaned",
            cell: (r) => (
              <span className="tabular-nums">
                {r.timesLoaned} <span className="text-sm text-neutral-600">in 12 months</span>
              </span>
            ),
          },
        ]}
      />

      <ListPagination page={page} pageCount={pageCount} total={rows.length} label="Catalog pages" />

      <ItemForm
        open={adding}
        onOpenChange={(o) => !o && setParams({ new: null })}
        returnFocusRef={addTrigger}
        onSubmit={(input) => {
          const res = useLibraryStore.getState().addItem(input);
          if (!res.ok) return res.reason;
          notifyResult(res, {
            success: `${input.name.trim()} added to the catalog.`,
            undone: "Item removed again",
          });
          setParams({ new: null });
          return null;
        }}
      />
    </div>
  );
}
