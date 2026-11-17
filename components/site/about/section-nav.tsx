"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { focusRing } from "@/components/dashboard/shared/fields";

export const ABOUT_PAGES = [
  { href: "/about", label: "About Openfield" },
  { href: "/about/team", label: "Our team" },
  { href: "/about/impact", label: "Our impact" },
  { href: "/about/funding", label: "How we're funded" },
  { href: "/about/careers", label: "Work with us" },
] as const;

/** "In this section": a list at the top on phones, a sidebar on desktop. */
export function SectionNav({ current }: { current?: string }) {
  return (
    <nav aria-label="About Openfield">
      <p className="mb-2 px-3 text-sm font-semibold text-ink">In this section</p>
      <ul className="flex flex-col gap-0.5 border-l-2 border-border">
        {ABOUT_PAGES.map((p) => {
          const on = p.href === current;
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={on ? "page" : undefined}
                className={`-ml-0.5 flex min-h-11 items-center border-l-2 px-3 text-base outline-none ${focusRing} ${on ? "border-brand font-semibold text-brand" : "border-transparent text-ink hover:border-neutral-400 hover:text-brand"}`}
              >
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function LiveSectionNav() {
  return <SectionNav current={usePathname()} />;
}
