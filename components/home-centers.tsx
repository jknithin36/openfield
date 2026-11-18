import { TopicGrid } from "@/components/site/centers/centers-index";

/** The six topics, simply: name and one line each. Details live on /centers. */
export function HomeCenters() {
  return (
    <section
      aria-labelledby="centers-heading"
      className="bg-linear-to-br from-[#e8f0f2] to-[#e6eee4]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 py-14 lg:px-8 lg:py-16">
        <h2
          id="centers-heading"
          className="mb-8 text-2xl leading-tight font-medium tracking-[-0.03em] text-ink"
        >
          Find help by topic
        </h2>
        <TopicGrid headingLevel="h3" simple />
      </div>
    </section>
  );
}
