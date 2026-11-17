import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsView } from "@/components/dashboard/settings/settings-view";

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageHeader title="Settings" description="Loading…" />}>
      <SettingsView />
    </Suspense>
  );
}
