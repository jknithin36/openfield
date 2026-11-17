import type { Metadata } from "next";
import { Suspense } from "react";

import { RequestSent } from "@/components/site/library/request-sent";

export const metadata: Metadata = { title: "Request sent · Openfield", robots: { index: false } };

export default function SentPage() {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-[720px] px-6 py-12 text-neutral-600">Loading…</p>}
    >
      <RequestSent />
    </Suspense>
  );
}
