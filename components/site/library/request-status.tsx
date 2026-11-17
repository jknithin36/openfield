"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import type { LibraryData, LoanRequest, OrganizationSettings } from "@/lib/types";
import {
  findRequestByRefAndEmail,
  KIND_DECLINE,
  PUBLIC_STATUS,
  requestTimeline,
  waitlistPosition,
} from "@/lib/library/public";
import { ErrorSummary, type FormError } from "@/components/dashboard/shared/form-errors";
import { focusRing, TextField } from "@/components/dashboard/shared/fields";
import { tel, usePublicLibrary } from "@/components/site/library/use-public-library";
import {
  link,
  RequestShell,
  usePageTitle,
} from "@/components/site/library/request-steps/request-steps";

const longDay = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
    new Date(iso),
  );

export function RequestStatus() {
  const d = usePublicLibrary();
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormError[]>([]);
  const [foundId, setFoundId] = useState<string | null>(null);
  const resultH = useRef<HTMLHeadingElement>(null);
  usePageTitle("Check a request", errors.length > 0);

  const submit = () => {
    if (!d) return;
    const e: FormError[] = [];
    if (!ref.trim()) e.push({ fieldId: "ref", message: "Enter your reference number" });
    if (!email.trim()) e.push({ fieldId: "status-email", message: "Enter your email address" });
    if (!e.length) {
      const r = findRequestByRefAndEmail(d.lib, d.lib.contacts, ref, email);
      // One generic message: never reveal which part was wrong.
      if (!r)
        e.push({
          fieldId: "ref",
          message: "We couldn't find a request with those details. Check them and try again.",
        });
      else {
        setFoundId(r.id);
        setTimeout(() => resultH.current?.focus(), 0);
      }
    }
    if (e.length) setFoundId(null);
    setErrors(e);
  };

  // Re-read from the store on every render, so it follows staff changes live.
  const found = d && foundId ? d.lib.requests.find((r) => r.id === foundId) : undefined;

  return (
    <RequestShell>
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-ink">Check a request</h1>
      <p className="mt-3 text-lg text-neutral-700">See where your library request is up to.</p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mt-8 flex flex-col gap-6"
      >
        <ErrorSummary errors={errors} />
        <TextField
          id="ref"
          label="Reference number"
          hint="For example, R-1091. It's in your confirmation email."
          value={ref}
          onChange={setRef}
          autoComplete="off"
          error={errors.find((x) => x.fieldId === "ref")?.message}
        />
        <TextField
          id="status-email"
          label="Email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          hint="The one you used when you asked."
          value={email}
          onChange={setEmail}
          error={errors.find((x) => x.fieldId === "status-email")?.message}
        />
        <Button
          type="submit"
          disabled={!d}
          className={`h-12 w-fit bg-brand px-8 text-base text-white hover:bg-brand-hover ${focusRing}`}
        >
          Check request
        </Button>
      </form>

      {found && d && <Result r={found} lib={d.lib} org={d.org} headingRef={resultH} />}
    </RequestShell>
  );
}

function Result({
  r,
  lib,
  org,
  headingRef,
}: {
  r: LoanRequest;
  lib: LibraryData;
  org: OrganizationSettings;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const item = lib.items.find((i) => i.id === r.itemId);
  const steps = requestTimeline(r);
  const showTimeline = r.status !== "declined" && r.status !== "waitlisted";

  return (
    <section aria-labelledby="result-h" className="mt-12 border-t-4 border-brand pt-8">
      <p className="text-base text-neutral-600">Request {r.id}</p>
      <h2
        ref={headingRef}
        id="result-h"
        tabIndex={-1}
        className="mt-1 text-2xl font-medium text-ink outline-none"
      >
        {item ? (
          <Link href={`/library/${item.slug}`} className={link}>
            {item.name}
          </Link>
        ) : (
          "Library item"
        )}
      </h2>
      <p className="mt-3 text-xl font-semibold text-ink">{PUBLIC_STATUS[r.status]}</p>

      {r.status === "waitlisted" && (
        <p className="mt-2 text-lg text-ink">
          You&apos;re number {waitlistPosition(lib, r)} on the waitlist. We&apos;ll email you when a
          copy is ready.
        </p>
      )}
      {r.status === "declined" && (
        <p className="mt-2 text-lg leading-relaxed text-ink">
          {KIND_DECLINE[r.declineReason ?? "other"]}
        </p>
      )}
      {r.status === "on-loan" && r.dueAt && (
        <p className="mt-2 text-lg text-ink">
          Please send it back by <strong className="font-semibold">{longDay(r.dueAt)}</strong>. Need
          more time? Call us on{" "}
          <a href={`tel:${tel(org.phone)}`} className={link}>
            {org.phone}
          </a>
          . We can extend it if no one is waiting.
        </p>
      )}

      {showTimeline && (
        <ol className="mt-8 flex flex-col" aria-label="Progress">
          {steps.map((s, i) => (
            <li key={s.label} className="relative flex gap-4 pb-6 last:pb-0">
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-8 left-[15px] h-[calc(100%-2rem)] w-0.5 ${s.state === "done" ? "bg-brand" : "bg-neutral-200"}`}
                />
              )}
              <span
                aria-hidden="true"
                className={`relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${s.state === "done" ? "border-brand bg-brand text-white" : s.state === "current" ? "border-brand bg-white" : "border-neutral-300 bg-white"}`}
              >
                {s.state === "done" ? (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-4" />
                ) : s.state === "current" ? (
                  <span className="size-2.5 rounded-full bg-brand" />
                ) : null}
              </span>
              <div className="pt-1">
                <p
                  className={`text-base ${s.state === "upcoming" ? "text-neutral-600" : "font-semibold text-ink"}`}
                >
                  {s.label}
                  <span className="sr-only">
                    {s.state === "done"
                      ? ": done"
                      : s.state === "current"
                        ? ": in progress"
                        : ": not yet"}
                  </span>
                </p>
                {s.at && (
                  <p className="text-[15px] text-neutral-700">
                    <time dateTime={s.at}>{longDay(s.at)}</time>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
