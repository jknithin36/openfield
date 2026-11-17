import Image from "next/image";
import Link from "next/link";
import { HomeCenters } from "@/components/home-centers";
import { HomeCourses } from "@/components/home-courses";
import { HomeEvents } from "@/components/home-events";
import { HomeFamilies } from "@/components/home-families";
import { HomeImpact } from "@/components/home-impact";
import { HomeLearningBanner } from "@/components/home-learning-banner";
import { HomeLibrary } from "@/components/home-library";
import { HomeChat } from "@/components/home-chat";
import { HomeNewsletter } from "@/components/home-newsletter";
import { HomePartners } from "@/components/home-partners";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  BookIllustration,
  CapIllustration,
  FamilyIllustration,
  TalkIllustration,
} from "@/components/illustrations";

// Written as what people want to do, not department names (GOV.UK:
// "start with user needs"). Only 4 choices, plain links, one click each.
const HELP_LINKS = [
  { href: "/learn", label: "Find free courses", Illustration: CapIllustration },
  {
    href: "/library",
    label: "Borrow a book or device",
    Illustration: BookIllustration,
  },
  {
    href: "/families",
    label: "Get help for my family",
    Illustration: FamilyIllustration,
  },
  {
    href: "/contact",
    label: "Talk to someone",
    Illustration: TalkIllustration,
  },
] as const;

export default function Home() {
  return (
    <>
      <section
        aria-labelledby="home-hero-title"
        className="mx-auto w-full max-w-[1400px] px-6 pt-4 pb-14 lg:px-8 lg:pt-4 lg:pb-16"
      >
        {/* Banner: photo on the left; our words on a soft gradient panel
          on the right whose curved left edge bulges over the photo. Phone: photo on top, words below. */}
        <div className="overflow-hidden rounded-2xl bg-linear-to-br from-[#e8f0f2] to-[#e6eee4] lg:grid lg:min-h-[300px] lg:grid-cols-[minmax(0,48%)_minmax(0,1fr)]">
          <div className="relative aspect-video lg:aspect-auto">
            {/* Photo: Raj Tuladhar on Unsplash (Unsplash License). */}
            <Image
              src="/hero-friends.jpg"
              alt="Friends, two of them in wheelchairs, chat and smile around a café table outdoors."
              fill
              priority
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover object-[50%_40%]"
            />
          </div>

          <div className="relative flex flex-col justify-center bg-linear-to-br from-[#e8f0f2] to-[#e6eee4] p-6 sm:p-8 lg:-ml-16 lg:rounded-l-[6rem_50%] lg:py-10 lg:pr-14 lg:pl-28">
            <h1
              id="home-hero-title"
              className="max-w-[18ch] text-3xl leading-[1.1] font-medium tracking-[-0.03em] text-balance text-ink sm:text-4xl lg:text-5xl"
            >
              Support for every stage of life.
            </h1>
            <p className="mt-3 max-w-[36rem] text-base leading-relaxed text-pretty text-neutral-600 sm:mt-4 sm:text-lg">
              Free training, devices to borrow, and guides for families.
            </p>
          </div>
        </div>

        <div className="mt-8 lg:mt-10">
          <nav aria-labelledby="help-heading">
            <h2
              id="help-heading"
              className="text-2xl leading-tight font-medium tracking-[-0.03em] text-ink dark:text-foreground"
            >
              How can we help?
            </h2>
            <ItemGroup className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {HELP_LINKS.map(({ href, label, Illustration }) => (
                <div role="listitem" key={href}>
                  <Item
                    variant="outline"
                    render={<Link href={href} />}
                    className="h-full min-h-20 gap-4 px-4 py-4 focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    <ItemMedia className="size-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                      <Illustration className="size-9" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-base font-medium">{label}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        strokeWidth={2}
                        className="size-5 text-brand"
                        aria-hidden="true"
                      />
                    </ItemActions>
                  </Item>
                </div>
              ))}
            </ItemGroup>
          </nav>
        </div>
      </section>
      <HomeImpact />
      <HomeCenters />
      <HomeLibrary />
      <HomeCourses />
      <HomeFamilies />
      <HomeEvents />
      <HomeLearningBanner />
      <HomePartners />
      <HomeNewsletter />
      <HomeChat />
    </>
  );
}
