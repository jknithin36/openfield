import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { CatalogView } from "@/components/dashboard/library/catalog/catalog-view";

// Library → Catalog: "What do we have, and what's in demand?"
export default function CatalogPage() {
  return (
    <Suspense fallback={<PageHeader title="Catalog" description="Loading…" />}>
      <CatalogView />
    </Suspense>
  );
}
