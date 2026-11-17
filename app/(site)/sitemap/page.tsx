import type { Metadata } from "next";
import Link from "next/link";

import { CENTERS } from "@/data/centers";
import { STAGES, STAGE_PUBLIC } from "@/lib/families/public";

export const metadata: Metadata = {
  title: "Sitemap · Openfield",
  description: "Every page on the Openfield website.",
};

const link =
  "rounded-sm text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand focus-visible:ring-3 focus-visible:ring-ring";

const GROUPS: Array<{ title: string; links: Array<[string, string]> }> = [
  {
    title: "Find help",
    links: [
      ["/centers", "Find help by topic"],
      ...CENTERS.map((c) => [`/centers/${c.slug}`, c.name] as [string, string]),
    ],
  },
  {
    title: "Learn",
    links: [
      ["/learn", "Free courses"],
      ["/learn/my-learning", "My learning"],
    ],
  },
  {
    title: "Borrow",
    links: [
      ["/library", "Lending library"],
      ["/library/how-it-works", "How borrowing works"],
      ["/library/request/status", "Check a library request"],
    ],
  },
  {
    title: "Events",
    links: [
      ["/events", "Upcoming events"],
      ["/events?when=past", "Past events"],
      ["/events/booking", "Manage your booking"],
    ],
  },
  {
    title: "Families",
    links: [
      ["/families", "Help for families"],
      ...STAGES.map((s) => [`/families/stage/${s}`, STAGE_PUBLIC[s]] as [string, string]),
    ],
  },
  {
    title: "About",
    links: [
      ["/about", "About Openfield"],
      ["/about/team", "Our team"],
      ["/about/impact", "Our impact"],
      ["/about/funding", "How we're funded"],
      ["/about/careers", "Work with us"],
      ["/donate", "Support our work"],
    ],
  },
  {
    title: "Help",
    links: [
      ["/contact", "Contact us"],
      ["/accessibility", "Accessibility statement"],
      ["/privacy", "Privacy"],
      ["/terms", "Terms of use"],
      ["/sign-in", "Staff sign in"],
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-ink sm:text-5xl">Sitemap</h1>
      <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <section key={g.title} aria-labelledby={`sm-${g.title}`}>
            <h2 id={`sm-${g.title}`} className="text-xl font-medium text-ink">
              {g.title}
            </h2>
            <ul className="mt-3 flex flex-col">
              {g.links.map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`inline-flex min-h-11 items-center text-base ${link}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
