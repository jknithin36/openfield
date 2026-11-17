"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";

import { useLibraryStore } from "@/store/library";
import type { LibraryData } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { dueWording, formatDay, formatMonthDay, plural } from "@/lib/format";
import { getAvailability, getDemand, itemById } from "@/lib/library/selectors";
import { CENTER_LABEL, copiesRightNow, csvDate, TYPE_LABEL } from "@/lib/library/views";
import { ItemIcon } from "@/components/dashboard/item-icon";
import { PageHeader } from "@/components/dashboard/page-header";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { REQUEST_STATUS, StatusText } from "@/components/dashboard/shared/status-text";
import { useLibrary } from "@/components/dashboard/shared/use-library";
import { Bar } from "@/components/dashboard/today/bar";
import { ItemForm } from "@/components/dashboard/library/catalog/item-form";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focus}`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      <div className="mt-3 text-[15px]">{children}</div>
    </section>
  );
}

export function ItemDetail({ id }: { id: string }) {
  const data = useLibrary();
  if (!data) return <PageHeader title="Item" description="Loading…" />;
  const item = itemById(data, id);
  if (!item)
    return (
      <PageHeader
        breadcrumb={[
          { label: "Library" },
          { label: "Catalog", href: "/dashboard/library/catalog" },
          { label: "Not found" },
        ]}
        title="Item not found"
        description="It may have been removed. Go back to the catalog to find it."
      />
    );
  return <ItemDetailContent data={data} id={id} />;
}

function ItemDetailContent({ data, id }: { data: LibraryData; id: string }) {
  const [now] = useState(() => new Date());
  const [editing, setEditing] = useState(false);
  const editTrigger = useRef<HTMLElement | null>(null);
  const item = itemById(data, id)!;
  const avail = getAvailability(data, id);
  const copies = copiesRightNow(data, id);
  const demand = getDemand(data, id, now);
  const maxMonth = Math.max(1, ...demand.byMonth.map((m) => m.count));
  const store = () => useLibraryStore.getState();

  const exportHistory = () =>
    downloadCsv(`openfield-${item.slug}-history`, [
      ["Request", "Borrower", "Sent", "Returned", "Status", "Condition", "Notes"],
      ...copies.history.map(({ request: r, contact }) => [
        r.id,
        contact.name,
        csvDate(r.shippedAt),
        csvDate(r.returnedAt),
        REQUEST_STATUS[r.status].label,
        r.returnCheck?.condition ?? "",
        r.returnCheck?.notes ?? r.lostNote ?? r.retireNote ?? "",
      ]),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        breadcrumb={[
          { label: "Library" },
          { label: "Catalog", href: "/dashboard/library/catalog" },
          { label: item.name },
        ]}
        title={item.name}
        description={
          <>
            {plural(item.copies, "copy", "copies")} · {avail.free} free · {avail.waitlist} waiting
            {item.archived && (
              <>
                {" "}
                ·{" "}
                <StatusText tone="warning" icon={false}>
                  Archived
                </StatusText>
              </>
            )}
          </>
        }
        primaryAction={{
          label: "Edit item",
          onClick: () => {
            editTrigger.current = document.activeElement as HTMLElement | null;
            setEditing(true);
          },
          icon: <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} aria-hidden="true" />,
        }}
        moreActions={[
          {
            label: item.archived ? "Unarchive item" : "Archive item",
            onSelect: () =>
              notifyResult(store().setArchived(id, !item.archived), {
                success: item.archived
                  ? `${item.name} is back in the catalog.`
                  : `${item.name} archived. It's hidden from the website and Requests.`,
                undone: "Undone",
              }),
          },
          { label: "Export history (CSV)", onSelect: exportHistory },
        ]}
      />

      <Section title="Details">
        <div className="flex gap-4">
          <ItemIcon item={item} />
          <dl className="grid flex-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {[
              ["Type", TYPE_LABEL[item.type]],
              ["Topic", CENTER_LABEL[item.center]],
              ["Age range", item.ageRange || "—"],
              ["Loan length", plural(item.loanDays, "day", "days")],
              ["Max extensions", String(item.maxExtensions)],
              ["Added", formatDay(item.addedAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-neutral-600">{k}:</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        {item.description && (
          <p className="mt-3 max-w-2xl leading-relaxed text-neutral-800">{item.description}</p>
        )}
      </Section>

      <Section title="Parts">
        <ul className="list-disc pl-6">
          {item.parts.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Section>

      <Section title="Copies right now">
        <p className="mb-3 text-neutral-700">
          {plural(copies.out.length, "copy is", "copies are")} out,{" "}
          {plural(copies.returns.length, "is", "are")} being checked or repaired, and{" "}
          {plural(copies.free, "copy is", "copies are")} free.
        </p>
        {copies.out.length + copies.returns.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border border-border bg-white">
            {copies.out.map(({ request: r, contact }) => {
              const due = r.dueAt ? dueWording(r.dueAt, now) : null;
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    {contact.name} ·{" "}
                    {r.status === "approved" ? "Approved, being packed" : "On loan"}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 text-sm">
                    {r.status === "on-loan" &&
                      r.dueAt &&
                      (due?.late ? (
                        <StatusText tone="danger">{due.text}</StatusText>
                      ) : (
                        <span>
                          Due <time dateTime={r.dueAt}>{formatDay(r.dueAt)}</time>
                        </span>
                      ))}
                    <Link
                      href={
                        r.status === "approved"
                          ? "/dashboard/library/to-ship"
                          : `/dashboard/library/on-loan?id=${r.id}`
                      }
                      className={link}
                    >
                      {r.status === "approved" ? "Open in To ship" : "Open loan"}
                      <span className="sr-only"> {r.id}</span>
                    </Link>
                  </span>
                </li>
              );
            })}
            {copies.returns.map(({ request: r, contact }) => (
              <li
                key={r.id}
                className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  {REQUEST_STATUS[r.status].label} · returned by {contact.name}
                </span>
                <Link
                  href={`/dashboard/library/returns${r.status === "in-repair" ? "?tab=in-repair" : ""}`}
                  className={`${link} text-sm`}
                >
                  Open in Returns<span className="sr-only"> {r.id}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Waitlist">
        {copies.waitlist.length === 0 ? (
          <p className="text-neutral-600">Nobody is waiting.</p>
        ) : (
          <ol className="list-decimal pl-6">
            {copies.waitlist.map(({ request: r, contact }) => (
              <li key={r.id} className="py-1">
                {contact.name} · waiting since{" "}
                <time dateTime={r.requestedAt}>{formatDay(r.requestedAt)}</time> ·{" "}
                <Link
                  href={`/dashboard/library/requests?status=waitlisted&id=${r.id}`}
                  className={link}
                >
                  View request<span className="sr-only"> {r.id}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="History">
        {copies.history.length === 0 ? (
          <p className="text-neutral-600">No past loans yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-white">
            {copies.history.map(({ request: r, contact }) => (
              <li key={r.id} className="flex flex-col gap-1 p-3">
                <span className="flex flex-wrap justify-between gap-x-4">
                  <span className="font-medium text-ink">{contact.name}</span>
                  <span className="text-sm text-neutral-600">
                    {r.shippedAt && (
                      <time dateTime={r.shippedAt}>{formatMonthDay(r.shippedAt)}</time>
                    )}
                    {r.returnedAt && (
                      <>
                        {" "}
                        – <time dateTime={r.returnedAt}>{formatMonthDay(r.returnedAt)}</time>
                      </>
                    )}
                  </span>
                </span>
                <span className="text-sm">
                  {r.status === "lost" ? (
                    <StatusText tone="danger">Lost</StatusText>
                  ) : r.returnCheck ? (
                    <StatusText tone={r.returnCheck.condition === "good" ? "success" : "warning"}>
                      {r.returnCheck.condition === "good"
                        ? "Returned in good condition"
                        : "Needed repair"}
                    </StatusText>
                  ) : (
                    "Closed"
                  )}
                  {(r.returnCheck?.notes || r.lostNote || r.retireNote) && (
                    <span className="text-neutral-700">
                      {" "}
                      — {r.returnCheck?.notes ?? r.lostNote ?? r.retireNote}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Demand">
        <p className="text-neutral-800">
          Loaned {plural(demand.timesLoaned12m, "time", "times")} in the last 12 months.
          {demand.avgWaitWeeks !== null && (
            <> Average wait: {plural(Math.round(demand.avgWaitWeeks), "week", "weeks")}.</>
          )}
        </p>
        <h3 className="mt-4 text-[15px] font-medium text-ink">Loans by month</h3>
        <ul className="mt-2 grid max-w-xl gap-1.5">
          {demand.byMonth.map((m) => (
            <li key={m.month} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-3 text-sm">
              <span className="text-neutral-700">{m.label}</span>
              <Bar value={m.count} max={maxMonth} />
              <span className="text-right font-medium text-ink tabular-nums">{m.count}</span>
            </li>
          ))}
        </ul>
      </Section>

      <ItemForm
        open={editing}
        item={item}
        returnFocusRef={editTrigger}
        onOpenChange={setEditing}
        onSubmit={(input) => {
          const res = store().updateItem(id, input);
          if (!res.ok) return res.reason;
          notifyResult(res, { success: `${input.name.trim()} saved.`, undone: "Changes undone" });
          setEditing(false);
          return null;
        }}
      />
    </div>
  );
}
