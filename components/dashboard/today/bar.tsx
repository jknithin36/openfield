// Thin horizontal bar for single-series bar lists. Purely visual — the value
// is always written as text next to it, so the bar is aria-hidden.
export function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div aria-hidden="true" className="mt-1.5 h-2 w-full rounded-full bg-neutral-100">
      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
    </div>
  );
}
