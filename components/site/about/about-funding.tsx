"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon, PrinterIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { ABOUT } from "@/data/about";
import { getFundingSummary, money } from "@/lib/about/public";
import { focusRing } from "@/components/dashboard/shared/fields";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { AboutBreadcrumb, H2, link } from "@/components/site/about/about-home";
import { DataTableSimple } from "@/components/site/about/money-table";

export function AboutFunding() {
  const { searchParams, hrefWith } = useUrlState();
  const f = getFundingSummary(Number(searchParams.get("year")) || undefined);
  const top = [...f.kinds].sort((a, b) => b.amount - a.amount)[0];

  return (
    <>
      <AboutBreadcrumb page="How we're funded" />
      <h1 className="mt-6 text-3xl font-medium tracking-[-0.03em] text-ink sm:text-5xl">
        How we&apos;re funded
      </h1>
      <p className="mt-4 max-w-3xl text-xl leading-relaxed text-ink">
        Everything we offer is free. Here&apos;s where the money comes from and how we spend it.
      </p>

      <nav aria-label="Choose a year" className="mt-6 flex flex-wrap gap-2 print:hidden">
        {f.years.map((y, i) => (
          <Link
            key={y}
            href={hrefWith({ year: i === 0 ? null : String(y) })}
            scroll={false}
            aria-current={f.year === y ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-base ${focusRing} ${f.year === y ? "border-brand bg-brand font-medium text-white" : "border-border bg-white text-ink hover:border-brand/40"}`}
          >
            {y}
          </Link>
        ))}
        <Button
          variant="outline"
          onClick={() => window.print()}
          className={`h-11 gap-1.5 px-4 ${focusRing}`}
        >
          <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} aria-hidden="true" />
          Print this page
        </Button>
      </nav>

      <div className="mt-10 flex flex-col gap-14">
        <section aria-labelledby="in-h" className="break-inside-avoid">
          <H2 id="in-h">Where it comes from</H2>
          <p className="mt-3 text-lg text-ink">
            In {f.year} our income was {money(f.total)}. The biggest share, {top.pct}%, came from{" "}
            {top.label.toLowerCase()}.
          </p>
          <div className="mt-5">
            <DataTableSimple
              caption={`Income by type, ${f.year}`}
              head={["Type", "Amount", "Share"]}
              rows={f.kinds.map((k) => [k.label, money(k.amount), `${k.pct}%`])}
              foot={["Total", money(f.total), "100%"]}
            />
          </div>
          <div className="mt-8">
            <DataTableSimple
              caption={`Our funders, ${f.year}`}
              head={["Funder", "Amount"]}
              rows={f.sources.map((s) => [s.name, money(s.amount)])}
              foot={["Total", money(f.total)]}
            />
          </div>
        </section>

        <section aria-labelledby="out-h" className="break-inside-avoid">
          <H2 id="out-h">How we spend it</H2>
          <p className="mt-3 text-lg text-ink">
            For every $1 we spend, {f.servicesCents} cents go directly to services. The rest pays
            for things like rent, insurance and accounts.
          </p>
          <div className="mt-5">
            <DataTableSimple
              caption={`Spending by area, ${f.year}`}
              head={["Area", "Amount", "Share"]}
              rows={f.costs.map((c) => [c.label, money(c.amount), `${c.pct}%`])}
              foot={["Total", money(f.spent), "100%"]}
            />
          </div>
        </section>

        <section aria-labelledby="ind-h">
          <H2 id="ind-h">Our independence</H2>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-ink">
            Our funders don&apos;t decide who gets help, what our guides say, or which items we
            lend. Those decisions are made by our staff, our board and our advisory group of
            disabled people and parents.
          </p>
        </section>

        <section aria-labelledby="docs-h" className="print:hidden">
          <H2 id="docs-h">Documents</H2>
          <ul className="mt-4 flex flex-col gap-3">
            {ABOUT.documents.map((d) => (
              <li key={d.href} className="flex gap-3">
                <HugeiconsIcon
                  icon={File02Icon}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="mt-1 size-5 shrink-0 text-brand"
                />
                <span>
                  <a href={d.href} className={`text-lg ${link}`}>
                    {d.title}
                  </a>
                  <span className="block text-[15px] text-neutral-600">
                    {d.kind}, {d.size}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-base text-neutral-700 print:hidden">
          Want to support our work?{" "}
          <Link href="/contact?topic=general" className={link}>
            Get in touch
          </Link>{" "}
          and we&apos;ll tell you how.
        </p>
      </div>
    </>
  );
}
