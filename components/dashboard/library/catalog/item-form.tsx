"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { NewItemInput } from "@/store/library";
import type { CenterSlug, ItemType, LibraryItem } from "@/lib/types";
import { CENTER_LABEL, TYPE_LABEL } from "@/lib/library/views";
import {
  ErrorSummary,
  FieldError,
  errorGroupClass,
  type FormError,
} from "@/components/dashboard/shared/form-errors";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const field = `h-11 bg-background text-base ${focus}`;

const blank: NewItemInput = {
  name: "",
  type: "kit",
  center: "assistive-technology",
  ageRange: "",
  loanDays: 28,
  maxExtensions: 1,
  copies: 1,
  description: "",
  parts: [""],
};

/**
 * Add / edit an item (same form). Validates in the GOV.UK style; the store
 * has the final say (e.g. copies can't go below copies in use) and its
 * reason is shown as an error.
 */
export function ItemForm({
  open,
  item,
  onOpenChange,
  onSubmit,
  returnFocusRef,
}: {
  open: boolean;
  /** Present when editing. */
  item?: LibraryItem;
  onOpenChange: (open: boolean) => void;
  /** Returns an error message from the store, or null on success. */
  onSubmit: (input: NewItemInput) => string | null;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const [v, setV] = useState<NewItemInput>(blank);
  const [loanDays, setLoanDays] = useState("28");
  const [maxExt, setMaxExt] = useState("1");
  const [copies, setCopies] = useState("1");
  const [errors, setErrors] = useState<FormError[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Fill the form each time it opens (during render, not in an effect).
  const openKey = open ? (item?.id ?? "new") : null;
  const [filledFor, setFilledFor] = useState<string | null>(null);
  if (filledFor !== openKey) {
    setFilledFor(openKey);
    if (open) {
      const src = item ? { ...item, parts: item.parts.length ? item.parts : [""] } : blank;
      setV({
        name: src.name,
        type: src.type,
        center: src.center,
        ageRange: src.ageRange,
        loanDays: src.loanDays,
        maxExtensions: src.maxExtensions,
        copies: src.copies,
        description: src.description,
        parts: [...src.parts],
      });
      setLoanDays(String(src.loanDays));
      setMaxExt(String(src.maxExtensions));
      setCopies(String(src.copies));
      setErrors([]);
    }
  }

  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const int = (s: string) => (/^\d+$/.test(s.trim()) ? Number(s) : NaN);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormError[] = [];
    if (!v.name.trim()) next.push({ fieldId: "item-name", message: "Enter the item name" });
    if (!(int(loanDays) >= 1))
      next.push({
        fieldId: "item-loan-days",
        message: "Enter the loan length in whole days, like 28",
      });
    if (!(int(maxExt) >= 0))
      next.push({
        fieldId: "item-max-ext",
        message: "Enter how many extensions are allowed, like 1",
      });
    if (!(int(copies) >= 0))
      next.push({
        fieldId: "item-copies",
        message: "Enter the number of copies, like 2",
      });
    if (!v.parts.some((p) => p.trim()))
      next.push({
        fieldId: "item-part-0",
        message: "Add at least one part, like “Book”",
      });
    if (next.length) {
      setErrors(next);
      return;
    }
    const storeError = onSubmit({
      ...v,
      loanDays: int(loanDays),
      maxExtensions: int(maxExt),
      copies: int(copies),
    });
    if (storeError) {
      const isCopies = /cop(y|ies)/i.test(storeError);
      setErrors([
        {
          fieldId: isCopies ? "item-copies" : "item-name",
          message: storeError,
        },
      ]);
    }
  };

  const text = (
    id: string,
    label: string,
    value: string,
    onChange: (s: string) => void,
    opts: { hint?: string; inputMode?: "numeric" } = {},
  ) => (
    <div className={errorGroupClass(!!err(id))}>
      <Label htmlFor={id} className="text-[15px] font-medium text-ink">
        {label}
      </Label>
      {opts.hint && (
        <p id={`${id}-hint`} className="text-sm text-neutral-600">
          {opts.hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={err(id)} />
      <Input
        id={id}
        value={value}
        inputMode={opts.inputMode}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!err(id)}
        aria-describedby={
          [opts.hint && `${id}-hint`, err(id) && `${id}-error`].filter(Boolean).join(" ") ||
          undefined
        }
        className={`mt-1.5 ${field}`}
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        initialFocus={titleRef}
        finalFocus={returnFocusRef}
        className="w-full gap-0 p-0 sm:max-w-lg"
      >
        <form id="item-form" onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6">
            <SheetTitle
              ref={titleRef}
              tabIndex={-1}
              className="pr-10 text-xl font-medium text-ink outline-none"
            >
              {item ? `Edit ${item.name}` : "Add item"}
            </SheetTitle>
            <SheetDescription className="mt-1 text-[15px] text-neutral-700">
              {item
                ? "Changes show on the website and in Requests straight away."
                : "New items appear on the website and in Requests."}
            </SheetDescription>

            <div className="mt-5 flex flex-col gap-5">
              <ErrorSummary errors={errors} />
              {text("item-name", "Name", v.name, (s) => setV({ ...v, name: s }))}

              <fieldset>
                <legend className="text-[15px] font-medium text-ink">Type</legend>
                <RadioGroup
                  value={v.type}
                  onValueChange={(t) => setV({ ...v, type: t as ItemType })}
                  className="mt-1 grid grid-cols-2 gap-x-4"
                >
                  {(Object.keys(TYPE_LABEL) as ItemType[]).map((t) => (
                    <div key={t} className="flex min-h-11 items-center gap-2.5">
                      <RadioGroupItem
                        value={t}
                        id={`item-type-${t}`}
                        className={`size-5 ${focus}`}
                      />
                      <Label htmlFor={`item-type-${t}`} className="text-[15px] font-normal">
                        {TYPE_LABEL[t]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </fieldset>

              <div>
                {/* 7 options: a select is clearer than 7 radios */}
                <Label htmlFor="item-center" className="text-[15px] font-medium text-ink">
                  Topic
                </Label>
                <NativeSelect
                  id="item-center"
                  value={v.center}
                  onChange={(e) => setV({ ...v, center: e.target.value as CenterSlug })}
                  className={`mt-1.5 w-full ${field}`}
                >
                  {(Object.keys(CENTER_LABEL) as CenterSlug[]).map((c) => (
                    <NativeSelectOption key={c} value={c}>
                      {CENTER_LABEL[c]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              {text("item-age", "Age range", v.ageRange, (s) => setV({ ...v, ageRange: s }), {
                hint: "For example “3+” or “Adults”",
              })}

              <div className="grid gap-5 sm:grid-cols-3">
                {text("item-loan-days", "Loan length (days)", loanDays, setLoanDays, {
                  inputMode: "numeric",
                })}
                {text("item-max-ext", "Max extensions", maxExt, setMaxExt, {
                  inputMode: "numeric",
                })}
                {text("item-copies", "Copies", copies, setCopies, {
                  inputMode: "numeric",
                })}
              </div>

              <div>
                <Label htmlFor="item-description" className="text-[15px] font-medium text-ink">
                  Description
                </Label>
                <Textarea
                  id="item-description"
                  value={v.description}
                  onChange={(e) => setV({ ...v, description: e.target.value })}
                  rows={3}
                  className={`mt-1.5 bg-background text-base ${focus}`}
                />
              </div>

              <fieldset className={errorGroupClass(!!err("item-part-0"))}>
                <legend className="text-[15px] font-medium text-ink">Parts in the box</legend>
                <FieldError id="item-part-0-error" message={err("item-part-0")} />
                <ul className="mt-2 flex flex-col gap-2">
                  {v.parts.map((p, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Label htmlFor={`item-part-${i}`} className="sr-only">
                        Part {i + 1}
                      </Label>
                      <Input
                        id={`item-part-${i}`}
                        value={p}
                        onChange={(e) =>
                          setV({
                            ...v,
                            parts: v.parts.map((x, j) => (j === i ? e.target.value : x)),
                          })
                        }
                        className={`flex-1 ${field}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={v.parts.length === 1}
                        onClick={() =>
                          setV({
                            ...v,
                            parts: v.parts.filter((_, j) => j !== i),
                          })
                        }
                        className={`size-11 p-0 ${focus}`}
                      >
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} aria-hidden="true" />
                        <span className="sr-only">
                          Remove part {i + 1}
                          {p ? `: ${p}` : ""}
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setV({ ...v, parts: [...v.parts, ""] })}
                  className={`mt-2 h-11 gap-1.5 px-3 ${focus}`}
                >
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />
                  Add a part
                </Button>
              </fieldset>
            </div>
          </div>
          <footer className="flex gap-2 border-t border-border bg-white px-5 py-4">
            <Button
              type="submit"
              className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
            >
              {item ? "Save changes" : "Add item"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={`h-11 px-4 ${focus}`}
            >
              Cancel
            </Button>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  );
}
