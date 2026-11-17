import type { Metadata } from "next";
import { Suspense } from "react";

import { ManageBooking } from "@/components/site/events/event-booking";

export const metadata: Metadata = {
  title: "Manage your booking · Openfield",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-[720px] px-6 py-12 text-neutral-600">Loading…</p>}
    >
      <ManageBooking />
    </Suspense>
  );
}
