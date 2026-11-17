import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createGuides } from "@/data/content";
import { FamilyGuidePage } from "@/components/site/families/families";

// Slugs and titles don't depend on dates, so a fixed date keeps the build deterministic.
const STATIC_GUIDES = createGuides(new Date("2026-01-01T12:00:00Z")).filter(
  (g) => g.status === "published",
);

export function generateStaticParams() {
  return STATIC_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = STATIC_GUIDES.find((x) => x.slug === slug);
  return g
    ? { title: `${g.title} · Help for families · Openfield`, description: g.summary }
    : { title: "Page not found · Openfield" };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Unknown slugs 404. (Guides published later in the dashboard still render client-side.)
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  return <FamilyGuidePage slug={slug} />;
}
