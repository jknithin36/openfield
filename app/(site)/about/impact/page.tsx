import type { Metadata } from "next";
import { Suspense } from "react";

import { AboutImpact } from "@/components/site/about/about-impact";

export function generateMetadata(): Metadata {
  return {
    title: "Our impact · About Openfield",
    description: "What we did this year and last year, in numbers from our own records.",
  };
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-neutral-600">Loading…</p>}>
      <AboutImpact />
    </Suspense>
  );
}
