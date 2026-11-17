"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cancelBooking, findBooking } from "@/store/event-booking";
import type { EventsData, Registration } from "@/lib/types";
import { ACC_TYPE_LABEL, eventById, partySize, waitlistFor } from "@/lib/events/selectors";
import { dayText, downloadIcs, timeText, whereText } from "@/lib/events/public";
import { ErrorSummary, type FormError } from "@/components/dashboard/shared/form-errors";
import { focusRing, TextField } from "@/components/dashboard/shared/fields";
import { useCenterSources } from "@/components/site/centers/use-center-sources";
import {
  link,
  RequestShell,
  usePageTitle,
} from "@/components/site/library/request-steps/request-steps";

const ACC_STATUS = {
  requested: "we're arranging it",
  arranged: "arranged",
  unable: "we couldn't arrange this — we'll contact you",
} as const;
const STATUS_WORDS: Record<Registration["status"], string> = {
  registered: "You're booked",
  waitlisted: "You're on the waitlist",
  attended: "You came to this event",
  "no-show": "You were booked on this event",
  cancelled: "Cancelled",
};

function Details({ data, reg }: { data: EventsData; reg: Registration }) {
  const e = eventById(data, reg.eventId)!;
  const accs = data.accommodations.filter((a) => a.registrationId === reg.id);
  const pos =
    reg.status === "waitlisted" ? waitlistFor(data, e.id).findIndex((r) => r.id === reg.id) + 1 : 0;
  return (
    <>
      <dl className="mt-6 grid gap-x-6 gap-y-3 border-y border-border py-5 text-base sm:grid-cols-[10rem_minmax(0,1fr)]">
        <dt className="font-semibold text-ink">Event</dt>
        <dd>
          <Link href={`/events/${e.slug}`} className={link}>
            {e.title}
          </Link>
        </dd>
        <dt className="font-semibold text-ink">When</dt>
        <dd className="text-ink">
          {dayText(e)}, {timeText(e)}
        </dd>
        <dt className="font-semibold text-ink">Where</dt>
        <dd className="text-ink">
          {e.format === "online"
            ? "Online — we'll email the link the day before"
            : `${whereText(e)}, ${e.venue?.address ?? ""}`}
        </dd>
        <dt className="font-semibold text-ink">Places</dt>
        <dd className="text-ink">
          {partySize(reg) === 1 ? "1 place" : `${partySize(reg)} places`}
        </dd>
        <dt className="font-semibold text-ink">Status</dt>
        <dd className="text-ink">
          {STATUS_WORDS[reg.status]}
          {pos ? ` — number ${pos} on the waitlist` : ""}
        </dd>
        {accs.length > 0 && (
          <>
            <dt className="font-semibold text-ink">Access needs</dt>
            <dd>
              <ul className="flex flex-col gap-1 text-ink">
                {accs.map((a) => (
                  <li key={a.id}>
                    {ACC_TYPE_LABEL[a.type]}: {ACC_STATUS[a.status]}
                  </li>
                ))}
              </ul>
            </dd>
          </>
        )}
      </dl>
      {(reg.status === "registered" || reg.status === "waitlisted") && (
        <button
          type="button"
          onClick={() => downloadIcs(e)}
          className={`mt-4 inline-flex min-h-11 items-center gap-1.5 text-base ${link}`}
        >
          <HugeiconsIcon
            icon={Calendar03Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="size-5"
          />
          Add to calendar
        </button>
      )}
    </>
  );
}

// ── /events/registered ────────────────────────────────────────────────────
export function EventRegistered() {
  const ref = useSearchParams().get("ref") ?? "";
  const s = useCenterSources();
  const h = useRef<HTMLHeadingElement>(null);
  usePageTitle("Booking confirmed", false);
  const reg = s?.ev.registrations.find((r) => r.ref === ref);
  useEffect(() => {
    if (reg) h.current?.focus();
  }, [reg]);
  if (!s)
    return (
      <RequestShell>
        <p className="text-neutral-600">Loading…</p>
      </RequestShell>
    );
  if (!reg)
    return (
      <RequestShell>
        <h1 className="text-3xl font-medium text-ink">We can&apos;t find that booking</h1>
        <p className="mt-3 text-lg">
          <Link href="/events/booking" className={link}>
            Find your booking
          </Link>{" "}
          with your reference and email.
        </p>
      </RequestShell>
    );
  const e = eventById(s.ev, reg.eventId)!;
  const waitlisted = reg.status === "waitlisted";
  const asked = s.ev.accommodations.some((a) => a.registrationId === reg.id);

  return (
    <RequestShell>
      <div className="rounded-2xl border-4 border-emerald-700 bg-white p-8 text-center">
        <h1 ref={h} tabIndex={-1} className="text-3xl font-semibold text-ink outline-none">
          {waitlisted ? "You're on the waitlist" : "You're registered"}
        </h1>
        <p className="mt-3 text-lg text-ink">Your reference is</p>
        <p className="mt-1 text-3xl font-semibold tracking-wide text-ink tabular-nums">{reg.ref}</p>
      </div>
      <Details data={s.ev} reg={reg} />
      <h2 className="mt-10 text-2xl font-medium text-ink">What happens next</h2>
      <ol className="mt-3 flex list-decimal flex-col gap-2 pl-6 text-lg text-ink">
        {waitlisted ? (
          <>
            <li>If a place opens up, we&apos;ll book you in and email you straight away.</li>
            <li>You can leave the waitlist at any time.</li>
          </>
        ) : (
          <>
            <li>We&apos;ve emailed your booking details (demo: no email is sent).</li>
            {asked && <li>We&apos;ll arrange what you asked for and confirm by email.</li>}
            <li>
              We&apos;ll remind you two days before
              {e.format !== "in-person" ? ", with the link to join" : ""}.
            </li>
          </>
        )}
      </ol>
      <p className="mt-8 text-lg">
        <Link href={`/events/booking?ref=${encodeURIComponent(reg.ref ?? "")}`} className={link}>
          Manage your booking
        </Link>
      </p>
    </RequestShell>
  );
}

// ── /events/booking ───────────────────────────────────────────────────────
export function ManageBooking() {
  const s = useCenterSources();
  const sp = useSearchParams();
  const [ref, setRef] = useState(sp.get("ref") ?? "");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormError[]>([]);
  const [foundId, setFoundId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  const result = useRef<HTMLHeadingElement>(null);
  usePageTitle("Manage your booking", errors.length > 0);
  const reg = foundId && s ? s.ev.registrations.find((r) => r.id === foundId) : undefined;

  const find = () => {
    const x: FormError[] = [];
    if (!ref.trim()) x.push({ fieldId: "b-ref", message: "Enter your booking reference" });
    if (!email.trim()) x.push({ fieldId: "b-email", message: "Enter your email address" });
    if (!x.length) {
      const r = findBooking(ref, email);
      if (!r)
        x.push({
          fieldId: "b-ref",
          message: "We couldn't find a booking with those details. Check them and try again.",
        });
      else {
        setFoundId(r.id);
        setNotice("");
        setTimeout(() => result.current?.focus(), 0);
      }
    }
    if (x.length) setFoundId(null);
    setErrors(x);
  };

  return (
    <RequestShell>
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-ink">Manage your booking</h1>
      <p className="mt-3 text-lg text-neutral-700">
        See your booking, check your access needs, or cancel your place.
      </p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          find();
        }}
        className="mt-8 flex flex-col gap-6"
      >
        <ErrorSummary errors={errors} />
        <TextField
          id="b-ref"
          label="Booking reference"
          hint="For example, E-1042. It's in your confirmation email."
          value={ref}
          onChange={setRef}
          autoComplete="off"
          error={errors.find((x) => x.fieldId === "b-ref")?.message}
        />
        <TextField
          id="b-email"
          label="Email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.find((x) => x.fieldId === "b-email")?.message}
        />
        <Button
          type="submit"
          disabled={!s}
          className={`h-12 w-fit bg-brand px-8 text-base text-white hover:bg-brand-hover ${focusRing}`}
        >
          Find my booking
        </Button>
      </form>

      {reg && s && (
        <section aria-labelledby="bk-h" className="mt-12 border-t-4 border-brand pt-8">
          <h2
            ref={result}
            id="bk-h"
            tabIndex={-1}
            className="text-2xl font-medium text-ink outline-none"
          >
            Booking {reg.ref}
          </h2>
          {notice && (
            <p
              role="status"
              className="mt-3 rounded-lg border-l-4 border-emerald-700 bg-emerald-50 p-3 text-base text-ink"
            >
              {notice}
            </p>
          )}
          <Details data={s.ev} reg={reg} />
          {(reg.status === "registered" || reg.status === "waitlisted") && (
            <Button
              variant="outline"
              onClick={() => setConfirm(true)}
              className={`mt-6 h-11 px-4 text-red-700 ${focusRing}`}
            >
              {reg.status === "waitlisted" ? "Leave the waitlist" : "Cancel my place"}
            </Button>
          )}
        </section>
      )}

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reg?.status === "waitlisted" ? "Leave the waitlist?" : "Cancel your place?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your place goes to the next person on the waitlist. You can book again later if places
              are free.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={`h-11 px-4 ${focusRing}`}>
              Keep my booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!reg) return;
                const res = cancelBooking(reg.id);
                setNotice(
                  res.ok ? "Your booking is cancelled. Thank you for letting us know." : res.reason,
                );
                setTimeout(() => result.current?.focus(), 0);
              }}
              className={`h-11 bg-red-700 px-4 text-white hover:bg-red-800 ${focusRing}`}
            >
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RequestShell>
  );
}
