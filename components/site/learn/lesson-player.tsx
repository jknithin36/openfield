"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  File02Icon,
  PlayCircleIcon,
} from "@hugeicons/core-free-icons";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { hydrateContent, useContentStore } from "@/store/content";
import {
  markLessonDone,
  openLesson,
  TEXT_SIZES,
  useLearning,
  useTextSize,
  type TextSize,
} from "@/store/learning";
import type { Course, Lesson } from "@/lib/types";
import { LESSON_TYPE_LABEL } from "@/lib/learn/public";
import { focusRing } from "@/components/dashboard/shared/fields";
import { Markdown } from "@/components/site/learn/markdown";
import { link } from "@/components/site/learn/course-page";

const SIZE_CLASS: Record<TextSize, string> = {
  default: "text-[17px]",
  large: "text-[20px]",
  xl: "text-[23px]",
};

export function useCourses() {
  useEffect(() => hydrateContent(), []);
  return useContentStore((s) => (s.hydrated ? s.data?.courses : null));
}

export function LessonPlayer({ slug, lessonId }: { slug: string; lessonId: string }) {
  const courses = useCourses();
  const shell = (c: React.ReactNode) => (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-10 lg:px-8">{c}</div>
  );
  if (!courses) return shell(<p className="text-neutral-600">Loading…</p>);
  const course = courses.find((c) => c.slug === slug && c.status === "published");
  const lesson = course?.lessons.find((l) => l.id === lessonId);
  if (!course || !lesson)
    return shell(
      <>
        <h1 className="text-3xl font-medium text-ink">We can&apos;t find that lesson</h1>
        <p className="mt-3 text-lg">
          {course ? (
            <Link href={`/learn/${course.slug}`} className={link}>
              Back to {course.title}
            </Link>
          ) : (
            <Link href="/learn" className={link}>
              See all free courses
            </Link>
          )}
        </p>
      </>,
    );
  return <Player course={course} lesson={lesson} />;
}

