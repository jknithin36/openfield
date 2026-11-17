"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { LibraryItem, OrganizationSettings } from "@/lib/types";
import { itemBySlug } from "@/lib/library/public";
import {
  ErrorSummary,
  FieldError,
  errorGroupClass,
  type FormError,
} from "@/components/dashboard/shared/form-errors";
import { focusRing, RadioField, TextField } from "@/components/dashboard/shared/fields";
import { tel, usePublicLibrary } from "@/components/site/library/use-public-library";
import {
  CONTACT_BY,
  NOTE_MAX,
  STEP_COUNT,
  useDraft,
  WHO,
  type Draft,
} from "@/components/site/library/request-steps/draft";

export const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link href={href} className={`inline-flex min-h-11 items-center gap-1 text-base ${link}`}>
      <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} aria-hidden="true" className="size-4" />
      {label}
    </Link>
  );
}

/** Page title follows GOV.UK: "Error: " first when the form has problems. */
export function usePageTitle(title: string, hasErrors: boolean) {
  useEffect(() => {
    document.title = `${hasErrors ? "Error: " : ""}${title} · Openfield`;
  }, [title, hasErrors]);
}

export function RequestShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[720px] px-6 py-8 lg:py-12">{children}</div>;
}

export function RequestSteps({ slug }: { slug: string }) {
  const d = usePublicLibrary();
  if (!d)
    return (
      <RequestShell>
        <p className="text-neutral-600">Loading…</p>
      </RequestShell>
    );
  const item = itemBySlug(d.lib, slug);
  if (!item)
    return (
      <RequestShell>
        <h1 className="text-3xl font-medium text-ink">We can&apos;t find that item</h1>
        <p className="mt-3 text-lg">
          <Link href="/library" className={link}>
            Browse the library
          </Link>
        </p>
      </RequestShell>
    );
  return <Steps item={item} org={d.org} />;
}

