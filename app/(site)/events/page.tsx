import type { Metadata } from "next";

import { Suspense } from "react";

import { PublicEvents } from "@/components/site/public-events";

export const metadata: Metadata = {
  title: "Events · Openfield",
  description: "Webinars, workshops and family nights. Most are free.",
};

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-[1100px] px-6 py-14 text-neutral-600">Loading events…</p>
      }
    >
      <PublicEvents />
    </Suspense>
  );
}
