import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ItemDetail } from "@/components/dashboard/library/catalog/item-detail";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ItemDetail id={id} />;
}

// Library → Catalog → item. Reads the URL inside Suspense (instant navigation).
export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageHeader title="Item" description="Loading…" />}>
      <Detail params={params} />
    </Suspense>
  );
}