function Steps({ item, org }: { item: LibraryItem; org: OrganizationSettings }) {
  const router = useRouter();
  const sp = useSearchParams();
  const raw = sp.get("step");
  const fromCheck = sp.get("from") === "check";
  const outside = raw === "outside";
  const step = outside ? 2 : Math.min(STEP_COUNT, Math.max(1, Number(raw) || 1));
  const { draft, save } = useDraft(item.slug);
  const [f, setF] = useState<Draft>(draft);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [shownFor, setShownFor] = useState(raw);
  const h1 = useRef<HTMLHeadingElement>(null);
  const base = `/library/${item.slug}/request`;
  const check = `${base}/check`;

  // New step: reset errors and the working copy, move focus to the question.
  if (shownFor !== raw) {
    setShownFor(raw);
    setErrors([]);
    setF(draft);
  }
  useEffect(() => {
    h1.current?.focus();
  }, [raw]);

  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const set =
    <K extends keyof Draft>(k: K) =>
    (v: Draft[K]) =>
      setF((p) => ({ ...p, [k]: v }));
  const go = (s: number | "outside") => router.push(`${base}?step=${s}`, { scroll: true });
  const back = outside
    ? `${base}?step=2`
    : fromCheck
      ? check
      : step === 1
        ? `/library/${item.slug}`
        : `${base}?step=${step - 1}`;

  const QUESTIONS = [
    "Who is this for?",
    `Do you live or work in the ${org.regionName} region?`,
    "Your details",
    "How should we get it to you?",
    "Anything we should know?",
  ];
  const title = outside ? "We can only lend to people in our region" : QUESTIONS[step - 1];
  usePageTitle(`${title} · Borrow ${item.name}`, errors.length > 0);

  const submit = () => {
    const e: FormError[] = [];
    if (step === 1 && !f.who) e.push({ fieldId: "who", message: "Select who this is for" });
    if (step === 2 && !f.region)
      e.push({
        fieldId: "region",
        message: `Select yes if you live or work in the ${org.regionName} region`,
      });
    if (step === 3) {
      if (!f.name.trim()) e.push({ fieldId: "name", message: "Enter your full name" });
      if (!f.email.trim()) e.push({ fieldId: "email", message: "Enter your email address" });
      else if (!EMAIL.test(f.email.trim()))
        e.push({
          fieldId: "email",
          message: "Enter an email address in the correct format, like name@example.com",
        });
      if (!f.contactBy)
        e.push({ fieldId: "contactBy", message: "Select how you'd like us to contact you" });
      else if (f.contactBy !== "email" && !f.phone.trim())
        e.push({ fieldId: "phone", message: "Enter a phone number so we can call or text you" });
    }
    if (step === 4) {
      if (!f.delivery)
        e.push({ fieldId: "delivery", message: "Select how you'd like us to get it to you" });
      if (f.delivery === "ship") {
        if (!f.line1.trim())
          e.push({ fieldId: "line1", message: "Enter the first line of your address" });
        if (!f.town.trim()) e.push({ fieldId: "town", message: "Enter your town or city" });
        if (!f.zip.trim()) e.push({ fieldId: "zip", message: "Enter your ZIP code" });
        else if (!/^\d{5}(-\d{4})?$/.test(f.zip.trim()))
          e.push({ fieldId: "zip", message: "Enter a ZIP code in the correct format, like 12345" });
      }
    }
    if (step === 5 && f.note.length > NOTE_MAX)
      e.push({ fieldId: "note", message: `Your note must be ${NOTE_MAX} characters or fewer` });
    setErrors(e);
    if (e.length) return;
    save(f);
    if (step === 2 && f.region === "no") return go("outside");
    if (fromCheck) return router.push(check);
    if (step < STEP_COUNT) return go(step + 1);
    router.push(check);
  };

  if (outside)
    return (
      <RequestShell>
        <BackLink href={back} />
        <h1
          ref={h1}
          tabIndex={-1}
          className="mt-6 text-3xl leading-tight font-medium tracking-[-0.03em] text-ink outline-none"
        >
          We can only lend to people in our region
        </h1>
        <div className="mt-5 flex flex-col gap-4 text-lg leading-relaxed text-ink">
          <p>
            Our lending library is paid for by local funding, so we can only send items to people
            who live or work in the {org.regionName} region.
          </p>
          <p>Lots of our help is open to everyone, wherever you live:</p>
          <ul className="flex flex-col gap-2 pl-1">
            <li>
              <Link href="/learn" className={link}>
                Free online courses
              </Link>
            </li>
            <li>
              <Link href="/families/just-got-a-diagnosis" className={link}>
                Plain-language guides for families
              </Link>
            </li>
            <li>
              <Link href="/events" className={link}>
                Online events and webinars
              </Link>
            </li>
          </ul>
          <p>
            Not sure if you&apos;re in our region? Call us on{" "}
            <a href={`tel:${tel(org.phone)}`} className={link}>
              {org.phone}
            </a>{" "}
            ({org.hours}). We can also suggest a library near you.
          </p>
        </div>
      </RequestShell>
    );

  return (
    <RequestShell>
      <BackLink href={back} />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mt-6 flex flex-col gap-6"
      >
        <ErrorSummary errors={errors} />
        <div>
          <p className="text-base text-neutral-600">
            Borrow: {item.name} · Step {step} of {STEP_COUNT}
          </p>
          <h1
            ref={h1}
            tabIndex={-1}
            className="mt-1 text-3xl leading-tight font-medium tracking-[-0.03em] text-balance text-ink outline-none"
          >
            {title}
          </h1>
        </div>

        {step === 1 && (
          <RadioField
            id="who"
            legend="Who is this for?"
            hideLegend
            columns={1}
            value={f.who ?? ""}
            options={WHO}
            onChange={set("who")}
            error={err("who")}
          />
        )}

        {step === 2 && (
          <>
            <p className="-mt-2 text-base text-neutral-700">
              {org.address.replace(/^[^,]*,\s*/, "")} and the towns around it.
            </p>
            <RadioField
              id="region"
              legend={title}
              hideLegend
              columns={1}
              value={f.region ?? ""}
              options={{ yes: "Yes", no: "No" }}
              onChange={set("region")}
              error={err("region")}
            />
          </>
        )}

        {step === 3 && (
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
              hint="We'll send your confirmation here."
            />
            <TextField
              id="phone"
              label="Phone number (optional)"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={f.phone}
              onChange={set("phone")}
              error={err("phone")}
            />
            <RadioField
              id="contactBy"
              legend="How should we contact you?"
              columns={1}
              value={f.contactBy ?? ""}
              options={CONTACT_BY}
              onChange={set("contactBy")}
              error={err("contactBy")}
            />
          </>
        )}

        {step === 4 && <DeliveryStep f={f} set={set} err={err} org={org} />}

        {step === 5 && <NoteStep value={f.note} onChange={set("note")} error={err("note")} />}

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

function DeliveryStep({
  f,
  set,
  err,
  org,
}: {
  f: Draft;
  set: <K extends keyof Draft>(k: K) => (v: Draft[K]) => void;
  err: (id: string) => string | undefined;
  org: OrganizationSettings;
}) {
  return (
    <fieldset
      className={errorGroupClass(!!err("delivery"))}
      aria-describedby={err("delivery") ? "delivery-error" : undefined}
    >
      <legend className="sr-only">How should we get it to you?</legend>
      <FieldError id="delivery-error" message={err("delivery")} />
      <RadioGroup
        value={f.delivery ?? ""}
        onValueChange={(v) => set("delivery")(v as Draft["delivery"])}
        className="gap-0"
      >
        <div className="flex min-h-11 items-center gap-3">
          <RadioGroupItem
            id="delivery-ship"
            value="ship"
            aria-controls="reveal-ship"
            className={`size-6 ${focusRing}`}
          />
          <Label htmlFor="delivery-ship" className="text-base font-normal">
            Ship it to me <span className="text-neutral-600">(free, with a return label)</span>
          </Label>
        </div>
        {f.delivery === "ship" && (
          <div
            id="reveal-ship"
            className="my-2 ml-3 flex flex-col gap-5 border-l-4 border-neutral-300 py-1 pl-6"
          >
            <TextField
              id="line1"
              label="Address line 1"
              autoComplete="address-line1"
              value={f.line1}
              onChange={set("line1")}
              error={err("line1")}
            />
            <TextField
              id="line2"
              label="Address line 2 (optional)"
              autoComplete="address-line2"
              value={f.line2}
              onChange={set("line2")}
            />
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <TextField
                id="town"
                label="Town or city"
                autoComplete="address-level2"
                value={f.town}
                onChange={set("town")}
                error={err("town")}
              />
              <TextField
                id="zip"
                label="ZIP code"
                inputMode="numeric"
                autoComplete="postal-code"
                value={f.zip}
                onChange={set("zip")}
                error={err("zip")}
              />
            </div>
          </div>
        )}
        <div className="flex min-h-11 items-center gap-3">
          <RadioGroupItem
            id="delivery-pickup"
            value="pickup"
            aria-controls="reveal-pickup"
            className={`size-6 ${focusRing}`}
          />
          <Label htmlFor="delivery-pickup" className="text-base font-normal">
            Pick it up at {org.address.split(",")[0]}
          </Label>
        </div>
        {f.delivery === "pickup" && (
          <div
            id="reveal-pickup"
            className="my-2 ml-3 border-l-4 border-neutral-300 py-1 pl-6 text-base text-ink"
          >
            <p>{org.address}</p>
            <p className="text-neutral-700">
              Open {org.hours}. We&apos;ll email you when it&apos;s ready.
            </p>
          </div>
        )}
      </RadioGroup>
    </fieldset>
  );
}

function NoteStep({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const left = NOTE_MAX - value.length;
  // Announce the count only after typing pauses, so screen readers aren't flooded.
  const [spoken, setSpoken] = useState(left);
  useEffect(() => {
    const t = setTimeout(() => setSpoken(left), 900);
    return () => clearTimeout(t);
  }, [left]);
  const countText = (n: number) =>
    n >= 0
      ? `You have ${n} ${n === 1 ? "character" : "characters"} remaining`
      : `You have ${-n} ${n === -1 ? "character" : "characters"} too many`;
  return (
    <div className={errorGroupClass(!!error)}>
      <Label htmlFor="note" className="sr-only">
        Anything we should know? (optional)
      </Label>
      <p id="note-hint" className="text-base text-neutral-700">
        Optional. For example, who will use it and what you hope it helps with.
      </p>
      <FieldError id="note-error" message={error} />
      <Textarea
        id="note"
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error || left < 0}
        aria-describedby={`note-hint note-count${error ? " note-error" : ""}`}
        className={`mt-2 bg-white text-base ${left < 0 ? "border-red-700" : ""} ${focusRing}`}
      />
      <p
        id="note-count"
        aria-hidden="true"
        className={`mt-1.5 text-[15px] ${left < 0 ? "font-semibold text-red-700" : "text-neutral-600"}`}
      >
        {countText(left)}
      </p>
      <p aria-live="polite" className="sr-only">
        {countText(spoken)}
      </p>
    </div>
  );
}
