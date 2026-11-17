import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isStage, STAGE_PUBLIC, STAGES } from "@/lib/families/public";
import { FamiliesStage } from "@/components/site/families/families";

export function generateStaticParams() {
  return STAGES.map((stage) => ({ stage }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stage: string }>;
}): Promise<Metadata> {
  const { stage } = await params;
  return isStage(stage)
    ? { title: `${STAGE_PUBLIC[stage]} · Help for families · Openfield` }
    : { title: "Page not found · Openfield" };
}

export default async function StagePage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params;
  if (!isStage(stage)) notFound();
  return <FamiliesStage stage={stage} />;
}
