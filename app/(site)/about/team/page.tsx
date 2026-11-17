import type { Metadata } from "next";
import { Suspense } from "react";

import { AboutTeam } from "@/components/site/about/about-team";

export function generateMetadata(): Metadata {
  return {
    title: "Our team · About Openfield",
    description: "Our staff, board and advisory group of disabled people and parents.",
  };
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-neutral-600">Loading…</p>}>
      <AboutTeam />
    </Suspense>
  );
}
