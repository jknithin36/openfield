import Link from "next/link";

import type { ActionLine } from "@/lib/today";
import { textLink } from "@/components/dashboard/today/section";

// The only coloured box on the page.
export function NeedsAction({ lines }: { lines: ActionLine[] }) {
  return (
    <section
      aria-labelledby="needs-action-heading"
      className="rounded-lg bg-amber-50 p-5 ring-1 ring-amber-200 sm:p-6"
    >
      <h2 id="needs-action-heading" className="text-lg font-medium text-ink">
        Needs action
      </h2>
      {lines.length === 0 ? (
        <p className="mt-3 text-base text-neutral-700">Nothing needs action right now.</p>
      ) : (
        <ul className="mt-3 divide-y divide-amber-200/70">
          {lines.map((line) => (
            <li
              key={line.key}
              className="flex flex-col gap-1 py-3 first:pt-1 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <span className="text-base text-ink">{line.text}</span>
              <Link href={line.href} className={`${textLink} shrink-0 text-base`}>
                {line.linkLabel}
                <span className="sr-only">: {line.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
