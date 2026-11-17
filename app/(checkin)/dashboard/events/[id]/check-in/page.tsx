import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckInView } from "@/components/dashboard/events/check-in/check-in-view";

export const metadata: Metadata = { title: "Check-in · Openfield", robots: { index: false } };

async function Door({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CheckInView id={id} />;
}

// "Who has arrived?"
export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-lg">Loading…</p>}>
      <Door params={params} />
    </Suspense>
  );
}
