"use client";

import Link from "next/link";
import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { hydrateContent, useContentStore } from "@/store/content";
import { homeCourses } from "@/lib/learn/public";
import { STATIC_COURSES } from "@/lib/learn/static-courses";
import { CourseCard } from "@/components/site/course-card";

const link =
  "rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring";

/** One course per audience (featured first), live from Courses. */
export function HomeCourses() {
  useEffect(() => hydrateContent(), []);
  const live = useContentStore((s) => (s.hydrated ? s.data?.courses : null));
  const all = live ?? STATIC_COURSES;
  // Six courses: one per audience, plus a second for parents (featured first).
  const courses = homeCourses(all, [
    "parent",
    "teacher",
    "employer",
    "provider",
    "self-advocate",
    "parent",
  ]);
  const total = all.filter((c) => c.status === "published").length;

  return (
    <section
      aria-labelledby="courses-heading"
      className="bg-linear-to-br from-[#e8f0f2] to-[#e6eee4]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 py-14 lg:px-8 lg:py-20">
        <h2
          id="courses-heading"
          className="text-2xl leading-tight font-medium tracking-[-0.03em] text-ink sm:text-[28px]"
        >
          Free courses
        </h2>
        <p className="mt-2 text-base leading-relaxed text-pretty text-neutral-600">
          Learn at your own pace. No account needed.
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {courses.map((c) => (
            <li key={c.id}>
              <CourseCard course={c} />
            </li>
          ))}
        </ul>
        <Link
          href="/learn"
          className={`${link} mx-auto mt-8 flex w-fit items-center gap-1 text-base`}
        >
          See all {total} courses
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-4"
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
