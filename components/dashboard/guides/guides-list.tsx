"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

import type { FamilyGuide } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import {
  aboveLevel,
  helpfulPercent,
  needsReview,
  reviewedText,
  STAGE_LABEL,
} from "@/lib/guides/selectors";
import { parseOne } from "@/lib/library/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/shared/data-table";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListPagination, paginate } from "@/components/dashboard/shared/list-pagination";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { Toolbar } from "@/components/dashboard/shared/toolbar";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { useWorkspace, type Workspace } from "@/components/dashboard/shared/use-workspace";

const TABS = ["published", "needs-review", "draft", "archived"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  published: "Published",
  "needs-review": "Needs review",
  draft: "Drafts",
  archived: "Archived",
};
const EMPTY: Record<Tab, string> = {
  published: "Nothing published yet.",
  "needs-review": "Every guide is up to date and easy to read.",
  draft: "No drafts.",
  archived: "Nothing archived.",
};

export function ReadingLevel({ grade, max }: { grade: number; max: number }) {
  return grade > max ? (
    <StatusText tone="warning">Grade {grade}, too hard</StatusText>
  ) : (
    <span>Grade {grade}</span>
  );
}

export function GuidesList() {
  const w = useWorkspace();
  return w ? <Content w={w} /> : <PageHeader title="Family guides" description="Loading…" />;
}

function Content({ w }: { w: Workspace }) {
  const [now] = useState(() => new Date());
  const router = useRouter();
  const { searchParams } = useUrlState();
  const tab = parseOne(searchParams.get("status"), TABS, "published");
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const stage = searchParams.get("stage");
  const owner = searchParams.get("owner");
  const rules = w.settings.contentRules;
  const guides = w.content.guides;
  const staffName = (id: string) => w.settings.staff.find((s) => s.id === id)?.name ?? "No one";
  const inTab = (g: FamilyGuide, t: Tab) =>
    t === "needs-review" ? needsReview(g, rules, now) : g.status === t;

  const rows = guides
    .filter((g) => inTab(g, tab))
    .filter((g) => !stage || g.ageStage === stage)
    .filter((g) => !owner || g.owner === owner)
    .filter((g) => !q || g.title.toLowerCase().includes(q) || g.summary.toLowerCase().includes(q))
    .sort((a, b) =>
      tab === "needs-review"
        ? a.lastReviewedAt.localeCompare(b.lastReviewedAt)
        : a.title.localeCompare(b.title),
    );
  const { page, pageCount, pageRows } = paginate(rows, searchParams.get("page"), 15);
  const review = guides.filter((g) => needsReview(g, rules, now)).length;
  const owners = w.settings.staff.filter((s) => guides.some((g) => g.owner === s.id));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Content" }, { label: "Family guides" }]}
        title="Family guides"
        description={
          review
            ? `${review} ${review === 1 ? "guide needs" : "guides need"} a look: reviewed over ${rules.guideReviewMonths} months ago, or harder to read than grade ${rules.maxReadingLevel}.`
            : `Every guide was reviewed in the last ${rules.guideReviewMonths} months and reads at grade ${rules.maxReadingLevel} or below.`
        }
        primaryAction={{
          label: "New guide",
          href: "/dashboard/family-guides/new",
          icon: <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />,
        }}
        moreActions={[
          {
            label: "Export CSV",
            onSelect: () =>
              downloadCsv(`openfield-guides-${tab}`, [
                [
                  "Title",
                  "Stage",
                  "Status",
                  "Reading grade",
                  "Last reviewed",
                  "Owner",
                  "Views",
                  "Found it helpful",
                ],
                ...rows.map((g) => [
                  g.title,
                  STAGE_LABEL[g.ageStage],
                  g.status,
                  g.readingLevel,
                  g.lastReviewedAt.slice(0, 10),
                  staffName(g.owner),
                  g.views,
                  helpfulPercent(g) === null ? "" : `${helpfulPercent(g)}%`,
                ]),
              ]),
          },
        ]}
        tabs={{
          label: "Guide status",
          current: tab,
          defaultValue: "published",
          items: TABS.map((t) => ({
            value: t,
            label: TAB_LABEL[t],
            count: guides.filter((g) => inTab(g, t)).length,
          })),
        }}
      />

      <Toolbar
        searchLabel="Search guides"
        searchPlaceholder="Title or summary"
        filters={[
          {
            key: "stage",
            label: "Life stage",
            options: Object.entries(STAGE_LABEL).map(([value, label]) => ({ value, label })),
          },
          {
            key: "owner",
            label: "Owner",
            options: owners.map((s) => ({ value: s.id, label: s.name })),
          },
        ]}
      />

      <DataTable
        caption={`${TAB_LABEL[tab]} family guides`}
        rows={pageRows}
        rowKey={(g) => g.id}
        openText={(g) => g.title}
        openLabel={(g) => `Edit ${g.title}`}
        onOpen={(g) => router.push(`/dashboard/family-guides/${g.id}`)}
        empty={
          <EmptyState>
            {q || stage || owner ? "No guides match your search." : EMPTY[tab]}
          </EmptyState>
        }
        columns={[
          {
            header: "Guide",
            cell: (g) => (
              <span className="text-sm text-neutral-600">
                {STAGE_LABEL[g.ageStage]} · {g.readMinutes} min read
              </span>
            ),
          },
          {
            header: "Reading level",
            cell: (g) => <ReadingLevel grade={g.readingLevel} max={rules.maxReadingLevel} />,
          },
          {
            header: "Last reviewed",
            cell: (g) => {
              const r = reviewedText(g, rules, now);
              return r.overdue ? (
                <StatusText tone="warning">{r.text.replace(" — overdue", ", overdue")}</StatusText>
              ) : (
                <span>{r.text}</span>
              );
            },
          },
          { header: "Owner", cell: (g) => staffName(g.owner) },
          {
            header: "Helpful",
            cell: (g) => {
              const p = helpfulPercent(g);
              return p === null ? (
                <span aria-label="No feedback yet">—</span>
              ) : (
                <span className="tabular-nums">
                  {p}% of {(g.helpfulYes + g.helpfulNo).toLocaleString()}
                </span>
              );
            },
          },
        ]}
      />
      <ListPagination
        page={page}
        pageCount={pageCount}
        total={rows.length}
        size={15}
        label="Guide pages"
      />
      {tab === "needs-review" && rows.some((g) => aboveLevel(g, rules)) && (
        <p className="text-sm text-neutral-600">
          Guides above grade {rules.maxReadingLevel} show here even if recently reviewed. Open one
          to see which sentences to shorten.
        </p>
      )}
    </div>
  );
}
