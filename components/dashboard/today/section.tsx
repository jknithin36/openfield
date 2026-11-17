import { cn } from "cn";

// Plain section: thin divider on top, an h2, then content. No shadow cards.
export function Section({
  id,
  title,
  action,
  className,
  headingRef,
  children,
}: {
  id: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
  headingRef?: React.Ref<HTMLHeadingElement>;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={cn("border-t border-border pt-6", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id={`${id}-heading`}
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-medium text-ink outline-none"
        >
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export const textLink =
  "rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring";
