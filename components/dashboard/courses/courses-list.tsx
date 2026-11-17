"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, StarIcon } from "@hugeicons/core-free-icons";

import type { CenterSlug, Course } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { formatMonthDay } from "@/lib/format";
import {
  accessibilityGaps,
  completionRate,
  COURSE_FORMAT_LABEL,
  courseMinutes,
  lengthText,
  LEVEL_LABEL,
  MAX_FEATURED,
} from "@/lib/courses/selectors";
import { CENTER_LABEL, parseOne, ROLE_LABEL } from "@/lib/library/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/shared/data-table";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { focusRing } from "@/components/dashboard/shared/fields";
import { ListPagination, paginate } from "@/components/dashboard/shared/list-pagination";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { Toolbar } from "@/components/dashboard/shared/toolbar";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { useWorkspace, type Workspace } from "@/components/dashboard/shared/use-workspace";

const TABS = ["published", "draft", "archived"] as const;
const TAB_LABEL = { published: "Published", draft: "Drafts", archived: "Archived" } as const;
const EMPTY = {
  published: "Nothing published yet.",
  draft: "No drafts. Start a new course when you're ready.",
  archived: "Nothing archived.",
} as const;

export function AccessibilityText({ c }: { c: Course }) {
  const gaps = accessibilityGaps(c);
  return gaps.length ? (
    <StatusText tone="warning">Missing {gaps.join(", ")}</StatusText>
  ) : (
    <StatusText tone="success">Complete</StatusText>
  );
}

export function CoursesList() {
  const w = useWorkspace();
  return w ? <Content w={w} /> : <PageHeader title="Courses" description="Loading…" />;
}

