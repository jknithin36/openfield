"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { submitEventBooking } from "@/store/event-booking";
import type { AccommodationType, EventsData, OFEvent, OrganizationSettings } from "@/lib/types";
import { ACC_TYPE_LABEL, effectiveStatus, seatsLeft } from "@/lib/events/selectors";
import { bookByDate, dayText, timeText } from "@/lib/events/public";
import {
  ErrorSummary,
  FieldError,
  errorGroupClass,
  type FormError,
} from "@/components/dashboard/shared/form-errors";
import { focusRing, RadioField, TextField } from "@/components/dashboard/shared/fields";
import { useCenterSources } from "@/components/site/centers/use-center-sources";
import {
  BackLink,
  link,
  RequestShell,
  usePageTitle,
} from "@/components/site/library/request-steps/request-steps";

// ── Answers, kept in sessionStorage until sent ─────────────────────────────
export const ROLE_CHOICES = {
  parent: "Parent or carer",
  teacher: "Teacher",
  provider: "Service provider",
  employer: "Employer",
  "self-advocate": "Self-advocate",
  other: "Other",
} as const;
type RoleChoice = keyof typeof ROLE_CHOICES;
const NEEDS: AccommodationType[] = [
  "asl",
  "captions",
  "wheelchair-space",
  "large-print",
  "quiet-room",
  "childcare",
  "other",
];
const NEED_LABEL: Record<AccommodationType, string> = {
  ...ACC_TYPE_LABEL,
  "large-print": "Large print materials",
  other: "Something else",
};

export type EventDraft = {
  who?: "me" | "others";
  guests: string;
  name: string;
  email: string;
  phone: string;
  role?: RoleChoice;
  needs: Array<AccommodationType | "none">;
  kids: string;
  otherNeed: string;
  note: string;
};
const EMPTY: EventDraft = {
  guests: "",
  name: "",
  email: "",
  phone: "",
  needs: [],
  kids: "",
  otherNeed: "",
  note: "",
};
const KEY = (slug: string) => `openfield-event-booking:${slug}`;
const read = (slug: string): EventDraft => {
  if (typeof window === "undefined") return EMPTY;
  try {
    return {
      ...EMPTY,
      ...(JSON.parse(sessionStorage.getItem(KEY(slug)) ?? "{}") as Partial<EventDraft>),
    };
  } catch {
    return EMPTY;
  }
};
export function useEventDraft(slug: string) {
  const [draft, setDraft] = useState<EventDraft>(() => read(slug));
  const save = useCallback(
    (p: Partial<EventDraft>) => {
      const next = { ...read(slug), ...p };
      sessionStorage.setItem(KEY(slug), JSON.stringify(next));
      setDraft(next);
    },
    [slug],
  );
  const clear = useCallback(() => sessionStorage.removeItem(KEY(slug)), [slug]);
  return { draft, save, clear };
}
const firstMissing = (d: EventDraft): number | null =>
  !d.who ? 1 : !d.name.trim() || !d.email.trim() || !d.role ? 2 : !d.needs.length ? 3 : null;
const guestsOf = (d: EventDraft) => (d.who === "others" ? Number(d.guests) || 0 : 0);
const needsOf = (d: EventDraft) =>
  d.needs
    .filter((n): n is AccommodationType => n !== "none")
    .map((t) => ({
      type: t,
      details: t === "childcare" ? d.kids.trim() : t === "other" ? d.otherNeed.trim() : "",
    }));

const STEPS = 4;
const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
    new Date(iso),
  );

function useOpenEvent(slug: string) {
  const s = useCenterSources();
  if (!s) return { s: null, e: undefined };
  return {
    s,
    e: s.ev.events.find((x) => x.slug === slug && effectiveStatus(x, s.now) === "published"),
  };
}

function Closed() {
  return (
    <RequestShell>
      <h1 className="text-3xl font-medium text-ink">Registration isn&apos;t open for this event</h1>
      <p className="mt-3 text-lg">
        <Link href="/events" className={link}>
          See upcoming events
        </Link>
      </p>
    </RequestShell>
  );
}

// ── Steps ───────────────────────────────────────────────────────────────────
export function EventRegister({ slug }: { slug: string }) {
  const { s, e } = useOpenEvent(slug);
  if (!s)
    return (
      <RequestShell>
        <p className="text-neutral-600">Loading…</p>
      </RequestShell>
    );
  if (!e) return <Closed />;
  return <Steps e={e} data={s.ev} max={s.ev.settings.maxGuests ?? 3} />;
}

