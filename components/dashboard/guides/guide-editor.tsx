"use client";

import { Fragment, useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useContentStore, type GuideInput } from "@/store/content";
import type { AgeStage, ContentStatus, FamilyGuide } from "@/lib/types";
import { formatDay } from "@/lib/format";
import { analyze, JARGON, plainText } from "@/lib/readability";
import { validateGuide } from "@/lib/guides/rules";
import { helpfulPercent, reviewedText, STAGE_LABEL } from "@/lib/guides/selectors";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  ErrorSummary,
  FieldError,
  errorGroupClass,
  type FormError,
} from "@/components/dashboard/shared/form-errors";
import { focusRing, SelectField, TextField } from "@/components/dashboard/shared/fields";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { useWorkspace, type Workspace } from "@/components/dashboard/shared/use-workspace";

export function GuideEditor({ id }: { id: string | null }) {
  const w = useWorkspace();
  if (!w) return <PageHeader title={id ? "Edit guide" : "New guide"} description="Loading…" />;
  const guide = id ? w.content.guides.find((g) => g.id === id) : undefined;
  if (id && !guide)
    return (
      <PageHeader
        breadcrumb={[
          { label: "Content" },
          { label: "Family guides", href: "/dashboard/family-guides" },
          { label: "Not found" },
        ]}
        title="Guide not found"
        description="It may have been removed."
      />
    );
  return <Editor key={guide?.id ?? "new"} w={w} guide={guide} />;
}

