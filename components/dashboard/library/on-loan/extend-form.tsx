"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { RuleResult } from "@/lib/types";
import { formatDay } from "@/lib/format";
import {
  ErrorSummary,
  FieldError,
  errorGroupClass,
  type FormError,
} from "@/components/dashboard/shared/form-errors";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const DAY = 86400000;

export function ExtendForm({
  dueAt,
  weeks,
  allowed,
  onSave,
  onCancel,
}: {
  dueAt: string;
  weeks: number[];
  /** canExtend() — when blocked, the reason is shown and the form disabled. */
  allowed: RuleResult;
  onSave: (weeks: number) => void;
  onCancel: () => void;
}) {
  const [choice, setChoice] = useState<string>("");
  const [errors, setErrors] = useState<FormError[]>([]);
  const blocked = !allowed.ok;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!choice) {
      setErrors([{ fieldId: `extend-${weeks[0]}`, message: "Choose how long to extend the loan" }]);
      return;
    }
    onSave(Number(choice));
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-4 border-t border-border px-5 py-4"
    >
      <ErrorSummary errors={errors} />
      {blocked && (
        <p
          id="extend-blocked"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-[15px] font-medium text-amber-900"
        >
          {allowed.reason}
        </p>
      )}
      <fieldset
        disabled={blocked}
        aria-describedby={blocked ? "extend-blocked" : errors.length ? "extend-error" : undefined}
        className={errorGroupClass(errors.length > 0)}
      >
        <legend className="text-base font-medium text-ink">How long should we extend it?</legend>
        <FieldError id="extend-error" message={errors[0]?.message} />
        <RadioGroup
          value={choice}
          onValueChange={(v) => setChoice(String(v))}
          className="mt-3 gap-2"
          disabled={blocked}
        >
          {weeks.map((w) => {
            const newDue = new Date(new Date(dueAt).getTime() + w * 7 * DAY).toISOString();
            return (
              <div key={w} className="flex min-h-11 items-center gap-3">
                <RadioGroupItem
                  value={String(w)}
                  id={`extend-${w}`}
                  className={`size-5 ${focus}`}
                />
                <Label htmlFor={`extend-${w}`} className="text-[15px] font-normal">
                  +{w} {w === 1 ? "week" : "weeks"}{" "}
                  <span className="text-neutral-600">(new due date {formatDay(newDue)})</span>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={blocked}
          aria-describedby={blocked ? "extend-blocked" : undefined}
          className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
        >
          Extend loan
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className={`h-11 px-4 ${focus}`}>
          Go back
        </Button>
      </div>
    </form>
  );
}
