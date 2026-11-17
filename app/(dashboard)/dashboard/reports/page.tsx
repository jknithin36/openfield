import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ReportsView } from "@/components/dashboard/reports/reports-view";

export default function ReportsPage() {
  return (
    <Suspense fallback={<PageHeader title="Reports" description="Loading…" />}>
      <ReportsView />
    </Suspense>
  );
}
