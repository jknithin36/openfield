"use client";

// Small labeled field helpers for GOV.UK-style forms (label always visible,
// hint, inline error tied by aria-describedby).
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { errorGroupClass, FieldError } from "@/components/dashboard/shared/form-errors";

export const focusRing = "focus-visible:ring-3 focus-visible:ring-ring";
export const fieldClass = `h-11 bg-background text-base ${focusRing}`;
const describedBy = (id: string, hint?: string, error?: string) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  type = "text",
  inputMode,
  multiline,
  rows = 3,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
  type?: string;
  inputMode?: "numeric" | "decimal" | "email" | "tel";
  multiline?: boolean;
  rows?: number;
  autoComplete?: string;
}) {
  return (
    <div className={errorGroupClass(!!error)}>
      <Label htmlFor={id} className="text-[15px] font-medium text-ink">
        {label}
      </Label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-neutral-600">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
      {multiline ? (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy(id, hint, error)}
          className={`mt-1.5 bg-background text-base ${focusRing}`}
        />
      ) : (
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy(id, hint, error)}
          className={`mt-1.5 ${fieldClass}`}
        />
      )}
    </div>
  );
}

export function RadioField<T extends string>({
  id,
  legend,
  value,
  options,
  onChange,
  error,
  columns = 2,
  hideLegend,
}: {
  id: string;
  legend: string;
  value: T | "";
  options: Record<T, string>;
  onChange: (v: T) => void;
  error?: string;
  columns?: 1 | 2 | 3;
  /** When the page heading already asks the question. */
  hideLegend?: boolean;
}) {
  return (
    <fieldset
      className={errorGroupClass(!!error)}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <legend className={hideLegend ? "sr-only" : "text-[15px] font-medium text-ink"}>
        {legend}
      </legend>
      <FieldError id={`${id}-error`} message={error} />
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as T)}
        className={`mt-1 grid gap-x-6 ${columns === 1 ? "" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
      >
        {(Object.keys(options) as T[]).map((o) => (
          <div key={o} className="flex min-h-11 items-center gap-2.5">
            <RadioGroupItem value={o} id={`${id}-${o}`} className={`size-5 ${focusRing}`} />
            <Label htmlFor={`${id}-${o}`} className="text-[15px] font-normal">
              {options[o]}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

/**
 * shadcn Select with a visible label, optional hint and GOV.UK inline error.
 * `noneLabel` adds a choice that clears the value (e.g. "No specific topic").
 */
export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Choose one",
  noneLabel,
  hint,
  error,
}: {
  id: string;
  label: string;
  value: T | "";
  options: Record<T, string>;
  onChange: (v: T | "") => void;
  placeholder?: string;
  noneLabel?: string;
  hint?: string;
  error?: string;
}) {
  const keys = Object.keys(options) as T[];
  const items: Record<string, string> = { ...(noneLabel ? { "": noneLabel } : {}), ...options };
  return (
    <div className={errorGroupClass(!!error)}>
      <Label htmlFor={id} className="text-[15px] font-medium text-ink">
        {label}
      </Label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-neutral-600">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
      <Select
        items={items}
        value={value === "" ? (noneLabel ? "" : null) : value}
        onValueChange={(v) => onChange(((v as string | null) ?? "") as T | "")}
      >
        <SelectTrigger
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy(id, hint, error)}
          className={`mt-1.5 h-11 w-full bg-background text-base data-[size=default]:h-11 ${focusRing}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {noneLabel && (
              <SelectItem value="" className="min-h-10 text-[15px]">
                {noneLabel}
              </SelectItem>
            )}
            {keys.map((o) => (
              <SelectItem key={o} value={o} className="min-h-10 text-[15px]">
                {options[o]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
