import type { Metadata } from "next";
import { Suspense } from "react";

import { RequestSteps } from "@/components/site/library/request-steps/request-steps";

export const metadata: Metadata = { title: "Borrow an item · Openfield", robots: { index: false } };

async function Steps({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RequestSteps slug={slug} />;
}

export default function RequestPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-[720px] px-6 py-12 text-neutral-600">Loading…</p>}
    >
      <Steps params={params} />
    </Suspense>
  );
}
