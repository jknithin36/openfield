"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { hydrateContent, useContentStore } from "@/store/content";
import type { LibraryItem, ItemType } from "@/lib/types";
import {
  ageText,
  itemBySlug,
  publicAvailability,
  similarItems,
  TYPE_ONE,
  TYPE_PLURAL,
} from "@/lib/library/public";
import { CENTER_LABEL } from "@/lib/library/views";
import { focusRing } from "@/components/dashboard/shared/fields";
import { AvailabilityBox } from "@/components/site/library/availability-box";
import { ItemCard, ItemPicture } from "@/components/site/library/item-card";
import { tel, usePublicLibrary } from "@/components/site/library/use-public-library";

const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;

const CARE: Record<ItemType, string> = {
  device:
    "Charge it fully before you send it back. Please don't install other apps or change the settings.",
  kit: "Keep all the pieces together in the box. Wipe hard parts with a damp cloth if they get sticky.",
  book: "Please don't write in the book. A bookmark is fine.",
  video: "Keep the USB drive in its case when you're not using it.",
  assessment: "Return every record form, even blank ones. Please don't copy the forms.",
};

function whoFor(item: LibraryItem): string {
  const age =
    item.ageRange === "Professionals"
      ? "Made for teachers, therapists and other professionals"
      : item.ageRange === "Adults"
        ? "Made for adults"
        : item.ageRange === "Any age"
          ? "Suits any age"
          : `Suits ${ageText(item.ageRange).replace("Ages", "ages")}`;
  return `${age}. Part of our ${CENTER_LABEL[item.center]} collection. Families, schools and support workers can all borrow it.`;
}

export function ItemPage({ slug }: { slug: string }) {
  const d = usePublicLibrary();
  const [now] = useState<Date | null>(() => (typeof window === "undefined" ? null : new Date()));
  useEffect(() => hydrateContent(), []);
  const courses = useContentStore((s) => (s.hydrated ? s.data?.courses : null));
  const shell = (c: React.ReactNode) => (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-10 lg:px-8 lg:py-14">{c}</div>
  );

  if (!d || !now) return shell(<p className="text-neutral-600">Loading…</p>);
  const item = itemBySlug(d.lib, slug);
  if (!item)
    return shell(
      <>
        <h1 className="text-3xl font-medium text-ink">We can&apos;t find that item</h1>
        <p className="mt-3 text-lg text-neutral-700">
          It may have been removed from the library.{" "}
          <Link href="/library" className={link}>
            Browse the library
          </Link>
        </p>
      </>,
    );

  const a = publicAvailability(d.lib, item, now);
  const course = courses?.find((c) => c.status === "published" && c.center === item.center);
  const similar = similarItems(d.lib, item, 3);
  const ext = d.lib.settings.extensionWeeks;

  return shell(
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/library" />}>Library</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/library?type=${item.type}`} />}>
              {TYPE_PLURAL[item.type]}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{item.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="grid gap-6 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center">
            <ItemPicture item={item} />
            <div>
              <h1 className="text-3xl leading-tight font-medium tracking-[-0.03em] text-balance text-ink sm:text-4xl">
                {item.name}
              </h1>
              <p className="mt-2 text-base text-neutral-600">
                {TYPE_ONE[item.type]} · {ageText(item.ageRange)} · {CENTER_LABEL[item.center]}
              </p>
              <p className="mt-3 text-lg leading-relaxed text-ink">{item.description}</p>
            </div>
          </div>

          <div className="mt-8 lg:hidden">
            <AvailabilityBox item={item} a={a} regionName={d.org.regionName} />
          </div>

          <section aria-labelledby="box-h" className="mt-10">
            <h2 id="box-h" className="text-xl font-medium text-ink">
              What&apos;s in the box
            </h2>
            <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-base text-ink sm:grid-cols-2">
              {item.parts.map((p) => (
                <li key={p} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand"
                  />
                  {p}
                </li>
              ))}
              <li className="flex gap-2">
                <span
                  aria-hidden="true"
                  className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand"
                />
                A prepaid return label
              </li>
            </ul>
          </section>

          <section aria-labelledby="who-h" className="mt-10">
            <h2 id="who-h" className="text-xl font-medium text-ink">
              Who it&apos;s for
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink">{whoFor(item)}</p>
          </section>

          <section aria-labelledby="good-h" className="mt-10">
            <h2 id="good-h" className="text-xl font-medium text-ink">
              Good to know
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-base leading-relaxed text-ink">
              <li>
                Need more time? You can extend once by{" "}
                {ext.length > 1
                  ? `${ext.slice(0, -1).join(", ")} or ${ext[ext.length - 1]}`
                  : ext[0]}{" "}
                weeks, as long as no one is waiting for it.
              </li>
              <li>{CARE[item.type]}</li>
              <li>Accidents happen. If something breaks, tell us and we&apos;ll sort it out.</li>
            </ul>
          </section>

          {course && (
            <section
              aria-labelledby="course-h"
              className="mt-10 rounded-2xl bg-linear-to-br from-[#e8f0f2] to-[#e6eee4] p-6"
            >
              <h2 id="course-h" className="text-xl font-medium text-ink">
                Free course
              </h2>
              <p className="mt-2 text-base text-neutral-700">
                Learn more while you wait, or alongside the loan.
              </p>
              <p className="mt-2 text-base">
                <Link href={`/learn/${course.slug}`} className={link}>
                  {course.title}
                </Link>
              </p>
            </section>
          )}

          {similar.length > 0 && (
            <section aria-labelledby="similar-h" className="mt-12">
              <h2 id="similar-h" className="text-xl font-medium text-ink">
                Similar items
              </h2>
              <ul className="mt-4 grid gap-5 sm:grid-cols-3">
                {similar.map((s) => (
                  <li key={s.id}>
                    <ItemCard item={s} a={publicAvailability(d.lib, s, now)} headingLevel="h3" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside aria-label="Borrow this item" className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-4">
            <AvailabilityBox item={item} a={a} regionName={d.org.regionName} />
            <p className="px-1 text-sm text-neutral-700">
              Questions? Call{" "}
              <a href={`tel:${tel(d.org.phone)}`} className={link}>
                {d.org.phone}
              </a>
            </p>
          </div>
        </aside>
      </div>
    </>,
  );
}
