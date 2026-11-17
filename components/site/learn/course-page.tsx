"use client";

import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, File02Icon, Link01Icon } from "@hugeicons/core-free-icons";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLearning, type CourseProgress } from "@/store/learning";
import type { Course } from "@/lib/types";
import { COURSE_FORMAT_LABEL, LEVEL_LABEL } from "@/lib/courses/selectors";
import { LESSON_TYPE_LABEL, lengthWords } from "@/lib/learn/public";
import { courseImage } from "@/lib/learn/images";
import { getCenterEvents, getCenterItems } from "@/lib/centers/public";
import { publicAvailability } from "@/lib/library/public";
import { seatsLeft } from "@/lib/events/selectors";
import { focusRing } from "@/components/dashboard/shared/fields";
import { audienceText } from "@/components/site/course-card";
import { ItemCard } from "@/components/site/library/item-card";
import { useCenterSources } from "@/components/site/centers/use-center-sources";

export const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;
export const primaryLink = `inline-flex h-12 items-center justify-center rounded-lg bg-brand px-6 text-base font-medium text-white hover:bg-brand-hover ${focusRing}`;
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", o).format(new Date(iso));

/** Where the main button goes, and what it says. */
export function nextStep(course: Course, p?: CourseProgress): { label: string; href: string } {
  const first = course.lessons[0];
  if (!p) return { label: "Start course", href: `/learn/${course.slug}/${first.id}` };
  if (p.completedAt) return { label: "Review course", href: `/learn/${course.slug}/${first.id}` };
  const i = course.lessons.findIndex((l) => !p.completedLessonIds.includes(l.id));
  if (i < 0) return { label: "Finish course", href: `/learn/${course.slug}/complete` };
  return {
    label: `Continue: Lesson ${i + 1}`,
    href: `/learn/${course.slug}/${course.lessons[i].id}`,
  };
}