function Content({ w }: { w: Workspace }) {
  const router = useRouter();
  const { searchParams } = useUrlState();
  const tab = parseOne(searchParams.get("status"), TABS, "published");
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const center = searchParams.get("center");
  const format = searchParams.get("format");
  const audience = searchParams.get("audience");
  const a11y = searchParams.get("a11y");
  const courses = w.content.courses;

  const rows = useMemo(
    () =>
      courses
        .filter((c) => c.status === tab)
        .filter((c) => !center || c.center === center)
        .filter((c) => !format || c.format === format)
        .filter((c) => !audience || c.audiences.includes(audience as Course["audiences"][number]))
        .filter(
          (c) =>
            !a11y ||
            (a11y === "gaps" ? accessibilityGaps(c).length > 0 : accessibilityGaps(c).length === 0),
        )
        .filter(
          (c) => !q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q),
        )
        .sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) || b.updatedAt.localeCompare(a.updatedAt),
        ),
    [courses, tab, center, format, audience, a11y, q],
  );
  const { page, pageCount, pageRows } = paginate(rows, searchParams.get("page"), 15);
  const featured = courses.filter((c) => c.featured);
  const gaps = courses.filter(
    (c) => c.status === "published" && accessibilityGaps(c).length,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Content" }, { label: "Courses" }]}
        title="Courses"
        description={
          gaps
            ? `${gaps} published ${gaps === 1 ? "course is" : "courses are"} missing accessibility features.`
            : "Every published course has captions, transcripts and a plain-language summary."
        }
        primaryAction={{
          label: "New course",
          href: "/dashboard/courses/new",
          icon: <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />,
        }}
        moreActions={[
          {
            label: "Export CSV",
            onSelect: () =>
              downloadCsv(`openfield-courses-${tab}`, [
                [
                  "Title",
                  "Topic",
                  "Format",
                  "Audience",
                  "Level",
                  "Lessons",
                  "Minutes",
                  "Enrolled",
                  "Completed",
                  "Completion rate",
                  "Accessibility",
                  "Featured",
                ],
                ...rows.map((c) => [
                  c.title,
                  CENTER_LABEL[c.center],
                  COURSE_FORMAT_LABEL[c.format],
                  c.audiences.map((a) => ROLE_LABEL[a]).join("; "),
                  LEVEL_LABEL[c.level],
                  c.lessons.length,
                  courseMinutes(c),
                  c.enrollments,
                  c.completions,
                  `${completionRate(c)}%`,
                  accessibilityGaps(c).length
                    ? `Missing ${accessibilityGaps(c).join(", ")}`
                    : "Complete",
                  c.featured ? "Yes" : "No",
                ]),
              ]),
          },
        ]}
        tabs={{
          label: "Course status",
          current: tab,
          defaultValue: "published",
          items: TABS.map((t) => ({
            value: t,
            label: TAB_LABEL[t],
            count: courses.filter((c) => c.status === t).length,
          })),
        }}
      />

      {tab === "published" && (
        <section
          aria-labelledby="featured-title"
          className="rounded-xl border border-border bg-white p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="featured-title" className="text-[15px] font-semibold text-ink">
              On the home page
            </h2>
            <p className="text-sm text-neutral-600">
              {featured.length} of {MAX_FEATURED} featured places used
            </p>
          </div>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: MAX_FEATURED }, (_, i) => featured[i]).map((c, i) => (
              <li
                key={c?.id ?? `empty-${i}`}
                className={`flex min-h-24 flex-col justify-between gap-2 rounded-lg p-4 ${c ? "bg-brand-soft" : "border border-dashed border-border"}`}
              >
                <span className="text-sm text-neutral-600">Place {i + 1}</span>
                {c ? (
                  <Link
                    href={`/dashboard/courses/${c.id}`}
                    className={`text-[15px] font-medium text-ink underline decoration-brand/30 underline-offset-4 hover:decoration-brand ${focusRing} rounded-sm`}
                  >
                    <HugeiconsIcon
                      icon={StarIcon}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="mr-1.5 inline size-4 align-[-2px] text-brand"
                    />
                    {c.title}
                  </Link>
                ) : (
                  <span className="text-[15px] text-neutral-600">
                    Empty. Open a published course to feature it.
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <Toolbar
        searchLabel="Search courses"
        searchPlaceholder="Title or summary"
        filters={[
          {
            key: "center",
            label: "Topic",
            options: (Object.keys(CENTER_LABEL) as CenterSlug[]).map((k) => ({
              value: k,
              label: CENTER_LABEL[k],
            })),
          },
          {
            key: "format",
            label: "Format",
            options: Object.entries(COURSE_FORMAT_LABEL).map(([value, label]) => ({
              value,
              label,
            })),
          },
          {
            key: "audience",
            label: "Audience",
            options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })),
          },
          {
            key: "a11y",
            label: "Accessibility",
            options: [
              { value: "gaps", label: "Something missing" },
              { value: "complete", label: "Complete" },
            ],
          },
        ]}
      />

      <DataTable
        caption={`${TAB_LABEL[tab]} courses`}
        rows={pageRows}
        rowKey={(c) => c.id}
        openText={(c) => c.title}
        openLabel={(c) => `Edit ${c.title}`}
        onOpen={(c) => router.push(`/dashboard/courses/${c.id}`)}
        empty={
          <EmptyState>
            {q || center || format || audience || a11y
              ? "No courses match your search."
              : EMPTY[tab]}
          </EmptyState>
        }
        columns={[
          {
            header: "Course",
            className: "w-[34%]",
            cell: (c) => (
              <span className="text-sm text-neutral-600">
                {COURSE_FORMAT_LABEL[c.format]} · {CENTER_LABEL[c.center]}
                {c.featured && (
                  <>
                    {" · "}
                    <span className="inline-flex items-center gap-1 font-medium text-brand">
                      <HugeiconsIcon
                        icon={StarIcon}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="size-3.5"
                      />
                      Featured
                    </span>
                  </>
                )}
              </span>
            ),
          },
          { header: "For", cell: (c) => c.audiences.map((a) => `${ROLE_LABEL[a]}s`).join(", ") },
          {
            header: "Length",
            cell: (c) => (
              <span className="whitespace-nowrap">
                {c.lessons.length} {c.lessons.length === 1 ? "lesson" : "lessons"} ·{" "}
                {lengthText(courseMinutes(c))}
              </span>
            ),
          },
          ...(tab === "draft"
            ? [
                {
                  header: "Last edited",
                  cell: (c: Course) => (
                    <time dateTime={c.updatedAt}>{formatMonthDay(c.updatedAt)}</time>
                  ),
                },
              ]
            : [
                {
                  header: "Completed",
                  cell: (c: Course) =>
                    c.enrollments ? (
                      <span className="tabular-nums">
                        {completionRate(c)}% of {c.enrollments.toLocaleString()}
                      </span>
                    ) : (
                      <span aria-label="No one yet">—</span>
                    ),
                },
              ]),
          { header: "Accessibility", cell: (c) => <AccessibilityText c={c} /> },
        ]}
      />
      <ListPagination
        page={page}
        pageCount={pageCount}
        total={rows.length}
        size={15}
        label="Course pages"
      />
    </div>
  );
}
