"use client";

import { useEffect, useRef } from "react";

// GOV.UK error pattern: a summary at the top that receives focus, listing
// each problem as a link to its field, plus an inline message by the field.

export type FormError = { fieldId: string; message: string };

export function ErrorSummary({ errors }: { errors: FormError[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const key = errors.map((e) => e.message).join("|");
  useEffect(() => {
    if (errors.length) ref.current?.focus();
  }, [key, errors.length]);

  if (!errors.length) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="error-summary-title"
      className="rounded-md border-2 border-red-700 bg-white p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring"
    >
      <h2 id="error-summary-title" className="font-semibold text-ink">
        There is a problem
      </h2>
      <ul className="mt-2 flex flex-col gap-1">
        {errors.map((e) => (
          <li key={e.fieldId}>
            <a
              href={`#${e.fieldId}`}
              onClick={(ev) => {
                ev.preventDefault();
                // Radio and checkbox groups: go to the first option (GOV.UK pattern).
                const el =
                  document.getElementById(e.fieldId) ??
                  document.querySelector<HTMLElement>(
                    `[id^="${CSS.escape(e.fieldId)}-"]:not([id$="-error"]):not([id$="-hint"])`,
                  );
                el?.scrollIntoView({ block: "center" });
                el?.focus();
              }}
              className="font-medium text-red-700 underline underline-offset-4"
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Inline message; tie it to the field with aria-describedby={id}. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm font-semibold text-red-700">
      <span className="sr-only">Error: </span>
      {message}
    </p>
  );
}

/** Red left border around a field group that has an error. */
export const errorGroupClass = (hasError: boolean) =>
  hasError ? "border-l-4 border-red-700 pl-4" : "";
