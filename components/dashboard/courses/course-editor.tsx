"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Delete02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useContentStore, type CourseInput } from "@/store/content";
import type {
  CenterSlug,
  ContentStatus,
  Course,
  CourseFormat,
  CourseLevel,
  Role,
} from "@/lib/types";
import { formatDay } from "@/lib/format";
import { validateCourse } from "@/lib/courses/rules";
import {
  completionRate,
  COURSE_FORMAT_LABEL,
  isVideo,
  lengthText,
  LEVEL_LABEL,
  MAX_FEATURED,
} from "@/lib/courses/selectors";
import { CENTER_LABEL, ROLE_LABEL } from "@/lib/library/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { announce } from "@/components/dashboard/shared/announcer";
import {
  ErrorSummary,
  FieldError,
  errorGroupClass,
  type FormError,
} from "@/components/dashboard/shared/form-errors";
import {
  focusRing,
  RadioField,
  SelectField,
  TextField,
} from "@/components/dashboard/shared/fields";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { useWorkspace, type Workspace } from "@/components/dashboard/shared/use-workspace";

const A11Y = {
  captions: { label: "Captions on every video", hint: "Needed to publish a course with video." },
  transcript: {
    label: "A transcript for every video",
    hint: "Needed to publish a course with video.",
  },
  plainLanguage: { label: "Plain-language summary", hint: "A short version anyone can read." },
  audioDescription: {
    label: "Audio description",
    hint: "Describes what's on screen. Recommended.",
  },
} as const;

let tmp = 0;
const lessonId = () => `new-${Date.now().toString(36)}-${tmp++}`;

export function CourseEditor({ id }: { id: string | null }) {
  const w = useWorkspace();
  if (!w) return <PageHeader title={id ? "Edit course" : "New course"} description="Loading…" />;
  const course = id ? w.content.courses.find((c) => c.id === id) : undefined;
  if (id && !course)
    return (
      <PageHeader
        breadcrumb={[
          { label: "Content" },
          { label: "Courses", href: "/dashboard/courses" },
          { label: "Not found" },
        ]}
        title="Course not found"
        description="It may have been removed."
      />
    );
  return <Editor key={course?.id ?? "new"} w={w} course={course} />;
}

