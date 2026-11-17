import Link from "next/link";

import type { Center } from "@/lib/types";
import type { Popular } from "@/lib/centers/public";
import { focusRing } from "@/components/dashboard/shared/fields";

/**
 * One topic. The name is the one real link and stretches over the box; the
 * "Popular" link sits above that layer as a separate sibling link.
 */
export function TopicBox({
  center,
  popular,
  counts,
  headingLevel = "h2",
}: {
  center: Center;
  popular?: Popular | null;
  counts?: string;
  headingLevel?: "h2" | "h3";
}) {
  const H = headingLevel;
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-white p-6 transition-colors focus-within:ring-3 focus-within:ring-ring hover:border-brand/40 motion-reduce:transition-none">
      <H className="text-xl leading-snug font-medium text-ink">
        <Link
          href={`/centers/${center.slug}`}
          className="text-brand underline decoration-brand/30 underline-offset-4 outline-none group-hover:decoration-brand after:absolute after:inset-0 after:rounded-2xl"
        >
          {center.name}
        </Link>
      </H>
      <p className="mt-2 text-base leading-relaxed text-neutral-700">{center.summary}</p>
      <div className="mt-auto flex flex-col gap-1.5 pt-5 text-[15px]">
        {popular && (
          <p className="text-neutral-700">
            Popular:{" "}
            <Link
              href={popular.href}
              className={`relative z-10 rounded-sm font-medium text-ink underline decoration-neutral-400 underline-offset-4 hover:decoration-ink ${focusRing}`}
            >
              {popular.label}
            </Link>
          </p>
        )}
        {counts && <p className="text-neutral-600">{counts}</p>}
      </div>
    </article>
  );
}
