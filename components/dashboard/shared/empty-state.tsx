// One plain sentence per tab, e.g. "No requests waiting. Nice work."
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-base text-neutral-600">
      {children}
    </p>
  );
}
