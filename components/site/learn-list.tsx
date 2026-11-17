"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  FilterHorizontalIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { hydrateContent, useContentStore } from "@/store/content";
import { useLearning } from "@/store/learning";
import type { CenterSlug, CourseFormat, Role } from "@/lib/types";
import { COURSE_FORMAT_LABEL } from "@/lib/courses/selectors";
import {
  AUDIENCE_PLURAL,
  COURSE_SORT_LABEL,
  COURSE_SORTS,
  courseFacets,
  LENGTH_LABEL,
  LENGTHS,
  searchCourses,
  type CourseFilters,
  type CourseSort,
  type LengthBucket,
} from "@/lib/learn/public";
import { CENTERS as TOPICS } from "@/data/centers";
import { focusRing } from "@/components/dashboard/shared/fields";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { CourseCard } from "@/components/site/course-card";

const PER_PAGE = 12;
const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;
const list = <T extends string>(v: string | null, allowed: readonly T[]) =>
  (v ?? "").split(",").filter((x): x is T => (allowed as readonly string[]).includes(x));
const ROLES = Object.keys(AUDIENCE_PLURAL) as Role[];
const FORMATS = Object.keys(COURSE_FORMAT_LABEL) as CourseFormat[];
const TOPIC_LABEL = Object.fromEntries(TOPICS.map((t) => [t.slug, t.shortName])) as Record<
  CenterSlug,
  string
>;
const CENTER_KEYS = TOPICS.map((t) => t.slug);

type Update = Partial<Omit<CourseFilters, "q">> & { q?: string };

