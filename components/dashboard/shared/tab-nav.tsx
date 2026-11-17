"use client";

import Link from "next/link";
import { cn } from "cn";

import { useUrlState } from "@/components/dashboard/shared/use-url-state";

export type TabDef = { value: string; label: string; count?: number };

/**
 * Tabs as links that set a URL param (default "status"). The default tab
 * has no param. Switching tabs resets ?page and closes ?id.
 */
export function TabNav({
  tabs,
  current,
  param = "status",
  defaultValue,
  label,
}: {
  tabs: TabDef[];
  current: string;
  param?: string;
  defaultValue: string;
  /** Accessible name, e.g. "Filter by status". */
  label: string;
}) {
  const { hrefWith } = useUrlState();
  return (
    <nav aria-label={label} className="border-b border-border">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const active = t.value === current;
          return (
            <li key={t.value}>
              <Link
                href={hrefWith({
                  [param]: t.value === defaultValue ? null : t.value,
                  page: null,
                  id: null,
                })}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center gap-1.5 rounded-t-md border-b-2 px-3 text-[15px] whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring",
                  active
                    ? "border-brand font-semibold text-ink"
                    : "border-transparent text-neutral-600 hover:text-ink",
                )}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className="text-neutral-600 tabular-nums">{t.count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
