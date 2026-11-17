import type { Range, ReportSection } from "@/lib/reports";

/** One plain-English paragraph a funder could read on its own. */
export function summarySentence(sections: ReportSection[], range: Range): string {
  const v = (id: string, label: string) =>
    sections.find((s) => s.id === id)?.metrics.find((m) => m.label === label)?.value ?? 0;
  const n = (x: number | string) => (typeof x === "number" ? x.toLocaleString() : x);
  return [
    `In ${range.label}, Openfield helped ${n(v("reach", "People helped"))} people, including ${n(v("reach", "Families"))} families.`,
    `We lent ${n(v("library", "Items lent"))} items from the library`,
    `and ran ${n(v("events", "Events held"))} events with ${n(v("events", "People attended"))} people attending.`,
    `We answered messages in a typical ${String(v("response", "Typical first reply")).toLowerCase()}.`,
  ]
    .join(" ")
    .replace("library and", "library, and")
    .replace(" in a typical no replies yet", ", though none have had replies yet");
}

const changeText = (c: number | null | undefined) =>
  c == null
    ? null
    : c === 0
      ? "Same as the period before"
      : `${c > 0 ? "Up" : "Down"} ${Math.abs(c)}% on the period before`;

/** The report itself. `print` switches to black and white with no colour fills. */
export function ReportBody({
  sections,
  print = false,
}: {
  sections: ReportSection[];
  print?: boolean;
}) {
  return (
    <div className="flex flex-col">
      {sections.map((s) => (
        <section
          key={s.id}
          aria-labelledby={`r-${s.id}`}
          className={`grid gap-6 border-t py-8 lg:grid-cols-[220px_1fr] ${print ? "break-inside-avoid border-black py-5 lg:grid-cols-[180px_1fr]" : "border-border"}`}
        >
          <div>
            <h2 id={`r-${s.id}`} className="text-lg font-semibold text-ink">
              {s.title}
            </h2>
            <p className={`mt-1 text-[15px] ${print ? "text-black" : "text-neutral-600"}`}>
              {s.intro}
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
              {s.metrics.map((m) => (
                <div key={m.label} className="flex flex-col">
                  <dt className={`order-2 text-sm ${print ? "text-black" : "text-neutral-700"}`}>
                    {m.label}
                  </dt>
                  <dd className="order-1 text-[28px] leading-tight font-semibold text-ink tabular-nums">
                    {m.value}
                  </dd>
                  {(m.note || m.change != null) && (
                    <dd className={`order-3 text-sm ${print ? "text-black" : "text-neutral-600"}`}>
                      {[m.note, changeText(m.change)].filter(Boolean).join(". ")}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
            {s.breakdowns
              .filter((b) => b.rows.length)
              .map((b) => {
                const max = Math.max(...b.rows.map((r) => r.value), 1);
                return (
                  <div key={b.title}>
                    <h3 className="text-[15px] font-medium text-ink">{b.title}</h3>
                    <table className="mt-2 w-full max-w-2xl text-[15px]">
                      <caption className="sr-only">{b.title}</caption>
                      <thead className="sr-only">
                        <tr>
                          <th scope="col">Name</th>
                          <th scope="col">Share</th>
                          <th scope="col">Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows.map((r) => (
                          <tr key={r.label}>
                            <th scope="row" className="w-2/5 py-1.5 pr-3 text-left font-normal">
                              {r.label}
                            </th>
                            <td
                              className="py-1.5 pr-3"
                              aria-hidden={r.percent == null ? undefined : "true"}
                            >
                              <div
                                className={`h-2.5 overflow-hidden rounded-full ${print ? "border border-black" : "bg-neutral-100"}`}
                              >
                                <div
                                  className={`h-full ${print ? "bg-black" : "rounded-full bg-brand"}`}
                                  style={{ width: `${(r.value / max) * 100}%` }}
                                />
                              </div>
                            </td>
                            <td className="w-28 py-1.5 text-right tabular-nums">
                              {r.value.toLocaleString()}
                              {r.percent != null && s.id !== "families"
                                ? ` (${r.percent}%)`
                                : s.id === "families"
                                  ? "%"
                                  : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            {s.footnote && (
              <p className={`text-sm ${print ? "text-black" : "text-neutral-600"}`}>{s.footnote}</p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
