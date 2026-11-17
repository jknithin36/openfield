"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PackageReceiveIcon } from "@hugeicons/core-free-icons";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLibraryStore } from "@/store/library";
import type { ItemType, LibraryData } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { dueWording, formatDay, formatMonthDay, plural } from "@/lib/format";
import { isOverdue } from "@/lib/library/selectors";
import {
  csvDate,
  join,
  LOAN_TAB_LABEL,
  LOAN_TABS,
  loansView,
  options,
  parseOne,
  parseOptional,
  reminderSummary,
  ROLE_LABEL,
  TYPE_LABEL,
  type LoanTab,
} from "@/lib/library/views";
import { ItemIcon } from "@/components/dashboard/item-icon";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/shared/data-table";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListPagination, paginate } from "@/components/dashboard/shared/list-pagination";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { useRecordParam } from "@/components/dashboard/shared/record-panel";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { Toolbar } from "@/components/dashboard/shared/toolbar";
import { useLibrary } from "@/components/dashboard/shared/use-library";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { CheckInDialog } from "@/components/dashboard/library/on-loan/check-in-dialog";
import { LoanPanel, type LoanAction } from "@/components/dashboard/library/on-loan/loan-panel";

const EMPTY: Record<LoanTab, string> = {
  all: "Nothing is on loan right now.",
  overdue: "Nothing overdue.",
  "due-week": "Nothing due back this week.",
  extended: "No extended loans.",
};
const ITEM_TYPES = Object.keys(TYPE_LABEL) as ItemType[];
const focus = "focus-visible:ring-3 focus-visible:ring-ring";

export function LoansView() {
  const data = useLibrary();
  return data ? (
    <LoansContent data={data} />
  ) : (
    <PageHeader title="On loan" description="Loading…" />
  );
}

