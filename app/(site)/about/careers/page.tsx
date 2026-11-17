import type { Metadata } from "next";
import { Suspense } from "react";

import { AboutCareers } from "@/components/site/about/about-careers";

export function generateMetadata(): Metadata {
  return {
    title: "Work with us · About Openfield",
    description: "Open jobs and volunteering, with pay and closing dates.",
  };
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-neutral-600">Loading…</p>}>
      <AboutCareers />
    </Suspense>
  );
}
