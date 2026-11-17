import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { GuidesList } from "@/components/dashboard/guides/guides-list";

export default function GuidesPage() {
  return (
    <Suspense fallback={<PageHeader title="Family guides" description="Loading…" />}>
      <GuidesList />
    </Suspense>
  );
}