function Player({ course, lesson }: { course: Course; lesson: Lesson }) {
  const router = useRouter();
  const progress = useLearning()[course.slug];
  const [size, setSize] = useTextSize();
  const h1 = useRef<HTMLHeadingElement>(null);
  const i = course.lessons.findIndex((l) => l.id === lesson.id);
  const n = course.lessons.length;
  const prev = course.lessons[i - 1];
  const next = course.lessons[i + 1];
  const done = (id: string) => !!progress?.completedLessonIds.includes(id);
  const doneCount = course.lessons.filter((l) => done(l.id)).length;
  const type = lesson.type ?? "reading";

  useEffect(() => {
    openLesson(course.slug, lesson.id);
    document.title = `Lesson ${i + 1}: ${lesson.title} – ${course.title} – Openfield`;
    h1.current?.focus();
  }, [course.slug, course.title, lesson.id, lesson.title, i]);

  const finish = () => {
    markLessonDone(course.slug, lesson.id);
    router.push(next ? `/learn/${course.slug}/${next.id}` : `/learn/${course.slug}/complete`);
  };

  const lessonList = (
    <ol className="flex flex-col gap-0.5">
      {course.lessons.map((l, k) => {
        const current = l.id === lesson.id;
        return (
          <li key={l.id}>
            <Link
              href={`/learn/${course.slug}/${l.id}`}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-11 items-start gap-3 rounded-lg px-3 py-2.5 text-[15px] outline-none ${focusRing} ${current ? "bg-brand-soft font-medium text-brand" : "text-ink hover:bg-neutral-100"}`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${done(l.id) ? "bg-brand text-white" : "border border-neutral-300 text-neutral-600"}`}
              >
                {done(l.id) ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    strokeWidth={2.4}
                    className="size-4"
                  />
                ) : (
                  k + 1
                )}
              </span>
              <span>
                {l.title}
                <span className="sr-only">{done(l.id) ? ", done" : ", not done yet"}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-8 lg:px-8 lg:py-12">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/learn" />}>Learn</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/learn/${course.slug}`} />}>
              {course.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Lesson {i + 1}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <details className="mt-6 rounded-xl border border-border bg-white lg:hidden">
        <summary
          className={`flex min-h-12 cursor-pointer items-center px-4 text-base font-medium text-brand ${focusRing}`}
        >
          Lessons ({i + 1} of {n})
        </summary>
        <nav aria-label="Lessons in this course" className="border-t border-border p-2">
          {lessonList}
        </nav>
      </details>

      <div className="mt-6 grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="px-3 text-sm font-semibold text-ink">{course.title}</p>
            <p className="mb-3 px-3 text-sm text-neutral-600">
              {doneCount} of {n} lessons done
            </p>
            <nav aria-label="Lessons in this course">{lessonList}</nav>
          </div>
        </aside>

        <article aria-labelledby="lesson-h" className="min-w-0">
          <p className="text-base text-neutral-600">
            Lesson {i + 1} of {n}
          </p>
          <h1
            ref={h1}
            id="lesson-h"
            tabIndex={-1}
            className="mt-1 text-3xl leading-tight font-medium tracking-[-0.03em] text-balance text-ink outline-none sm:text-4xl"
          >
            {lesson.title}
          </h1>
          <p className="mt-2 text-base text-neutral-700">
            {LESSON_TYPE_LABEL[type]} · {lesson.minutes} minutes
          </p>

          <div
            role="group"
            aria-label="Text size"
            className="mt-5 flex flex-wrap items-center gap-2"
          >
            <span className="text-sm text-neutral-700">Text size:</span>
            {(Object.keys(TEXT_SIZES) as TextSize[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={size === k}
                onClick={() => setSize(k)}
                className={`min-h-11 rounded-lg border px-3 text-[15px] ${focusRing} ${size === k ? "border-brand bg-brand-soft font-medium text-brand" : "border-border bg-white text-ink hover:border-brand/40"}`}
              >
                {TEXT_SIZES[k]}
              </button>
            ))}
          </div>

          <div className={`mt-8 max-w-[70ch] leading-relaxed text-ink ${SIZE_CLASS[size]}`}>
            {type === "video" && lesson.video ? <VideoLesson video={lesson.video} /> : null}
            {type === "check" && lesson.check ? (
              <CheckLesson key={lesson.id} check={lesson.check} />
            ) : null}
            {(type === "reading" || type === "activity") && lesson.body ? (
              <Markdown source={lesson.body} />
            ) : null}
            {type === "activity" && lesson.worksheet && (
              <p className="mt-6 flex items-center gap-2.5 rounded-xl border border-border bg-white p-4 text-base">
                <HugeiconsIcon
                  icon={File02Icon}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="size-6 shrink-0 text-brand"
                />
                <a
                  href={lesson.worksheet.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  {lesson.worksheet.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
            )}
          </div>

          <div className="mt-12 flex max-w-[70ch] flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            {prev ? (
              <Link
                href={`/learn/${course.slug}/${prev.id}`}
                className={`inline-flex min-h-11 items-center gap-1 text-base ${link}`}
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="size-4"
                />
                Previous lesson
              </Link>
            ) : (
              <span />
            )}
            <Button
              onClick={finish}
              className={`h-12 bg-brand px-6 text-base text-white hover:bg-brand-hover ${focusRing}`}
            >
              {next ? "Mark as done and continue" : "Finish course"}
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}

function VideoLesson({ video }: { video: NonNullable<Lesson["video"]> }) {
  const [show, setShow] = useState(true);
  return (
    <div className="flex flex-col gap-6">
      <div
        role="img"
        aria-label={`Video still: ${video.posterAlt}`}
        className="flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl bg-linear-to-br from-brand-strong to-brand p-6 text-center text-white"
      >
        <HugeiconsIcon
          icon={PlayCircleIcon}
          strokeWidth={1.5}
          aria-hidden="true"
          className="size-14 opacity-90"
        />
        <p className="text-base font-medium">Video coming soon in this demo</p>
        <p className="text-sm text-white/80">The full transcript is below.</p>
      </div>
      <p className="text-[15px] text-neutral-700">
        Captions: {video.captionsAvailable ? "available" : "not available yet"}.
      </p>
      <div>
        <button
          type="button"
          aria-expanded={show}
          aria-controls="transcript"
          onClick={() => setShow((s) => !s)}
          className={`min-h-11 rounded-sm text-base font-medium text-brand underline underline-offset-4 ${focusRing}`}
        >
          {show ? "Hide transcript" : "Show transcript"}
        </button>
        <section
          id="transcript"
          aria-label="Transcript"
          hidden={!show}
          className="mt-4 border-l-4 border-neutral-200 pl-5"
        >
          <Markdown source={video.transcript} />
        </section>
      </div>
    </div>
  );
}

function CheckLesson({ check }: { check: NonNullable<Lesson["check"]> }) {
  const [choice, setChoice] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [error, setError] = useState("");
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!choice) return setError("Select an answer");
        setError("");
        setResult(choice === check.correctId);
      }}
      className="flex flex-col gap-5"
    >
      <fieldset
        aria-describedby={error ? "check-error" : undefined}
        className={error ? "border-l-4 border-red-700 pl-4" : ""}
      >
        <legend className="text-[1.2em] font-semibold text-ink">{check.question}</legend>
        {error && (
          <p id="check-error" className="mt-1 text-[15px] font-semibold text-red-700">
            <span className="sr-only">Error: </span>
            {error}
          </p>
        )}
        <RadioGroup
          value={choice}
          onValueChange={(v) => {
            setChoice(String(v));
            setResult(null);
          }}
          className="mt-3 gap-1"
        >
          {check.options.map((o) => (
            <div key={o.id} className="flex min-h-11 items-start gap-3 py-1.5">
              <RadioGroupItem
                id={`opt-${o.id}`}
                value={o.id}
                className={`mt-1 size-6 ${focusRing}`}
              />
              <Label htmlFor={`opt-${o.id}`} className="text-[1em] leading-snug font-normal">
                {o.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>
      <Button type="submit" variant="outline" className={`h-12 w-fit px-6 text-base ${focusRing}`}>
        Check answer
      </Button>
      <div aria-live="polite">
        {result !== null && (
          <div
            className={`rounded-xl border-l-4 p-4 ${result ? "border-emerald-700 bg-emerald-50" : "border-amber-600 bg-amber-50"}`}
          >
            <p className="font-semibold">{result ? "Correct." : "Not quite."}</p>
            <p className="mt-1">{check.explanation}</p>
            {!result && (
              <p className="mt-2 text-[15px] text-neutral-700">
                Choose another answer and check again.
              </p>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
