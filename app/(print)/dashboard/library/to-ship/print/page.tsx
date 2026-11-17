import type { Metadata } from "next";
import { Suspense } from "react";

import { PrintView } from "@/components/dashboard/library/to-ship/print-view";

export const metadata: Metadata = {
  title: "Packing slips · Openfield",
  robots: { index: false },
};

// Outside the dashboard layout: no sidebar or top bar when printing.
export default function PrintPackingSlipsPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <PrintView />
    </Suspense>
  );
}
