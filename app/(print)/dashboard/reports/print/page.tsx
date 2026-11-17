import type { Metadata } from "next";
import { Suspense } from "react";

import { ReportPrint } from "@/components/dashboard/reports/report-print";

export const metadata: Metadata = {
  title: "Report · Openfield",
  robots: { index: false },
};

// Outside the dashboard layout: no sidebar or top bar when printing.
export default function PrintReportPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <ReportPrint />
    </Suspense>
  );
}
