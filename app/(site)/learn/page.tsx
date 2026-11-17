import type { Metadata } from "next";
import { Suspense } from "react";

import { LearnList } from "@/components/site/learn-list";

export const metadata: Metadata = {
  title: "Free courses · Openfield",
  description: "Free online courses for families, teachers, providers and employers.",
};

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-[1400px] px-6 py-14 text-neutral-600">Loading courses…</p>
      }
    >
      <LearnList />
    </Suspense>
  );
}
