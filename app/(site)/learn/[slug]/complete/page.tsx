import type { Metadata } from "next";
import { Suspense } from "react";

import { STATIC_COURSES } from "@/lib/learn/static-courses";
import { CourseComplete } from "@/components/site/learn/course-complete";

export const metadata: Metadata = {
  title: "Course finished · Openfield",
  robots: { index: false },
};

export function generateStaticParams() {
  return STATIC_COURSES.map((c) => ({ slug: c.slug }));
}

async function Complete({ params }: { params: Promise<{ slug: string }> }) {
  return <CourseComplete slug={(await params).slug} />;
}

export default function CompletePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-[900px] px-6 py-14 text-neutral-600">Loading…</p>}
    >
      <Complete params={params} />
    </Suspense>
  );
}
