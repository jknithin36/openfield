import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { RequestsView } from "@/components/dashboard/library/requests/requests-view";

// Library → Requests: "Should we lend this item to this person?"
export default function RequestsPage() {
  return (
    <Suspense fallback={<PageHeader title="Requests" description="Loading…" />}>
      <RequestsView />
    </Suspense>
  );
}
