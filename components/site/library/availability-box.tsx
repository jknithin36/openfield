import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  DeliveryTruck01Icon,
  Location01Icon,
  CalendarCheckIn01Icon,
} from "@hugeicons/core-free-icons";

import type { LibraryItem } from "@/lib/types";
import type { PublicAvailability } from "@/lib/library/public";
import { focusRing } from "@/components/dashboard/shared/fields";

const weeks = (days: number) => (days % 7 === 0 ? `${days / 7} weeks` : `${days} days`);

/** Derived from the store: never hard-coded. */
export function AvailabilityBox({
  item,
  a,
  regionName,
}: {
  item: LibraryItem;
  a: PublicAvailability;
  regionName: string;
}) {
  return (
    <section aria-labelledby="avail-h" className="rounded-2xl border border-border bg-white p-6">
      <h2 id="avail-h" className="sr-only">
        Availability
      </h2>
      {a.available ? (
        <p className="flex items-center gap-2 text-lg font-semibold text-emerald-800">
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="size-6"
          />
          Available now
        </p>
      ) : (
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold text-ink">
            <HugeiconsIcon
              icon={Clock01Icon}
              strokeWidth={2}
              aria-hidden="true"
              className="size-6 text-brand"
            />
            All copies are out right now
          </p>
          <p className="mt-1.5 text-base text-neutral-700">
            {a.waiting === 0
              ? "No one is waiting yet."
              : `${a.waiting} ${a.waiting === 1 ? "person is" : "people are"} waiting.`}{" "}
            Usual wait: about {a.weeks} {a.weeks === 1 ? "week" : "weeks"}.
          </p>
        </div>
      )}

      <Link
        href={`/library/${item.slug}/request`}
        className={`mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-brand px-5 text-base font-medium text-white hover:bg-brand-hover ${focusRing}`}
      >
        {a.available ? "Request to borrow" : "Join the waitlist"}
      </Link>

      <ul className="mt-5 flex flex-col gap-2.5 border-t border-border pt-5 text-[15px] text-neutral-800">
        <li className="flex items-start gap-2.5">
          <HugeiconsIcon
            icon={CalendarCheckIn01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-brand"
          />
          Keep it for {weeks(item.loanDays)}
        </li>
        <li className="flex items-start gap-2.5">
          <HugeiconsIcon
            icon={DeliveryTruck01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-brand"
          />
          Free shipping both ways, or pick it up
        </li>
        <li className="flex items-start gap-2.5">
          <HugeiconsIcon
            icon={Location01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-brand"
          />
          <span>
            For people who live or work in the {regionName} region.{" "}
            <Link
              href="/library/how-it-works"
              className={`rounded-sm font-medium text-brand underline underline-offset-4 ${focusRing}`}
            >
              Who can borrow
            </Link>
          </span>
        </li>
      </ul>
    </section>
  );
}
