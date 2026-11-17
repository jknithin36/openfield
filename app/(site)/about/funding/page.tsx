import type { Metadata } from "next";
import { Suspense } from "react";

import { AboutFunding } from "@/components/site/about/about-funding";

export function generateMetadata(): Metadata {
  return {
    title: "How we're funded · About Openfield",
    description: "Where our money comes from and how we spend it.",
  };
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-neutral-600">Loading…</p>}>
      <AboutFunding />
    </Suspense>
  );
}
