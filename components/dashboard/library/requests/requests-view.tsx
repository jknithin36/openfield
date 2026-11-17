"use client";

import { useMemo, useState } from "react";

import { useLibraryStore } from "@/store/library";
import type { ItemType, LibraryData, Role } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { plural } from "@/lib/format";
import { dayDiff, isOverWaitingTarget } from "@/lib/library/selectors";
import {
  copiesText,
  csvDate,
  nextWaitingId,
  oldestWaitingDays,
  options,
  parseOne,
  parseOptional,
  REQUEST_TAB_LABEL,
  REQUEST_TABS,
  requestsView,
  ROLE_LABEL,
  TYPE_LABEL,
  type RequestRow,
  type RequestTab,
} from "@/lib/library/views";
import { ItemIcon } from "@/components/dashboard/item-icon";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/shared/data-table";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListPagination, paginate } from "@/components/dashboard/shared/list-pagination";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { useRecordParam } from "@/components/dashboard/shared/record-panel";
import { REQUEST_STATUS, StatusText } from "@/components/dashboard/shared/status-text";
import { Toolbar } from "@/components/dashboard/shared/toolbar";
import { useLibrary } from "@/components/dashboard/shared/use-library";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import {
  RequestPanel,
  type RequestAction,
} from "@/components/dashboard/library/requests/request-panel";

const EMPTY: Record<RequestTab, string> = {
  all: "No requests yet.",
  waiting: "No requests waiting. Nice work.",
  waitlisted: "Nobody is on a waitlist.",
  approved: "No approved requests waiting to go out.",
  declined: "No declined requests.",
};
const ITEM_TYPES = Object.keys(TYPE_LABEL) as ItemType[];
const ROLES = Object.keys(ROLE_LABEL) as Role[];

export function RequestsView() {
  const data = useLibrary();
  return data ? (
    <RequestsContent data={data} />
  ) : (
    <PageHeader title="Requests" description="Loading…" />
  );
}

function RequestsContent({ data }: { data: LibraryData }) {
  const [now] = useState(() => new Date());
  const { searchParams } = useUrlState();
  const record = useRecordParam();

  const tab = parseOne(searchParams.get("status"), REQUEST_TABS, "waiting");
  const q = searchParams.get("q") ?? "";
  const type = parseOptional(searchParams.get("type"), ITEM_TYPES);
  const role = parseOptional(searchParams.get("role"), ROLES);

  const { rows, counts } = useMemo(
    () => requestsView(data, { tab, q, type, role }),
    [data, tab, q, type, role],
  );
  const { page, pageCount, pageRows } = paginate(rows, searchParams.get("page"));
  const oldest = oldestWaitingDays(data, now);

  const exportCsv = () =>
    downloadCsv(`openfield-requests-${tab}`, [
      [
        "Request",
        "Status",
        "Item",
        "Type",
        "Person",
        "Role",
        "Requested",
        "Waiting (days)",
        "Copies",
      ],
      ...rows.map((r) => [
        r.request.id,
        REQUEST_STATUS[r.request.status].label,
        r.item.name,
        TYPE_LABEL[r.item.type],
        r.contact.name,
        ROLE_LABEL[r.contact.role],
        csvDate(r.request.requestedAt),
        dayDiff(r.request.requestedAt, now),
        copiesText(data, r.item.id),
      ]),
    ]);

  const onAction = (id: string, action: RequestAction) => {
    const store = useLibraryStore.getState();
    const result =
      action.kind === "approve"
        ? store.approve(id)
        : action.kind === "waitlist"
          ? store.waitlist(id)
          : store.decline(id, action.reason, action.note);
    const ok = notifyResult(result, {
      success:
        action.kind === "approve"
          ? "Approved. Moved to To ship."
          : action.kind === "waitlist"
            ? "Added to the waitlist."
            : "Request declined.",
      description: id,
      undone: `Undone: ${id} is back to how it was`,
    });
    if (!ok) return;
    // Move to the next waiting request, or close the panel.
    const after = useLibraryStore.getState().data;
    const next = after ? nextWaitingId(after, id) : null;
    if (next) record.open(next);
    else record.close();
  };

  const waitingCell = (r: RequestRow) => {
    if (r.copyAvailable) return <StatusText tone="info">Copy available</StatusText>;
    if (r.request.status !== "waiting")
      return <StatusText icon={false}>{REQUEST_STATUS[r.request.status].label}</StatusText>;
    const days = dayDiff(r.request.requestedAt, now);
    return isOverWaitingTarget(data, r.request, now) ? (
      <StatusText tone="warning">
        {plural(days, "day", "days")}
        <span className="sr-only">, over {data.settings.waitingTargetDays}-day target</span>
      </StatusText>
    ) : (
      <span className="tabular-nums">{plural(days, "day", "days")}</span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Library" }, { label: "Requests" }]}
        title="Requests"
        count={`(${counts.waiting} waiting)`}
        description={
          <>
            Approve or decline new borrowing requests.
            {counts.waiting > 0 && <> Oldest waiting: {plural(oldest, "day", "days")}.</>}
          </>
        }
        moreActions={[{ label: "Export CSV", onSelect: exportCsv }]}
        tabs={{
          label: "Filter by status",
          current: tab,
          defaultValue: "waiting",
          items: REQUEST_TABS.map((t) => ({
            value: t,
            label: REQUEST_TAB_LABEL[t],
            count: counts[t],
          })),
        }}
      />

      <Toolbar
        searchLabel="Search requests"
        searchPlaceholder="Name, item or R-1042"
        searchHint="Matches person, item name or request number."
        filters={[
          { key: "type", label: "Item type", options: options(TYPE_LABEL) },
          { key: "role", label: "Role", options: options(ROLE_LABEL) },
        ]}
      />

      <DataTable
        caption="Library requests, sorted oldest first"
        rows={pageRows}
        rowKey={(r) => r.request.id}
        openText={(r) => r.request.id}
        openLabel={(r) => `Open request ${r.request.id}, ${r.item.name} for ${r.contact.name}`}
        onOpen={(r, trigger) => record.open(r.request.id, trigger)}
        empty={
          <EmptyState>
            {q || type || role ? "No requests match your search." : EMPTY[tab]}
          </EmptyState>
        }
        columns={[
          { header: "Request", cell: () => null },
          {
            header: "Item",
            cell: (r) => (
              <div className="flex items-center gap-3">
                <ItemIcon item={r.item} size="sm" />
                <div>
                  <div className="font-medium text-ink">{r.item.name}</div>
                  <div className="text-sm text-neutral-600">{TYPE_LABEL[r.item.type]}</div>
                </div>
              </div>
            ),
          },
          {
            header: "Person",
            cell: (r) => (
              <div>
                <div className="text-ink">{r.contact.name}</div>
                <div className="text-sm text-neutral-600">{ROLE_LABEL[r.contact.role]}</div>
              </div>
            ),
          },
          { header: tab === "waiting" ? "Waiting" : "Status", cell: waitingCell },
          {
            header: "Copies",
            cell: (r) => <span className="tabular-nums">{copiesText(data, r.item.id)}</span>,
          },
        ]}
      />

      <ListPagination page={page} pageCount={pageCount} total={rows.length} label="Request pages" />

      <RequestPanel
        data={data}
        id={record.id}
        now={now}
        returnFocusRef={record.returnFocusRef}
        onClose={record.close}
        onAction={onAction}
      />
    </div>
  );
}
