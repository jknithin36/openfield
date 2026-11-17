"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { LibraryData } from "@/lib/types";
import { formatDay } from "@/lib/format";
import { join } from "@/lib/library/views";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";

/** Fast desk flow: search → pick the loan → confirm check-in. */
export function CheckInDialog({
  data,
  open,
  onOpenChange,
  onConfirm,
}: {
  data: LibraryData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return join(
      data,
      data.requests.filter((r) => r.status === "on-loan"),
    )
      .filter(
        (j) =>
          j.request.id.toLowerCase().includes(s) ||
          j.item.name.toLowerCase().includes(s) ||
          j.contact.name.toLowerCase().includes(s),
      )
      .slice(0, 8);
  }, [data, q]);
  const valid = results.some((r) => r.request.id === picked);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setQ("");
          setPicked("");
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Check in a return</DialogTitle>
          <DialogDescription>Find the loan by request number, item or borrower.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="check-in-search">Find the loan</Label>
          <Input
            id="check-in-search"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPicked("");
            }}
            placeholder="R-1042, item or name"
            className={`h-11 text-base ${focus}`}
            autoComplete="off"
          />
        </div>

        <div aria-live="polite" className="text-sm text-neutral-600">
          {q.trim() &&
            (results.length
              ? `${results.length} matching ${results.length === 1 ? "loan" : "loans"}`
              : "No loans match.")}
        </div>

        {results.length > 0 && (
          <fieldset>
            <legend className="sr-only">Matching loans</legend>
            <RadioGroup
              value={picked}
              onValueChange={(v) => setPicked(String(v))}
              className="max-h-72 gap-1 overflow-y-auto"
            >
              {results.map(({ request, item, contact }) => (
                <div
                  key={request.id}
                  className="flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-neutral-50"
                >
                  <RadioGroupItem
                    value={request.id}
                    id={`ci-${request.id}`}
                    className={`size-5 ${focus}`}
                  />
                  <Label
                    htmlFor={`ci-${request.id}`}
                    className="flex flex-1 flex-col items-start py-2 font-normal"
                  >
                    <span className="font-medium text-ink">
                      {item.name}{" "}
                      <span className="font-normal text-neutral-600 tabular-nums">
                        {request.id}
                      </span>
                    </span>
                    <span className="text-sm text-neutral-600">
                      {contact.name}
                      {request.dueAt && (
                        <>
                          {" "}
                          · due <time dateTime={request.dueAt}>{formatDay(request.dueAt)}</time>
                        </>
                      )}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={`h-11 px-4 ${focus}`}
          >
            Cancel
          </Button>
          <Button
            disabled={!valid}
            aria-describedby={!valid ? "check-in-hint" : undefined}
            onClick={() => {
              onConfirm(picked);
              setQ("");
              setPicked("");
            }}
            className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
          >
            Check in
          </Button>
        </DialogFooter>
        {!valid && (
          <p id="check-in-hint" className="sr-only">
            Pick a loan first
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
