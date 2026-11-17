"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon, PrinterIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { ABOUT } from "@/data/about";
import { getYearImpact, metric, type ImpactYear } from "@/lib/about/public";
import { focusRing } from "@/components/dashboard/shared/fields";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { useWorkspace } from "@/components/dashboard/shared/use-workspace";
import { useCenterSources } from "@/components/site/centers/use-center-sources";
import { AboutBreadcrumb, H2, link } from "@/components/site/about/about-home";
import { DataTableSimple } from "@/components/site/about/money-table";

const n = (x: number | string) => (typeof x === "number" ? x.toLocaleString("en-US") : x);

export function AboutImpact() {
  const { searchParams, hrefWith } = useUrlState();
  const which: ImpactYear = searchParams.get("year") === "last" ? "last-year" : "this-year";
  const w = useWorkspace();
  const s = useCenterSources();
  const report = ABOUT.documents.find((d) => d.title.startsWith("Annual report"));

  return (
    <>
      <AboutBreadcrumb page="Our impact" />
      <h1 className="mt-6 text-3xl font-medium tracking-[-0.03em] text-ink sm:text-5xl">
        Our impact
      </h1>
      <p className="mt-4 max-w-3xl text-xl leading-relaxed text-ink">
        What we did, in numbers. These come straight from our records, the same ones our staff use
        every day.
      </p>

      <nav aria-label="Choose a year" className="mt-6 flex flex-wrap gap-2 print:hidden">
        {(["this-year", "last-year"] as const).map((y) => (
          <Link
            key={y}
            href={hrefWith({ year: y === "last-year" ? "last" : null })}
            scroll={false}
            aria-current={which === y ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-base ${focusRing} ${which === y ? "border-brand bg-brand font-medium text-white" : "border-border bg-white text-ink hover:border-brand/40"}`}
          >
            {y === "this-year" ? "This year" : "Last year"}
          </Link>
        ))}
      </nav>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        {report && (
          <a
            href={report.href}
            className={`inline-flex min-h-11 items-center gap-1.5 text-base ${link}`}
          >
            <HugeiconsIcon
              icon={File02Icon}
              strokeWidth={2}
              aria-hidden="true"
              className="size-5"
            />
            Download annual report
            <span className="text-neutral-600 no-underline">
              ({report.kind.toLowerCase()}, {report.size})
            </span>
          </a>
        )}
        <Button
          variant="outline"
          onClick={() => window.print()}
          className={`h-11 gap-1.5 px-4 ${focusRing}`}
        >
          <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} aria-hidden="true" />
          Print this page
        </Button>
      </div>

      {!w || !s ? (
        <p className="mt-10 text-neutral-600">Loading…</p>
      ) : (
        <Sections which={which} w={w} now={s.now} />
      )}
    </>
  );
}

function Sections({
  which,
  w,
  now,
}: {
  which: ImpactYear;
  w: NonNullable<ReturnType<typeof useWorkspace>>;
  now: Date;
}) {
  const y = getYearImpact(
    {
      lib: w.lib,
      ev: w.ev.data,
      contacts: w.contacts,
      messages: w.messages,
      courses: w.content.courses,
      guides: w.content.guides,
      inboxRules: w.settings.inboxRules,
      now,
    },
    which,
  );
  const sec = (id: string) => y.sections.find((x) => x.id === id)!;
  const m = (id: string, label: string) => metric(y.sections, id, label);
  const reach = sec("reach");
  const lib = sec("library");
  const ev = sec("events");
  const fam = sec("families");
  const learn = sec("learning");

  if (y.empty)
    return (
      <p className="mt-10 rounded-2xl border border-dashed border-border p-8 text-lg text-ink">
        We don&apos;t have records for {y.range.label} in this demo. Course and guide numbers are
        below and are since launch.{" "}
        <Link href="/about/impact" className={link}>
          See this year
        </Link>
      </p>
    );

  return (
    <div className="mt-10 flex flex-col gap-14">
      <p className="text-base text-neutral-700">
        Showing {y.range.label}
        {which === "this-year" ? ", so far" : ""}.
      </p>

      <section aria-labelledby="reach-h" className="break-inside-avoid">
        <H2 id="reach-h">Reach</H2>
        <p className="mt-3 text-lg text-ink">
          We helped {n(m("reach", "People helped"))} people, including {n(m("reach", "Families"))}{" "}
          families. {n(m("reach", "From outside the region"))} came from outside our region.
        </p>
        <div className="mt-5">
          <DataTableSimple
            caption="People helped, by role"
            head={["Role", "People", "Share"]}
            rows={reach.breakdowns[0].rows.map((r) => [r.label, n(r.value), `${r.percent ?? 0}%`])}
          />
        </div>
      </section>

      <section aria-labelledby="lib-h" className="break-inside-avoid">
        <H2 id="lib-h">Library</H2>
        <p className="mt-3 text-lg text-ink">
          We lent {n(m("library", "Items lent"))} items.{" "}
          {y.averageWaitDays !== null
            ? `On average, people heard yes within ${y.averageWaitDays} days.`
            : ""}{" "}
          {lib.breakdowns[0].rows[0]
            ? `The most borrowed was ${lib.breakdowns[0].rows[0].label}.`
            : ""}
        </p>
        <div className="mt-5">
          <DataTableSimple
            caption="Most borrowed items"
            head={["Item", "Times lent"]}
            rows={lib.breakdowns[0].rows.map((r) => [r.label, n(r.value)])}
          />
        </div>
      </section>

      <section aria-labelledby="learn-h" className="break-inside-avoid">
        <H2 id="learn-h">Learning</H2>
        <p className="mt-3 text-lg text-ink">
          People enrolled on our courses {n(m("learning", "Enrolments"))} times and finished them{" "}
          {n(m("learning", "Completed"))} times. We issued {n(y.certificates)} certificates. These
          numbers are since launch.
        </p>
        <div className="mt-5">
          <DataTableSimple
            caption="Courses, since launch"
            head={["Measure", "Number"]}
            rows={[
              ["Courses published", n(m("learning", "Courses published"))],
              ["Enrolments", n(m("learning", "Enrolments"))],
              ["Completions", n(m("learning", "Completed"))],
              ["Certificates", n(y.certificates)],
            ]}
          />
        </div>
        {learn.breakdowns[0].rows.length > 0 && (
          <div className="mt-6">
            <DataTableSimple
              caption="Completions by who the course was for"
              head={["Audience", "Completions", "Share"]}
              rows={learn.breakdowns[0].rows.map((r) => [
                r.label,
                n(r.value),
                `${r.percent ?? 0}%`,
              ])}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="ev-h" className="break-inside-avoid">
        <H2 id="ev-h">Events</H2>
        <p className="mt-3 text-lg text-ink">
          We held {n(m("events", "Events held"))} events. {n(m("events", "People attended"))} people
          came, and we arranged {n(m("events", "Accommodations arranged"))} accommodations so people
          could take part.
        </p>
        {ev.breakdowns[0].rows.length > 0 && (
          <div className="mt-5">
            <DataTableSimple
              caption="Accommodations arranged, by type"
              head={["Type", "Number"]}
              rows={ev.breakdowns[0].rows.map((r) => [r.label, n(r.value)])}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="fam-h" className="break-inside-avoid">
        <H2 id="fam-h">Families</H2>
        <p className="mt-3 text-lg text-ink">
          Our {n(m("families", "Guides published"))} family guides have been read{" "}
          {n(m("families", "Times read"))} times since launch. {m("families", "Found them helpful")}{" "}
          of readers who answered found them helpful.
        </p>
        <div className="mt-5">
          <DataTableSimple
            caption="Most helpful guides"
            head={["Guide", "Found it helpful"]}
            rows={fam.breakdowns[0].rows.map((r) => [r.label, `${r.value}%`])}
          />
        </div>
      </section>
    </div>
  );
}
