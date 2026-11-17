import Image from "next/image";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { FooterContact } from "@/components/site/footer-contact";

const COLUMNS = [
  {
    heading: "Explore",
    links: [
      { href: "/centers", label: "Find help by topic" },
      { href: "/learn", label: "Free courses" },
      { href: "/library", label: "Lending library" },
      { href: "/events", label: "Events" },
      { href: "/families", label: "Help for families" },
    ],
  },
  {
    heading: "Organization",
    links: [
      { href: "/about", label: "About us" },
      { href: "/about/team", label: "Our team" },
      { href: "/about/impact", label: "Our impact" },
      { href: "/about/funding", label: "How we're funded" },
      { href: "/about/careers", label: "Careers" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    heading: "Help",
    links: [
      { href: "/accessibility", label: "Accessibility statement" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms of use" },
      { href: "/sitemap", label: "Sitemap" },
    ],
  },
] as const;

const footerLink =
  "rounded-sm text-white/85 underline-offset-4 outline-none hover:text-white hover:underline focus-visible:ring-3 focus-visible:ring-ring";

// Cached so the page can be prerendered; refreshes on each build/deploy.
async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

export function SiteFooter() {
  return (
    <footer className="bg-brand-strong text-white print:hidden">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-14 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-sm text-lg font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              <Image src="/logo.svg" alt="" width={28} height={28} className="size-7 invert" />
              Openfield
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/80">
              Free training, devices to borrow, and guides for people with disabilities and the
              families who support them.
            </p>
            <FooterContact />
          </div>

          {COLUMNS.map(({ heading, links }) => (
            <nav key={heading} aria-labelledby={`footer-${heading}`}>
              <h2 id={`footer-${heading}`} className="text-sm font-semibold text-white">
                {heading}
              </h2>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className={footerLink}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Separator className="mt-12 bg-white/15" />

        <div className="mt-6 flex flex-col gap-2 text-sm text-white/70 sm:flex-row sm:justify-between">
          <p>
            © <CopyrightYear /> Openfield. All rights reserved.
          </p>
          <p>Openfield is a nonprofit organization.</p>
        </div>
      </div>
    </footer>
  );
}
