"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon } from "@hugeicons/core-free-icons";

import { Cell, Pie, PieChart } from "recharts";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Role } from "@/lib/types";
import { announce } from "@/components/dashboard/shared/announcer";
import { quarterReportRows, toCsv, type QuarterStats } from "@/lib/today";
import { Section } from "@/components/dashboard/today/section";

// Fixed colour per role (never by rank). Palette validated for colour-blind
// separation in donut order, incl. the wrap-around pair. Light slices rely on
// the text legend, which is always shown.
const ROLE_ORDER: Role[] = ["parent", "teacher", "provider", "employer", "self-advocate"];
const ROLE_COLORS: Record<Role, string> = {
  parent: "#2a78d6",
  teacher: "#eb6834",
  provider: "#1baf7a",
  employer: "#eda100",
  "self-advocate": "#e87ba4",
};
const ROLE_NAMES: Record<Role, string> = {
  parent: "Parents",
  teacher: "Teachers",
  provider: "Providers",
  employer: "Employers",
  "self-advocate": "Self-advocates",
};
const reachConfig = Object.fromEntries(
  ROLE_ORDER.map((r) => [r, { label: ROLE_NAMES[r], color: ROLE_COLORS[r] }]),
) satisfies ChartConfig;

export function ThisQuarter({ stats }: { stats: QuarterStats }) {
  const slices = ROLE_ORDER.flatMap((role) => {
    const r = stats.reachByRole.find((x) => x.role === role);
    return r ? [r] : [];
  });

  const onExport = () => {
    const csv = toCsv(quarterReportRows(stats));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openfield-report-${stats.label.replace(" ", "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    announce(`Report for ${stats.label} downloaded`);
  };

  const figures = [
    { label: "Items loaned", value: stats.itemsLoaned },
    { label: "Families reached", value: stats.familiesReached },
    { label: "People at events", value: stats.eventAttendance },
  ];

  return (
    <Section id="this-quarter" title={`This quarter (${stats.label})`}>
      <dl className="grid grid-cols-3 gap-4">
        {figures.map((f) => (
          <div key={f.label} className="flex flex-col">
            <dt className="order-2 text-sm text-neutral-600">{f.label}</dt>
            <dd className="order-1 text-2xl font-medium text-ink tabular-nums">
              {f.value.toLocaleString("en-US")}
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-6 text-[15px] font-medium text-ink">Who we reached</h3>
      <div className="mt-3 flex items-center gap-6">
        {/* Donut is visual only; the legend list beside it carries the data. */}
        <ChartContainer
          config={reachConfig}
          aria-hidden="true"
          className="aspect-square w-32 shrink-0"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="role" />} />
            <Pie
              data={slices}
              dataKey="percent"
              nameKey="role"
              innerRadius="58%"
              outerRadius="100%"
              stroke="#ffffff"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.role} fill={`var(--color-${s.role})`} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <ul className="flex min-w-0 flex-1 flex-col gap-2">
          {slices.map((s) => (
            <li
              key={s.role}
              className="flex items-center justify-between gap-3 text-[15px] tabular-nums"
            >
              <span className="flex items-center gap-2 text-neutral-700">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: ROLE_COLORS[s.role] }}
                />
                {s.label}
              </span>
              <span className="font-medium text-ink">{s.percent}%</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        variant="outline"
        onClick={onExport}
        className="extend-touch-target mt-6 h-9 px-3 focus-visible:ring-3 focus-visible:ring-ring"
      >
        <HugeiconsIcon
          icon={Download04Icon}
          strokeWidth={2}
          aria-hidden="true"
          data-icon="inline-start"
        />
        Export report (CSV)
      </Button>
    </Section>
  );
}
