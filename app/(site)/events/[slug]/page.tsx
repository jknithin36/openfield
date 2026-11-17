import type { Metadata } from "next";
import { Suspense } from "react";

import { createEventsData } from "@/data/events";
import { PublicEvent } from "@/components/site/public-events";

// Slugs and titles don't depend on dates, so a fixed date keeps the build deterministic.
const STATIC_EVENTS = createEventsData(new Date("2026-01-01T12:00:00Z")).events.filter(
  (e) => e.status !== "draft",
);

export function generateStaticParams() {
  return STATIC_EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = STATIC_EVENTS.find((x) => x.slug === slug);
  return e
    ? { title: `${e.title} · Events · Openfield`, description: e.summary }
    : { title: "Events · Openfield" };
}

async function Event({ params }: { params: Promise<{ slug: string }> }) {
  return <PublicEvent slug={(await params).slug} />;
}

export default function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-[1100px] px-6 py-10 text-neutral-600">Loading…</p>}
    >
      <Event params={params} />
    </Suspense>
  );
}
