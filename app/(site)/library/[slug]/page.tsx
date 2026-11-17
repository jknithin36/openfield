import type { Metadata } from "next";
import { Suspense } from "react";

import { STATIC_ITEMS, staticItem } from "@/lib/library/static-items";
import { ItemPage } from "@/components/site/library/item-page";

export function generateStaticParams() {
  return STATIC_ITEMS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = staticItem(slug);
  return item
    ? { title: `${item.name} · Lending library · Openfield`, description: item.description }
    : { title: "Lending library · Openfield" };
}

async function Item({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ItemPage slug={slug} />;
}

export default function LibraryItemPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-[1200px] px-6 py-14 text-neutral-600">Loading…</p>}
    >
      <Item params={params} />
    </Suspense>
  );
}
