"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";

export function BulkBar({
  total,
  selected,
  onSelectAll,
  onShipSelected,
}: {
  total: number;
  selected: number;
  onSelectAll: (checked: boolean) => void;
  onShipSelected: () => void;
}) {
  const all = total > 0 && selected === total;
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 rounded-lg bg-neutral-50 px-4 py-2 ring-1 ring-border">
      <div className="flex min-h-11 items-center gap-2.5">
        <Checkbox
          id="select-all"
          checked={all}
          indeterminate={selected > 0 && !all}
          onCheckedChange={(c) => onSelectAll(c === true)}
          className={`size-5 ${focus}`}
        />
        <Label htmlFor="select-all" className="text-[15px] font-normal">
          Select all
        </Label>
      </div>
      {selected > 0 && (
        <div className="flex items-center gap-3">
          <p className="text-[15px] font-medium text-ink tabular-nums">{selected} selected</p>
          <Button
            onClick={onShipSelected}
            className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
          >
            Mark shipped
          </Button>
        </div>
      )}
    </div>
  );
}
