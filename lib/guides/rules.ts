import type { FamilyGuide, RuleResult } from "@/lib/types";

export function validateGuide(
  g: Pick<FamilyGuide, "title" | "summary" | "body">,
): Array<{ field: string; message: string }> {
  const errs: Array<{ field: string; message: string }> = [];
  if (!g.title.trim()) errs.push({ field: "title", message: "Enter a title" });
  if (!g.summary.trim()) errs.push({ field: "summary", message: "Enter a short summary" });
  if (g.body.trim().split(/\s+/).length < 20)
    errs.push({ field: "body", message: "Write at least a few sentences in the guide" });
  return errs;
}
export const canMarkReviewed = (note: string): RuleResult =>
  note.trim() ? { ok: true } : { ok: false, reason: "Write a short note about what you checked" };
export const canPublishGuide = (g: FamilyGuide): RuleResult => {
  const errs = validateGuide(g);
  return errs.length ? { ok: false, reason: errs[0].message } : { ok: true };
};
