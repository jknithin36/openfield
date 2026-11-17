import { Fragment } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BulbIcon } from "@hugeicons/core-free-icons";

/** **bold** only — lesson text stays plain. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/**
 * Small, safe Markdown for lessons: ## and ### headings, paragraphs, "- " and
 * "1. " lists, "> " callouts and **bold**. Headings start at h2 (the lesson
 * title is the h1).
 */
export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (block.startsWith("### "))
          return (
            <h3 key={i} className="mt-2 text-[1.15em] font-semibold text-ink">
              {inline(block.slice(4))}
            </h3>
          );
        if (block.startsWith("## "))
          return (
            <h2
              key={i}
              className="mt-4 text-[1.35em] font-semibold tracking-[-0.01em] text-ink first:mt-0"
            >
              {inline(block.slice(3))}
            </h2>
          );
        if (block.startsWith("> "))
          return (
            <div
              key={i}
              className="flex gap-3 rounded-xl border-l-4 border-brand bg-brand-soft p-4"
            >
              <HugeiconsIcon
                icon={BulbIcon}
                strokeWidth={2}
                aria-hidden="true"
                className="mt-1 size-5 shrink-0 text-brand"
              />
              <p>{inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}</p>
            </div>
          );
        if (lines.every((l) => /^- /.test(l)))
          return (
            <ul key={i} className="flex list-disc flex-col gap-2 pl-6 marker:text-brand">
              {lines.map((l, k) => (
                <li key={k}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        if (lines.every((l) => /^\d+\. /.test(l)))
          return (
            <ol
              key={i}
              className="flex list-decimal flex-col gap-2 pl-6 marker:font-semibold marker:text-brand"
            >
              {lines.map((l, k) => (
                <li key={k}>{inline(l.replace(/^\d+\. /, ""))}</li>
              ))}
            </ol>
          );
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}
