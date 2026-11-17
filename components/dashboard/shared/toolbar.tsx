"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Search01Icon } from "@hugeicons/core-free-icons";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";

export type FilterOption = { value: string; label: string };
export type FilterDef = {
  /** URL param, e.g. "type". */
  key: string;
  label: string;
  options: FilterOption[];
};

/**
 * Labeled search + simple filter menus. Everything lives in the URL
 * (?q=…&type=…); changing anything resets ?page and closes ?id.
 */
export function Toolbar({
  searchLabel,
  searchPlaceholder,
  searchHint,
  filters = [],
  children,
}: {
  searchLabel: string;
  searchPlaceholder?: string;
  /** Screen-reader hint, e.g. "Matches person, item or request number." */
  searchHint?: string;
  filters?: FilterDef[];
  /** Extra controls on the right (e.g. a sort menu). */
  children?: React.ReactNode;
}) {
  const { searchParams, setParams } = useUrlState();
  const q = searchParams.get("q") ?? "";
  // What's typed, until the URL catches up (then the URL wins, e.g. after Clear).
  const [typed, setTyped] = useState({ forQ: q, value: q });
  const query = typed.forQ === q ? typed.value : q;
  const setQuery = (value: string) => setTyped({ forQ: q, value });

  const update = (updates: Record<string, string | null>) =>
    setParams({ ...updates, page: null, id: null });
  const active = q || filters.some((f) => searchParams.get(f.key));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1.5 sm:w-80">
        <Label htmlFor="toolbar-search" className="text-sm font-medium">
          {searchLabel}
        </Label>
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500"
          />
          <Input
            id="toolbar-search"
            type="search"
            value={query}
            placeholder={searchPlaceholder}
            aria-describedby={searchHint ? "toolbar-search-hint" : undefined}
            onChange={(e) => {
              setQuery(e.target.value);
              update({ q: e.target.value });
            }}
            className={`h-11 bg-background pl-9 text-base ${focus}`}
          />
        </div>
        {searchHint && (
          <p id="toolbar-search-hint" className="sr-only">
            {searchHint}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {filters.map((f) => {
          const value = searchParams.get(f.key);
          const current = f.options.find((o) => o.value === value);
          return (
            <DropdownMenu key={f.key}>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" className={`h-11 gap-1.5 px-3 font-normal ${focus}`} />
                }
              >
                {f.label}: <span className="font-medium">{current?.label ?? "Any"}</span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="size-3.5 opacity-70"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{f.label}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={value ?? "any"}
                    onValueChange={(v) => update({ [f.key]: v === "any" ? null : String(v) })}
                  >
                    <DropdownMenuRadioItem value="any">Any</DropdownMenuRadioItem>
                    {f.options.map((o) => (
                      <DropdownMenuRadioItem key={o.value} value={o.value}>
                        {o.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
        {children}
        {active && (
          <Button
            variant="ghost"
            onClick={() =>
              update({ q: null, ...Object.fromEntries(filters.map((f) => [f.key, null])) })
            }
            className={`h-11 px-3 text-brand underline underline-offset-4 ${focus}`}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