/** Body paragraphs with long sentences marked and jargon underlined. */
function Checked({ body, long, jargon }: { body: string; long: Set<string>; jargon: string[] }) {
  const terms = jargon.length
    ? new RegExp(
        `\\b(${jargon.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
        "gi",
      )
    : null;
  const withJargon = (s: string) =>
    terms
      ? s.split(terms).map((part, i) =>
          i % 2 ? (
            <abbr
              key={i}
              title={JARGON[part.toLowerCase()]}
              className="underline decoration-amber-600 decoration-wavy decoration-1 underline-offset-4"
            >
              {part}
            </abbr>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          ),
        )
      : s;
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-ink">
      {body.split(/\n{2,}/).map((block, bi) => {
        const heading = /^#{1,6}\s+/.test(block);
        const text = plainText(block).trim();
        if (!text) return null;
        if (heading)
          return (
            <p key={bi} className="font-semibold">
              {text}
            </p>
          );
        const parts = text.split(/(?<=[.!?])\s+/);
        return (
          <p key={bi}>
            {parts.map((s, i) => (
              <Fragment key={i}>
                {long.has(s.trim()) ? (
                  <mark className="rounded-sm bg-amber-100 px-0.5 text-ink">
                    <span className="sr-only">Long sentence: </span>
                    {withJargon(s)}
                  </mark>
                ) : (
                  withJargon(s)
                )}{" "}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function Editor({ w, guide }: { w: Workspace; guide?: FamilyGuide }) {
  const [now] = useState(() => new Date());
  const router = useRouter();
  const [f, setF] = useState<GuideInput>(() =>
    guide
      ? {
          title: guide.title,
          ageStage: guide.ageStage,
          summary: guide.summary,
          body: guide.body,
          owner: guide.owner,
        }
      : { title: "", ageStage: "diagnosis", summary: "", body: "", owner: w.me?.id ?? "s4" },
  );
  const [errors, setErrors] = useState<FormError[]>([]);
  const [view, setView] = useState<"write" | "check">("write");
  const [reviewing, setReviewing] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewError, setReviewError] = useState("");
  const set = <K extends keyof GuideInput>(k: K, v: GuideInput[K]) =>
    setF((p) => ({ ...p, [k]: v }));
  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const status: ContentStatus = guide?.status ?? "draft";
  const rules = w.settings.contentRules;
  const store = () => useContentStore.getState();
  const me = w.me?.name ?? "Staff";

  const body = useDeferredValue(f.body);
  const r = useMemo(() => analyze(body), [body]);
  const grade = Math.round(r.grade);
  const tooHard = r.words > 0 && grade > rules.maxReadingLevel;
  const long = useMemo(() => new Set(r.longSentences.map((s) => s.trim())), [r]);
  const owners = Object.fromEntries(
    w.settings.staff
      .filter((s) => s.active && (s.role === "content" || s.role === "admin"))
      .map((s) => [s.id, s.name]),
  );

  const fieldFor: Record<string, string> = {
    title: "g-title",
    summary: "g-summary",
    body: "g-body",
  };
  const save = (next: ContentStatus) => {
    const errs = validateGuide(f).map((e) => ({
      fieldId: fieldFor[e.field] ?? "g-title",
      message: e.message,
    }));
    setErrors(errs);
    if (errs.length) return;
    const res = store().saveGuide(guide?.id ?? null, f, next);
    const msg =
      next === "published"
        ? status === "published"
          ? "Changes published."
          : "Guide published. Families can read it now."
        : "Draft saved.";
    if (
      notifyResult(res, {
        success: msg,
        description: tooHard
          ? `It reads at grade ${grade}. Aim for ${rules.maxReadingLevel} or below.`
          : undefined,
        undone: "Undone",
      }) &&
      !guide &&
      res.ok &&
      res.id
    )
      router.replace(`/dashboard/family-guides/${res.id}`);
  };

  const reviewed = guide ? reviewedText(guide, rules, now) : null;
  const helpful = guide ? helpfulPercent(guide) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[
          { label: "Content" },
          { label: "Family guides", href: "/dashboard/family-guides" },
          { label: guide ? guide.title : "New guide" },
        ]}
        title={guide ? guide.title : "New guide"}
        description={
          guide
            ? `${status === "published" ? "Published" : status === "draft" ? "Draft" : "Archived"} · ${STAGE_LABEL[guide.ageStage]}`
            : `Write for a parent reading on their phone. Aim for grade ${rules.maxReadingLevel} or below.`
        }
        moreActions={
          guide
            ? status === "archived"
              ? [
                  {
                    label: "Move back to drafts",
                    onSelect: () =>
                      notifyResult(store().setGuideStatus(guide.id, "draft"), {
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
                            notifyResult(store().setGuideStatus(guide.id, "draft"), {
                              success: "Unpublished.",
                              undone: "Published again",
                            }),
                        },
                      ]
                    : []),
                  {
                    label: "Archive",
                    onSelect: () =>
                      notifyResult(store().setGuideStatus(guide.id, "archived"), {
                        success: "Guide archived.",
                        undone: "Restored",
                      }),
                  },
                ]
            : undefined
        }
      />

      <ErrorSummary errors={errors} />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save(status === "published" ? "published" : "draft");
          }}
          className="flex flex-col gap-5"
        >
          <TextField
            id="g-title"
            label="Title"
            value={f.title}
            onChange={(v) => set("title", v)}
            error={err("g-title")}
            hint="Use the words a parent would search for, like “Turning 18”."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              id="g-stage"
              label="Life stage"
              value={f.ageStage}
              options={STAGE_LABEL}
              onChange={(v) => v && set("ageStage", v as AgeStage)}
            />
            <SelectField
              id="g-owner"
              label="Owner"
              value={f.owner}
              options={owners}
              onChange={(v) => v && set("owner", v)}
            />
          </div>
          <TextField
            id="g-summary"
            label="Summary"
            value={f.summary}
            onChange={(v) => set("summary", v)}
            error={err("g-summary")}
            hint="One sentence. Shown in search results."
          />

          <div className={errorGroupClass(!!err("g-body"))}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <Label htmlFor="g-body" className="text-[15px] font-medium text-ink">
                Guide
              </Label>
              <div
                role="group"
                aria-label="View"
                className="inline-flex rounded-lg border border-border p-0.5"
              >
                {(["write", "check"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={view === k}
                    onClick={() => setView(k)}
                    className={`min-h-10 rounded-md px-3 text-[15px] font-medium ${focusRing} ${view === k ? "bg-brand text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
                  >
                    {k === "write" ? "Write" : "Check the wording"}
                  </button>
                ))}
              </div>
            </div>
            <p id="g-body-hint" className="text-sm text-neutral-600">
              Start headings with ##. Leave a blank line between paragraphs.
            </p>
            <FieldError id="g-body-error" message={err("g-body")} />
            {view === "write" ? (
              <Textarea
                id="g-body"
                rows={18}
                value={f.body}
                onChange={(e) => set("body", e.target.value)}
                aria-invalid={!!err("g-body")}
                aria-describedby={["g-body-hint", err("g-body") && "g-body-error"]
                  .filter(Boolean)
                  .join(" ")}
                className={`mt-1.5 bg-background font-mono text-[15px] leading-relaxed ${focusRing}`}
              />
            ) : (
              <div
                id="g-body"
                tabIndex={-1}
                className="mt-1.5 rounded-lg border border-border bg-white p-5 outline-none"
              >
                {f.body.trim() ? (
                  <Checked body={f.body} long={long} jargon={r.jargon.map((j) => j.term)} />
                ) : (
                  <p className="text-neutral-600">Nothing written yet.</p>
                )}
                <p className="mt-4 border-t border-border pt-3 text-sm text-neutral-600">
                  <mark className="rounded-sm bg-amber-100 px-1 text-ink">Highlighted</mark>{" "}
                  sentences are over 25 words. Words with a wavy underline may need explaining.
                </p>
              </div>
            )}
          </div>

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

        <aside aria-label="Guide checks" className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section
            aria-labelledby="read-title"
            className="rounded-xl border border-border bg-white p-5"
          >
            <h2 id="read-title" className="text-[15px] font-semibold text-ink">
              How easy it is to read
            </h2>
            <div aria-live="polite" aria-atomic="true">
              {r.words === 0 ? (
                <p className="mt-2 text-[15px] text-neutral-600">
                  Start writing to see the reading level.
                </p>
              ) : (
                <>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-ink tabular-nums">
                      Grade {grade}
                    </span>
                  </p>
                  <p className="mt-0.5">
                    {tooHard ? (
                      <StatusText tone="warning">
                        Harder than our target of grade {rules.maxReadingLevel}
                      </StatusText>
                    ) : (
                      <StatusText tone="success">
                        At or below our target of grade {rules.maxReadingLevel}
                      </StatusText>
                    )}
                  </p>
                </>
              )}
            </div>
            {r.words > 0 && (
              <>
                <div aria-hidden="true" className="relative mt-4 h-2 rounded-full bg-neutral-100">
                  <div
                    className={`h-full rounded-full ${tooHard ? "bg-amber-500" : "bg-brand"}`}
                    style={{ width: `${Math.min(100, (grade / 16) * 100)}%` }}
                  />
                  <div
                    className="absolute -top-1 h-4 w-0.5 bg-ink"
                    style={{ left: `${(rules.maxReadingLevel / 16) * 100}%` }}
                  />
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-neutral-600">Words</dt>
                    <dd className="font-medium tabular-nums">{r.words}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-600">Sentences</dt>
                    <dd className="font-medium tabular-nums">{r.sentenceCount}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-600">Read time</dt>
                    <dd className="font-medium tabular-nums">
                      {Math.max(1, Math.round(r.words / 200))} min
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </section>

          {r.words > 0 && (r.longSentences.length > 0 || r.jargon.length > 0) && (
            <section
              aria-labelledby="fix-title"
              className="rounded-xl border border-border bg-white p-5"
            >
              <h2 id="fix-title" className="text-[15px] font-semibold text-ink">
                Suggestions
              </h2>
              {r.longSentences.length > 0 && (
                <>
                  <p className="mt-2 text-[15px] text-ink">
                    {r.longSentences.length} long{" "}
                    {r.longSentences.length === 1 ? "sentence" : "sentences"}. Try splitting{" "}
                    {r.longSentences.length === 1 ? "it" : "them"} in two.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setView("check")}
                    className={`h-11 px-0 text-brand ${focusRing}`}
                  >
                    Show me where
                  </Button>
                </>
              )}
              {r.jargon.length > 0 && (
                <>
                  <p className="mt-2 text-[15px] text-ink">
                    Explain these words the first time you use them:
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1.5 text-sm text-neutral-700">
                    {r.jargon.map((j) => (
                      <li key={j.term}>{j.suggestion}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          {guide && status === "published" && reviewed && (
            <section
              aria-labelledby="rev-title"
              className="rounded-xl border border-border bg-white p-5"
            >
              <h2 id="rev-title" className="text-[15px] font-semibold text-ink">
                Review
              </h2>
              <p className="mt-2 text-[15px]">
                Last checked:{" "}
                {reviewed.overdue ? (
                  <StatusText tone="warning">
                    {reviewed.text.replace(" — overdue", ", overdue")}
                  </StatusText>
                ) : (
                  reviewed.text.toLowerCase()
                )}
              </p>
              <p className="text-sm text-neutral-600">
                Guides are checked every {guide.reviewEveryMonths || rules.guideReviewMonths}{" "}
                months.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReviewNote("");
                  setReviewError("");
                  setReviewing(true);
                }}
                className={`mt-3 h-11 px-4 ${focusRing}`}
              >
                Mark as reviewed
              </Button>
              {guide.reviewNotes && guide.reviewNotes.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
                  {[...guide.reviewNotes]
                    .reverse()
                    .slice(0, 3)
                    .map((n) => (
                      <li key={n.at} className="text-sm">
                        <span className="text-neutral-600">
                          <time dateTime={n.at}>{formatDay(n.at)}</time>, {n.by}:
                        </span>{" "}
                        {n.body}
                      </li>
                    ))}
                </ul>
              )}
            </section>
          )}

          {guide && (guide.helpfulYes + guide.helpfulNo > 0 || guide.comments.length > 0) && (
            <section
              aria-labelledby="fb-title"
              className="rounded-xl border border-border bg-white p-5"
            >
              <h2 id="fb-title" className="text-[15px] font-semibold text-ink">
                What families said
              </h2>
              {helpful !== null && (
                <p className="mt-2 text-[15px]">
                  <span className="text-2xl font-semibold tabular-nums">{helpful}%</span> found it
                  helpful{" "}
                  <span className="text-sm text-neutral-600">
                    ({(guide.helpfulYes + guide.helpfulNo).toLocaleString()} answers,{" "}
                    {guide.views.toLocaleString()} views)
                  </span>
                </p>
              )}
              <ul className="mt-3 flex flex-col gap-2">
                {guide.comments.map((c) => (
                  <li key={c.at} className="rounded-lg bg-neutral-50 p-3 text-sm">
                    <p className="text-ink">“{c.body}”</p>
                    <p className="mt-1 text-neutral-600">
                      {c.helpful ? "Found it helpful" : "Didn't find it helpful"} ·{" "}
                      <time dateTime={c.at}>{formatDay(c.at)}</time>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <Dialog open={reviewing} onOpenChange={setReviewing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mark as reviewed</DialogTitle>
            <DialogDescription>Note what you checked, so the next person knows.</DialogDescription>
          </DialogHeader>
          <div className={errorGroupClass(!!reviewError)}>
            <Label htmlFor="rev-note" className="text-[15px] font-medium">
              What did you check?
            </Label>
            <p id="rev-note-hint" className="text-sm text-neutral-600">
              For example: “Checked links and phone numbers. Updated the age limit.”
            </p>
            <FieldError id="rev-note-error" message={reviewError} />
            <Textarea
              id="rev-note"
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              aria-invalid={!!reviewError}
              aria-describedby={`rev-note-hint${reviewError ? " rev-note-error" : ""}`}
              className={`mt-1.5 text-base ${focusRing}`}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewing(false)}
              className={`h-11 px-4 ${focusRing}`}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!guide) return;
                if (!reviewNote.trim())
                  return setReviewError("Write a short note about what you checked");
                if (
                  notifyResult(store().markReviewed(guide.id, reviewNote, me), {
                    success: "Marked as reviewed. Next review in 12 months.",
                    undone: "Review undone",
                  })
                )
                  setReviewing(false);
              }}
              className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
            >
              Mark as reviewed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
