import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ToShipView } from "@/components/dashboard/library/to-ship/to-ship-view";

// Library → To ship: "What do I need to pack and send today?"
export default function ToShipPage() {
  return (
    <Suspense fallback={<PageHeader title="To ship" description="Loading…" />}>
      <ToShipView />
    </Suspense>
  );
}
