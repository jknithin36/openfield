import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { CoursesList } from "@/components/dashboard/courses/courses-list";

export default function CoursesPage() {
  return (
    <Suspense fallback={<PageHeader title="Courses" description="Loading…" />}>
      <CoursesList />
    </Suspense>
  );
}
