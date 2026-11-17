import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { cn } from "cn";

// Two equal, photo-led halves — one per way of learning — under a single
// heading. Not used elsewhere on the page. Phones: one under the other.
// Photos from Unsplash (Unsplash License).
const OPTIONS = [
  {
    heading: "On your own",
    body: "Start any course without an account. Your progress is saved on this device, so you can pick up where you left off.",
    href: "/learn/my-learning",
    cta: "See my learning",
    image: "/learn-solo.jpg",
    alt: "A woman sits on a sunny doorstep among plants, smiling at her laptop.",
    position: "object-[40%_50%]",
  },
  {
    heading: "As a team",
    body: "Short, practical courses for schools, clinics and workplaces. Watch together in a staff meeting, or share the link.",
    href: "/learn?for=teacher,provider,employer",
    cta: "Find courses for your team",
    image: "/learn-team.jpg",
    alt: "Four colleagues smile and point at a laptop together at a wooden table.",
    position: "object-[50%_40%]",
  },
] as const;

const link =
  "rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring";

export function HomeLearningBanner() {
  return (
    <section
      aria-labelledby="learning-heading"
      className="mx-auto w-full max-w-[1400px] px-6 py-14 lg:px-8 lg:py-20"
    >
      <h2
        id="learning-heading"
        className="text-2xl leading-tight font-medium tracking-[-0.03em] text-ink sm:text-[28px]"
      >
        Learn on your own, or as a team
      </h2>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-8 lg:gap-12">
        {OPTIONS.map(({ heading, body, href, cta, image, alt, position }) => (
          <div key={heading}>
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-muted">
              <Image
                src={image}
                alt={alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className={cn("object-cover", position)}
              />
            </div>
            <h3 className="mt-5 text-lg font-medium tracking-[-0.01em] text-ink">{heading}</h3>
            <p className="mt-1.5 max-w-md text-base leading-relaxed text-neutral-600">{body}</p>
            <Link href={href} className={cn(link, "mt-3 inline-flex items-center gap-1 text-base")}>
              {cta}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="size-4"
                aria-hidden="true"
              />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
