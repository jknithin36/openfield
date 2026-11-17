// Plain-language check for family guides (client-side, no dependencies).
// Flesch-Kincaid grade, long sentences (> 25 words) and jargon to explain.

export const JARGON: Record<string, string> = {
  iep: "IEP (a plan for a child's support at school)",
  "assistive technology": "assistive technology (tools that help someone do a task)",
  transition: "transition (moving from school to adult life)",
  accommodations: "accommodations (changes that make things accessible)",
  modifications: "modifications (changes to what is taught or expected)",
  multidisciplinary: "multidisciplinary (a team with different specialists)",
  vocational: "vocational (to do with work and jobs)",
  "related services": "related services (extra support like speech therapy)",
  evaluation: "evaluation (a formal check of needs)",
  "legally binding": "legally binding (the school must follow it)",
};

/** Strip markdown to plain text. */
export function plainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>#-]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

export function sentences(text: string): string[] {
  return plainText(text)
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => /[a-z]/i.test(s));
}

export type Readability = {
  grade: number;
  words: number;
  sentenceCount: number;
  longSentences: string[];
  jargon: Array<{ term: string; suggestion: string }>;
};

export function analyze(md: string): Readability {
  const sents = sentences(md);
  const words = plainText(md)
    .split(/\s+/)
    .filter((w) => /[a-z]/i.test(w));
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const wc = words.length || 1;
  const sc = sents.length || 1;
  const grade = Math.max(1, Math.round((0.39 * (wc / sc) + 11.8 * (syl / wc) - 15.59) * 10) / 10);
  const lower = plainText(md).toLowerCase();
  return {
    grade,
    words: words.length,
    sentenceCount: sents.length,
    longSentences: sents.filter((s) => s.split(/\s+/).length > 25),
    jargon: Object.entries(JARGON)
      .filter(([term]) => new RegExp(`\\b${term}\\b`).test(lower))
      .map(([term, suggestion]) => ({ term, suggestion })),
  };
}
