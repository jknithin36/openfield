"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { DeclineReason } from "@/lib/types";
import { DECLINE_REASONS } from "@/lib/library/views";
import {
  ErrorSummary,
  errorGroupClass,
  FieldError,
  type FormError,
} from "@/components/dashboard/shared/form-errors";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";

export function DeclineForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (reason: DeclineReason, note: string) => void;
}) {
  const [reason, setReason] = useState<DeclineReason | "">("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FormError[]>([]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormError[] = [];
    if (!reason)
      next.push({
        fieldId: "decline-reason-not-eligible",
        message: "Select why you are declining",
      });
    if (reason === "other" && !note.trim())
      next.push({ fieldId: "decline-note", message: "Write a note explaining why" });
    setErrors(next);
    if (!next.length && reason) onSubmit(reason, note);
  };
  const err = (prefix: string) => errors.find((e) => e.fieldId.startsWith(prefix))?.message;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <ErrorSummary errors={errors} />

      <fieldset
        aria-describedby={err("decline-reason") ? "decline-reason-error" : undefined}
        className={errorGroupClass(!!err("decline-reason"))}
      >
        <legend className="text-base font-medium text-ink">Why are you declining?</legend>
        <FieldError id="decline-reason-error" message={err("decline-reason")} />
        <RadioGroup
          value={reason}
          onValueChange={(v) => setReason(v as DeclineReason)}
          className="mt-3 gap-3"
        >
          {DECLINE_REASONS.map((r) => (
            <div key={r.value} className="flex min-h-11 items-center gap-3">
              <RadioGroupItem
                value={r.value}
                id={`decline-reason-${r.value}`}
                className={`size-5 ${focus}`}
              />
              <Label htmlFor={`decline-reason-${r.value}`} className="text-[15px] font-normal">
                {r.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <div className={errorGroupClass(!!err("decline-note"))}>
        <Label htmlFor="decline-note" className="text-base font-medium text-ink">
          Note {reason === "other" ? "" : "(optional)"}
        </Label>
        <FieldError id="decline-note-error" message={err("decline-note")} />
        <Textarea
          id="decline-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-describedby={err("decline-note") ? "decline-note-error" : undefined}
          aria-invalid={!!err("decline-note")}
          rows={3}
          className={`mt-2 bg-background text-base ${focus}`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          className={`h-11 bg-red-700 px-4 text-white hover:bg-red-800 ${focus}`}
        >
          Decline request
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className={`h-11 px-4 ${focus}`}>
          Go back
        </Button>
      </div>
    </form>
  );
}
