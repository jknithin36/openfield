import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EventForm } from "@/components/dashboard/events/form/event-form";

export default function NewEventPage() {
  return (
    <Suspense fallback={<PageHeader title="New event" description="Loading…" />}>
      <EventForm />
    </Suspense>
  );
}
