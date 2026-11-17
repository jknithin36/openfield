import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { CourseEditor } from "@/components/dashboard/courses/course-editor";

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseEditor id={id} />;
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageHeader title="Course" description="Loading…" />}>
      <Edit params={params} />
    </Suspense>
  );
}
