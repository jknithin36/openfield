import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EventDetail } from "@/components/dashboard/events/detail/event-detail";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventDetail id={id} />;
}

// Event detail: "Who's coming, what do they need, is everything arranged?"
export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageHeader title="Event" description="Loading…" />}>
      <Detail params={params} />
    </Suspense>
  );
}
