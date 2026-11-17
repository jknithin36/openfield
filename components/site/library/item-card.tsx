import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons";

import type { LibraryItem } from "@/lib/types";
import { ageText, TYPE_ONE, type PublicAvailability } from "@/lib/library/public";
import { itemGlyph } from "@/components/dashboard/item-icon";

/** Large item picture: the item's own glyph on a soft tile (decorative; the name is always written). */
export function ItemPicture({
  item,
  className = "",
}: {
  item: Pick<LibraryItem, "id" | "type">;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex aspect-[4/3] items-center justify-center rounded-xl bg-brand-soft text-brand ${className}`}
    >
      <HugeiconsIcon icon={itemGlyph(item)} strokeWidth={1.4} className="size-14" />
    </div>
  );
}

/** Availability in words, with an icon as a second signal (never colour alone). */
export function AvailabilityText({
  a,
  className = "",
}: {
  a: PublicAvailability;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-start gap-1.5 ${a.available ? "text-emerald-800" : "text-neutral-800"} ${className}`}
    >
      <HugeiconsIcon
        icon={a.available ? CheckmarkCircle02Icon : Clock01Icon}
        strokeWidth={2}
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0"
      />
      <span>{a.text}</span>
    </span>
  );
}

/** One card, one link: the title link stretches over the whole card. */
export function ItemCard({
  item,
  a,
  headingLevel = "h2",
}: {
  item: LibraryItem;
  a: PublicAvailability;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const H = headingLevel;
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-white p-3 transition-shadow focus-within:ring-3 focus-within:ring-ring hover:border-brand/30 hover:shadow-sm motion-reduce:transition-none">
      <ItemPicture item={item} />
      <div className="flex flex-1 flex-col gap-1 px-1 pt-3 pb-1">
        <p className="text-sm text-neutral-600">
          {TYPE_ONE[item.type]} · {ageText(item.ageRange)}
        </p>
        <H className="text-[17px] leading-snug font-medium text-ink">
          <Link
            href={`/library/${item.slug}`}
            className="underline-offset-4 outline-none group-hover:underline after:absolute after:inset-0 after:rounded-2xl"
          >
            {item.name}
          </Link>
        </H>
        <p className="mt-auto pt-2 text-[15px]">
          <AvailabilityText a={a} />
        </p>
      </div>
    </article>
  );
}
