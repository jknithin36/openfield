import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { InboxView } from "@/components/dashboard/inbox/inbox-view";

// Inbox: "Nobody waits more than two days for an answer."
export default function InboxPage() {
  return (
    <Suspense fallback={<PageHeader title="Inbox" description="Loading…" />}>
      <InboxView />
    </Suspense>
  );
}
