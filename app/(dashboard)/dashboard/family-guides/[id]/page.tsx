import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { GuideEditor } from "@/components/dashboard/guides/guide-editor";

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GuideEditor id={id} />;
}

export default function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageHeader title="Guide" description="Loading…" />}>
      <Edit params={params} />
    </Suspense>
  );
}
