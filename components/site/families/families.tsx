"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, PrinterIcon, Search01Icon } from "@hugeicons/core-free-icons";

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
import { useContentStore } from "@/store/content";
import { TEXT_SIZES, useTextSize, type TextSize } from "@/store/learning";
import type { AgeStage, FamilyGuide, OFEvent, OrganizationSettings } from "@/lib/types";
import {
  familyEvents,
  GLOSSARY,
  guidesForStage,
  headingId,
  nextStage,
  parentCourses,
  publishedGuides,
  searchGuides,
  STAGE_PUBLIC,
  STAGES,
} from "@/lib/families/public";
import { dayText, timeText } from "@/lib/events/public";
import { focusRing, RadioField, TextField } from "@/components/dashboard/shared/fields";
import { CourseCard } from "@/components/site/course-card";
import { Markdown } from "@/components/site/learn/markdown";
import { useCenterSources } from "@/components/site/centers/use-center-sources";

const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;
const SIZE_CLASS: Record<TextSize, string> = {
  default: "text-[17px]",
  large: "text-[20px]",
  xl: "text-[23px]",
};
const longDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(iso));
const tel = (p: string) => p.replace(/[^\d+]/g, "");

function Crumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <Breadcrumb className="print:hidden">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((it) => (
          <span key={it.label} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {it.href ? (
                <BreadcrumbLink render={<Link href={it.href} />}>{it.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{it.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function GuideList({ guides }: { guides: FamilyGuide[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border border-y border-border">
      {guides.map((g) => (
        <li key={g.id} className="py-4">
          <h3 className="text-lg">
            <Link href={`/families/${g.slug}`} className={link}>
              {g.title}
            </Link>
          </h3>
          <p className="mt-1 text-base text-neutral-700">
            {g.summary} <span className="text-neutral-600">{g.readMinutes} minute read.</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

function TeamBox({ org }: { org: OrganizationSettings }) {
  return (
    <aside
      aria-labelledby="team-h"
      className="h-fit rounded-2xl bg-linear-to-br from-[#e8f0f2] to-[#e6eee4] p-6"
    >
      <h2 id="team-h" className="text-xl font-medium text-ink">
        Talk to our family team
      </h2>
      <p className="mt-2 text-base text-ink">
        Call{" "}
        <a href={`tel:${tel(org.phone)}`} className={link}>
          {org.phone}
        </a>
      </p>
      <p className="text-base text-neutral-700">{org.hours}</p>
      <p className="mt-3 text-base">
        <Link href="/contact?topic=family-support" className={link}>
          Send us a message
        </Link>
      </p>
    </aside>
  );
}

function EventRows({ events }: { events: OFEvent[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border border-y border-border">
      {events.map((e) => (
        <li key={e.id} className="py-4">
          <h3 className="text-lg">
            <Link href={`/events/${e.slug}`} className={link}>
              {e.title}
            </Link>
          </h3>
          <p className="text-[15px] text-neutral-700">
            <time dateTime={e.startsAt}>{dayText(e)}</time>, {timeText(e)}
          </p>
        </li>
      ))}
    </ul>
  );
}

// ── /families ─────────────────────────────────────────────────────────────
export function FamiliesHome() {
  const s = useCenterSources();
  const [q, setQ] = useState("");
  const [searched, setSearched] = useState("");
  const results = s && searched ? searchGuides(s.guides, searched) : [];

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 lg:px-8 lg:py-14">
      <Crumbs items={[{ label: "Help for families" }]} />
      <h1 className="mt-6 text-3xl font-medium tracking-[-0.03em] text-ink sm:text-5xl">
        Help for families
      </h1>
      <p className="mt-4 max-w-2xl text-xl leading-relaxed text-ink">
        Short, plain-language guides for each stage of your child&apos;s life. If you&apos;d rather
        talk, our family team is a phone call away{s ? ` on ${s.org.phone}` : ""}.
      </p>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setSearched(q.trim());
        }}
        className="mt-8 max-w-2xl"
      >
        <Label htmlFor="fg-search" className="text-[15px] font-semibold text-ink">
          Search family guides
        </Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="fg-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
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
      <div aria-live="polite">
        {searched && s && (
          <section aria-labelledby="fg-results" className="mt-6">
            <h2 id="fg-results" className="text-lg font-semibold text-ink">
              {results.length} {results.length === 1 ? "guide" : "guides"} found for “{searched}”
            </h2>
            {results.length > 0 ? (
              <div className="mt-3">
                <GuideList guides={results} />
              </div>
            ) : (
              <p className="mt-2 text-base text-neutral-700">
                Try a different word, or call our family team.
              </p>
            )}
          </section>
        )}
      </div>

      {!s ? (
        <p className="mt-10 text-neutral-600">Loading guides…</p>
      ) : (
        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="flex flex-col gap-12">
            {STAGES.map((stage) => {
              const all = guidesForStage(s.guides, stage);
              if (!all.length) return null;
              return (
                <section key={stage} aria-labelledby={`st-${stage}`}>
                  <h2
                    id={`st-${stage}`}
                    className="text-2xl font-medium tracking-[-0.02em] text-ink"
                  >
                    {STAGE_PUBLIC[stage]}
                  </h2>
                  <div className="mt-3">
                    <GuideList guides={all.slice(0, 3)} />
                  </div>
                  <Link
                    href={`/families/stage/${stage}`}
                    className={`mt-3 inline-flex min-h-11 items-center gap-1 text-base ${link}`}
                  >
                    See all {all.length} {all.length === 1 ? "guide" : "guides"} for this stage
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="size-4"
                    />
                  </Link>
                </section>
              );
            })}
          </div>
          <div className="flex flex-col gap-8">
            <TeamBox org={s.org} />
            {familyEvents(s.ev, s.now).length > 0 && (
              <section aria-labelledby="fev-h">
                <h2 id="fev-h" className="text-xl font-medium text-ink">
                  Upcoming family events
                </h2>
                <div className="mt-3">
                  <EventRows events={familyEvents(s.ev, s.now)} />
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── /families/stage/[stage] ───────────────────────────────────────────────
export function FamiliesStage({ stage }: { stage: AgeStage }) {
  const s = useCenterSources();
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 lg:px-8 lg:py-14">
      <Crumbs
        items={[{ label: "Help for families", href: "/families" }, { label: STAGE_PUBLIC[stage] }]}
      />
      <h1 className="mt-6 text-3xl font-medium tracking-[-0.03em] text-ink sm:text-5xl">
        {STAGE_PUBLIC[stage]}
      </h1>
      {!s ? (
        <p className="mt-8 text-neutral-600">Loading…</p>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="flex flex-col gap-12">
            <section aria-labelledby="g-h">
              <h2 id="g-h" className="text-2xl font-medium text-ink">
                Guides
              </h2>
              <div className="mt-3">
                {guidesForStage(s.guides, stage).length ? (
                  <GuideList guides={guidesForStage(s.guides, stage)} />
                ) : (
                  <p className="text-lg text-neutral-700">
                    No guides for this stage yet. Our family team can still help.
                  </p>
                )}
              </div>
            </section>
            <section aria-labelledby="c-h">
              <h2 id="c-h" className="text-2xl font-medium text-ink">
                Free courses for parents
              </h2>
              <ul className="mt-4 grid gap-5 md:grid-cols-3">
                {parentCourses(s.courses).map((c) => (
                  <li key={c.id}>
                    <CourseCard course={c} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="flex flex-col gap-8">
            <TeamBox org={s.org} />
            {familyEvents(s.ev, s.now).length > 0 && (
              <section aria-labelledby="fev-h">
                <h2 id="fev-h" className="text-xl font-medium text-ink">
                  Upcoming family events
                </h2>
                <div className="mt-3">
                  <EventRows events={familyEvents(s.ev, s.now)} />
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── /families/[slug] ──────────────────────────────────────────────────────
/** The body, with ids on headings and a plain explanation the first time a term appears. */
function GuideBody({ body }: { body: string }) {
  const explained = new Set<string>();
  const blocks = body.trim().split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) {
          const t = b.slice(3);
          return (
            <h2
              key={i}
              id={headingId(t)}
              className="mt-6 scroll-mt-24 text-[1.35em] font-semibold tracking-[-0.01em] text-ink first:mt-0"
            >
              {t}
            </h2>
          );
        }
        const lower = b.toLowerCase();
        const terms = GLOSSARY.filter(
          (g) => !explained.has(g.key) && new RegExp(`\\b${g.key}\\b`).test(lower),
        );
        terms.forEach((g) => explained.add(g.key));
        return (
          <div key={i} className="flex flex-col gap-2">
            <Markdown source={b} />
            {terms.map((g) => (
              <details
                key={g.key}
                className="rounded-lg border-l-4 border-brand bg-brand-soft px-4 py-1 print:border-0"
              >
                <summary
                  className={`min-h-11 cursor-pointer py-2 text-[0.9em] font-medium text-brand ${focusRing}`}
                >
                  What does “{g.term}” mean?
                </summary>
                <p className="pb-3 text-[0.95em]">
                  {g.meaning.charAt(0).toUpperCase() + g.meaning.slice(1)}.
                </p>
              </details>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Helpful({ slug }: { slug: string }) {
  const [answer, setAnswer] = useState<"yes" | "no" | "">("");
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const thanks = useRef<HTMLParagraphElement>(null);
  if (done)
    return (
      <p ref={thanks} tabIndex={-1} role="status" className="text-lg text-ink outline-none">
        Thank you. We read every answer and use them to improve our guides.
      </p>
    );
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!answer) return;
        useContentStore.getState().addGuideFeedback(slug, answer === "yes", comment);
        setDone(true);
        setTimeout(() => thanks.current?.focus(), 0);
      }}
      className="flex max-w-xl flex-col gap-5"
    >
      <RadioField
        id="helpful"
        legend="Was this guide helpful?"
        hideLegend
        columns={2}
        value={answer}
        options={{ yes: "Yes", no: "No" }}
        onChange={setAnswer}
      />
      {answer && (
        <TextField
          id="helpful-comment"
          label={answer === "yes" ? "What helped? (optional)" : "What was missing? (optional)"}
          multiline
          rows={3}
          value={comment}
          onChange={setComment}
          hint="Please don't include personal details."
        />
      )}
      <Button
        type="submit"
        variant="outline"
        disabled={!answer}
        className={`h-12 w-fit px-6 text-base ${focusRing}`}
      >
        Send
      </Button>
    </form>
  );
}

export function FamilyGuidePage({ slug }: { slug: string }) {
  const s = useCenterSources();
  const [size, setSize] = useTextSize();
  useEffect(() => {
    const g = s?.guides.find((x) => x.slug === slug);
    if (g) document.title = `${g.title} · Help for families · Openfield`;
  }, [s, slug]);
  const shell = (c: React.ReactNode) => (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 lg:px-8 lg:py-14">{c}</div>
  );
  if (!s) return shell(<p className="text-neutral-600">Loading…</p>);
  const g = s.guides.find((x) => x.slug === slug && x.status === "published");
  if (!g)
    return shell(
      <>
        <h1 className="text-3xl font-medium text-ink">Guide not found</h1>
        <p className="mt-3 text-lg text-neutral-700">
          It may have moved or been updated.{" "}
          <Link href="/families" className={link}>
            See all family guides
          </Link>
        </p>
      </>,
    );

  const headings = g.body
    .split(/\n{2,}/)
    .filter((b) => b.startsWith("## "))
    .map((b) => b.slice(3));
  const next = nextStage(g.ageStage as AgeStage);
  const related = (
    next
      ? guidesForStage(s.guides, next)
      : publishedGuides(s.guides).filter((x) => x.ageStage === g.ageStage && x.id !== g.id)
  ).slice(0, 3);

  return shell(
    <>
      <Crumbs
        items={[
          { label: "Help for families", href: "/families" },
          { label: STAGE_PUBLIC[g.ageStage], href: `/families/stage/${g.ageStage}` },
          { label: g.title },
        ]}
      />
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <article aria-labelledby="guide-h" className="min-w-0">
          <p className="text-base font-medium text-brand">{STAGE_PUBLIC[g.ageStage]}</p>
          <h1
            id="guide-h"
            className="mt-1 text-3xl leading-tight font-medium tracking-[-0.03em] text-balance text-ink sm:text-5xl"
          >
            {g.title}
          </h1>
          <p className="mt-3 text-base text-neutral-700">
            {g.readMinutes} minute read · Last checked{" "}
            <time dateTime={g.lastReviewedAt}>{longDate(g.lastReviewedAt)}</time>
          </p>
          <p className="mt-4 max-w-[65ch] text-xl leading-relaxed text-ink">{g.summary}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2 print:hidden">
            <div role="group" aria-label="Text size" className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-neutral-700">Text size:</span>
              {(Object.keys(TEXT_SIZES) as TextSize[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={size === k}
                  onClick={() => setSize(k)}
                  className={`min-h-11 rounded-lg border px-3 text-[15px] ${focusRing} ${size === k ? "border-brand bg-brand-soft font-medium text-brand" : "border-border bg-white text-ink hover:border-brand/40"}`}
                >
                  {TEXT_SIZES[k]}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className={`h-11 gap-1.5 px-4 ${focusRing}`}
            >
              <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} aria-hidden="true" />
              Print
            </Button>
          </div>

          {headings.length > 1 && (
            <nav
              aria-label="On this page"
              className="mt-8 rounded-xl bg-neutral-50 px-5 py-4 lg:hidden print:hidden"
            >
              <p className="text-sm font-semibold text-ink">On this page</p>
              <ul className="mt-1 flex flex-col">
                {headings.map((h) => (
                  <li key={h}>
                    <a
                      href={`#${headingId(h)}`}
                      className={`inline-flex min-h-11 items-center text-base ${link}`}
                    >
                      {h}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className={`mt-8 max-w-[65ch] leading-relaxed text-ink ${SIZE_CLASS[size]}`}>
            <GuideBody body={g.body} />
          </div>

          <section
            aria-labelledby="ask-h"
            className="mt-12 max-w-[65ch] rounded-2xl bg-linear-to-br from-[#e8f0f2] to-[#e6eee4] p-6"
          >
            <h2 id="ask-h" className="text-xl font-medium text-ink">
              Still have questions?
            </h2>
            <p className="mt-2 text-lg text-ink">
              Call our family team on{" "}
              <a href={`tel:${tel(s.org.phone)}`} className={link}>
                {s.org.phone}
              </a>
              , {s.org.hours}.
            </p>
          </section>

          <section
            aria-labelledby="help-h"
            className="mt-12 border-t border-border pt-8 print:hidden"
          >
            <h2 id="help-h" className="text-xl font-medium text-ink">
              Was this guide helpful?
            </h2>
            <div className="mt-4">
              <Helpful slug={g.slug} />
            </div>
          </section>

          {related.length > 0 && (
            <section aria-labelledby="rel-h" className="mt-12 print:hidden">
              <h2 id="rel-h" className="text-xl font-medium text-ink">
                {next ? `Next stage: ${STAGE_PUBLIC[next]}` : "More guides like this"}
              </h2>
              <div className="mt-3">
                <GuideList guides={related} />
              </div>
            </section>
          )}
        </article>

        {headings.length > 1 && (
          <nav aria-label="On this page" className="hidden lg:block print:hidden">
            <div className="sticky top-24">
              <p className="mb-2 text-sm font-semibold text-ink">On this page</p>
              <ul className="flex flex-col gap-0.5 border-l-2 border-border">
                {headings.map((h) => (
                  <li key={h}>
                    <a
                      href={`#${headingId(h)}`}
                      className={`-ml-0.5 flex min-h-11 items-center border-l-2 border-transparent px-3 text-[15px] text-ink outline-none hover:border-brand hover:text-brand ${focusRing}`}
                    >
                      {h}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}
      </div>
    </>,
  );
}
