import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CENTERS, centerBySlug } from "@/data/centers";
import { CenterHub } from "@/components/site/centers/center-hub";

export function generateStaticParams() {
  return CENTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const c = centerBySlug((await params).slug);
  return c
    ? { title: `${c.name} · Find help by topic · Openfield`, description: c.summary }
    : { title: "Page not found · Openfield" };
}

export default async function CenterPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = centerBySlug((await params).slug);
  if (!c) notFound();
  return <CenterHub slug={c.slug} />;
}
