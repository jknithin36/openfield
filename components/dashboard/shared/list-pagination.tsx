"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";

export const PAGE_SIZE = 10;

/** Slice rows for the current ?page (clamped to a valid page). */
export function paginate<T>(rows: T[], pageParam: string | null, size = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const page = Math.min(pageCount, Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1));
  return { page, pageCount, pageRows: rows.slice((page - 1) * size, page * size), size };
}

/**
 * "Showing 1–10 of 27" + Previous / 1 2 3 / Next. Real links (Cmd-click
 * opens a new tab) that update ?page in place. Hidden when one page.
 */
export function ListPagination({
  page,
  pageCount,
  total,
  size = PAGE_SIZE,
  label,
}: {
  page: number;
  pageCount: number;
  total: number;
  size?: number;
  /** e.g. "Request pages" */
  label: string;
}) {
  const { hrefWith, setParams } = useUrlState();
  if (total === 0) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  const value = (p: number) => (p === 1 ? null : String(p));
  const link = (p: number) => ({
    href: hrefWith({ page: value(p), id: null }),
    onClick: (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      setParams({ page: value(p), id: null });
    },
  });
  const disabled = "pointer-events-none opacity-50";

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-neutral-600 tabular-nums">
        Showing {from}–{to} of {total}
      </p>
      {pageCount > 1 && (
        <Pagination aria-label={label} className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              {page > 1 ? (
                <PaginationPrevious
                  {...link(page - 1)}
                  className="focus-visible:ring-3 focus-visible:ring-ring"
                />
              ) : (
                <PaginationPrevious aria-disabled="true" className={disabled} />
              )}
            </PaginationItem>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  {...link(p)}
                  isActive={p === page}
                  aria-label={`Page ${p}`}
                  className="tabular-nums focus-visible:ring-3 focus-visible:ring-ring"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              {page < pageCount ? (
                <PaginationNext
                  {...link(page + 1)}
                  className="focus-visible:ring-3 focus-visible:ring-ring"
                />
              ) : (
                <PaginationNext aria-disabled="true" className={disabled} />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