function LoansContent({ data }: { data: LibraryData }) {
  const [now] = useState(() => new Date());
  const { searchParams } = useUrlState();
  const record = useRecordParam();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const tab = parseOne(searchParams.get("status"), LOAN_TABS, "all");
  const q = searchParams.get("q") ?? "";
  const type = parseOptional(searchParams.get("type"), ITEM_TYPES);
  const { rows, counts } = useMemo(
    () => loansView(data, { tab, q, type }, now),
    [data, tab, q, type, now],
  );
  const { page, pageCount, pageRows } = paginate(rows, searchParams.get("page"));
  const overdueLoans = join(
    data,
    data.requests.filter((r) => isOverdue(r, now)),
  );
  const store = () => useLibraryStore.getState();

  const onAction = (id: string, a: LoanAction): boolean => {
    const s = store();
    const result =
      a.kind === "remind"
        ? s.sendReminder(id, "email")
        : a.kind === "extend"
          ? s.extendLoan(id, a.weeks)
          : a.kind === "check-in"
            ? s.checkIn(id)
            : s.markLost(id, a.note);
    const ok = notifyResult(result, {
      success:
        a.kind === "remind"
          ? "Reminder sent."
          : a.kind === "extend"
            ? `Loan extended by ${plural(a.weeks, "week", "weeks")}.`
            : a.kind === "check-in"
              ? "Checked in. Moved to Returns & cleaning."
              : "Marked as lost.",
      description: id,
      undone: `Undone: ${id} is back to how it was`,
    });
    // Checked in or lost: the loan leaves this page, so close the panel.
    if (ok && (a.kind === "check-in" || a.kind === "lost")) record.close();
    return ok;
  };

  const sendAllOverdue = () => {
    const res = store().sendReminders(overdueLoans.map((j) => j.request.id));
    setConfirmBulk(false);
    if (res.undoId)
      notifyResult(
        { ok: true, undoId: res.undoId },
        {
          success: `${plural(res.done.length, "reminder", "reminders")} sent.`,
          undone: "Reminders undone",
        },
      );
  };

  const exportCsv = () =>
    downloadCsv(`openfield-on-loan-${tab}`, [
      [
        "Request",
        "Item",
        "Type",
        "Borrower",
        "Role",
        "Due",
        "Days late",
        "Reminders",
        "Extended (days)",
      ],
      ...rows.map((r) => [
        r.request.id,
        r.item.name,
        TYPE_LABEL[r.item.type],
        r.contact.name,
        ROLE_LABEL[r.contact.role],
        csvDate(r.request.dueAt),
        r.late,
        r.request.reminders.length,
        r.request.extendedBy ?? 0,
      ]),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Library" }, { label: "On loan" }]}
        title="On loan"
        count={`(${counts.all})`}
        description={`Items currently with people. ${counts.overdue} overdue.`}
        primaryAction={{
          label: "Check in a return",
          onClick: () => setCheckInOpen(true),
          icon: <HugeiconsIcon icon={PackageReceiveIcon} strokeWidth={2} aria-hidden="true" />,
        }}
        moreActions={[
          ...(overdueLoans.length
            ? [{ label: "Send all overdue reminders", onSelect: () => setConfirmBulk(true) }]
            : []),
          { label: "Export CSV", onSelect: exportCsv },
        ]}
        tabs={{
          label: "Filter loans",
          current: tab,
          defaultValue: "all",
          items: LOAN_TABS.map((t) => ({ value: t, label: LOAN_TAB_LABEL[t], count: counts[t] })),
        }}
      />

      <Toolbar
        searchLabel="Search loans"
        searchPlaceholder="Borrower, item or R-1042"
        searchHint="Matches borrower, item name or request number."
        filters={[{ key: "type", label: "Item type", options: options(TYPE_LABEL) }]}
      />

      <DataTable
        caption="Items on loan, overdue first"
        rows={pageRows}
        rowKey={(r) => r.request.id}
        openText={(r) => r.request.id}
        openLabel={(r) => `Open loan ${r.request.id}, ${r.item.name} with ${r.contact.name}`}
        onOpen={(r, trigger) => record.open(r.request.id, trigger)}
        empty={<EmptyState>{q || type ? "No loans match your search." : EMPTY[tab]}</EmptyState>}
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
            header: "Borrower",
            cell: (r) => (
              <div>
                <div className="text-ink">{r.contact.name}</div>
                <div className="text-sm text-neutral-600">{ROLE_LABEL[r.contact.role]}</div>
              </div>
            ),
          },
          {
            header: "Due",
            cell: (r) => {
              if (!r.request.dueAt) return "—";
              const d = dueWording(r.request.dueAt, now);
              return d.late ? (
                <div className="flex flex-col">
                  <StatusText tone="danger">{d.text}</StatusText>
                  <span className="text-sm text-neutral-600">
                    Due <time dateTime={r.request.dueAt}>{formatMonthDay(r.request.dueAt)}</time>
                  </span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span>
                    Due <time dateTime={r.request.dueAt}>{formatDay(r.request.dueAt)}</time>
                  </span>
                  <span className="text-sm text-neutral-600">{d.text}</span>
                </div>
              );
            },
          },
          {
            header: "Reminded",
            cell: (r) => reminderSummary(r.request) ?? <span aria-label="No reminders">—</span>,
          },
        ]}
      />

      <ListPagination page={page} pageCount={pageCount} total={rows.length} label="Loan pages" />

      <LoanPanel
        data={data}
        id={record.id}
        now={now}
        returnFocusRef={record.returnFocusRef}
        onClose={record.close}
        onAction={onAction}
      />

      <CheckInDialog
        data={data}
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        onConfirm={(id) => {
          if (onAction(id, { kind: "check-in" })) setCheckInOpen(false);
        }}
      />

      <AlertDialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Send {plural(overdueLoans.length, "reminder", "reminders")}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              A friendly reminder email will go to{" "}
              {overdueLoans.map((j) => j.contact.name).join(", ")}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={`h-11 px-4 ${focus}`}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={sendAllOverdue}
              className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
            >
              Send reminders
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
