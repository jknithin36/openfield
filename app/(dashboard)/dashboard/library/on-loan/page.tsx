import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { LoansView } from "@/components/dashboard/library/on-loan/loans-view";

// Library → On loan: "Who has our items, and is anything late?"
export default function OnLoanPage() {
  return (
    <Suspense fallback={<PageHeader title="On loan" description="Loading…" />}>
      <LoansView />
    </Suspense>
  );
}
