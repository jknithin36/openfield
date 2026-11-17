"use client";

import { useCallback, useEffect, useRef } from "react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";

/**
 * Open/close a record via ?id= (deep-linkable). `open(id, trigger)` remembers
 * the trigger so focus returns to it when the panel closes.
 */
export function useRecordParam(param = "id") {
  const { searchParams, setParams } = useUrlState();
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const id = searchParams.get(param);
  const open = useCallback(
    (nextId: string, trigger?: HTMLElement) => {
      if (trigger) returnFocusRef.current = trigger;
      setParams({ [param]: nextId });
    },
    [param, setParams],
  );
  const close = useCallback(() => setParams({ [param]: null }), [param, setParams]);
  return { id, open, close, returnFocusRef };
}

/**
 * Side panel for one record (shadcn Sheet, right side). Focus moves to the
 * title on open, is trapped, Esc closes, focus returns to the trigger.
 * Actions stay pinned to the bottom.
 */
export function RecordPanel({
  open,
  onClose,
  returnFocusRef,
  recordKey,
  eyebrow,
  title,
  meta,
  actions,
  children,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
  /** When this changes while open (e.g. moved to the next record), focus the new title. */
  recordKey?: string | null;
  /** Small line above the title, e.g. the record id "R-1042". */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** Status line under the title, in words. */
  meta?: React.ReactNode;
  /** Sticky footer actions. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open, recordKey]);
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        initialFocus={titleRef}
        finalFocus={returnFocusRef}
        className="w-full gap-0 p-0 sm:max-w-md"
      >
        <div className="flex-1 overflow-y-auto">
          <header className="px-5 pt-5 pr-12 pb-4">
            {eyebrow && (
              <p className="text-sm font-medium text-neutral-600 tabular-nums">{eyebrow}</p>
            )}
            <SheetTitle
              ref={titleRef}
              tabIndex={-1}
              className="mt-1 text-xl leading-snug font-medium text-ink outline-none"
            >
              {title}
            </SheetTitle>
            {meta && (
              <SheetDescription className="mt-1 text-[15px] text-neutral-700">
                {meta}
              </SheetDescription>
            )}
          </header>
          {children}
        </div>
        {actions && (
          <footer className="border-t border-border bg-white px-5 py-4">{actions}</footer>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** A panel section with an h3 heading. */
export function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border px-5 py-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-2 text-[15px]">{children}</div>
    </section>
  );
}

/** Label/value pairs inside a panel section. */
export function PanelFacts({ facts }: { facts: Array<[string, React.ReactNode]> }) {
  return (
    <dl>
      {facts.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 py-1.5">
          <dt className="text-neutral-600">{label}</dt>
          <dd className="text-right font-medium text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
