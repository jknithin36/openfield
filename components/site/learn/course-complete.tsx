"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useContentStore } from "@/store/content";
import { finishCourse, setCertificateName, useLearning } from "@/store/learning";
import type { Course } from "@/lib/types";
import { relatedCourses } from "@/lib/learn/public";
import { getCenterItems } from "@/lib/centers/public";
import { publicAvailability } from "@/lib/library/public";
import { ErrorSummary, type FormError } from "@/components/dashboard/shared/form-errors";
import { focusRing, RadioField, TextField } from "@/components/dashboard/shared/fields";
import { CourseCard } from "@/components/site/course-card";
import { ItemCard } from "@/components/site/library/item-card";
import { useCenterSources } from "@/components/site/centers/use-center-sources";
import { link } from "@/components/site/learn/course-page";

export function CourseComplete({ slug }: { slug: string }) {
  const s = useCenterSources();
  const shell = (c: React.ReactNode) => (
    <div className="mx-auto w-full max-w-[900px] px-6 py-10 lg:py-14">{c}</div>
  );
  if (!s) return shell(<p className="text-neutral-600">Loading…</p>);
  const course = s.courses.find((c) => c.slug === slug && c.status === "published");
  if (!course)
    return shell(
      <>
        <h1 className="text-3xl font-medium text-ink">We can&apos;t find that course</h1>
        <p className="mt-3 text-lg">
          <Link href="/learn" className={link}>
            See all free courses
          </Link>
        </p>
      </>,
    );
  return <Complete course={course} s={s} />;
}

function Complete({
  course,
  s,
}: {
  course: Course;
  s: NonNullable<ReturnType<typeof useCenterSources>>;
}) {
  const router = useRouter();
  const p = useLearning()[course.slug];
  const left = course.lessons.filter((l) => !p?.completedLessonIds.includes(l.id));
  const allDone = left.length === 0;
  const h1 = useRef<HTMLHeadingElement>(null);
  const [name, setName] = useState(p?.certificateName ?? "");
  const [errors, setErrors] = useState<FormError[]>([]);
  const [useful, setUseful] = useState<"yes" | "no" | "">("");
  const [comment, setComment] = useState("");
  const [thanked, setThanked] = useState(false);

  useEffect(() => {
    if (allDone)
      finishCourse(
        course.slug,
        course.lessons.map((l) => l.id),
      ); // counted once per browser
    h1.current?.focus();
    document.title = `${allDone ? "Course finished" : "Lessons left"} – ${course.title} – Openfield`;
  }, [allDone, course]);

  const shell = (c: React.ReactNode) => (
    <div className="mx-auto w-full max-w-[900px] px-6 py-10 lg:py-14">{c}</div>
  );

  if (!allDone)
    return shell(
      <>
        <h1
          ref={h1}
          tabIndex={-1}
          className="text-3xl font-medium tracking-[-0.03em] text-ink outline-none"
        >
          You have {left.length} {left.length === 1 ? "lesson" : "lessons"} left
        </h1>
        <p className="mt-3 text-lg text-neutral-700">Finish these to complete {course.title}:</p>
        <ul className="mt-4 flex flex-col gap-2 text-lg">
          {left.map((l) => (
            <li key={l.id}>
              <Link href={`/learn/${course.slug}/${l.id}`} className={link}>
                Lesson {course.lessons.indexOf(l) + 1}: {l.title}
              </Link>
            </li>
          ))}
        </ul>
      </>,
    );

  const related = relatedCourses(s.courses, course, 3);
  const item = getCenterItems(s, course.center)[0];

  return shell(
    <>
      <div className="rounded-2xl border-4 border-emerald-700 bg-white p-8 text-center">
        <h1
          ref={h1}
          tabIndex={-1}
          className="text-3xl font-semibold text-balance text-ink outline-none"
        >
          You&apos;ve finished {course.title}
        </h1>
        <p className="mt-3 text-lg text-ink">Well done. Your progress is saved on this device.</p>
      </div>

      {course.certificate && (
        <section aria-labelledby="cert-h" className="mt-10">
          <h2 id="cert-h" className="text-2xl font-medium text-ink">
            Get your certificate
          </h2>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim())
                return setErrors([{ fieldId: "cert-name", message: "Enter your name" }]);
              setErrors([]);
              setCertificateName(course.slug, name);
              router.push(
                `/learn/${course.slug}/certificate?name=${encodeURIComponent(name.trim())}`,
              );
            }}
            className="mt-4 flex max-w-xl flex-col gap-5"
          >
            <ErrorSummary errors={errors} />
            <TextField
              id="cert-name"
              label="Name for your certificate"
              hint="This is printed on the certificate."
              autoComplete="name"
              value={name}
              onChange={setName}
              error={errors[0]?.message}
            />
            <Button
              type="submit"
              className={`h-12 w-fit bg-brand px-6 text-base text-white hover:bg-brand-hover ${focusRing}`}
            >
              Get certificate
            </Button>
          </form>
        </section>
      )}

      <section aria-labelledby="fb-h" className="mt-12 border-t border-border pt-10">
        <h2 id="fb-h" className="text-2xl font-medium text-ink">
          Was this course useful?
        </h2>
        {thanked ? (
          <p role="status" className="mt-3 text-lg text-ink">
            Thank you. Your answer helps us improve our courses.
          </p>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!useful) return;
              useContentStore.getState().addFeedback(course.slug, useful === "yes", comment);
              setThanked(true);
            }}
            className="mt-4 flex max-w-xl flex-col gap-5"
          >
            <RadioField
              id="useful"
              legend="Was this course useful?"
              hideLegend
              columns={2}
              value={useful}
              options={{ yes: "Yes", no: "No" }}
              onChange={setUseful}
            />
            <TextField
              id="useful-comment"
              label="Tell us more (optional)"
              multiline
              rows={3}
              value={comment}
              onChange={setComment}
              hint="Please don't include personal details."
            />
            <Button
              type="submit"
              variant="outline"
              disabled={!useful}
              className={`h-12 w-fit px-6 text-base ${focusRing}`}
            >
              Send feedback
            </Button>
          </form>
        )}
      </section>

      {(related.length > 0 || item) && (
        <section aria-labelledby="next-h" className="mt-12 border-t border-border pt-10">
          <h2 id="next-h" className="text-2xl font-medium text-ink">
            What next
          </h2>
          {related.length > 0 && (
            <ul className="mt-5 grid gap-5 md:grid-cols-3">
              {related.map((c) => (
                <li key={c.id}>
                  <CourseCard course={c} />
                </li>
              ))}
            </ul>
          )}
          {item && (
            <div className="mt-8 max-w-xs">
              <h3 className="mb-3 text-lg font-medium text-ink">Borrow for free</h3>
              <ItemCard item={item} a={publicAvailability(s.lib, item, s.now)} headingLevel="h4" />
            </div>
          )}
        </section>
      )}
    </>,
  );
}
