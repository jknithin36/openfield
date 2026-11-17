import type { Metadata } from "next";
import { Suspense } from "react";

import { STATIC_COURSES, staticCourse } from "@/lib/learn/static-courses";
import { LessonPlayer } from "@/components/site/learn/lesson-player";

export function generateStaticParams() {
  return STATIC_COURSES.flatMap((c) => c.lessons.map((l) => ({ slug: c.slug, lessonId: l.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}): Promise<Metadata> {
  const { slug, lessonId } = await params;
  const c = staticCourse(slug);
  const i = c?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  return c && i >= 0
    ? { title: `Lesson ${i + 1}: ${c.lessons[i].title} – ${c.title} – Openfield` }
    : { title: "Free courses · Openfield" };
}

async function Lesson({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  return <LessonPlayer slug={slug} lessonId={lessonId} />;
}

export default function LessonRoute({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-[1200px] px-6 py-12 text-neutral-600">Loading…</p>}
    >
      <Lesson params={params} />
    </Suspense>
  );
}
