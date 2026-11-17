import { focusRing } from "@/components/dashboard/shared/fields";

/** Jump links, only for sections that have content. */
export function OnThisPage({ links }: { links: Array<{ id: string; label: string }> }) {
  if (!links.length) return null;
  return (
    <nav aria-label="On this page" className="rounded-xl bg-neutral-50 px-5 py-4">
      <p className="text-sm font-semibold text-ink">On this page</p>
      <ul className="mt-1 flex flex-wrap gap-x-5">
        {links.map((l) => (
          <li key={l.id}>
            <a
              href={`#${l.id}`}
              className={`inline-flex min-h-11 items-center rounded-sm text-base font-medium text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand ${focusRing}`}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
