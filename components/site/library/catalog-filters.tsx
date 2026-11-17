"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CenterSlug, ItemType } from "@/lib/types";
import {
  AGE_LABEL,
  SORT_LABEL,
  SORTS,
  TYPE_PLURAL,
  type AgeBucket,
  type Filters,
  type Sort,
} from "@/lib/library/public";
import { CENTER_LABEL } from "@/lib/library/views";
import { focusRing } from "@/components/dashboard/shared/fields";

export type Counts = {
  types: Record<ItemType, number>;
  centers: Record<CenterSlug, number>;
  ages: Record<AgeBucket, number>;
  available: number;
};
export type FilterUpdate = Partial<
  Pick<Filters, "types" | "centers" | "ages" | "availableOnly" | "sort">
>;

const toggle = <T,>(list: T[], v: T) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

function Group<T extends string>({
  id,
  legend,
  options,
  selected,
  counts,
  onChange,
}: {
  id: string;
  legend: string;
  options: Record<T, string>;
  selected: T[];
  counts: Record<T, number>;
  onChange: (next: T[]) => void;
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
                onCheckedChange={() => onChange(toggle(selected, o))}
                className={`size-5 ${focusRing}`}
              />
              <Label
                htmlFor={`${id}-${o}`}
                className={`flex-1 text-[15px] font-normal ${!n && !on ? "text-neutral-500" : "text-ink"}`}
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

/** All filter groups. Used in the desktop column and the mobile panel. */
export function CatalogFilters({
  f,
  counts,
  onChange,
  idPrefix,
  showSort,
}: {
  f: Filters;
  counts: Counts;
  onChange: (u: FilterUpdate) => void;
  idPrefix: string;
  showSort?: boolean;
}) {
  const centersWithItems = Object.fromEntries(
    (Object.keys(CENTER_LABEL) as CenterSlug[])
      .filter((c) => counts.centers[c] || f.centers.includes(c))
      .map((c) => [c, CENTER_LABEL[c]]),
  ) as Record<CenterSlug, string>;
  return (
    <div className="flex flex-col gap-5">
      {showSort && (
        <fieldset className="pt-1">
          <legend className="mb-2 text-[15px] font-semibold text-ink">Sort by</legend>
          {SORTS.map((s) => (
            <label
              key={s}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]"
            >
              <input
                type="radio"
                name={`${idPrefix}-sort`}
                value={s}
                checked={f.sort === s}
                onChange={() => onChange({ sort: s as Sort })}
                className={`size-5 accent-[var(--brand)] ${focusRing}`}
              />
              {SORT_LABEL[s]}
            </label>
          ))}
        </fieldset>
      )}
      <fieldset className="border-t border-border pt-4">
        <legend className="sr-only">Availability</legend>
        <div className="flex min-h-11 items-center gap-2.5">
          <Checkbox
            id={`${idPrefix}-avail`}
            checked={f.availableOnly}
            onCheckedChange={(v) => onChange({ availableOnly: v === true })}
            className={`size-5 ${focusRing}`}
          />
          <Label htmlFor={`${idPrefix}-avail`} className="text-[15px] font-normal">
            Available now only{" "}
            <span className="text-neutral-600 tabular-nums">({counts.available})</span>
          </Label>
        </div>
      </fieldset>
      <Group
        id={`${idPrefix}-type`}
        legend="Type"
        options={TYPE_PLURAL}
        selected={f.types}
        counts={counts.types}
        onChange={(types) => onChange({ types })}
      />
      <Group
        id={`${idPrefix}-age`}
        legend="Age range"
        options={AGE_LABEL}
        selected={f.ages}
        counts={counts.ages}
        onChange={(ages) => onChange({ ages })}
      />
      <Group
        id={`${idPrefix}-topic`}
        legend="Topic"
        options={centersWithItems}
        selected={f.centers}
        counts={counts.centers}
        onChange={(centers) => onChange({ centers })}
      />
    </div>
  );
}
