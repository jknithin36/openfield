import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ReturnsView } from "@/components/dashboard/library/returns/returns-view";

// Library → Returns & cleaning: "Is this item ready to lend again?"
export default function ReturnsPage() {
  return (
    <Suspense fallback={<PageHeader title="Returns & cleaning" description="Loading…" />}>
      <ReturnsView />
    </Suspense>
  );
}
