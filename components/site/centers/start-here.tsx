import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

import type { Center } from "@/lib/types";
import { focusRing } from "@/components/dashboard/shared/fields";

/** The first questions people really ask. Native details/summary: keyboard and screen-reader friendly. */
export function StartHere({ items }: { items: Center["startHere"] }) {
  return (
    <div className="flex flex-col divide-y divide-border border-y border-border">
      {items.map((q) => (
        <details key={q.question} className="group">
          <summary
            className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            {q.question}
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              aria-hidden="true"
              className="size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <div className="flex flex-col gap-2 pb-5 text-lg leading-relaxed text-ink">
            <p>{q.answer}</p>
            {q.link && (
              <p>
                <Link
                  href={q.link.href}
                  className={`rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand ${focusRing}`}
                >
                  {q.link.label}
                </Link>
              </p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
