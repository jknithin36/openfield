import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { tactile, tactileBase } from "@/components/tactile-button";
import { FAMILY_GUIDES } from "@/lib/content";

// PLACEHOLDER PHONE NUMBER — (555) numbers are fictional; use the real line.
const PHONE_DISPLAY = "(555) 014-2200";
const PHONE_TEL = "+15550142200";

const link =
  "rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring";

export function HomeFamilies() {
  return (
    <section
      aria-labelledby="families-heading"
      className="mx-auto w-full max-w-[1400px] px-6 py-14 lg:px-8 lg:py-20"
    >
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
        {/* Photo: Vitaly Gariev on Unsplash (Unsplash License). */}
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-muted">
          <Image
            src="/families-reading.jpg"
            alt="A parent and young child lie in a play tent, laughing together over a picture book."
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </div>

        <div>
          <h2
            id="families-heading"
            className="text-2xl leading-tight font-medium tracking-[-0.03em] text-ink sm:text-[28px]"
          >
            Help for families
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-pretty text-neutral-600">
            Plain-language guides for each stage of your child&apos;s life, and a family team you
            can call.
          </p>

          <h3 className="sr-only">Guides by stage</h3>
          <ul className="mt-6 flex flex-col gap-3">
            {FAMILY_GUIDES.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={cn(link, "text-base")}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-start gap-3">
            <Button
              nativeButton={false}
              render={<Link href="/families" />}
              size="lg"
              className={cn(tactileBase, tactile.primary, "extend-touch-target h-10 px-4")}
            >
              Visit the family hub
            </Button>
            <p className="text-sm text-neutral-600">
              or call{" "}
              <a href={`tel:${PHONE_TEL}`} className={cn(link, "tabular-nums")}>
                {PHONE_DISPLAY}
              </a>
              , Mon–Fri 9–5
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
