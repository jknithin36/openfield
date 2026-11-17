"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  FilterHorizontalIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

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
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CenterSlug, ItemType } from "@/lib/types";
import {
  AGE_BUCKETS,
  AGE_LABEL,
  facetCounts,
  publicAvailability,
  searchItems,
  SORT_LABEL,
  SORTS,
  TYPE_PLURAL,
  type AgeBucket,
  type Filters,
  type Sort,
} from "@/lib/library/public";
import { CENTER_LABEL } from "@/lib/library/views";
import { focusRing } from "@/components/dashboard/shared/fields";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { CatalogFilters, type FilterUpdate } from "@/components/site/library/catalog-filters";
import { ItemCard } from "@/components/site/library/item-card";
import { tel, usePublicLibrary } from "@/components/site/library/use-public-library";

const PER_PAGE = 12;
const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;
const list = <T extends string>(v: string | null, allowed: readonly T[]) =>
  (v ?? "").split(",").filter((x): x is T => (allowed as readonly string[]).includes(x));

export function LibraryCatalog() {
  const d = usePublicLibrary();
  const { searchParams, setParams, hrefWith } = useUrlState();
  // "Now" is read only in the browser; data is null during prerender anyway.
  const [loadedAt] = useState<Date | null>(() =>
    typeof window === "undefined" ? null : new Date(),
  );

  const f: Filters = {
    q: searchParams.get("q") ?? "",
    types: list<ItemType>(searchParams.get("type"), Object.keys(TYPE_PLURAL) as ItemType[]),
    centers: list<CenterSlug>(searchParams.get("topic"), Object.keys(CENTER_LABEL) as CenterSlug[]),
    ages: list<AgeBucket>(searchParams.get("age"), AGE_BUCKETS),
    availableOnly: searchParams.get("available") === "1",
    sort: (SORTS as readonly string[]).includes(searchParams.get("sort") ?? "")
      ? (searchParams.get("sort") as Sort)
      : "popular",
  };
  // What's typed, until the URL catches up (then the URL wins, e.g. after "Clear").
  const [typed, setTyped] = useState({ forQ: f.q, value: f.q });
  const query = typed.forQ === f.q ? typed.value : f.q;
  const setQuery = (value: string) => setTyped({ forQ: f.q, value });
  const [panel, setPanel] = useState(false);

  const update = (u: FilterUpdate & { q?: string }) =>
    setParams({
      ...(u.q !== undefined ? { q: u.q.trim() || null } : {}),
      ...(u.types ? { type: u.types.join(",") || null } : {}),
      ...(u.centers ? { topic: u.centers.join(",") || null } : {}),
      ...(u.ages ? { age: u.ages.join(",") || null } : {}),
      ...(u.availableOnly !== undefined ? { available: u.availableOnly ? "1" : null } : {}),
      ...(u.sort ? { sort: u.sort === "popular" ? null : u.sort } : {}),
      page: null,
    });

  // Search as you type (debounced); Enter or the button searches straight away.
  const typing = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onType = (v: string) => {
    setQuery(v);
    clearTimeout(typing.current);
    typing.current = setTimeout(() => update({ q: v }), 350);
  };

  const ready = d && loadedAt;
  const results = ready ? searchItems(d.lib, f, loadedAt) : [];
  const counts = ready ? facetCounts(d.lib, f, loadedAt) : null;
  const pageCount = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const page = Math.min(pageCount, Math.max(1, Number(searchParams.get("page")) || 1));
  const shown = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const applied = [
    ...(f.availableOnly
      ? [
          {
            key: "available",
            label: "Available now",
            remove: { availableOnly: false } as FilterUpdate,
          },
        ]
      : []),
    ...f.types.map((t) => ({
      key: `t-${t}`,
      label: TYPE_PLURAL[t],
      remove: { types: f.types.filter((x) => x !== t) },
    })),
    ...f.ages.map((a) => ({
      key: `a-${a}`,
      label: AGE_LABEL[a],
      remove: { ages: f.ages.filter((x) => x !== a) },
    })),
    ...f.centers.map((c) => ({
      key: `c-${c}`,
      label: CENTER_LABEL[c],
      remove: { centers: f.centers.filter((x) => x !== c) },
    })),
  ];
  const resultText = `${results.length} ${results.length === 1 ? "item" : "items"}`;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-ink sm:text-4xl">
        Lending library
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-neutral-600">
        Borrow devices, kits, books and videos for free. We ship them to you and pay for the return.
      </p>
      <p className="mt-2 text-base text-neutral-700">
        For people who live or work in the {d?.org.regionName ?? "Riverbend"} region.{" "}
        <Link href="/library/how-it-works" className={link}>
          How borrowing works
        </Link>
      </p>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          clearTimeout(typing.current);
          update({ q: query });
        }}
        className="mt-8 max-w-2xl"
      >
        <Label htmlFor="lib-search" className="text-[15px] font-semibold text-ink">
          Search the library
        </Label>
        <p id="lib-search-hint" className="text-sm text-neutral-600">
          Search by name, what it does, or what&apos;s in the box.
        </p>
        <div className="mt-2 flex gap-2">
          <Input
            id="lib-search"
            type="search"
            value={query}
            onChange={(e) => onType(e.target.value)}
            aria-describedby="lib-search-hint"
            className={`h-12 flex-1 bg-white text-base ${focusRing}`}
          />
          <Button
            type="submit"
            className={`h-12 gap-1.5 bg-brand px-5 text-base text-white hover:bg-brand-hover ${focusRing}`}
          >
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} aria-hidden="true" />
            Search
          </Button>
        </div>
      </form>

      {!ready || !counts ? (
        <p className="mt-10 text-neutral-600">Loading the library…</p>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside aria-labelledby="filters-h" className="hidden lg:block">
            <h2 id="filters-h" className="mb-3 text-lg font-medium text-ink">
              Filter
            </h2>
            <CatalogFilters f={f} counts={counts} onChange={update} idPrefix="d" />
          </aside>

          <section aria-labelledby="results-h">
            <h2 id="results-h" className="sr-only">
              Results
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-[15px] text-ink">
                <span className="font-semibold">{resultText}</span>
                {f.q && <> for “{f.q}”</>}
                {applied.length > 0 && <> · {applied.map((a) => a.label).join(", ")}</>}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPanel(true)}
                  className={`h-11 gap-1.5 px-4 lg:hidden ${focusRing}`}
                >
                  <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} aria-hidden="true" />
                  Filter{applied.length ? ` (${applied.length})` : ""}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        className={`hidden h-11 gap-1.5 px-4 font-normal lg:inline-flex ${focusRing}`}
                      />
                    }
                  >
                    Sort: <span className="font-medium">{SORT_LABEL[f.sort]}</span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="size-3.5"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={f.sort}
                        onValueChange={(v) => update({ sort: v as Sort })}
                      >
                        {SORTS.map((s) => (
                          <DropdownMenuRadioItem key={s} value={s} className="min-h-10">
                            {SORT_LABEL[s]}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {applied.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-neutral-600">Showing items for:</span>
                {applied.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => update(a.remove)}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-3 text-sm font-medium text-brand hover:border-brand ${focusRing}`}
                  >
                    {a.label}
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      strokeWidth={2.2}
                      aria-hidden="true"
                      className="size-3.5"
                    />
                    <span className="sr-only">: remove this filter</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => update({ types: [], centers: [], ages: [], availableOnly: false })}
                  className={`min-h-9 px-1 text-sm ${link}`}
                >
                  Clear filters
                </button>
              </div>
            )}

            {shown.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-lg font-medium text-ink">No items match.</p>
                <p className="mt-1 text-base text-neutral-700">
                  Try removing a filter, or call us on{" "}
                  <a href={`tel:${tel(d.org.phone)}`} className={link}>
                    {d.org.phone}
                  </a>
                  . We may be able to help.
                </p>
              </div>
            ) : (
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((item) => (
                  <li key={item.id}>
                    <ItemCard item={item} a={publicAvailability(d.lib, item, loadedAt)} />
                  </li>
                ))}
              </ul>
            )}

            {pageCount > 1 && (
              <nav
                aria-label="Pages"
                className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6"
              >
                {page > 1 ? (
                  <Link
                    href={hrefWith({ page: page - 1 === 1 ? null : String(page - 1) })}
                    scroll
                    className={`inline-flex min-h-11 items-center gap-1 ${link}`}
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="size-4"
                    />
                    Previous<span className="sr-only"> page</span>
                  </Link>
                ) : (
                  <span />
                )}
                <p className="text-[15px] text-neutral-700">
                  Page {page} of {pageCount}
                </p>
                {page < pageCount ? (
                  <Link
                    href={hrefWith({ page: String(page + 1) })}
                    scroll
                    className={`inline-flex min-h-11 items-center gap-1 ${link}`}
                  >
                    Next<span className="sr-only"> page</span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="size-4"
                    />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </section>
        </div>
      )}

      {counts && (
        <Sheet open={panel} onOpenChange={setPanel}>
          <SheetContent side="left" className="w-[88%] gap-0 overflow-y-auto sm:max-w-sm">
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle className="text-lg">Filter and sort</SheetTitle>
            </SheetHeader>
            <div className="px-5 py-4">
              <CatalogFilters f={f} counts={counts} onChange={update} idPrefix="m" showSort />
            </div>
            <SheetFooter className="sticky bottom-0 border-t border-border bg-white px-5 py-4">
              <Button
                onClick={() => setPanel(false)}
                className={`h-12 w-full bg-brand text-base text-white hover:bg-brand-hover ${focusRing}`}
              >
                Show {resultText}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
