"use client";

import { cn } from "cn";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Hide the header label on mobile cards (e.g. for the title column). */
  hideLabelOnMobile?: boolean;
};

/**
 * Semantic table: hidden <caption>, <th scope="col">, and a real button in
 * the first cell that opens the record (the whole row is clickable too).
 * Under 768px rows become stacked cards with the same information.
 */
export function DataTable<T>({
  caption,
  rows,
  rowKey,
  columns,
  openLabel,
  openText,
  onOpen,
  empty,
}: {
  caption: string;
  rows: T[];
  rowKey: (row: T) => string;
  /** First column is rendered after the open button (e.g. the record id). */
  columns: Column<T>[];
  /** Accessible name, e.g. "Open request R-1042, Talk-Easy Tablet for Maria Lopez". */
  openLabel: (row: T) => string;
  /** Visible text of the open button, e.g. "R-1042". */
  openText: (row: T) => React.ReactNode;
  onOpen: (row: T, trigger: HTMLElement) => void;
  empty: React.ReactNode;
}) {
  if (rows.length === 0) return <>{empty}</>;

  const openButton = (row: T, extra?: string) => (
    <button
      type="button"
      data-open-button=""
      aria-label={openLabel(row)}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(row, e.currentTarget);
      }}
      className={cn(
        "rounded-sm text-left font-medium text-brand tabular-nums underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand",
        focus,
        extra,
      )}
    >
      {openText(row)}
    </button>
  );

  // Clicking anywhere on a row/card acts like its open button (mouse only;
  // keyboard users use the button itself).
  const rowClick = (row: T) => (e: React.MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("a, button, input, label")) return;
    const btn = e.currentTarget.querySelector<HTMLElement>("[data-open-button]");
    if (btn) onOpen(row, btn);
  };

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-border bg-white md:block">
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((c, i) => (
                <TableHead
                  key={c.header}
                  scope="col"
                  className={cn(
                    "h-11 text-neutral-600",
                    i === 0 && "pl-4",
                    i === columns.length - 1 && "pr-4",
                    c.className,
                  )}
                >
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={rowKey(row)} onClick={rowClick(row)} className="cursor-pointer">
                {columns.map((c, i) => (
                  <TableCell
                    key={c.header}
                    className={cn(
                      "py-3 align-top whitespace-normal",
                      i === 0 && "pl-4",
                      i === columns.length - 1 && "pr-4",
                      c.className,
                    )}
                  >
                    {i === 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {openButton(row, "w-fit")}
                        {c.cell(row)}
                      </div>
                    ) : (
                      c.cell(row)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: one card per row, same information */}
      <ul className="flex flex-col gap-3 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            onClick={rowClick(row)}
            className="cursor-pointer rounded-lg border border-border bg-white p-4"
          >
            <div className="flex flex-col gap-0.5">
              {openButton(row, "w-fit text-base")}
              {columns[0].cell(row)}
            </div>
            <dl className="mt-3 flex flex-col gap-2 text-[15px]">
              {columns.slice(1).map((c) => (
                <div key={c.header} className="flex flex-col">
                  {!c.hideLabelOnMobile && (
                    <dt className="text-xs font-medium text-neutral-600">{c.header}</dt>
                  )}
                  <dd>{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
