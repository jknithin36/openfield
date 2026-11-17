"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DemandRow } from "@/lib/today";
import { plural } from "@/lib/today";
import { Section } from "@/components/dashboard/today/section";

// One series (people waiting), horizontal bars sorted most → least, navy.
// Copies and average wait appear in the tooltip and in the screen-reader table.
const chartConfig = {
  waiting: { label: "People waiting", color: "var(--brand)" },
} satisfies ChartConfig;

export function HighDemand({ items }: { items: DemandRow[] }) {
  const data = items.map((i) => ({
    name: i.name,
    waiting: i.waiting,
    copies: i.copies,
    avgWaitWeeks: i.avgWaitWeeks,
  }));

  return (
    <Section id="high-demand" title="High demand — consider more copies">
      {items.length === 0 ? (
        <p className="text-base text-neutral-600">No waitlists right now.</p>
      ) : (
        <>
          <p className="text-sm text-neutral-600">People waiting, by item</p>
          <ChartContainer
            config={chartConfig}
            aria-hidden="true"
            className="mt-2 aspect-auto w-full"
            style={{ height: data.length * 44 + 8 }}
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
              barCategoryGap={10}
            >
              <XAxis type="number" dataKey="waiting" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#404040", fontSize: 13 }}
              />
              <ChartTooltip
                cursor={{ fill: "rgb(0 0 0 / 0.04)" }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value, _name, item) => {
                      const row = data.find((d) => d.name === item.payload?.name);
                      if (!row) return null;
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground tabular-nums">
                            {Number(value)} waiting
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            {row.copies} {plural(row.copies, "copy", "copies")} · about{" "}
                            {row.avgWaitWeeks} {plural(row.avgWaitWeeks, "week", "weeks")} wait
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey="waiting" fill="var(--color-waiting)" radius={4}>
                <LabelList
                  dataKey="waiting"
                  position="right"
                  offset={8}
                  className="fill-ink text-[13px] font-medium"
                />
              </Bar>
            </BarChart>
          </ChartContainer>

          {/* Same data as a table for screen readers */}
          <table className="sr-only">
            <caption>High-demand library items</caption>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">People waiting</th>
                <th scope="col">Copies</th>
                <th scope="col">Average wait</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  <td>{row.waiting}</td>
                  <td>{row.copies}</td>
                  <td>
                    {row.avgWaitWeeks} {plural(row.avgWaitWeeks, "week", "weeks")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Section>
  );
}
