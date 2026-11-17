import type { CenterPerson } from "@/lib/types";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Avatars are decorative; the name is the text. */
export function TeamList({ people }: { people: CenterPerson[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((p) => (
        <li key={p.name} className="flex gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg font-semibold text-brand"
          >
            {initials(p.name)}
          </span>
          <div>
            <h3 className="text-lg font-medium text-ink">{p.name}</h3>
            <p className="text-[15px] text-neutral-600">{p.role}</p>
            <p className="mt-1.5 text-base leading-relaxed text-ink">{p.bio}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
