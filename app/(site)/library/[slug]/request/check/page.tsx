import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckAnswers } from "@/components/site/library/check-answers";

export const metadata: Metadata = {
  title: "Check your answers · Openfield",
  robots: { index: false },
};

async function Check({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CheckAnswers slug={slug} />;
}

export default function CheckPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-[720px] px-6 py-12 text-neutral-600">Loading…</p>}
    >
      <Check params={params} />
    </Suspense>
  );
}
