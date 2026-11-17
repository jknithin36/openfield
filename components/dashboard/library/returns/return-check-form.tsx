"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { LibraryData, ReturnCheck, ReturnCondition } from "@/lib/types";
import { canShelve } from "@/lib/library/rules";
import type { Joined } from "@/lib/library/views";
import {
  ErrorSummary,
  FieldError,
  errorGroupClass,
  type FormError,
} from "@/components/dashboard/shared/form-errors";
import { StatusText } from "@/components/dashboard/shared/status-text";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";

/** The return check, inside each row: parts, condition, cleaned, notes. */
export function ReturnCheckForm({
  data,
  row,
  onShelve,
  onRepair,
}: {
  data: LibraryData;
  row: Joined;
  onShelve: (check: ReturnCheck) => void;
  onRepair: (check: ReturnCheck) => void;
}) {
  const { request, item, contact } = row;
  const id = request.id;
  const [parts, setParts] = useState<string[]>([]);
  const [condition, setCondition] = useState<ReturnCondition | "">("");
  const [cleaned, setCleaned] = useState(false);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormError[]>([]);

  const missing = item.parts.filter((p) => !parts.includes(p));
  const check: ReturnCheck = {
    partsReturned: parts,
    condition: condition || "good",
    cleaned,
    notes: notes.trim() || undefined,
  };
  const shelf =
    condition === "good"
      ? canShelve(data, request, check)
      : {
          ok: false as const,
          reason: condition
            ? "Only items in good condition can go back on the shelf."
            : "Choose the item's condition first.",
        };
  const hintId = `${id}-shelf-hint`;

  const sendToRepair = () => {
    if (!notes.trim()) {
      setErrors([{ fieldId: `${id}-notes`, message: "Write a note about what needs repairing" }]);
      return;
    }
    setErrors([]);
    onRepair({ ...check, condition: "needs-repair" });
  };

  return (
    <div className="flex flex-col gap-5">
      <ErrorSummary errors={errors} />

      <fieldset>
        <legend className="text-sm font-medium text-ink">1. Parts returned</legend>
        <ul className="mt-1 grid gap-x-6 sm:grid-cols-2">
          {item.parts.map((p) => {
            const pid = `${id}-ret-${p.replace(/\W+/g, "-").toLowerCase()}`;
            return (
              <li key={p} className="flex min-h-11 items-center gap-2.5">
                <Checkbox
                  id={pid}
                  checked={parts.includes(p)}
                  onCheckedChange={(c) =>
                    setParts((s) => (c === true ? [...s, p] : s.filter((x) => x !== p)))
                  }
                  className={`size-5 ${focus}`}
                />
                <Label htmlFor={pid} className="text-[15px] font-normal">
                  {p}
                </Label>
              </li>
            );
          })}
        </ul>
        {missing.length > 0 && (
          <p className="mt-1 text-sm">
            <StatusText tone="warning">Missing: {missing.join(", ")}</StatusText>{" "}
            <Link
              href={`/dashboard/contacts/${contact.id}`}
              className={`ml-1 rounded-sm font-medium text-brand underline underline-offset-4 outline-none ${focus}`}
            >
              Contact borrower<span className="sr-only"> {contact.name}</span>
            </Link>
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-ink">2. Condition</legend>
        <RadioGroup
          value={condition}
          onValueChange={(v) => setCondition(v as ReturnCondition)}
          className="mt-1 flex flex-wrap gap-x-6"
        >
          {(["good", "needs-repair"] as const).map((c) => (
            <div key={c} className="flex min-h-11 items-center gap-2.5">
              <RadioGroupItem value={c} id={`${id}-cond-${c}`} className={`size-5 ${focus}`} />
              <Label htmlFor={`${id}-cond-${c}`} className="text-[15px] font-normal">
                {c === "good" ? "Good" : "Needs repair"}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <div className="flex min-h-11 items-center gap-2.5">
        <Checkbox
          id={`${id}-cleaned`}
          checked={cleaned}
          onCheckedChange={(c) => setCleaned(c === true)}
          className={`size-5 ${focus}`}
        />
        <Label htmlFor={`${id}-cleaned`} className="text-[15px] font-normal">
          3. Cleaned and disinfected
        </Label>
      </div>

      <div className={errorGroupClass(errors.length > 0)}>
        <Label htmlFor={`${id}-notes`} className="text-sm font-medium text-ink">
          4. Notes {missing.length || condition === "needs-repair" ? "(required)" : "(optional)"}
        </Label>
        <FieldError id={`${id}-notes-error`} message={errors[0]?.message} />
        <Textarea
          id={`${id}-notes`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-invalid={errors.length > 0}
          aria-describedby={errors.length ? `${id}-notes-error` : undefined}
          rows={2}
          className={`mt-1.5 bg-background text-base ${focus}`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => shelf.ok && onShelve(check)}
            disabled={!shelf.ok}
            aria-describedby={shelf.ok ? undefined : hintId}
            className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
          >
            Back on shelf<span className="sr-only">: {item.name}</span>
          </Button>
          <Button variant="outline" onClick={sendToRepair} className={`h-11 px-4 ${focus}`}>
            Send to repair<span className="sr-only">: {item.name}</span>
          </Button>
        </div>
        {!shelf.ok && (
          <p id={hintId} className="text-sm text-neutral-600">
            {shelf.reason}
          </p>
        )}
      </div>
    </div>
  );
}
