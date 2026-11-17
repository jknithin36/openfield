"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Real checkboxes in a fieldset; each tick is saved to the store immediately.
export function PartsChecklist({
  requestId,
  itemName,
  parts,
  packed,
  onToggle,
}: {
  requestId: string;
  itemName: string;
  parts: string[];
  packed: string[];
  onToggle: (part: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">
        <span className="sr-only">Parts to pack for {itemName}</span>
        <span aria-hidden="true">Pack:</span>{" "}
        <span className="font-normal text-neutral-600 tabular-nums">
          {packed.length} of {parts.length} ticked
        </span>
      </legend>
      <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {parts.map((part) => {
          const id = `${requestId}-part-${part.replace(/\W+/g, "-").toLowerCase()}`;
          const checked = packed.includes(part);
          return (
            <li key={part} className="flex min-h-11 items-center gap-2.5">
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={() => onToggle(part)}
                className="size-5 focus-visible:ring-3 focus-visible:ring-ring"
              />
              <Label
                htmlFor={id}
                className={
                  "text-[15px] font-normal " +
                  (checked ? "text-neutral-600 line-through" : "text-ink")
                }
              >
                {part}
              </Label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