export function CoursePage({ slug }: { slug: string }) {
  const s = useCenterSources();
  const learning = useLearning();
  const shell = (c: React.ReactNode) => (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 lg:px-8 lg:py-14">{c}</div>
  );
  if (!s) return shell(<p className="text-neutral-600">Loading…</p>);
  const course = s.courses.find((c) => c.slug === slug && c.status === "published");
  if (!course)
    return shell(
      <>
        <h1 className="text-3xl font-medium text-ink">We can&apos;t find that course</h1>
        <p className="mt-3 text-lg text-neutral-700">
          It may have been moved or taken down.{" "}
          <Link href="/learn" className={link}>
            See all free courses
          </Link>
        </p>
      </>,
    );

  const p = learning[course.slug];
  const go = nextStep(course, p);
  const items = getCenterItems(s, course.center).slice(0, 3);
  const events = getCenterEvents(s, course.center).slice(0, 2);
  const yes = (b: boolean) => (b ? "Yes" : "No");

  return shell(
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/learn" />}>Learn</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{course.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-6 text-3xl leading-tight font-medium tracking-[-0.03em] text-balance text-ink sm:text-5xl">
        {course.title}
      </h1>
      <p className="mt-3 text-base text-neutral-700">
        {audienceText(course.audiences)} · {COURSE_FORMAT_LABEL[course.format]} ·{" "}
        {lengthWords(course)} · {LEVEL_LABEL[course.level]}
        {course.certificate ? " · Certificate" : ""}
      </p>
      <p className="mt-4 max-w-3xl text-xl leading-relaxed text-ink">{course.summary}</p>
      {courseImage(course.slug) && (
        <div className="relative mt-8 aspect-[2.8/1] overflow-hidden rounded-2xl bg-brand-soft">
          <Image
            src={courseImage(course.slug)!.src}
            alt={courseImage(course.slug)!.alt}
            fill
            priority
            sizes="(min-width: 1100px) 1050px, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link href={go.href} className={primaryLink}>
          {go.label}
        </Link>
        {p && !p.completedAt && (
          <span className="text-base text-neutral-700">
            {p.completedLessonIds.length} of {course.lessons.length} lessons done
          </span>
        )}
        {p?.completedAt && (
          <span className="inline-flex items-center gap-1.5 text-base font-medium text-emerald-800">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              strokeWidth={2}
              aria-hidden="true"
              className="size-5"
            />
            Completed {fmt(p.completedAt, { month: "long", day: "numeric" })}
          </span>
        )}
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-12">
          {course.outcomes && course.outcomes.length > 0 && (
            <section aria-labelledby="outcomes-h">
              <h2 id="outcomes-h" className="text-2xl font-medium text-ink">
                What you&apos;ll learn
              </h2>
              <p className="mt-2 text-base text-neutral-700">By the end you&apos;ll be able to:</p>
              <ul className="mt-3 flex flex-col gap-2 text-lg text-ink">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex gap-3">
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="mt-1 size-5 shrink-0 text-brand"
                    />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="lessons-h">
            <h2 id="lessons-h" className="text-2xl font-medium text-ink">
              Lessons
            </h2>
            <p className="mt-2 text-base text-neutral-700">Do them in any order.</p>
            <ol className="mt-4 flex flex-col divide-y divide-border border-y border-border">
              {course.lessons.map((l, i) => {
                const done = !!p?.completedLessonIds.includes(l.id);
                return (
                  <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-4">
                    <span
                      aria-hidden="true"
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums ${done ? "bg-brand text-white" : "bg-brand-soft text-brand"}`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/learn/${course.slug}/${l.id}`} className={`text-lg ${link}`}>
                        <span className="sr-only">Lesson {i + 1}: </span>
                        {l.title}
                      </Link>
                      <p className="text-[15px] text-neutral-600">
                        {LESSON_TYPE_LABEL[l.type ?? "reading"]} · {l.minutes} minutes
                      </p>
                    </div>
                    <span
                      className={`text-[15px] ${done ? "inline-flex items-center gap-1 font-medium text-emerald-800" : "text-neutral-600"}`}
                    >
                      {done && (
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="size-4"
                        />
                      )}
                      {done ? "Done" : "Not started"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          {(items.length > 0 || events.length > 0) && (
            <section aria-labelledby="related-h">
              <h2 id="related-h" className="text-2xl font-medium text-ink">
                Related
              </h2>
              {items.length > 0 && (
                <>
                  <h3 className="mt-5 text-lg font-medium text-ink">Borrow for free</h3>
                  <ul className="mt-3 grid gap-4 sm:grid-cols-3">
                    {items.map((i) => (
                      <li key={i.id}>
                        <ItemCard
                          item={i}
                          a={publicAvailability(s.lib, i, s.now)}
                          headingLevel="h4"
                        />
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {events.length > 0 && (
                <>
                  <h3 className="mt-8 text-lg font-medium text-ink">Upcoming events</h3>
                  <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
                    {events.map((e) => {
                      const left = seatsLeft(s.ev, e);
                      return (
                        <li key={e.id} className="py-3">
                          <Link href={`/events/${e.slug}`} className={`text-base ${link}`}>
                            {e.title}
                          </Link>
                          <p className="text-[15px] text-neutral-700">
                            <time dateTime={e.startsAt}>
                              {fmt(e.startsAt, { weekday: "long", month: "long", day: "numeric" })}
                            </time>{" "}
                            · {left === 0 ? "Full, waitlist open" : `${left} places left`}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-6" aria-label="About this course">
          <section
            aria-labelledby="a11y-h"
            className="rounded-2xl border border-border bg-white p-5"
          >
            <h2 id="a11y-h" className="text-lg font-medium text-ink">
              Accessibility
            </h2>
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[15px]">
              <dt className="text-neutral-700">Captions</dt>
              <dd className="font-medium text-ink">{yes(course.accessibility.captions)}</dd>
              <dt className="text-neutral-700">Transcripts</dt>
              <dd className="font-medium text-ink">{yes(course.accessibility.transcript)}</dd>
              <dt className="text-neutral-700">Plain language</dt>
              <dd className="font-medium text-ink">{yes(course.accessibility.plainLanguage)}</dd>
              <dt className="text-neutral-700">Audio description</dt>
              <dd className="font-medium text-ink">{yes(course.accessibility.audioDescription)}</dd>
            </dl>
          </section>

          {course.author && (
            <section
              aria-labelledby="author-h"
              className="rounded-2xl border border-border bg-white p-5"
            >
              <h2 id="author-h" className="text-lg font-medium text-ink">
                Who made this course
              </h2>
              <p className="mt-2 text-base font-medium text-ink">{course.author.name}</p>
              <p className="text-[15px] text-neutral-700">{course.author.role}</p>
            </section>
          )}

          {course.resources && course.resources.length > 0 && (
            <section
              aria-labelledby="res-h"
              className="rounded-2xl border border-border bg-white p-5"
            >
              <h2 id="res-h" className="text-lg font-medium text-ink">
                Resources
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {course.resources.map((r) => (
                  <li key={r.href} className="flex gap-2.5">
                    <HugeiconsIcon
                      icon={r.kind === "pdf" ? File02Icon : Link01Icon}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="mt-1 size-5 shrink-0 text-brand"
                    />
                    <span>
                      <a href={r.href} className={`text-base ${link}`}>
                        {r.label}
                      </a>
                      <span className="block text-sm text-neutral-600">
                        {r.kind === "pdf" ? "PDF" : "Web page"}
                        {r.size ? `, ${r.size}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>,
  );
}
