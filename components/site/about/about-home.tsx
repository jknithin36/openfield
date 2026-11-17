"use client";

import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Calendar03Icon,
  LibraryIcon,
  Mortarboard01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ABOUT } from "@/data/about";
import { getServiceCounts, getYearImpact, metric } from "@/lib/about/public";
import { focusRing } from "@/components/dashboard/shared/fields";
import { useWorkspace } from "@/components/dashboard/shared/use-workspace";
import { useCenterSources } from "@/components/site/centers/use-center-sources";
import { useOrg } from "@/components/site/about/about-contact";

export const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;
const n = (x: number | string) => (typeof x === "number" ? x.toLocaleString("en-US") : x);

export function AboutBreadcrumb({ page }: { page?: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {page ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/about" />}>About</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{page}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>About</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-medium tracking-[-0.02em] text-ink">
      {children}
    </h2>
  );
}

/** One row, one link. Numbers in words, live from the stores. */
function ServiceRows() {
  const s = useCenterSources();
  const c = s ? getServiceCounts(s.lib, s.courses, s.ev, s.guides, s.now) : null;
  const rows = [
    {
      href: "/library",
      icon: LibraryIcon,
      name: "Lending library",
      text: c
        ? `${n(c.copies)} items to borrow, across ${c.items} kinds of device, kit and book`
        : "Devices, kits and books to borrow",
    },
    {
      href: "/learn",
      icon: Mortarboard01Icon,
      name: "Free courses",
      text: c ? `${c.courses} courses` : "Courses for families and professionals",
    },
    {
      href: "/events",
      icon: Calendar03Icon,
      name: "Events",
      text: c ? `${c.events} coming up` : "Workshops, webinars and family nights",
    },
    {
      href: "/families",
      icon: UserGroupIcon,
      name: "Family guides",
      text: c ? `${c.guides} guides` : "Plain-language guides for each stage of life",
    },
  ];
  return (
    <ul className="mt-5 flex flex-col divide-y divide-border border-y border-border">
      {rows.map((r) => (
        <li key={r.href}>
          <Link
            href={r.href}
            className={`group flex min-h-16 items-center gap-4 py-4 outline-none ${focusRing}`}
          >
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"
            >
              <HugeiconsIcon icon={r.icon} strokeWidth={1.8} className="size-6" />
            </span>
            <span className="flex-1">
              <span className="block text-lg font-medium text-brand underline decoration-brand/30 underline-offset-4 group-hover:decoration-brand">
                {r.name}
              </span>
              <span className="block text-base text-neutral-700">{r.text}</span>
            </span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              aria-hidden="true"
              className="size-5 text-brand"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function YearNumbers() {
  const w = useWorkspace();
  const s = useCenterSources();
  if (!w || !s) return <p className="mt-4 text-neutral-600">Loading…</p>;
  const y = getYearImpact(
    {
      lib: w.lib,
      ev: w.ev.data,
      contacts: w.contacts,
      messages: w.messages,
      courses: w.content.courses,
      guides: w.content.guides,
      inboxRules: w.settings.inboxRules,
      now: s.now,
    },
    "this-year",
  );
  const lines = [
    `We helped ${n(metric(y.sections, "reach", "People helped"))} people, including ${n(metric(y.sections, "reach", "Families"))} families.`,
    `We lent ${n(metric(y.sections, "library", "Items lent"))} items from the library.`,
    `People finished our courses ${n(metric(y.sections, "learning", "Completed"))} times.`,
    `We held ${n(metric(y.sections, "events", "Events held"))} events, with ${n(metric(y.sections, "events", "People attended"))} people attending.`,
  ];
  return (
    <>
      <p className="mt-2 text-base text-neutral-600">
        {y.range.label}, so far. Course numbers are since launch.
      </p>
      <ul className="mt-4 flex flex-col gap-2 text-lg text-ink">
        {lines.map((l) => (
          <li key={l} className="flex gap-3">
            <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-brand" />
            {l}
          </li>
        ))}
      </ul>
    </>
  );
}

export function AboutHome() {
  const org = useOrg();
  return (
    <>
      <AboutBreadcrumb />
      <h1 className="mt-6 text-3xl font-medium tracking-[-0.03em] text-ink sm:text-5xl">
        About {org.name}
      </h1>
      <p className="mt-4 max-w-3xl text-xl leading-relaxed text-ink">
        {org.name} is a nonprofit center for people with disabilities, their families, and the
        teachers and employers who support them in the {org.regionName} region. Everything we offer
        is free to use.
      </p>

      <div className="mt-12 flex flex-col gap-14">
        <section aria-labelledby="what-h">
          <H2 id="what-h">What we do</H2>
          <ServiceRows />
        </section>

        <section aria-labelledby="story-h">
          <H2 id="story-h">Our story</H2>
          <div className="mt-5 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:items-start">
            <div className="flex flex-col gap-4 text-lg leading-relaxed text-ink">
              {ABOUT.story.map((p) => (
                <p key={p.slice(0, 20)}>{p}</p>
              ))}
            </div>
            {/* Photo: Vitaly Gariev on Unsplash (Unsplash License). */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
              <Image
                src="/families-reading.jpg"
                alt="A parent and young child lie in a play tent, laughing together over a picture book."
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="how-h">
          <H2 id="how-h">How we work</H2>
          <p className="mt-2 text-base text-neutral-700">Promises you can hold us to.</p>
          <ul className="mt-5 flex flex-col gap-4">
            {ABOUT.principles.map((p) => (
              <li key={p.title} className="text-lg leading-relaxed text-ink">
                <strong className="font-semibold">{p.title}.</strong> {p.text}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="behind-h">
          <H2 id="behind-h">Who&apos;s behind us</H2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink">
            A small staff team does the day-to-day work. A volunteer board of parents, disabled
            people and professionals makes sure we spend money well and stay true to these promises.
            Most of our money comes from local government and foundations.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-lg">
            <li>
              <Link href="/about/team" className={`inline-flex min-h-11 items-center ${link}`}>
                Meet our team and board
              </Link>
            </li>
            <li>
              <Link href="/about/funding" className={`inline-flex min-h-11 items-center ${link}`}>
                See how we&apos;re funded
              </Link>
            </li>
          </ul>
        </section>

        <section aria-labelledby="year-h">
          <H2 id="year-h">This year in numbers</H2>
          <YearNumbers />
          <Link
            href="/about/impact"
            className={`mt-4 inline-flex min-h-11 items-center gap-1 text-lg ${link}`}
          >
            See our impact
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              aria-hidden="true"
              className="size-4"
            />
          </Link>
        </section>
      </div>
    </>
  );
}
