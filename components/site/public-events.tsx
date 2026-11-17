"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CenterSlug, EventFormat, EventType, OFEvent, Role } from "@/lib/types";
import { ACCESS_LABEL, EVENT_TYPE_LABEL, effectiveStatus, seatsLeft } from "@/lib/events/selectors";
import {
  bookByDate,
  dayText,
  downloadIcs,
  eventExtras,
  eventFacets,
  formatWords,
  monthKey,
  placesWords,
  priceText,
  searchEvents,
  timeText,
  whereText,
  type EventFilters,
} from "@/lib/events/public";
import { getCenterCourses, getCenterItems } from "@/lib/centers/public";
import { publicAvailability } from "@/lib/library/public";
import { AUDIENCE_PLURAL } from "@/lib/learn/public";
import { CENTERS as TOPICS } from "@/data/centers";
import { focusRing } from "@/components/dashboard/shared/fields";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { CheckGroup, CheckOne } from "@/components/site/filter-group";
import { CourseCard } from "@/components/site/course-card";
import { ItemCard } from "@/components/site/library/item-card";
import { useCenterSources } from "@/components/site/centers/use-center-sources";

export const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand hover:decoration-2 ${focusRing}`;
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", o).format(new Date(iso));
const list = <T extends string>(v: string | null, allowed: readonly T[]) =>
  (v ?? "").split(",").filter((x): x is T => (allowed as readonly string[]).includes(x));
const TYPES: EventType[] = ["webinar", "workshop", "family-night", "conference"];
const FORMATS: EventFormat[] = ["online", "in-person", "hybrid"];
const TOPIC_LABEL = Object.fromEntries(TOPICS.map((t) => [t.slug, t.shortName])) as Record<
  CenterSlug,
  string
>;
const TYPE_PLURAL = Object.fromEntries(TYPES.map((t) => [t, `${EVENT_TYPE_LABEL[t]}s`])) as Record<
  EventType,
  string
>;

export const accessWords = (e: OFEvent) =>
  e.accessibilityProvided.map((a) => ACCESS_LABEL[a]).join(" · ");

function DateBlock({ e }: { e: OFEvent }) {
  return (
    <time
      dateTime={e.startsAt}
      className="flex w-20 shrink-0 flex-col items-center rounded-xl bg-brand-soft py-2 text-brand"
    >
      <span className="text-sm font-medium">{fmt(e.startsAt, { weekday: "short" })}</span>
      <span className="text-3xl leading-tight font-semibold tabular-nums">
        {fmt(e.startsAt, { day: "numeric" })}
      </span>
      <span className="text-sm font-semibold uppercase">{fmt(e.startsAt, { month: "short" })}</span>
    </time>
  );
}

type Update = Partial<Omit<EventFilters, "q" | "when">> & { q?: string };

function Filters({
  f,
  c,
  update,
  idp,
}: {
  f: EventFilters;
  c: ReturnType<typeof eventFacets>;
  update: (u: Update) => void;
  idp: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <fieldset className="border-t border-border pt-4">
        <legend className="sr-only">Price and places</legend>
        <CheckOne
          id={`${idp}-free`}
          label="Free only"
          checked={f.free}
          count={c.free}
          onChange={(free) => update({ free })}
        />
        {f.when === "upcoming" && (
          <CheckOne
            id={`${idp}-places`}
            label="Has places left"
            checked={f.places}
            count={c.places}
            onChange={(places) => update({ places })}
          />
        )}
      </fieldset>
      <CheckGroup
        id={`${idp}-type`}
        legend="Type"
        options={TYPE_PLURAL}
        selected={f.types}
        counts={c.types}
        onChange={(types) => update({ types })}
      />
      <CheckGroup
        id={`${idp}-format`}
        legend="Format"
        options={formatWords}
        selected={f.formats}
        counts={c.formats}
        onChange={(formats) => update({ formats })}
      />
      <CheckGroup
        id={`${idp}-topic`}
        legend="Topic"
        options={TOPIC_LABEL}
        selected={f.centers}
        counts={c.centers}
        onChange={(centers) => update({ centers })}
      />
      <CheckGroup
        id={`${idp}-for`}
        legend="Who it's for"
        options={AUDIENCE_PLURAL}
        selected={f.audiences}
        counts={c.audiences}
        onChange={(audiences) => update({ audiences })}
      />
    </div>
  );
}

// ── /events ───────────────────────────────────────────────────────────────
export function PublicEvents() {
  const s = useCenterSources();
  const { searchParams, setParams, hrefWith } = useUrlState();
  const [panel, setPanel] = useState(false);
  const f: EventFilters = {
    q: searchParams.get("q") ?? "",
    types: list<EventType>(searchParams.get("type"), TYPES),
    formats: list<EventFormat>(searchParams.get("format"), FORMATS),
    centers: list<CenterSlug>(
      searchParams.get("center"),
      TOPICS.map((t) => t.slug),
    ),
    audiences: list<Role>(searchParams.get("for"), Object.keys(AUDIENCE_PLURAL) as Role[]),
    free: searchParams.get("free") === "1",
    places: searchParams.get("places") === "1",
    when: searchParams.get("when") === "past" ? "past" : "upcoming",
  };
  const update = (u: Update) =>
    setParams({
      ...(u.q !== undefined ? { q: u.q.trim() || null } : {}),
      ...(u.types ? { type: u.types.join(",") || null } : {}),
      ...(u.formats ? { format: u.formats.join(",") || null } : {}),
      ...(u.centers ? { center: u.centers.join(",") || null } : {}),
      ...(u.audiences ? { for: u.audiences.join(",") || null } : {}),
      ...(u.free !== undefined ? { free: u.free ? "1" : null } : {}),
      ...(u.places !== undefined ? { places: u.places ? "1" : null } : {}),
    });
  const [typed, setTyped] = useState({ forQ: f.q, value: f.q });
  const query = typed.forQ === f.q ? typed.value : f.q;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const results = s ? searchEvents(s.ev, f, s.now) : [];
  const counts = s ? eventFacets(s.ev, f, s.now) : null;
  const months = results.reduce<Array<{ month: string; events: OFEvent[] }>>((acc, e) => {
    const m = monthKey(e);
    if (acc.at(-1)?.month === m) acc.at(-1)!.events.push(e);
    else acc.push({ month: m, events: [e] });
    return acc;
  }, []);
  const applied = [
    ...(f.free ? [{ k: "free", label: "Free only", u: { free: false } as Update }] : []),
    ...(f.places
      ? [{ k: "places", label: "Has places left", u: { places: false } as Update }]
      : []),
    ...f.types.map((t) => ({
      k: t,
      label: TYPE_PLURAL[t],
      u: { types: f.types.filter((x) => x !== t) },
    })),
    ...f.formats.map((t) => ({
      k: t,
      label: formatWords[t],
      u: { formats: f.formats.filter((x) => x !== t) },
    })),
    ...f.centers.map((t) => ({
      k: t,
      label: TOPIC_LABEL[t],
      u: { centers: f.centers.filter((x) => x !== t) },
    })),
    ...f.audiences.map((t) => ({
      k: `a-${t}`,
      label: AUDIENCE_PLURAL[t],
      u: { audiences: f.audiences.filter((x) => x !== t) },
    })),
  ];
  const resultText = `${results.length} ${results.length === 1 ? "event" : "events"}`;

  return (
    <div className="mx-auto w-full max-w-[1300px] px-6 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-ink sm:text-4xl">Events</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-neutral-700">
        Free and low-cost events for families, educators and employers. Online and in person.
      </p>

      <nav aria-label="Upcoming or past events" className="mt-6 flex gap-2">
        {(["upcoming", "past"] as const).map((w) => (
          <Link
            key={w}
            href={hrefWith({ when: w === "past" ? "past" : null, places: null })}
            scroll={false}
            aria-current={f.when === w ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-base ${focusRing} ${f.when === w ? "border-brand bg-brand font-medium text-white" : "border-border bg-white text-ink hover:border-brand/40"}`}
          >
            {w === "upcoming" ? "Upcoming" : "Past"}
          </Link>
        ))}
      </nav>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          clearTimeout(timer.current);
          update({ q: query });
        }}
        className="mt-6 max-w-2xl"
      >
        <Label htmlFor="ev-search" className="text-[15px] font-semibold text-ink">
          Search events
        </Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="ev-search"
            type="search"
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setTyped({ forQ: f.q, value: v });
              clearTimeout(timer.current);
              timer.current = setTimeout(() => update({ q: v }), 350);
            }}
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

      {!s || !counts ? (
        <p className="mt-10 text-neutral-600">Loading events…</p>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside aria-labelledby="ev-filter-h" className="hidden lg:block">
            <h2 id="ev-filter-h" className="mb-3 text-lg font-medium text-ink">
              Filter
            </h2>
            <Filters f={f} c={counts} update={update} idp="d" />
          </aside>
          <section aria-labelledby="ev-results-h">
            <h2 id="ev-results-h" className="sr-only">
              {f.when === "past" ? "Past events" : "Upcoming events"}
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-[15px] font-semibold text-ink">
                {resultText} found
              </p>
              <Button
                variant="outline"
                onClick={() => setPanel(true)}
                className={`h-11 gap-1.5 px-4 lg:hidden ${focusRing}`}
              >
                <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} aria-hidden="true" />
                Filter{applied.length ? ` (${applied.length})` : ""}
              </Button>
            </div>
            {applied.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-neutral-600">Showing events for:</span>
                {applied.map((a) => (
                  <button
                    key={a.k}
                    type="button"
                    onClick={() => update(a.u)}
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
                      types: [],
                      formats: [],
                      centers: [],
                      audiences: [],
                      free: false,
                      places: false,
                    })
                  }
                  className={`min-h-9 px-1 text-sm ${link}`}
                >
                  Clear filters
                </button>
              </div>
            )}

            {months.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-lg text-ink">
                <p>No {f.when === "past" ? "past" : "upcoming"} events match.</p>
                <p className="mt-2 text-base text-neutral-700">
                  Try removing a filter
                  {f.when === "upcoming" && (
                    <>
                      , look at{" "}
                      <Link href="/events?when=past" className={link}>
                        past events
                      </Link>
                    </>
                  )}
                  , or{" "}
                  <Link href="/contact?topic=events" className={link}>
                    ask us to tell you about new events
                  </Link>
                  .
                </p>
              </div>
            ) : (
              months.map(({ month, events }) => (
                <section key={month} aria-labelledby={`m-${month}`} className="mt-8">
                  <h2 id={`m-${month}`} className="text-xl font-medium text-ink">
                    {month}
                  </h2>
                  <ol className="mt-3 flex flex-col divide-y divide-border border-y border-border">
                    {events.map((e) => {
                      const p = placesWords(s.ev, e);
                      const x = eventExtras(e);
                      return (
                        <li key={e.id} className="flex gap-5 py-5">
                          <DateBlock e={e} />
                          <div className="min-w-0">
                            <h3 className="text-lg leading-snug">
                              <Link href={`/events/${e.slug}`} className={link}>
                                {e.title}
                              </Link>
                            </h3>
                            <p className="mt-1 text-[15px] text-neutral-700">
                              {timeText(e)} ·{" "}
                              {e.format === "online"
                                ? "Online"
                                : `${formatWords[e.format]}, ${e.venue?.name ?? ""}`}{" "}
                              · {priceText(e)}
                            </p>
                            {f.when === "upcoming" && p.text && (
                              <p
                                className={`mt-0.5 text-[15px] ${p.full ? "font-medium text-amber-800" : "text-neutral-800"}`}
                              >
                                {p.text}
                              </p>
                            )}
                            {f.when === "past" && x.recordingUrl && (
                              <p className="mt-0.5 text-[15px] text-ink">
                                Recording available:{" "}
                                <Link href={x.recordingUrl} className={link}>
                                  watch or read it
                                </Link>
                              </p>
                            )}
                            {e.accessibilityProvided.length > 0 && (
                              <p className="mt-0.5 text-[15px] text-neutral-700">
                                {accessWords(e)}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ))
            )}
          </section>
        </div>
      )}

      {counts && (
        <Sheet open={panel} onOpenChange={setPanel}>
          <SheetContent side="left" className="w-[88%] gap-0 overflow-y-auto sm:max-w-sm">
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle className="text-lg">Filter events</SheetTitle>
            </SheetHeader>
            <div className="px-5 py-4">
              <Filters f={f} c={counts} update={update} idp="m" />
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

// ── /events/[slug] ────────────────────────────────────────────────────────
export function PublicEvent({ slug }: { slug: string }) {
  const s = useCenterSources();
  const shell = (c: React.ReactNode) => (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 lg:px-8 lg:py-14">{c}</div>
  );
  if (!s) return shell(<p className="text-neutral-600">Loading…</p>);
  const e = s.ev.events.find((x) => x.slug === slug && effectiveStatus(x, s.now) !== "draft");
  if (!e)
    return shell(
      <>
        <h1 className="text-3xl font-medium text-ink">Event not found</h1>
        <p className="mt-3 text-lg text-neutral-600">
          It may have been removed.{" "}
          <Link href="/events" className={link}>
            See all events
          </Link>
        </p>
      </>,
    );

  const status = effectiveStatus(e, s.now);
  const x = eventExtras(e);
  const left = seatsLeft(s.ev, e);
  const bookBy = bookByDate(e, s.ev.settings.leadTimeDays);
  const courses = e.center ? getCenterCourses(s, e.center).slice(0, 2) : [];
  const items = e.center ? getCenterItems(s, e.center).slice(0, 2) : [];

  return shell(
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/events" />}>Events</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{e.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {status === "cancelled" && (
        <div role="note" className="mt-6 border-l-4 border-red-700 bg-red-50 p-4 text-lg text-ink">
          <p className="font-semibold">This event is cancelled.</p>
          <p className="mt-1">
            {e.cancelReason ?? "We're sorry for any trouble this causes."}{" "}
            <Link href="/events" className={link}>
              See other events
            </Link>
          </p>
        </div>
      )}

      <p className="mt-6 text-base font-medium text-brand">{EVENT_TYPE_LABEL[e.type]}</p>
      <h1 className="mt-1 text-3xl leading-tight font-medium tracking-[-0.03em] text-balance text-ink sm:text-5xl">
        {e.title}
      </h1>
      <p className="mt-3 max-w-3xl text-xl leading-relaxed text-neutral-700">{e.summary}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="order-2 flex flex-col gap-12 lg:order-1">
          <section aria-labelledby="about-h">
            <h2 id="about-h" className="text-2xl font-medium text-ink">
              About this event
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-ink">{e.description}</p>
          </section>
          <section aria-labelledby="for-h">
            <h2 id="for-h" className="text-2xl font-medium text-ink">
              Who it&apos;s for
            </h2>
            <p className="mt-3 text-lg text-ink">
              {x.audiences
                .map((a) => AUDIENCE_PLURAL[a])
                .join(", ")
                .replace(/, ([^,]*)$/, " and $1")}
              .
            </p>
          </section>
          <section aria-labelledby="get-h">
            <h2 id="get-h" className="text-2xl font-medium text-ink">
              What you&apos;ll get
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-lg text-ink">
              {x.whatYouGet.map((w) => (
                <li key={w} className="flex gap-3">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-brand"
                  />
                  {w}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="acc-h">
            <h2 id="acc-h" className="text-2xl font-medium text-ink">
              Accessibility
            </h2>
            {e.accessibilityProvided.length > 0 && (
              <>
                <p className="mt-3 text-lg text-ink">Provided for everyone:</p>
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-6 text-lg text-ink">
                  {e.accessibilityProvided.map((a) => (
                    <li key={a}>{ACCESS_LABEL[a]}</li>
                  ))}
                </ul>
              </>
            )}
            {status === "published" && (
              <p className="mt-3 text-lg text-ink">
                Need something else? Tell us when you register. Book by{" "}
                <strong className="font-semibold">
                  {fmt(bookBy, { weekday: "long", month: "long", day: "numeric" })}
                </strong>{" "}
                so we can arrange it.
              </p>
            )}
          </section>
          {x.speakers.length > 0 && (
            <section aria-labelledby="sp-h">
              <h2 id="sp-h" className="text-2xl font-medium text-ink">
                Speakers
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {x.speakers.map((p) => (
                  <li key={p.name}>
                    <p className="text-lg font-medium text-ink">{p.name}</p>
                    <p className="text-[15px] text-neutral-700">{p.role}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(courses.length > 0 || items.length > 0) && (
            <section aria-labelledby="rel-h">
              <h2 id="rel-h" className="text-2xl font-medium text-ink">
                Related
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {courses.map((c) => (
                  <li key={c.id}>
                    <CourseCard course={c} />
                  </li>
                ))}
                {items.map((i) => (
                  <li key={i.id}>
                    <ItemCard item={i} a={publicAvailability(s.lib, i, s.now)} headingLevel="h3" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside
          aria-label="Event details"
          className="order-1 h-fit rounded-2xl border border-border bg-white p-6 lg:sticky lg:top-24 lg:order-2"
        >
          <dl className="flex flex-col gap-4 text-base">
            <div>
              <dt className="text-sm text-neutral-600">Date and time</dt>
              <dd className="font-medium text-ink">
                <time dateTime={e.startsAt}>{dayText(e)}</time>
                <br />
                {timeText(e)}
              </dd>
              {status === "published" && (
                <dd>
                  <button
                    type="button"
                    onClick={() => downloadIcs(e)}
                    className={`mt-1 inline-flex min-h-11 items-center gap-1.5 text-[15px] ${link}`}
                  >
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="size-4"
                    />
                    Add to calendar
                  </button>
                </dd>
              )}
            </div>
            <div>
              <dt className="text-sm text-neutral-600">Format</dt>
              <dd className="font-medium text-ink">{formatWords[e.format]}</dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-600">Where</dt>
              <dd className="font-medium text-ink">
                {e.format === "online" ? "Online — link sent after you register" : whereText(e)}
              </dd>
              {e.venue && e.format !== "online" && <dd className="text-ink">{e.venue.address}</dd>}
              {x.gettingThere && (
                <dd>
                  <details className="mt-1">
                    <summary className={`min-h-11 cursor-pointer py-2 text-[15px] ${link}`}>
                      Getting there
                    </summary>
                    <p className="pb-1 text-[15px] text-ink">{x.gettingThere}</p>
                  </details>
                </dd>
              )}
            </div>
            <div>
              <dt className="text-sm text-neutral-600">Price</dt>
              <dd className="font-medium text-ink">{priceText(e)}</dd>
            </div>
            {status === "published" && (
              <div>
                <dt className="text-sm text-neutral-600">Places</dt>
                <dd className="font-medium text-ink">
                  {left === 0 ? "Full — join the waitlist" : `${left} of ${e.seats} left`}
                </dd>
              </div>
            )}
          </dl>
          {status === "published" ? (
            <Link
              href={`/events/${e.slug}/register`}
              className={`mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-brand text-base font-medium text-white hover:bg-brand-hover ${focusRing}`}
            >
              {left === 0 ? "Join the waitlist" : "Register"}
            </Link>
          ) : (
            <p className="mt-6 rounded-lg bg-neutral-100 p-3 text-center text-base font-medium text-ink">
              Registration closed —{" "}
              {status === "cancelled" ? "this event is cancelled" : "this event has finished"}
            </p>
          )}
          <p className="mt-4 text-[15px] text-neutral-700">
            Already booked?{" "}
            <Link href="/events/booking" className={link}>
              Manage your booking
            </Link>
          </p>
        </aside>
      </div>
    </>,
  );
}