function Editor({ w, course }: { w: Workspace; course?: Course }) {
  const router = useRouter();
  const [f, setF] = useState<CourseInput>(() =>
    course
      ? {
          title: course.title,
          summary: course.summary,
          center: course.center,
          format: course.format,
          audiences: course.audiences,
          level: course.level,
          lessons: course.lessons,
          certificate: course.certificate,
          accessibility: course.accessibility,
        }
      : {
          title: "",
          summary: "",
          center: "autism",
          format: "course",
          audiences: [],
          level: "intro",
          lessons: [{ id: lessonId(), title: "", minutes: 10, type: "reading", body: "" }],
          certificate: false,
          accessibility: {
            captions: false,
            transcript: false,
            plainLanguage: false,
            audioDescription: false,
          },
        },
  );
  const [errors, setErrors] = useState<FormError[]>([]);
  const [replacing, setReplacing] = useState(false);
  const [replaceId, setReplaceId] = useState("");
  const set = <K extends keyof CourseInput>(k: K, v: CourseInput[K]) =>
    setF((p) => ({ ...p, [k]: v }));
  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const status: ContentStatus = course?.status ?? "draft";
  const video = isVideo(f);
  const minutes = f.lessons.reduce((n, l) => n + (l.minutes || 0), 0);
  const store = () => useContentStore.getState();

  const checks = [
    { ok: !!f.title.trim() && !!f.summary.trim(), text: "Title and summary" },
    { ok: f.audiences.length > 0, text: "At least one audience" },
    {
      ok: f.lessons.length > 0 && f.lessons.every((l) => l.title.trim() && l.minutes > 0),
      text: "Every lesson has a title and length",
    },
    ...(video
      ? [
          { ok: f.accessibility.captions, text: "Captions" },
          { ok: f.accessibility.transcript, text: "Transcript" },
        ]
      : []),
  ];
  const ready = checks.every((c) => c.ok);

  const fieldFor: Record<string, string> = {
    title: "c-title",
    summary: "c-summary",
    audience: "c-audience",
    lessons: "c-lessons",
  };
  const save = (next: ContentStatus) => {
    const errs: FormError[] = validateCourse(f).map((e) => ({
      fieldId: fieldFor[e.field] ?? "c-title",
      message: e.message,
    }));
    if (next === "published" && video && (!f.accessibility.captions || !f.accessibility.transcript))
      errs.push({
        fieldId: "c-a11y",
        message: `This course has video, so it needs ${[!f.accessibility.captions && "captions", !f.accessibility.transcript && "a transcript"].filter(Boolean).join(" and ")} before it can be published`,
      });
    setErrors(errs);
    if (errs.length) return;
    const res = store().saveCourse(course?.id ?? null, f, next);
    const word =
      next === "published"
        ? status === "published"
          ? "Changes published."
          : "Course published. It's live on the website."
        : "Draft saved.";
    if (notifyResult(res, { success: word, undone: "Undone" }) && !course && res.ok && res.id)
      router.replace(`/dashboard/courses/${res.id}`);
  };

  const moveLesson = (i: number, d: -1 | 1) => {
    const ls = [...f.lessons];
    const j = i + d;
    if (j < 0 || j >= ls.length) return;
    [ls[i], ls[j]] = [ls[j], ls[i]];
    set("lessons", ls);
    announce(`${ls[j].title || `Lesson ${i + 1}`} moved to position ${j + 1} of ${ls.length}.`);
    setTimeout(
      () =>
        document.getElementById(`move-${d < 0 ? "up" : "down"}-${ls[j].id}`)?.focus() ??
        document.getElementById(`lesson-${ls[j].id}`)?.focus(),
      0,
    );
  };
  const setLesson = (i: number, patch: Partial<Course["lessons"][number]>) =>
    set(
      "lessons",
      f.lessons.map((l, k) => (k === i ? { ...l, ...patch } : l)),
    );

  const toggleFeatured = (on: boolean) => {
    if (!course) return;
    if (!on)
      return notifyResult(store().setFeatured(course.id, false), {
        success: "Removed from the home page.",
        undone: "Featured again",
      });
    const others = w.content.courses.filter((c) => c.featured && c.id !== course.id);
    if (others.length >= MAX_FEATURED) {
      setReplaceId("");
      setReplacing(true);
      return;
    }
    notifyResult(store().setFeatured(course.id, true), {
      success: "Featured on the home page.",
      undone: "Unfeatured",
    });
  };
  const featuredOthers = w.content.courses.filter((c) => c.featured && c.id !== course?.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[
          { label: "Content" },
          { label: "Courses", href: "/dashboard/courses" },
          { label: course ? course.title : "New course" },
        ]}
        title={course ? course.title : "New course"}
        description={
          course
            ? `${status === "published" ? "Published" : status === "draft" ? "Draft" : "Archived"} · last edited ${formatDay(course.updatedAt)}`
            : "Start as a draft. Publish when the checklist is complete."
        }
        moreActions={
          course
            ? status === "archived"
              ? [
                  {
                    label: "Move back to drafts",
                    onSelect: () =>
                      notifyResult(store().setCourseStatus(course.id, "draft"), {
                        success: "Moved to drafts.",
                        undone: "Archived again",
                      }),
                  },
                ]
              : [
                  ...(status === "published"
                    ? [
                        {
                          label: "Unpublish (move to drafts)",
                          onSelect: () =>
                            notifyResult(store().setCourseStatus(course.id, "draft"), {
                              success: "Unpublished. It's no longer on the website.",
                              undone: "Published again",
                            }),
                        },
                      ]
                    : []),
                  {
                    label: "Archive",
                    onSelect: () =>
                      notifyResult(store().setCourseStatus(course.id, "archived"), {
                        success: "Course archived.",
                        undone: "Restored",
                      }),
                  },
                ]
            : undefined
        }
      />

      <ErrorSummary errors={errors} />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save(status === "published" ? "published" : "draft");
          }}
          className="flex flex-col gap-8"
        >
          <fieldset className="flex flex-col gap-5">
            <legend className="mb-4 text-lg font-medium text-ink">About the course</legend>
            <TextField
              id="c-title"
              label="Title"
              value={f.title}
              onChange={(v) => set("title", v)}
              error={err("c-title")}
              hint="Say what people will be able to do, like “Getting started with AAC”."
            />
            <TextField
              id="c-summary"
              label="Summary"
              multiline
              rows={3}
              value={f.summary}
              onChange={(v) => set("summary", v)}
              error={err("c-summary")}
              hint="One or two sentences. Shown on the course card."
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <SelectField
                id="c-center"
                label="Topic"
                value={f.center}
                options={CENTER_LABEL}
                onChange={(v) => v && set("center", v as CenterSlug)}
              />
              <SelectField
                id="c-format"
                label="Format"
                value={f.format}
                options={COURSE_FORMAT_LABEL}
                onChange={(v) => v && set("format", v as CourseFormat)}
              />
              <SelectField
                id="c-level"
                label="Level"
                value={f.level}
                options={LEVEL_LABEL}
                onChange={(v) => v && set("level", v as CourseLevel)}
              />
            </div>
          </fieldset>

          <fieldset
            id="c-audience"
            tabIndex={-1}
            className={`outline-none ${errorGroupClass(!!err("c-audience"))}`}
            aria-describedby={err("c-audience") ? "c-audience-error" : undefined}
          >
            <legend className="text-lg font-medium text-ink">Who it&apos;s for</legend>
            <FieldError id="c-audience-error" message={err("c-audience")} />
            <div className="mt-2 grid gap-x-6 sm:grid-cols-3">
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <div key={r} className="flex min-h-11 items-center gap-2.5">
                  <Checkbox
                    id={`aud-${r}`}
                    checked={f.audiences.includes(r)}
                    onCheckedChange={(v) =>
                      set("audiences", v ? [...f.audiences, r] : f.audiences.filter((x) => x !== r))
                    }
                    className={`size-5 ${focusRing}`}
                  />
                  <Label htmlFor={`aud-${r}`} className="text-[15px] font-normal">
                    {ROLE_LABEL[r]}s
                  </Label>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset
            id="c-lessons"
            tabIndex={-1}
            className={`outline-none ${errorGroupClass(!!err("c-lessons"))}`}
          >
            <legend className="text-lg font-medium text-ink">Lessons</legend>
            <p className="text-sm text-neutral-600">
              {f.lessons.length} {f.lessons.length === 1 ? "lesson" : "lessons"},{" "}
              {lengthText(minutes)} in total. Use Move up and Move down to change the order.
            </p>
            <FieldError id="c-lessons-error" message={err("c-lessons")} />
            <ol className="mt-3 flex flex-col gap-2">
              {f.lessons.map((l, i) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-white p-3"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[15px] font-semibold text-brand tabular-nums"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-48 flex-1">
                    <Label htmlFor={`lesson-${l.id}`} className="text-sm">
                      Lesson {i + 1} title
                    </Label>
                    <Input
                      id={`lesson-${l.id}`}
                      value={l.title}
                      onChange={(e) => setLesson(i, { title: e.target.value })}
                      className={`mt-1 h-11 text-base ${focusRing}`}
                    />
                  </div>
                  <div className="w-24">
                    <Label htmlFor={`min-${l.id}`} className="text-sm">
                      Minutes
                    </Label>
                    <Input
                      id={`min-${l.id}`}
                      inputMode="numeric"
                      value={l.minutes || ""}
                      onChange={(e) =>
                        setLesson(i, { minutes: Number(e.target.value.replace(/\D/g, "")) || 0 })
                      }
                      className={`mt-1 h-11 text-base tabular-nums ${focusRing}`}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      id={`move-up-${l.id}`}
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={i === 0}
                      onClick={() => moveLesson(i, -1)}
                      aria-label={`Move lesson ${i + 1} up`}
                      className={`size-11 ${focusRing}`}
                    >
                      <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} aria-hidden="true" />
                    </Button>
                    <Button
                      id={`move-down-${l.id}`}
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={i === f.lessons.length - 1}
                      onClick={() => moveLesson(i, 1)}
                      aria-label={`Move lesson ${i + 1} down`}
                      className={`size-11 ${focusRing}`}
                    >
                      <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={f.lessons.length === 1}
                      onClick={() => {
                        set(
                          "lessons",
                          f.lessons.filter((_, k) => k !== i),
                        );
                        announce(`Lesson ${i + 1} removed.`);
                      }}
                      aria-label={`Remove lesson ${i + 1}`}
                      className={`size-11 text-red-700 ${focusRing}`}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const nl = {
                  id: lessonId(),
                  title: "",
                  minutes: 10,
                  type: "reading" as const,
                  body: "",
                };
                set("lessons", [...f.lessons, nl]);
                setTimeout(() => document.getElementById(`lesson-${nl.id}`)?.focus(), 0);
              }}
              className={`mt-3 h-11 w-fit gap-1.5 px-4 ${focusRing}`}
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />
              Add a lesson
            </Button>
          </fieldset>

          <fieldset
            id="c-a11y"
            tabIndex={-1}
            className={`outline-none ${errorGroupClass(!!err("c-a11y"))}`}
          >
            <legend className="text-lg font-medium text-ink">Accessibility</legend>
            <p className="text-sm text-neutral-600">
              {video
                ? "This format has video."
                : "Toolkits have no video, so captions and transcripts aren't needed."}
            </p>
            <FieldError id="c-a11y-error" message={err("c-a11y")} />
            <ul className="mt-2 flex flex-col">
              {(Object.keys(A11Y) as Array<keyof typeof A11Y>)
                .filter((k) => video || (k !== "captions" && k !== "transcript"))
                .map((k) => (
                  <li key={k} className="flex items-start gap-2.5 py-2">
                    <Checkbox
                      id={`a11y-${k}`}
                      checked={f.accessibility[k]}
                      onCheckedChange={(v) =>
                        set("accessibility", { ...f.accessibility, [k]: v === true })
                      }
                      aria-describedby={`a11y-${k}-hint`}
                      className={`mt-0.5 size-5 ${focusRing}`}
                    />
                    <div>
                      <Label htmlFor={`a11y-${k}`} className="text-[15px] font-normal">
                        {A11Y[k].label}
                      </Label>
                      <p id={`a11y-${k}-hint`} className="text-sm text-neutral-600">
                        {A11Y[k].hint}
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
            <div className="mt-2 flex min-h-11 items-center gap-2.5">
              <Checkbox
                id="c-cert"
                checked={f.certificate}
                onCheckedChange={(v) => set("certificate", v === true)}
                className={`size-5 ${focusRing}`}
              />
              <Label htmlFor="c-cert" className="text-[15px] font-normal">
                Give a certificate when finished
              </Label>
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2 border-t border-border pt-6">
            {status === "published" ? (
              <Button
                type="button"
                onClick={() => save("published")}
                className={`h-11 bg-brand px-5 text-white hover:bg-brand-hover ${focusRing}`}
              >
                Save and update the website
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => save("published")}
                  className={`h-11 bg-brand px-5 text-white hover:bg-brand-hover ${focusRing}`}
                >
                  Publish
                </Button>
                <Button type="submit" variant="outline" className={`h-11 px-5 ${focusRing}`}>
                  Save draft
                </Button>
              </>
            )}
          </div>
        </form>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6" aria-label="Course status">
          <section
            aria-labelledby="ready-title"
            className="rounded-xl border border-border bg-white p-5"
          >
            <h2 id="ready-title" className="text-[15px] font-semibold text-ink">
              {ready ? "Ready to publish" : "Before you publish"}
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-[15px]">
              {checks.map((c) => (
                <li key={c.text} className="flex items-start gap-2">
                  <HugeiconsIcon
                    icon={c.ok ? Tick02Icon : Cancel01Icon}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className={`mt-0.5 size-4 shrink-0 ${c.ok ? "text-emerald-700" : "text-neutral-400"}`}
                  />
                  <span className={c.ok ? "text-ink" : "text-neutral-700"}>
                    {c.text}
                    <span className="sr-only">{c.ok ? ": done" : ": not done"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {course && status === "published" && (
            <section
              aria-labelledby="feat-title"
              className="rounded-xl border border-border bg-white p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <Label
                  id="feat-title"
                  htmlFor="feat"
                  className="text-[15px] font-semibold text-ink"
                >
                  Feature on the home page
                </Label>
                <Switch
                  id="feat"
                  checked={course.featured}
                  onCheckedChange={toggleFeatured}
                  className={focusRing}
                />
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {course.featured
                  ? "Shown on the home page."
                  : `Up to ${MAX_FEATURED} courses. ${featuredOthers.length} in use.`}
              </p>
            </section>
          )}

          {course && course.enrollments > 0 && (
            <section
              aria-labelledby="stats-title"
              className="rounded-xl border border-border bg-white p-5"
            >
              <h2 id="stats-title" className="text-[15px] font-semibold text-ink">
                How it&apos;s doing
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-sm text-neutral-600">Enrolled</dt>
                  <dd className="text-2xl font-semibold text-ink tabular-nums">
                    {course.enrollments.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-600">Finished</dt>
                  <dd className="text-2xl font-semibold text-ink tabular-nums">
                    {completionRate(course)}%
                  </dd>
                </div>
              </dl>
              {course.completionsByAudience && (
                <ul className="mt-4 flex flex-col gap-2.5" aria-label="Completions by audience">
                  {Object.entries(course.completionsByAudience).map(([a, n]) => (
                    <li key={a}>
                      <div className="flex justify-between text-sm">
                        <span>{ROLE_LABEL[a as Role]}s</span>
                        <span className="tabular-nums">{n}</span>
                      </div>
                      <div
                        aria-hidden="true"
                        className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100"
                      >
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{
                            width: `${course.completions ? Math.round(((n ?? 0) / course.completions) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {course.rating && (
                <p className="mt-4 text-sm text-neutral-700">
                  Rated {course.rating.toFixed(1)} out of 5 by learners.
                </p>
              )}
              {course.feedback && course.feedback.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm font-medium text-ink">
                    {Math.round(
                      (course.feedback.filter((x) => x.useful).length / course.feedback.length) *
                        100,
                    )}
                    % said it was useful ({course.feedback.length}{" "}
                    {course.feedback.length === 1 ? "answer" : "answers"} from the website)
                  </p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {[...course.feedback]
                      .reverse()
                      .filter((x) => x.comment)
                      .slice(0, 3)
                      .map((x) => (
                        <li key={x.at} className="rounded-lg bg-neutral-50 p-2.5 text-sm">
                          <span className="text-ink">“{x.comment}”</span>
                          <span className="block text-neutral-600">
                            {x.useful ? "Found it useful" : "Didn't find it useful"}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {course && status !== "published" && (
            <p className="px-1 text-sm text-neutral-600">
              {status === "archived" ? (
                <StatusText tone="neutral">Archived. Not on the website.</StatusText>
              ) : (
                "Drafts aren't on the website."
              )}
            </p>
          )}
        </aside>
      </div>

      <Dialog open={replacing} onOpenChange={setReplacing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>All {MAX_FEATURED} featured places are full</DialogTitle>
            <DialogDescription>Choose a course to take off the home page.</DialogDescription>
          </DialogHeader>
          <RadioField
            id="replace"
            legend="Replace"
            columns={1}
            value={replaceId}
            options={Object.fromEntries(featuredOthers.map((c) => [c.id, c.title]))}
            onChange={setReplaceId}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReplacing(false)}
              className={`h-11 px-4 ${focusRing}`}
            >
              Cancel
            </Button>
            <Button
              disabled={!replaceId}
              onClick={() => {
                if (!course) return;
                const old = featuredOthers.find((c) => c.id === replaceId)?.title;
                if (
                  notifyResult(store().setFeatured(course.id, true, replaceId), {
                    success: `Featured. ${old} is no longer on the home page.`,
                    undone: "Undone",
                  })
                )
                  setReplacing(false);
              }}
              className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
            >
              Feature this course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
