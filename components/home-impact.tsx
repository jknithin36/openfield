// PLACEHOLDER FIGURES — replace with real, sourced numbers before launch.
// Each stat says who it counts and where the number comes from, so it
// means something instead of being a big number on its own.
const STATS = [
  {
    value: "12,400+",
    label: "People trained",
    detail: "Teachers, therapists and employers",
  },
  {
    value: "3,000+",
    label: "Items in our library",
    detail: "Books, devices and kits, shipped free",
  },
  {
    value: "8,500",
    label: "Families supported",
    detail: "From first diagnosis to adulthood",
  },
  {
    value: "96%",
    label: "Would recommend us",
    detail: "From our yearly survey",
  },
] as const;

export function HomeImpact() {
  return (
    <section
      aria-labelledby="impact-heading"
      className="mx-auto w-full max-w-[1400px] px-6 pb-16 lg:px-8 lg:pb-20"
    >
      {/* One compact line so the numbers stay on the first screen. */}
      <h2 id="impact-heading" className="sr-only">
        Our impact
      </h2>

      {/* Stats: 2 × 2 on phones, one row of 4 on laptops */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-0">
        {STATS.map(({ value, label, detail }, i) => (
          <div
            key={label}
            className={
              "flex flex-col " + (i === 0 ? "lg:pr-8" : "lg:border-l lg:border-border lg:px-8")
            }
          >
            {/* DOM order is label → number → detail (reads well aloud);
                the number is moved above the label visually. */}
            <dt className="order-2 mt-1 text-base font-medium text-ink dark:text-foreground">
              {label}
            </dt>
            <dd className="order-1 text-3xl font-medium tracking-[-0.03em] text-brand tabular-nums lg:text-[32px] dark:text-foreground">
              {value}
            </dd>
            <dd className="order-3 mt-1 text-sm leading-snug text-muted-foreground">{detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
