"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ErrorSummary,
  FieldError,
  errorGroupClass,
  type FormError,
} from "@/components/dashboard/shared/form-errors";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";

/** Confirm step with a required note (GOV.UK errors). */
export function NoteConfirmForm({
  id,
  intro,
  label,
  requiredMessage,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = true,
}: {
  id: string;
  intro: React.ReactNode;
  label: string;
  requiredMessage: string;
  confirmLabel: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FormError[]>([]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrors([{ fieldId: id, message: requiredMessage }]);
      return;
    }
    onConfirm(note);
  };
  const err = errors[0]?.message;
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <ErrorSummary errors={errors} />
      <div className="text-[15px] text-neutral-800">{intro}</div>
      <div className={errorGroupClass(!!err)}>
        <Label htmlFor={id} className="text-base font-medium text-ink">
          {label}
        </Label>
        <FieldError id={`${id}-error`} message={err} />
        <Textarea
          id={id}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={!!err}
          aria-describedby={err ? `${id}-error` : undefined}
          rows={3}
          className={`mt-2 bg-background text-base ${focus}`}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          className={`h-11 px-4 text-white ${danger ? "bg-red-700 hover:bg-red-800" : "bg-brand hover:bg-brand-hover"} ${focus}`}
        >
          {confirmLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className={`h-11 px-4 ${focus}`}>
          Go back
        </Button>
      </div>
    </form>
  );
}
