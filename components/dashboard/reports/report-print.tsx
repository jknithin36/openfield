"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, PrinterIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { isAdmin } from "@/store/dashboard";
import { focusRing } from "@/components/dashboard/shared/fields";
import { useWorkspace } from "@/components/dashboard/shared/use-workspace";
import { ReportBody, summarySentence } from "@/components/dashboard/reports/report-body";
import { useReport } from "@/components/dashboard/reports/reports-view";

/** Black and white, A4/Letter friendly. No sidebar or colour fills. */
export function ReportPrint() {
  const sp = useSearchParams();
  const w = useWorkspace();
  const { kind, range, sections, now } = useReport(
    w,
    sp.get("period"),
    sp.get("from"),
    sp.get("to"),
  );
  const back = `/dashboard/reports?${new URLSearchParams({ ...(kind !== "this-quarter" ? { period: kind } : {}), ...(sp.get("from") ? { from: sp.get("from")! } : {}), ...(sp.get("to") ? { to: sp.get("to")! } : {}) })}`;

  if (!w) return <p className="p-8">Loading…</p>;
  if (!isAdmin(w.role))
    return (
      <p className="p-8">
        Only admins can see reports.{" "}
        <Link href="/dashboard" className="underline">
          Go back to Today
        </Link>
      </p>
    );
  if (!range || !sections)
    return (
      <p className="p-8">
        Choose valid dates on the Reports page first.{" "}
        <Link href={back} className="underline">
          Back to reports
        </Link>
      </p>
    );

  return (
    <div className="mx-auto max-w-4xl bg-white p-8 text-black print:max-w-none print:p-0">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={back}
          className={`inline-flex min-h-11 items-center gap-1 rounded-sm font-medium text-brand underline underline-offset-4 ${focusRing}`}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="size-4"
          />
          Back to reports
        </Link>
        <Button
          onClick={() => window.print()}
          className={`h-11 gap-1.5 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
        >
          <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} aria-hidden="true" />
          Print this report
        </Button>
      </div>
      <header className="border-b-2 border-black pb-4">
        <p className="text-sm">{w.settings.org.name}</p>
        <h1 className="text-3xl font-semibold">Report for {range.label}</h1>
        <p className="mt-1 text-sm">
          Printed {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(now)}
        </p>
      </header>
      <p className="mt-5 text-lg leading-relaxed">{summarySentence(sections, range)}</p>
      <div className="mt-4">
        <ReportBody sections={sections} print />
      </div>
      <footer className="mt-6 border-t border-black pt-3 text-sm">
        {w.settings.org.name} · {w.settings.org.address} · {w.settings.org.phone}
      </footer>
    </div>
  );
}
