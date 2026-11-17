"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { focusRing } from "@/components/dashboard/shared/fields";

/** GOV.UK-style checkbox filter: fieldset + legend, counts, empty options disabled. */
export function CheckGroup<T extends string>({
  id,
  legend,
  options,
  selected,
  counts,
  onChange,
}: {
  id: string;
  legend: string;
  options: Partial<Record<T, string>>;
  selected: T[];
  counts: Partial<Record<T, number>>;
  onChange: (v: T[]) => void;
}) {
  return (
    <fieldset className="border-t border-border pt-4">
      <legend className="float-left mb-2 w-full text-[15px] font-semibold text-ink">
        {legend}
      </legend>
      <div className="clear-left flex flex-col">
        {(Object.keys(options) as T[]).map((o) => {
          const n = counts[o] ?? 0;
          const on = selected.includes(o);
          return (
            <div key={o} className="flex min-h-11 items-center gap-2.5">
              <Checkbox
                id={`${id}-${o}`}
                checked={on}
                disabled={!n && !on}
                onCheckedChange={() =>
                  onChange(on ? selected.filter((x) => x !== o) : [...selected, o])
                }
                className={`size-5 ${focusRing}`}
              />
              <Label
                htmlFor={`${id}-${o}`}
                className={`text-[15px] font-normal ${!n && !on ? "text-neutral-500" : "text-ink"}`}
              >
                {options[o]} <span className="text-neutral-600 tabular-nums">({n})</span>
              </Label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

/** One checkbox (e.g. "Free only") with its count. */
export function CheckOne({
  id,
  label,
  checked,
  count,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  count: number;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center gap-2.5">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className={`size-5 ${focusRing}`}
      />
      <Label htmlFor={id} className="text-[15px] font-normal">
        {label} <span className="text-neutral-600 tabular-nums">({count})</span>
      </Label>
    </div>
  );
}
