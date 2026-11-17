import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EventForm } from "@/components/dashboard/events/form/event-form";

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventForm id={id} />;
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageHeader title="Edit event" description="Loading…" />}>
      <Edit params={params} />
    </Suspense>
  );
}
