import type { ContentRules, FamilyGuide } from "@/lib/types";

export const STAGE_LABEL = {
  diagnosis: "After a diagnosis",
  "birth-5": "Birth to 5",
  "school-age": "School age",
  teen: "Teen years",
  adult: "Adult life",
} as const;

export const monthsSince = (iso: string, now: Date) =>
  Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / (30.44 * 86400000)));

export const reviewOverdue = (g: FamilyGuide, rules: ContentRules, now: Date) =>
  g.status === "published" &&
  monthsSince(g.lastReviewedAt, now) >= (g.reviewEveryMonths || rules.guideReviewMonths);
export const aboveLevel = (g: FamilyGuide, rules: ContentRules) =>
  g.readingLevel > rules.maxReadingLevel;
export const needsReview = (g: FamilyGuide, rules: ContentRules, now: Date) =>
  g.status === "published" && (reviewOverdue(g, rules, now) || aboveLevel(g, rules));
export const helpfulPercent = (g: FamilyGuide) =>
  g.helpfulYes + g.helpfulNo
    ? Math.round((g.helpfulYes / (g.helpfulYes + g.helpfulNo)) * 100)
    : null;

export function reviewedText(g: FamilyGuide, rules: ContentRules, now: Date) {
  const m = monthsSince(g.lastReviewedAt, now);
  const when = m === 0 ? "This month" : `${m} ${m === 1 ? "month" : "months"} ago`;
  return {
    text: reviewOverdue(g, rules, now) ? `${when} — overdue` : when,
    overdue: reviewOverdue(g, rules, now),
  };
}
