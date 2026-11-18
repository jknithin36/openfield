"use client";

import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DEFAULT_ORG } from "@/data/settings";
import { CENTERS, countsText, getCenterCounts, getPopularForCenter } from "@/lib/centers/public";
import { focusRing } from "@/components/dashboard/shared/fields";
import { TopicBox } from "@/components/site/centers/topic-box";
import { useCenterSources } from "@/components/site/centers/use-center-sources";
import { tel } from "@/components/site/library/use-public-library";

const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;

/** The 6 topic boxes. Names and summaries render at once; live counts follow. */
/** `simple` shows just the name and summary (home page); the full version adds "Popular" and counts. */
export function TopicGrid({
  headingLevel = "h2",
  simple = false,
}: {
  headingLevel?: "h2" | "h3";
  simple?: boolean;
}) {
  const s = useCenterSources();
  if (simple)
    return (
      <ul className="grid gap-x-12 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {CENTERS.map((c) => {
          const H = headingLevel;
          return (
            <li key={c.slug}>
              <H className="text-[17px] leading-snug">
                <Link href={`/centers/${c.slug}`} className={link}>
                  {c.name}
                </Link>
              </H>
              <p className="mt-1 text-[15px] leading-relaxed text-neutral-600">{c.summary}</p>
            </li>
          );
        })}
      </ul>
    );
  return (
    <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {CENTERS.map((c) => (
        <li key={c.slug}>
          <TopicBox
            center={c}
            headingLevel={headingLevel}
            popular={s ? getPopularForCenter(s, c.slug) : undefined}
            counts={s ? countsText(getCenterCounts(s, c.slug)) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}

export function CentersIndex() {
  const s = useCenterSources();
  const org = s?.org ?? DEFAULT_ORG;
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-10 lg:px-8 lg:py-14">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Find help by topic</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="mt-6 text-3xl font-medium tracking-[-0.03em] text-ink sm:text-4xl">
        Find help by topic
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-neutral-700">
        Each topic brings together our courses, library items, events and guides in one place.
      </p>

      <div className="mt-10">
        <TopicGrid />
      </div>

      <div className="mt-12 grid gap-6 border-t border-border pt-8 md:grid-cols-2">
        <section aria-labelledby="family-h">
          <h2 id="family-h" className="text-xl font-medium text-ink">
            Looking for help as a family?
          </h2>
          <p className="mt-2 text-base text-neutral-700">
            Plain-language guides for each stage of your child&apos;s life.{" "}
            <Link href="/families" className={link}>
              Help for families
            </Link>
          </p>
        </section>
        <section aria-labelledby="unsure-h">
          <h2 id="unsure-h" className="text-xl font-medium text-ink">
            Not sure which topic?
          </h2>
          <p className="mt-2 text-base text-neutral-700">
            Call us on{" "}
            <a href={`tel:${tel(org.phone)}`} className={link}>
              {org.phone}
            </a>
            , {org.hours}. We&apos;ll point you in the right direction.
          </p>
        </section>
      </div>
    </div>
  );
}