function Group<T extends string>({
  id,
  legend,
  options,
  selected,
  counts,
  onChange,
}: {
  id: string;
  legend: string;
  options: Record<T, string>;
  selected: T[];
  counts: Partial<Record<T, number>>;
  onChange: (v: T[]) => void;
}) {
  return (
    <fieldset className="border-t border-border pt-4">
      <legend className="float-left mb-2 w-full text-[15px] font-semibold text-ink">
        {legend}
      </legend>
      <div className="clear-left flex flex-col">
        {(Object.keys(options) as T[]).map((o) => {
          const n = counts[o] ?? 0;
          const on = selected.includes(o);
          return (
            <div key={o} className="flex min-h-11 items-center gap-2.5">
              <Checkbox
                id={`${id}-${o}`}
                checked={on}
                disabled={!n && !on}
                onCheckedChange={() =>
                  onChange(on ? selected.filter((x) => x !== o) : [...selected, o])
                }
                className={`size-5 ${focusRing}`}
              />
              <Label
                htmlFor={`${id}-${o}`}
                className={`text-[15px] font-normal ${!n && !on ? "text-neutral-500" : "text-ink"}`}
              >
                {options[o]} <span className="text-neutral-600 tabular-nums">({n})</span>
              </Label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function Filters({
  f,
  c,
  update,
  idPrefix,
  showSort,
}: {
  f: CourseFilters;
  c: ReturnType<typeof courseFacets>;
  update: (u: Update) => void;
  idPrefix: string;
  showSort?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      {showSort && (
        <fieldset>
          <legend className="mb-2 text-[15px] font-semibold text-ink">Sort by</legend>
          {COURSE_SORTS.map((s) => (
            <label
              key={s}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]"
            >
              <input
                type="radio"
                name={`${idPrefix}-sort`}
                checked={f.sort === s}
                onChange={() => update({ sort: s })}
                className={`size-5 accent-[var(--brand)] ${focusRing}`}
              />
              {COURSE_SORT_LABEL[s]}
            </label>
          ))}
        </fieldset>
      )}
      <Group
        id={`${idPrefix}-for`}
        legend="Who it's for"
        options={AUDIENCE_PLURAL}
        selected={f.audiences}
        counts={c.audiences}
        onChange={(audiences) => update({ audiences })}
      />
      <Group
        id={`${idPrefix}-topic`}
        legend="Topic"
        options={TOPIC_LABEL}
        selected={f.centers}
        counts={c.centers}
        onChange={(centers) => update({ centers })}
      />
      <Group
        id={`${idPrefix}-format`}
        legend="Format"
        options={COURSE_FORMAT_LABEL}
        selected={f.formats}
        counts={c.formats}
        onChange={(formats) => update({ formats })}
      />
      <Group
        id={`${idPrefix}-length`}
        legend="Length"
        options={LENGTH_LABEL}
        selected={f.lengths}
        counts={c.lengths}
        onChange={(lengths) => update({ lengths })}
      />
      <fieldset className="border-t border-border pt-4">
        <legend className="sr-only">Certificate</legend>
        <div className="flex min-h-11 items-center gap-2.5">
          <Checkbox
            id={`${idPrefix}-cert`}
            checked={f.certificate}
            onCheckedChange={(v) => update({ certificate: v === true })}
            className={`size-5 ${focusRing}`}
          />
          <Label htmlFor={`${idPrefix}-cert`} className="text-[15px] font-normal">
            Has a certificate{" "}
            <span className="text-neutral-600 tabular-nums">({c.certificate})</span>
          </Label>
        </div>
      </fieldset>
    </div>
  );
}

export function LearnList() {
  useEffect(() => hydrateContent(), []);
  const all = useContentStore((s) => (s.hydrated ? s.data?.courses : null));
  const learning = useLearning();
  const { searchParams, setParams, hrefWith } = useUrlState();
  const [panel, setPanel] = useState(false);

  const f: CourseFilters = {
    q: searchParams.get("q") ?? "",
    audiences: list<Role>(searchParams.get("for"), ROLES),
    centers: list<CenterSlug>(searchParams.get("center"), CENTER_KEYS),
    formats: list<CourseFormat>(searchParams.get("format"), FORMATS),
    lengths: list<LengthBucket>(searchParams.get("length"), LENGTHS),
    certificate: searchParams.get("certificate") === "1",
    sort: (COURSE_SORTS as readonly string[]).includes(searchParams.get("sort") ?? "")
      ? (searchParams.get("sort") as CourseSort)
      : "popular",
  };
  const update = (u: Update) =>
    setParams({
      ...(u.q !== undefined ? { q: u.q.trim() || null } : {}),
      ...(u.audiences ? { for: u.audiences.join(",") || null } : {}),
      ...(u.centers ? { center: u.centers.join(",") || null } : {}),
      ...(u.formats ? { format: u.formats.join(",") || null } : {}),
      ...(u.lengths ? { length: u.lengths.join(",") || null } : {}),
      ...(u.certificate !== undefined ? { certificate: u.certificate ? "1" : null } : {}),
      ...(u.sort ? { sort: u.sort === "popular" ? null : u.sort } : {}),
      page: null,
    });

  const [typed, setTyped] = useState({ forQ: f.q, value: f.q });
  const query = typed.forQ === f.q ? typed.value : f.q;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onType = (v: string) => {
    setTyped({ forQ: f.q, value: v });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ q: v }), 350);
  };

  const results = all ? searchCourses(all, f) : [];
  const counts = all ? courseFacets(all, f) : null;
  const pageCount = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const page = Math.min(pageCount, Math.max(1, Number(searchParams.get("page")) || 1));
  const shown = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const inProgress = Object.values(learning).filter((p) => !p.completedAt).length;

  const applied = [
    ...f.audiences.map((a) => ({
      key: `a-${a}`,
      label: AUDIENCE_PLURAL[a],
      remove: { audiences: f.audiences.filter((x) => x !== a) } as Update,
    })),
    ...f.centers.map((c) => ({
      key: `c-${c}`,
      label: TOPIC_LABEL[c],
      remove: { centers: f.centers.filter((x) => x !== c) },
    })),
    ...f.formats.map((x) => ({
      key: `f-${x}`,
      label: COURSE_FORMAT_LABEL[x],
      remove: { formats: f.formats.filter((y) => y !== x) },
    })),
    ...f.lengths.map((x) => ({
      key: `l-${x}`,
      label: LENGTH_LABEL[x],
      remove: { lengths: f.lengths.filter((y) => y !== x) },
    })),
    ...(f.certificate
      ? [{ key: "cert", label: "Has a certificate", remove: { certificate: false } }]
      : []),
  ];
  const resultText = `${results.length} ${results.length === 1 ? "course" : "courses"}`;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-8 lg:py-14">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Learn</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="mt-6 text-3xl font-medium tracking-[-0.03em] text-ink sm:text-4xl">
        Free courses
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-neutral-700">
        Learn at your own pace. No account needed.
      </p>

      {inProgress > 0 && (
        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-brand-soft px-5 py-4 text-base text-ink">
          <span>
            You have {inProgress} {inProgress === 1 ? "course" : "courses"} in progress on this
            device.
          </span>
          <Link href="/learn/my-learning" className={link}>
            Continue where you left off
          </Link>
        </p>
      )}

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          clearTimeout(timer.current);
          update({ q: query });
        }}
        className="mt-8 max-w-2xl"
      >
        <Label htmlFor="learn-search" className="text-[15px] font-semibold text-ink">
          Search courses
        </Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="learn-search"
            type="search"
            value={query}
            onChange={(e) => onType(e.target.value)}
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

      {!all || !counts ? (
        <p className="mt-10 text-neutral-600">Loading courses…</p>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside aria-labelledby="learn-filter-h" className="hidden lg:block">
            <h2 id="learn-filter-h" className="mb-3 text-lg font-medium text-ink">
              Filter
            </h2>
            <Filters f={f} c={counts} update={update} idPrefix="d" />
          </aside>

          <section aria-labelledby="learn-results-h">
            <h2 id="learn-results-h" className="sr-only">
              Courses
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-[15px] text-ink">
                <span className="font-semibold">{resultText} found</span>
                {f.q && <> for “{f.q}”</>}
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
                    Sort: <span className="font-medium">{COURSE_SORT_LABEL[f.sort]}</span>
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
                        onValueChange={(v) => update({ sort: v as CourseSort })}
                      >
                        {COURSE_SORTS.map((s) => (
                          <DropdownMenuRadioItem key={s} value={s} className="min-h-10">
                            {COURSE_SORT_LABEL[s]}
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
                <span className="text-sm text-neutral-600">Showing courses for:</span>
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
                  onClick={() =>
                    update({
                      audiences: [],
                      centers: [],
                      formats: [],
                      lengths: [],
                      certificate: false,
                    })
                  }
                  className={`min-h-9 px-1 text-sm ${link}`}
                >
                  Clear filters
                </button>
              </div>
            )}

            {shown.length === 0 ? (
              <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-lg text-neutral-700">
                No courses match. Try removing a filter.
              </p>
            ) : (
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((c) => (
                  <li key={c.id}>
                    <CourseCard course={c} headingLevel="h3" />
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
              <Filters f={f} c={counts} update={update} idPrefix="m" showSort />
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
