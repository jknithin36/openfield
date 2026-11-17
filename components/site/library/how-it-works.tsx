"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

import type { ItemType } from "@/lib/types";
import { TYPE_PLURAL } from "@/lib/library/public";
import { focusRing } from "@/components/dashboard/shared/fields";
import { tel, usePublicLibrary } from "@/components/site/library/use-public-library";

const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;
const weeks = (days: number) => (days % 7 === 0 ? `${days / 7} weeks` : `${days} days`);
const list = (xs: (string | number)[]) =>
  xs.length > 1 ? `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}` : String(xs[0] ?? "");

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-border pt-8">
      <h2 id={id} className="text-2xl font-medium tracking-[-0.02em] text-ink">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-lg leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export function HowItWorks() {
  const d = usePublicLibrary();
  const shell = (c: React.ReactNode) => (
    <div className="mx-auto w-full max-w-[760px] px-6 py-10 lg:py-14">{c}</div>
  );
  if (!d)
    return shell(
      <>
        <h1 className="text-3xl font-medium text-ink sm:text-4xl">How borrowing works</h1>
        <p className="mt-4 text-neutral-600">Loading…</p>
      </>,
    );

  const { lib, org } = d;
  const s = lib.settings;
  const live = lib.items.filter((i) => !i.archived);
  // Loan length per type, from the items themselves.
  const byType = (Object.keys(TYPE_PLURAL) as ItemType[])
    .map((t) => ({
      t,
      days: [...new Set(live.filter((i) => i.type === t).map((i) => i.loanDays))],
    }))
    .filter((x) => x.days.length);
  const lengths = new Map<number, ItemType[]>();
  for (const x of byType)
    for (const dd of x.days) lengths.set(dd, [...(lengths.get(dd) ?? []), x.t]);
  const counts = byType.map(
    (x) => `${live.filter((i) => i.type === x.t).length} ${TYPE_PLURAL[x.t].toLowerCase()}`,
  );

  const FAQ = [
    { q: "Does it cost anything?", a: "No. Borrowing is free, and so is shipping both ways." },
    {
      q: "Can I borrow for my school or clinic?",
      a: `Yes, if you work in the ${org.regionName} region. Choose “My students” or “Someone I support at work” when you ask.`,
    },
    {
      q: "How long will I wait?",
      a: `We look at every request within ${s.waitingTargetDays} working days. If all copies are out, you join a waitlist and each item page shows the usual wait.`,
    },
    {
      q: "Can I buy an item I've borrowed?",
      a: "We don't sell items, but we're happy to tell you where to buy one and help with funding forms.",
    },
    {
      q: "What if I need it longer?",
      a: `Call us before the due date. We can add ${list(s.extensionWeeks)} weeks, once, if no one is waiting for it.`,
    },
  ];

  return shell(
    <>
      <p className="text-base text-neutral-600">
        <Link href="/library" className={link}>
          Lending library
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-[-0.03em] text-ink sm:text-4xl">
        How borrowing works
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-neutral-700">
        Free to borrow, free to send back. Here&apos;s everything you need to know.
      </p>

      <nav aria-labelledby="contents-h" className="mt-8">
        <h2 id="contents-h" className="text-base font-semibold text-ink">
          Contents
        </h2>
        <ul className="mt-2 grid gap-1.5 text-base sm:grid-cols-2">
          {[
            ["who", "Who can borrow"],
            ["what", "What you can borrow"],
            ["how-long", "How long you can keep it"],
            ["getting", "Getting it and sending it back"],
            ["care", "Cleaning and care"],
            ["extensions", "Extensions"],
            ["lost", "If something is lost or broken"],
            ["faq", "Questions"],
          ].map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className={link}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 flex flex-col gap-10">
        <Section id="who" title="Who can borrow">
          <p>
            Anyone who lives or works in the {org.regionName} region: families, people with
            disabilities, teachers, therapists and support workers.
          </p>
          <p>You can have up to {s.loanLimitPerPerson} items at a time.</p>
        </Section>

        <Section id="what" title="What you can borrow">
          <p>
            We have {list(counts)}. Each item page says what&apos;s in the box and who it suits.
          </p>
          <p>
            <Link href="/library" className={link}>
              Browse the library
            </Link>
          </p>
        </Section>

        <Section id="how-long" title="How long you can keep it">
          <ul className="flex list-disc flex-col gap-1.5 pl-6">
            {[...lengths.entries()]
              .sort((a, b) => b[0] - a[0])
              .map(([days, types]) => (
                <li key={days}>
                  {list(types.map((t) => TYPE_PLURAL[t]))}: {weeks(days)}
                </li>
              ))}
          </ul>
          <p>
            Your due date is in your email and on the{" "}
            <Link href="/library/request/status" className={link}>
              check a request
            </Link>{" "}
            page.
          </p>
        </Section>

        <Section id="getting" title="Getting it and sending it back">
          <p>
            We ship it to you for free, usually within 3 days of saying yes. Or pick it up at{" "}
            {org.address}, {org.hours}.
          </p>
          <p>
            Every box has a prepaid return label. Pack everything back in the box, stick the label
            on, and drop it at any post office.
          </p>
        </Section>

        <Section id="care" title="Cleaning and care">
          <p>
            We clean and check every item before it goes out. You don&apos;t need to clean it before
            sending it back, but please keep all the pieces together.
          </p>
          <p>Charge devices before you return them, and please don&apos;t change their settings.</p>
        </Section>

        <Section id="extensions" title="Extensions">
          <p>
            If you need more time, call us before the due date. We can add {list(s.extensionWeeks)}{" "}
            weeks, once per loan, as long as no one else is waiting for the item.
          </p>
        </Section>

        <Section id="lost" title="If something is lost or broken">
          <p>
            Accidents happen. Tell us and we&apos;ll sort it out. You won&apos;t be charged for
            normal wear and tear.
          </p>
          <p>
            Call{" "}
            <a href={`tel:${tel(org.phone)}`} className={link}>
              {org.phone}
            </a>{" "}
            or{" "}
            <Link href="/contact" className={link}>
              send us a message
            </Link>
            .
          </p>
        </Section>

        <Section id="faq" title="Questions">
          <div className="flex flex-col divide-y divide-border border-y border-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group">
                <summary
                  className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-lg font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none [&::-webkit-details-marker]:hidden ${focusRing}`}
                >
                  {f.q}
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <p className="pb-4 text-lg leading-relaxed text-ink">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>
      </div>
    </>,
  );
}