function Steps({ e, data, max }: { e: OFEvent; data: EventsData; max: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const raw = sp.get("step");
  const fromCheck = sp.get("from") === "check";
  const step = Math.min(STEPS, Math.max(1, Number(raw) || 1));
  const { draft, save } = useEventDraft(e.slug);
  const [f, setF] = useState<EventDraft>(draft);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [shownFor, setShownFor] = useState(raw);
  const h1 = useRef<HTMLHeadingElement>(null);
  const base = `/events/${e.slug}/register`;
  if (shownFor !== raw) {
    setShownFor(raw);
    setErrors([]);
    setF(draft);
  }
  useEffect(() => {
    h1.current?.focus();
  }, [raw]);

  const full = seatsLeft(data, e) === 0;
  const bookBy = bookByDate(e, data.settings.leadTimeDays);
  const QUESTIONS = [
    "Who is attending?",
    "Your details",
    "Do you need anything to take part?",
    "Anything else we should know?",
  ];
  usePageTitle(`${QUESTIONS[step - 1]} · ${e.title}`, errors.length > 0);
  const err = (id: string) => errors.find((x) => x.fieldId === id)?.message;
  const set =
    <K extends keyof EventDraft>(k: K) =>
    (v: EventDraft[K]) =>
      setF((p) => ({ ...p, [k]: v }));
  const back = fromCheck
    ? `${base}/check`
    : step === 1
      ? `/events/${e.slug}`
      : `${base}?step=${step - 1}`;

  const submit = () => {
    const x: FormError[] = [];
    if (step === 1) {
      if (!f.who) x.push({ fieldId: "who", message: "Select who is attending" });
      else if (f.who === "others") {
        const n = Number(f.guests);
        if (!/^\d+$/.test(f.guests.trim()) || n < 1 || n > max)
          x.push({
            fieldId: "guests",
            message: `Enter how many other people are coming, from 1 to ${max}`,
          });
      }
    }
    if (step === 2) {
      if (!f.name.trim()) x.push({ fieldId: "name", message: "Enter your full name" });
      if (!f.email.trim()) x.push({ fieldId: "email", message: "Enter your email address" });
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
        x.push({
          fieldId: "email",
          message: "Enter an email address in the correct format, like name@example.com",
        });
      if (!f.role) x.push({ fieldId: "role", message: "Select which describes you best" });
    }
    if (step === 3) {
      if (!f.needs.length)
        x.push({
          fieldId: "needs",
          message: "Select what you need, or select “No, nothing needed”",
        });
      if (f.needs.includes("childcare") && !f.kids.trim())
        x.push({ fieldId: "kids", message: "Tell us how many children and their ages" });
      if (f.needs.includes("other") && !f.otherNeed.trim())
        x.push({ fieldId: "otherNeed", message: "Tell us what else you need" });
    }
    if (step === 4 && f.note.length > 1000)
      x.push({ fieldId: "note", message: "Your note must be 1,000 characters or fewer" });
    setErrors(x);
    if (x.length) return;
    save(f);
    router.push(fromCheck || step === STEPS ? `${base}/check` : `${base}?step=${step + 1}`);
  };

  const toggleNeed = (n: AccommodationType | "none", on: boolean) =>
    setF((p) => ({
      ...p,
      needs:
        n === "none"
          ? on
            ? ["none"]
            : []
          : on
            ? [...p.needs.filter((x) => x !== "none"), n]
            : p.needs.filter((x) => x !== n),
    }));

  return (
    <RequestShell>
      <BackLink href={back} />
      <form
        noValidate
        onSubmit={(ev) => {
          ev.preventDefault();
          submit();
        }}
        className="mt-6 flex flex-col gap-6"
      >
        <ErrorSummary errors={errors} />
        <div>
          <p className="text-base text-neutral-600">
            {full ? "Join the waitlist" : "Register"}: {e.title} · Step {step} of {STEPS}
          </p>
          <h1
            ref={h1}
            tabIndex={-1}
            className="mt-1 text-3xl leading-tight font-medium tracking-[-0.03em] text-ink outline-none"
          >
            {QUESTIONS[step - 1]}
          </h1>
        </div>

        {step === 1 && (
          <>
            <RadioField
              id="who"
              legend="Who is attending?"
              hideLegend
              columns={1}
              value={f.who ?? ""}
              options={{ me: "Just me", others: "Me and others" }}
              onChange={set("who")}
              error={err("who")}
            />
            {f.who === "others" && (
              <div className="ml-3 border-l-4 border-neutral-300 pl-6">
                <TextField
                  id="guests"
                  label="How many other people are coming?"
                  hint={`Up to ${max}. Each person needs a place.`}
                  inputMode="numeric"
                  value={f.guests}
                  onChange={set("guests")}
                  error={err("guests")}
                />
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <TextField
              id="name"
              label="Full name"
              autoComplete="name"
              value={f.name}
              onChange={set("name")}
              error={err("name")}
            />
            <TextField
              id="email"
              label="Email address"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={f.email}
              onChange={set("email")}
              error={err("email")}
              hint="We'll send your booking details here."
            />
            <TextField
              id="phone"
              label="Phone number (optional)"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={f.phone}
              onChange={set("phone")}
            />
            <RadioField
              id="role"
              legend="Which describes you best?"
              columns={2}
              value={f.role ?? ""}
              options={ROLE_CHOICES}
              onChange={set("role")}
              error={err("role")}
            />
          </>
        )}

        {step === 3 && (
          <fieldset
            className={errorGroupClass(!!err("needs"))}
            aria-describedby={`needs-hint${err("needs") ? " needs-error" : ""}`}
          >
            <legend className="sr-only">Do you need anything to take part?</legend>
            <p id="needs-hint" className="text-base text-neutral-700">
              Select all that apply. It&apos;s free. Please tell us by {fmt(bookBy)} so we have time
              to arrange it.
            </p>
            <FieldError id="needs-error" message={err("needs")} />
            <div className="mt-3 flex flex-col">
              {NEEDS.map((n) => (
                <div key={n}>
                  <div className="flex min-h-11 items-center gap-3">
                    <Checkbox
                      id={`needs-${n}`}
                      checked={f.needs.includes(n)}
                      onCheckedChange={(v) => toggleNeed(n, v === true)}
                      className={`size-6 ${focusRing}`}
                    />
                    <Label htmlFor={`needs-${n}`} className="text-base font-normal">
                      {NEED_LABEL[n]}
                    </Label>
                  </div>
                  {n === "childcare" && f.needs.includes("childcare") && (
                    <div className="my-2 ml-3 border-l-4 border-neutral-300 pl-6">
                      <TextField
                        id="kids"
                        label="How many children, and how old are they?"
                        hint="For example, 2 children, ages 4 and 7."
                        value={f.kids}
                        onChange={set("kids")}
                        error={err("kids")}
                      />
                    </div>
                  )}
                  {n === "other" && f.needs.includes("other") && (
                    <div className="my-2 ml-3 border-l-4 border-neutral-300 pl-6">
                      <TextField
                        id="otherNeed"
                        label="What do you need?"
                        multiline
                        rows={3}
                        value={f.otherNeed}
                        onChange={set("otherNeed")}
                        error={err("otherNeed")}
                      />
                    </div>
                  )}
                </div>
              ))}
              <p className="my-2 text-base text-neutral-700">or</p>
              <div className="flex min-h-11 items-center gap-3">
                <Checkbox
                  id="needs-none"
                  checked={f.needs.includes("none")}
                  onCheckedChange={(v) => toggleNeed("none", v === true)}
                  className={`size-6 ${focusRing}`}
                />
                <Label htmlFor="needs-none" className="text-base font-normal">
                  No, nothing needed
                </Label>
              </div>
            </div>
          </fieldset>
        )}

        {step === 4 && (
          <TextField
            id="note"
            label="Anything else we should know? (optional)"
            multiline
            rows={5}
            value={f.note}
            onChange={set("note")}
            error={err("note")}
            hint="For example, dietary needs, or questions for the speakers."
          />
        )}

        <Button
          type="submit"
          className={`h-12 w-fit bg-brand px-8 text-base text-white hover:bg-brand-hover ${focusRing}`}
        >
          Continue
        </Button>
      </form>
    </RequestShell>
  );
}

// ── Check your answers ──────────────────────────────────────────────────────
export function EventCheck({ slug }: { slug: string }) {
  const { s, e } = useOpenEvent(slug);
  if (!s)
    return (
      <RequestShell>
        <p className="text-neutral-600">Loading…</p>
      </RequestShell>
    );
  if (!e) return <Closed />;
  return <Check e={e} data={s.ev} org={s.org} />;
}

function Check({ e, data, org }: { e: OFEvent; data: EventsData; org: OrganizationSettings }) {
  const router = useRouter();
  const { draft, clear } = useEventDraft(e.slug);
  const [error, setError] = useState<FormError[]>([]);
  const [sending, setSending] = useState(false);
  const h1 = useRef<HTMLHeadingElement>(null);
  const missing = firstMissing(draft);
  const base = `/events/${e.slug}/register`;
  usePageTitle(`Check your answers · ${e.title}`, error.length > 0);
  useEffect(() => {
    if (missing) router.replace(`${base}?step=${missing}`);
    else h1.current?.focus();
  }, [missing, base, router]);
  if (missing)
    return (
      <RequestShell>
        <p className="text-neutral-600">Loading…</p>
      </RequestShell>
    );

  const guests = guestsOf(draft);
  const full = seatsLeft(data, e) < 1 + guests;
  const needs = needsOf(draft);
  const rows: Array<[string, React.ReactNode, number?, string?]> = [
    [
      "Event",
      <>
        {e.title}
        <br />
        <span className="text-neutral-700">
          {dayText(e)}, {timeText(e)}
        </span>
      </>,
    ],
    [
      "Who is attending",
      guests ? `Me and ${guests} ${guests === 1 ? "other person" : "others"}` : "Just me",
      1,
      "who is attending",
    ],
    ["Name", draft.name, 2, "name"],
    ["Email", draft.email, 2, "email address"],
    ["Phone", draft.phone || "Not given", 2, "phone number"],
    ["Role", draft.role ? ROLE_CHOICES[draft.role] : "", 2, "role"],
    [
      "Access needs",
      needs.length
        ? needs.map((n) => `${NEED_LABEL[n.type]}${n.details ? ` (${n.details})` : ""}`).join(", ")
        : "Nothing needed",
      3,
      "access needs",
    ],
    ["Anything else", draft.note.trim() || "None", 4, "anything else"],
  ];

  const confirm = () => {
    if (sending) return;
    setSending(true);
    const res = submitEventBooking({
      eventId: e.id,
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      role: draft.role ?? "other",
      guests,
      needs,
      note: draft.note,
      regionName: org.regionName,
    });
    if (!res.ok) {
      setSending(false);
      setError([{ fieldId: "confirm", message: res.reason }]);
      return;
    }
    clear();
    router.push(`/events/registered?ref=${encodeURIComponent(res.ref)}`);
  };

  return (
    <RequestShell>
      <BackLink href={`${base}?step=4`} />
      <div className="mt-6 flex flex-col gap-6">
        <ErrorSummary errors={error} />
        <div>
          <p className="text-base text-neutral-600">{e.title}</p>
          <h1
            ref={h1}
            tabIndex={-1}
            className="mt-1 text-3xl font-medium tracking-[-0.03em] text-ink outline-none"
          >
            Check your answers
          </h1>
        </div>
        {full && (
          <p className="border-l-4 border-brand bg-brand-soft p-4 text-base text-ink">
            There aren&apos;t enough places left right now, so you&apos;ll join the waitlist. If
            places open up, we&apos;ll book you in and email you.
          </p>
        )}
        <dl className="border-t border-border">
          {rows.map(([k, v, step, what]) => (
            <div
              key={k}
              className="grid gap-1 border-b border-border py-4 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:gap-4"
            >
              <dt className="text-base font-semibold text-ink">{k}</dt>
              <dd className="text-base break-words text-ink">{v}</dd>
              <dd className="sm:text-right">
                {step && (
                  <Link
                    href={`${base}?step=${step}&from=check`}
                    className={`inline-flex min-h-11 items-center sm:min-h-0 ${link}`}
                  >
                    Change<span className="sr-only"> {what}</span>
                  </Link>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-base text-neutral-700">
          We&apos;ll use your details to manage your booking.{" "}
          <Link href="/privacy" className={link}>
            Privacy policy
          </Link>
        </p>
        <Button
          id="confirm"
          onClick={confirm}
          disabled={sending}
          className={`h-12 w-fit bg-brand px-8 text-base text-white hover:bg-brand-hover ${focusRing}`}
        >
          {sending ? "Sending…" : full ? "Join waitlist" : "Confirm registration"}
        </Button>
      </div>
    </RequestShell>
  );
}
