"use client";

import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons";

import type { Course } from "@/lib/types";
import { COURSE_FORMAT_LABEL } from "@/lib/courses/selectors";
import { ROLE_LABEL } from "@/lib/library/views";
import { lengthWords } from "@/lib/learn/public";
import { courseImage } from "@/lib/learn/images";
import { useLearning } from "@/store/learning";

export const audienceText = (a: Course["audiences"]) =>
  `For ${a.map((r) => `${ROLE_LABEL[r].toLowerCase()}s`).join(" and ")}`;

/** Progress on this device, in words. */
export function useCourseStatus(course: Course): "completed" | "in-progress" | null {
  const p = useLearning()[course.slug];
  if (!p) return null;
  return p.completedAt ? "completed" : "in-progress";
}

/** The card picture (decorative: the title says what the course is). */
function CoursePicture({ course }: { course: Course }) {
  const img = courseImage(course.slug);
  return (
    <div className="relative aspect-[2.8/1] overflow-hidden rounded-t-2xl bg-brand-soft">
      {img && (
        <Image
          src={img.src}
          alt=""
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 45vw, 100vw"
          className="object-cover"
        />
      )}
    </div>
  );
}

/** One card, one link: the title stretches over the card. */
export function CourseCard({
  course,
  headingLevel = "h3",
}: {
  course: Course;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const H = headingLevel;
  const status = useCourseStatus(course);
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-white transition-colors focus-within:ring-3 focus-within:ring-ring hover:border-brand/40 motion-reduce:transition-none">
      <CoursePicture course={course} />
      <div className="flex flex-1 flex-col p-6 pt-5">
        <p className="text-sm font-medium text-brand">{audienceText(course.audiences)}</p>
        <H className="mt-2 text-lg leading-snug font-medium tracking-[-0.01em] text-ink">
          <Link
            href={`/learn/${course.slug}`}
            className="underline-offset-4 outline-none group-hover:underline after:absolute after:inset-0 after:rounded-2xl"
          >
            {course.title}
          </Link>
        </H>
        <p className="mt-2 text-[15px] text-neutral-700">
          {COURSE_FORMAT_LABEL[course.format]} · {lengthWords(course)}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-sm">
          {course.certificate && (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-neutral-700">
              Certificate
            </span>
          )}
          {status === "completed" && (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={2}
                aria-hidden="true"
                className="size-4"
              />
              Completed
            </span>
          )}
          {status === "in-progress" && (
            <span className="inline-flex items-center gap-1 font-medium text-brand">
              <HugeiconsIcon
                icon={Clock01Icon}
                strokeWidth={2}
                aria-hidden="true"
                className="size-4"
              />
              In progress
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
