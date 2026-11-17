import type { Metadata } from "next";
import { Suspense } from "react";

import { EventRegister } from "@/components/site/events/event-register";

export const metadata: Metadata = {
  title: "Register for an event · Openfield",
  robots: { index: false },
};

async function Inner({ params }: { params: Promise<{ slug: string }> }) {
  return <EventRegister slug={(await params).slug} />;
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-[720px] px-6 py-12 text-neutral-600">Loading…</p>}
    >
      <Inner params={params} />
    </Suspense>
  );
}
