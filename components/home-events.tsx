"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { tactile, tactileBase } from "@/components/tactile-button";
import { useEffect } from "react";

import { EVENT_IMAGE, EVENTS } from "@/lib/content";
import { EVENT_TYPE_LABEL, effectiveStatus, seatsLeft } from "@/lib/events/selectors";
import { hydrateEvents, useEventsStore } from "@/store/events";

type Card = {
  slug: string;
  image?: string;
  alt?: string;
  date: string;
  day: string;
  title: string;
  description: string;
  details: string;
  places?: string;
};
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", o).format(new Date(iso));

/** The next 4 published events, live from Events. Static copy shows until it loads. */
function useUpcoming(): Card[] {
  useEffect(() => hydrateEvents(), []);
  const data = useEventsStore((s) => (s.hydrated ? s.data : null));
  if (!data) return EVENTS.map((e) => ({ ...e }));
  // Only reached in the browser, after the store loads (never during prerender).
  const now = new Date();
  return data.events
    .filter((e) => effectiveStatus(e, now) === "published")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 4)
    .map((e) => {
      const left = seatsLeft(data, e);
      const time =
        `${fmt(e.startsAt, { hour: "numeric", minute: "2-digit" })}–${fmt(e.endsAt, { hour: "numeric", minute: "2-digit" })}`.replace(
          /:00/g,
          "",
        );
      const where =
        e.format === "online"
          ? "Online"
          : e.format === "hybrid"
            ? "In person and online"
            : "In person";
      return {
        slug: e.slug,
        image: EVENT_IMAGE[e.slug]?.src,
        alt: EVENT_IMAGE[e.slug]?.alt,
        date: e.startsAt,
        day: fmt(e.startsAt, { weekday: "short", month: "short", day: "numeric" }),
        title: e.title,
        description: e.summary,
        details: `${EVENT_TYPE_LABEL[e.type]} · ${time} · ${where} · ${e.price ? `$${e.price}` : "Free"}`,
        places:
          left === 0
            ? "Full. Join the waitlist"
            : left <= 5
              ? `Only ${left} ${left === 1 ? "place" : "places"} left`
              : undefined,
      };
    });
}

const titleLink =
  "rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring";

export function HomeEvents() {
  const events = useUpcoming();
  return (
    <section
      aria-labelledby="events-heading"
      className="bg-linear-to-br from-[#e8f0f2] to-[#e6eee4]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 py-14 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2
            id="events-heading"
            className="text-2xl leading-tight font-medium tracking-[-0.03em] text-ink sm:text-[28px]"
          >
            Upcoming events
          </h2>
          <Button
            nativeButton={false}
            render={<Link href="/events" />}
            size="lg"
            className={cn(tactileBase, tactile.primary, "extend-touch-target h-10 shrink-0 px-4")}
          >
            See all events
          </Button>
        </div>

        {/* 2 × 2 on laptops: photo left, text right. Phones: photo on top. */}
        <ol className="mt-8 grid gap-x-12 gap-y-10 lg:grid-cols-2">
          {events.map(({ slug, image, alt, date, day, title, description, details, places }) => (
            <li
              key={slug}
              className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-6"
            >
              {image ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={image}
                    alt={alt ?? ""}
                    fill
                    sizes="(min-width: 640px) 240px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl bg-white/70 text-brand"
                >
                  <span className="text-sm font-semibold uppercase">
                    {fmt(date, { month: "short" })}
                  </span>
                  <span className="text-4xl font-semibold tabular-nums">
                    {fmt(date, { day: "numeric" })}
                  </span>
                </div>
              )}
              <div className="sm:pt-1">
                <time dateTime={date} className="text-sm font-medium text-neutral-700 tabular-nums">
                  {day}
                </time>
                <h3 className="mt-1 text-[17px] leading-snug">
                  <Link href={`/events/${slug}`} className={titleLink}>
                    {title}
                  </Link>
                </h3>
                <p className="mt-1.5 text-base leading-relaxed text-neutral-700">{description}</p>
                <p className="mt-1.5 text-sm text-neutral-600">{details}</p>
                {places && <p className="mt-1 text-sm font-medium text-amber-800">{places}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
