"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { cn } from "cn";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { tactile, tactileBase } from "@/components/tactile-button";
import { LIBRARY_ITEMS } from "@/lib/content";
import { popularItems, publicAvailability, type PublicAvailability } from "@/lib/library/public";
import { staticItem } from "@/lib/library/static-items";
import type { LibraryItem } from "@/lib/types";
import { ItemCard } from "@/components/site/library/item-card";
import { usePublicLibrary } from "@/components/site/library/use-public-library";

/** The 4 most-borrowed items with live availability. Static copy shows until the store loads. */
function usePopular(): Array<{ item: LibraryItem; a: PublicAvailability }> {
  const d = usePublicLibrary();
  const [now] = useState<Date | null>(() => (typeof window === "undefined" ? null : new Date()));
  if (!d || !now) {
    return LIBRARY_ITEMS.flatMap((x) => {
      const item = staticItem(x.slug);
      return item
        ? [{ item, a: { available: x.available, free: 0, waiting: 0, weeks: 0, text: x.status } }]
        : [];
    });
  }
  return popularItems(d.lib, 4).map((item) => ({ item, a: publicAvailability(d.lib, item, now) }));
}

const STEPS = [
  "Find an item and send a request.",
  "We check it and ship it to you, usually within 3 days.",
  "Use it for up to 6 weeks, then send it back with the free label.",
] as const;

const link =
  "rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring";

export function HomeLibrary() {
  const popular = usePopular();
  return (
    <section
      aria-labelledby="library-heading"
      className="mx-auto w-full max-w-[1400px] px-6 py-14 lg:px-8 lg:py-20"
    >
      {/* Centered intro + search */}
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="library-heading"
          className="text-2xl leading-tight font-medium tracking-[-0.03em] text-balance text-ink sm:text-[28px]"
        >
          Borrow books, devices and kits for free
        </h2>
        <p className="mt-2 text-base leading-relaxed text-pretty text-neutral-600">
          Try equipment before you buy it. We ship it to you and include a return label.
        </p>

        <form
          action="/library"
          method="get"
          role="search"
          className="mx-auto mt-6 flex max-w-xl gap-2"
        >
          <label htmlFor="library-search" className="sr-only">
            Search the library
          </label>
          <Input
            id="library-search"
            name="q"
            type="search"
            placeholder='Search the library (e.g. "tablet")'
            className="h-11 flex-1 bg-background px-3.5 text-base focus-visible:ring-3 focus-visible:ring-ring"
          />
          <Button type="submit" size="lg" className={cn(tactileBase, tactile.primary, "h-11 px-5")}>
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              aria-hidden="true"
              data-icon="inline-start"
            />
            Search
          </Button>
        </form>
      </div>

      {/* Popular right now */}
      <h3 className="mt-14 text-lg font-medium tracking-[-0.02em] text-ink">Popular right now</h3>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {popular.map(({ item, a }) => (
          <li key={item.id}>
            <ItemCard item={item} a={a} headingLevel="h4" />
          </li>
        ))}
      </ul>

      {/* One quiet row: who can borrow, plus the steps behind a click */}
      <Separator className="mt-8" />
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* PLACEHOLDER REGION — replace "Riverbend region" with the real area. */}
        <p className="text-base leading-relaxed text-neutral-700">
          <span className="font-medium text-ink">Who can borrow:</span> adults who live or work in
          the Riverbend region.
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Popover>
            <PopoverTrigger
              render={<Button variant="link" className={cn(link, "h-auto p-0 text-base")} />}
            >
              How borrowing works
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 gap-3 p-4">
              <PopoverHeader>
                <PopoverTitle className="text-base font-medium">How borrowing works</PopoverTitle>
              </PopoverHeader>
              <ol className="flex flex-col gap-2.5">
                {STEPS.map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-medium text-white tabular-nums"
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-neutral-700">{step}</span>
                  </li>
                ))}
              </ol>
            </PopoverContent>
          </Popover>

          <Link href="/library" className={cn(link, "inline-flex items-center gap-1 text-base")}>
            Browse the full library
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="size-4"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
