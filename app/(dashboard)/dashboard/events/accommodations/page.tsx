import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { AccommodationsView } from "@/components/dashboard/events/accommodations/accommodations-view";

// "What support have people asked for that isn't arranged yet?"
export default function AccommodationsPage() {
  return (
    <Suspense fallback={<PageHeader title="Accommodations" description="Loading…" />}>
      <AccommodationsView />
    </Suspense>
  );
}
