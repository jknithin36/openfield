"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { requestById } from "@/lib/library/selectors";
import { waitlistPosition } from "@/lib/library/public";
import { tel, usePublicLibrary } from "@/components/site/library/use-public-library";
import {
  link,
  RequestShell,
  usePageTitle,
} from "@/components/site/library/request-steps/request-steps";

export function RequestSent() {
  const ref = useSearchParams().get("ref") ?? "";
  const d = usePublicLibrary();
  const h = useRef<HTMLHeadingElement>(null);
  usePageTitle("Request sent", false);
  const r = d ? requestById(d.lib, ref) : undefined;
  useEffect(() => {
    if (r) h.current?.focus();
  }, [r]);

  if (!d)
    return (
      <RequestShell>
        <p className="text-neutral-600">Loading…</p>
      </RequestShell>
    );
  if (!r)
    return (
      <RequestShell>
        <h1 className="text-3xl font-medium text-ink">We can&apos;t find that request</h1>
        <p className="mt-3 text-lg text-neutral-700">
          <Link href="/library/request/status" className={link}>
            Check a request
          </Link>{" "}
          with your reference number and email.
        </p>
      </RequestShell>
    );

  const item = d.lib.items.find((i) => i.id === r.itemId);
  const person = d.lib.contacts.find((c) => c.id === r.contactId);
  const waitlisted = r.status === "waitlisted";
  const pos = waitlisted ? waitlistPosition(d.lib, r) : 0;
  const target = d.lib.settings.waitingTargetDays;

  return (
    <RequestShell>
      <div className="rounded-2xl border-4 border-emerald-700 bg-white p-8 text-center">
        <h1 ref={h} tabIndex={-1} className="text-3xl font-semibold text-ink outline-none">
          {waitlisted ? "You're on the waitlist" : "Request sent"}
        </h1>
        <p className="mt-3 text-lg text-ink">Your reference number is</p>
        <p className="mt-1 text-3xl font-semibold tracking-wide text-ink tabular-nums">{r.id}</p>
      </div>

      <div className="mt-8 flex flex-col gap-4 text-lg leading-relaxed text-ink">
        {person?.email && (
          <p>
            We&apos;ve sent a confirmation to{" "}
            <strong className="font-semibold">{person.email}</strong>.
          </p>
        )}
        <p>
          You asked to borrow{" "}
          <Link href={`/library/${item?.slug}`} className={link}>
            {item?.name}
          </Link>
          .
        </p>

        <h2 className="mt-4 text-2xl font-medium">What happens next</h2>
        {waitlisted ? (
          <ol className="flex list-decimal flex-col gap-2 pl-6">
            <li>You&apos;re number {pos} on the waitlist.</li>
            <li>When a copy comes back, we check and clean it.</li>
            <li>
              We&apos;ll email you when it&apos;s ready, then{" "}
              {r.delivery === "ship" ? "ship it to you" : "hold it for you to pick up"}.
            </li>
          </ol>
        ) : (
          <ol className="flex list-decimal flex-col gap-2 pl-6">
            <li>We&apos;ll look at your request within {target} working days.</li>
            <li>
              {r.delivery === "ship"
                ? "Once approved, we ship it within 3 days."
                : "Once approved, we get it ready for you to pick up."}
            </li>
            <li>
              {r.delivery === "ship"
                ? "We'll email you when it's on its way."
                : "We'll email you when it's ready."}
            </li>
          </ol>
        )}

        <ul className="mt-4 flex flex-col gap-2">
          <li>
            <Link href="/library/request/status" className={link}>
              Check your request
            </Link>
          </li>
          <li>
            <Link href="/library" className={link}>
              Browse more items
            </Link>
          </li>
        </ul>
        <p className="text-base text-neutral-700">
          Questions? Call{" "}
          <a href={`tel:${tel(d.org.phone)}`} className={link}>
            {d.org.phone}
          </a>
          , {d.org.hours}.
        </p>
      </div>
    </RequestShell>
  );
}
