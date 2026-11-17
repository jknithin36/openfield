"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, PrinterIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadCsv } from "@/lib/csv";
import {
  buildReport,
  isoDate,
  PERIOD_LABEL,
  PERIODS,
  periodRange,
  reportCsv,
  type Range,
} from "@/lib/reports";
import { parseOne } from "@/lib/library/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { announce } from "@/components/dashboard/shared/announcer";
import { focusRing } from "@/components/dashboard/shared/fields";
import { FieldError, errorGroupClass } from "@/components/dashboard/shared/form-errors";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { useWorkspace, type Workspace } from "@/components/dashboard/shared/use-workspace";
import { ReportBody, summarySentence } from "@/components/dashboard/reports/report-body";

export function useReport(
  w: Workspace | null,
  period: string | null,
  from: string | null,
  to: string | null,
) {
  const [now] = useState(() => new Date());
  const kind = parseOne(period, PERIODS, "this-quarter");
  const range = periodRange(kind, now, from, to);
  const sections =
    w && range
      ? buildReport(
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
          range,
        )
      : null;
  return { kind, range, sections, now };
}

export function ReportsView() {
  const w = useWorkspace();
  return w ? <Reports w={w} /> : <PageHeader title="Reports" description="Loading…" />;
}

function Reports({ w }: { w: Workspace }) {
  const { searchParams, setParams } = useUrlState();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const { kind, range, sections, now } = useReport(w, searchParams.get("period"), from, to);
  const [draft, setDraft] = useState({
    from: from ?? isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: to ?? isoDate(now),
  });
  const [error, setError] = useState("");
  const qs = new URLSearchParams({
    period: kind,
    ...(kind === "custom" && from && to ? { from, to } : {}),
  }).toString();

  const apply = () => {
    if (!draft.from || !draft.to) return setError("Enter both dates");
    const r = periodRange("custom", now, draft.from, draft.to);
    if (!r) return setError("The end date must be the same as or after the start date");
    setError("");
    setParams({ from: draft.from, to: draft.to });
    announce(`Showing ${r.label}.`);
  };

  const summary = sections && range ? summarySentence(sections, range) : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Reports" }]}
        title="Reports"
        description="Numbers for funders and the board. Everything here comes from live records."
        primaryAction={{
          label: "Print",
          href: `/dashboard/reports/print?${qs}`,
          icon: <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} aria-hidden="true" />,
        }}
        moreActions={
          sections && range
            ? [
                {
                  label: "Download CSV",
                  onSelect: () =>
                    downloadCsv(
                      `openfield-report-${range.label.replace(/\W+/g, "-").toLowerCase()}`,
                      reportCsv(sections, range),
                    ),
                },
              ]
            : []
        }
        tabs={{
          label: "Period",
          param: "period",
          current: kind,
          defaultValue: "this-quarter",
          items: PERIODS.map((p) => ({ value: p, label: PERIOD_LABEL[p] })),
        }}
      />

      {kind === "custom" && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
          className={`flex flex-wrap items-end gap-3 ${errorGroupClass(!!error)}`}
        >
          <FieldError id="range-error" message={error} />
          <div className="w-full basis-full" />
          {(["from", "to"] as const).map((k) => (
            <div key={k} className="flex flex-col gap-1.5">
              <Label htmlFor={`range-${k}`} className="text-[15px] font-medium">
                {k === "from" ? "From" : "To"}
              </Label>
              <Input
                id={`range-${k}`}
                type="date"
                value={draft[k]}
                onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                aria-invalid={!!error}
                aria-describedby={error ? "range-error" : undefined}
                className={`h-11 w-44 text-base ${focusRing}`}
              />
            </div>
          ))}
          <Button
            type="submit"
            className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
          >
            Show report
          </Button>
        </form>
      )}

      {!range || !sections ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-neutral-600">
          Choose a start and end date to see the report.
        </p>
      ) : (
        <ReportContent range={range} summary={summary}>
          <ReportBody sections={sections} />
        </ReportContent>
      )}
    </div>
  );
}

function ReportContent({
  range,
  summary,
  children,
}: {
  range: Range;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <article aria-label={`Report for ${range.label}`}>
      <div className="rounded-xl bg-brand-soft p-6">
        <p className="text-sm font-medium text-brand">{range.label} at a glance</p>
        <p className="mt-2 max-w-3xl text-lg leading-relaxed text-pretty text-ink">{summary}</p>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(summary);
              announce("Summary copied.");
            } catch {
              announce("Couldn't copy. Select the text and copy it instead.");
            }
          }}
          className={`mt-4 h-11 gap-1.5 bg-white px-4 ${focusRing}`}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} aria-hidden="true" />
          Copy this summary
        </Button>
      </div>
      <div className="mt-2">{children}</div>
    </article>
  );
}
