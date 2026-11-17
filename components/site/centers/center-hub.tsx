"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { CenterSlug, OFEvent } from "@/lib/types";
import {
  CENTERS,
  getCenter,
  getCenterCourses,
  getCenterEvents,
  getCenterGuides,
  getCenterItems,
} from "@/lib/centers/public";
import { ACCESS_LABEL, EVENT_TYPE_LABEL, seatsLeft } from "@/lib/events/selectors";
import { publicAvailability } from "@/lib/library/public";
import { STAGE_LABEL } from "@/lib/guides/selectors";
import { focusRing } from "@/components/dashboard/shared/fields";
import { CourseCard } from "@/components/site/course-card";
import { ItemCard } from "@/components/site/library/item-card";
import { AskTeamForm } from "@/components/site/centers/ask-team-form";
import { OnThisPage } from "@/components/site/centers/on-this-page";
import { StartHere } from "@/components/site/centers/start-here";
import { TeamList } from "@/components/site/centers/team-list";
import { useCenterSources } from "@/components/site/centers/use-center-sources";

const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", o).format(new Date(iso));

function SeeAll({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`mt-6 inline-flex min-h-11 items-center gap-1 text-base ${link}`}>
      {children}
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        strokeWidth={2}
        aria-hidden="true"
        className="size-4"
      />
    </Link>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-h`}
      id={id}
      className="scroll-mt-24 border-t border-border pt-10"
    >
      <h2 id={`${id}-h`} className="text-2xl font-medium tracking-[-0.02em] text-ink">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EventRow({ e, left }: { e: OFEvent; left: number }) {
  const time =
    `${fmt(e.startsAt, { hour: "numeric", minute: "2-digit" })}–${fmt(e.endsAt, { hour: "numeric", minute: "2-digit" })}`.replace(
      /:00/g,
      "",
    );
  const where =
    e.format === "online" ? "Online" : e.format === "hybrid" ? "In person and online" : "In person";
  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-5 py-5">
      <time
        dateTime={e.startsAt}
        className="flex flex-col items-center justify-center rounded-xl bg-brand-soft py-2 text-brand"
      >
        <span className="text-sm font-semibold uppercase">
          {fmt(e.startsAt, { month: "short" })}
        </span>
        <span className="text-3xl leading-none font-semibold tabular-nums">
          {fmt(e.startsAt, { day: "numeric" })}
        </span>
      </time>
      <div>
        <h3 className="text-lg leading-snug">
          <Link href={`/events/${e.slug}`} className={link}>
            {e.title}
          </Link>
        </h3>
        <p className="mt-1 text-[15px] text-neutral-700">
          {fmt(e.startsAt, { weekday: "long" })}, {time} · {EVENT_TYPE_LABEL[e.type]} · {where} ·{" "}
          {e.price ? `$${e.price}` : "Free"}
        </p>
        <p
          className={`mt-0.5 text-[15px] ${left === 0 ? "font-medium text-amber-800" : "text-neutral-700"}`}
        >
          {left === 0
            ? "Full. You can join the waitlist."
            : left <= 5
              ? `Only ${left} ${left === 1 ? "place" : "places"} left`
              : `${left} places left`}
        </p>
        {e.accessibilityProvided.length > 0 && (
          <p className="mt-0.5 text-[15px] text-neutral-700">
            Provided:{" "}
            {e.accessibilityProvided
              .map((a) => ACCESS_LABEL[a].toLowerCase())
              .join(", ")
              .replace(/^./, (c) => c.toUpperCase())}
          </p>
        )}
      </div>
    </li>
  );
}

export function CenterHub({ slug }: { slug: CenterSlug }) {
  const center = getCenter(slug)!;
  const s = useCenterSources();
  const courses = s ? getCenterCourses(s, slug) : [];
  const items = s ? getCenterItems(s, slug) : [];
  const events = s ? getCenterEvents(s, slug) : [];
  const guides = s ? getCenterGuides(s, center) : [];
  const short = center.shortName.toLowerCase();

  const sections = s
    ? [
        courses.length && { id: "courses", label: "Courses" },
        items.length && { id: "borrow", label: "Borrow" },
        { id: "events", label: "Events" },
        guides.length && { id: "guides", label: "Guides" },
        { id: "ask", label: "Ask the team" },
      ].filter((x): x is { id: string; label: string } => !!x)
    : [];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-10 lg:px-8 lg:py-14">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/centers" />}>Topics</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{center.shortName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <h1 className="text-3xl leading-tight font-medium tracking-[-0.03em] text-balance text-ink sm:text-5xl">
            {center.name}
          </h1>
          <p className="mt-4 text-xl leading-relaxed text-neutral-700">{center.summary}</p>
        </div>
        <section
          aria-labelledby="who-h"
          className="self-end rounded-2xl bg-linear-to-br from-[#e8f0f2] to-[#e6eee4] p-6"
        >
          <h2 id="who-h" className="text-lg font-medium text-ink">
            Who this is for
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-base text-ink">
            {center.whoItsFor.map((w) => (
              <li key={w} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand"
                />
                {w}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="start-h" className="mt-12">
        <h2 id="start-h" className="text-2xl font-medium tracking-[-0.02em] text-ink">
          Start here
        </h2>
        <div className="mt-4">
          <StartHere items={center.startHere} />
        </div>
      </section>

      <div className="mt-10">
        <OnThisPage links={sections} />
      </div>

      <div className="mt-10 flex flex-col gap-14">
        {!s ? (
          <p className="text-neutral-600">Loading courses, items and events…</p>
        ) : (
          <>
            {courses.length > 0 && (
              <Section id="courses" title="Free courses">
                <ul className="grid gap-5 md:grid-cols-3">
                  {courses.slice(0, 3).map((c) => (
                    <li key={c.id}>
                      <CourseCard course={c} />
                    </li>
                  ))}
                </ul>
                <SeeAll href={`/learn?center=${slug}`}>
                  See all {courses.length} {short} {courses.length === 1 ? "course" : "courses"}
                </SeeAll>
              </Section>
            )}

            {items.length > 0 && (
              <Section id="borrow" title="Borrow">
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {items.slice(0, 4).map((i) => (
                    <li key={i.id}>
                      <ItemCard
                        item={i}
                        a={publicAvailability(s.lib, i, s.now)}
                        headingLevel="h3"
                      />
                    </li>
                  ))}
                </ul>
                <SeeAll href={`/library?topic=${slug}`}>
                  See all {items.length} {items.length === 1 ? "item" : "items"}
                </SeeAll>
              </Section>
            )}

            <Section id="events" title="Upcoming events">
              {events.length > 0 ? (
                <>
                  <ol className="flex flex-col divide-y divide-border border-y border-border">
                    {events.slice(0, 3).map((e) => (
                      <EventRow key={e.id} e={e} left={seatsLeft(s.ev, e)} />
                    ))}
                  </ol>
                  <SeeAll href={`/events?center=${slug}`}>See all {short} events</SeeAll>
                </>
              ) : (
                <p className="text-lg text-neutral-700">
                  No upcoming events for this topic.{" "}
                  <Link href="/events" className={link}>
                    See all events
                  </Link>
                </p>
              )}
            </Section>

            {guides.length > 0 && (
              <Section id="guides" title="Guides for families">
                <ul className="grid gap-5 md:grid-cols-3">
                  {guides.map((g) => (
                    <li key={g.id} className="rounded-2xl border border-border bg-white p-5">
                      <p className="text-sm text-neutral-600">
                        {STAGE_LABEL[g.ageStage]} · {g.readMinutes} min read
                      </p>
                      <h3 className="mt-1 text-lg leading-snug">
                        <Link href={`/families/${g.slug}`} className={link}>
                          {g.title}
                        </Link>
                      </h3>
                      <p className="mt-1.5 text-base text-neutral-700">{g.summary}</p>
                    </li>
                  ))}
                </ul>
                <SeeAll href="/families">All guides for families</SeeAll>
              </Section>
            )}
          </>
        )}

        <Section id="team" title="Meet the team">
          <TeamList people={center.team} />
        </Section>

        <Section id="ask" title="Ask the team">
          <AskTeamForm center={center} replyDays={s?.inboxRules.replyTargetDays ?? 2} ready={!!s} />
        </Section>

        <nav aria-labelledby="other-h" className="border-t border-border pt-10">
          <h2 id="other-h" className="text-xl font-medium text-ink">
            Other topics
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            {CENTERS.filter((c) => c.slug !== slug).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/centers/${c.slug}`}
                  className={`inline-flex min-h-11 items-center text-base ${link}`}
                >
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/families"
                className={`inline-flex min-h-11 items-center text-base ${link}`}
              >
                Help for families
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
