import type { Metadata } from "next";
import { Suspense } from "react";

import { EventRegistered } from "@/components/site/events/event-booking";

export const metadata: Metadata = {
  title: "Booking confirmed · Openfield",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-[720px] px-6 py-12 text-neutral-600">Loading…</p>}
    >
      <EventRegistered />
    </Suspense>
  );
}
