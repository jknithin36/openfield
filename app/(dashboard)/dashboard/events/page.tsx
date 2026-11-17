import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EventsList } from "@/components/dashboard/events/list/events-list";

// Events: "What's coming up, and is each event ready?"
export default function EventsPage() {
  return (
    <Suspense fallback={<PageHeader title="Upcoming events" description="Loading…" />}>
      <EventsList />
    </Suspense>
  );
}
