"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Call02Icon, Location01Icon, Mail01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useContactsStore } from "@/store/contacts";
import { useInboxStore } from "@/store/inbox";
import type { MessageTopic } from "@/lib/types";
import { DEFAULT_ORG, DEFAULT_INBOX_RULES } from "@/data/settings";
import {
  ErrorSummary,
  FieldError,
  errorGroupClass,
  type FormError,
} from "@/components/dashboard/shared/form-errors";
import { focusRing, RadioField, TextField } from "@/components/dashboard/shared/fields";
import { useWorkspace } from "@/components/dashboard/shared/use-workspace";

const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;
const TOPICS: Record<MessageTopic, string> = {
  general: "General",
  library: "Library",
  training: "Courses and training",
  "family-support": "Family support",
  events: "Events",
  accessibility: "Accessibility",
  volunteering: "Volunteering",
  careers: "Careers",
};
const REPLY = { email: "Email", phone: "Phone call", text: "Text message" } as const;
const FORMATS = {
  "large-print": "Large print",
  "easy-read": "Easy read",
  phone: "A phone call",
  other: "Something else",
} as const;
type Format = keyof typeof FORMATS;
const MAX = 1000;
const GETTING_HERE =
  "Free parking behind the building, with 6 accessible spaces by the door. Step-free entrance on Main Street. The number 4 bus stops outside.";

/** Contact details that follow Settings › Organization. */
export function ContactDetails() {
  const w = useWorkspace();
  const org = w?.settings.org ?? DEFAULT_ORG;
  const tel = org.phone.replace(/[^\d+]/g, "");
  return (
    <div className="flex flex-col gap-5 text-base">
      <div className="flex gap-3">
        <HugeiconsIcon
          icon={Call02Icon}
          strokeWidth={2}
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-brand"
        />
        <div>
          <p className="font-semibold text-ink">Phone</p>
          <p>
            <a href={`tel:${tel}`} className={link}>
              {org.phone}
            </a>
          </p>
          <p className="text-neutral-700">{org.hours}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <HugeiconsIcon
          icon={Mail01Icon}
          strokeWidth={2}
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-brand"
        />
        <div>
          <p className="font-semibold text-ink">Email</p>
          <p>
            <a href={`mailto:${org.email}`} className={link}>
              {org.email}
            </a>
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <HugeiconsIcon
          icon={Location01Icon}
          strokeWidth={2}
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-brand"
        />
        <div>
          <p className="font-semibold text-ink">Visit us</p>
          <p className="text-ink">{org.address}</p>
          <details className="mt-1">
            <summary className={`min-h-11 cursor-pointer py-2 ${link}`}>Getting here</summary>
            <p className="pb-2 text-ink">{GETTING_HERE}</p>
          </details>
        </div>
      </div>
      <p className="text-ink">
        Prefer another way? We can call you back, or you can reach us through a relay service.
      </p>
    </div>
  );
}

/** Public contact form: becomes an Inbox message the team answers. */
export function ContactForm() {
  const w = useWorkspace();
  const org = w?.settings.org ?? DEFAULT_ORG;
  const days = w?.settings.inboxRules.replyTargetDays ?? DEFAULT_INBOX_RULES.replyTargetDays;
  const asked = useSearchParams().get("topic");
  const preset = asked && asked in TOPICS ? (asked as MessageTopic) : "";
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    reply: "" as keyof typeof REPLY | "",
    topic: preset as MessageTopic | "",
    message: "",
    formatNeeded: false,
    formats: [] as Format[],
    otherFormat: "",
  });
  const [errors, setErrors] = useState<FormError[]>([]);
  const [sent, setSent] = useState<string | null>(null);
  const panel = useRef<HTMLHeadingElement>(null);
  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const set = (k: "name" | "email" | "phone" | "message" | "otherFormat") => (v: string) =>
    setF((p) => ({ ...p, [k]: v }));
  const left = MAX - f.message.length;
  const [spoken, setSpoken] = useState(left);
  useEffect(() => {
    const t = setTimeout(() => setSpoken(left), 900);
    return () => clearTimeout(t);
  }, [left]);
  useEffect(() => {
    document.title = `${errors.length ? "Error: " : ""}Contact us · Openfield`;
  }, [errors.length]);

  const submit = () => {
    const e: FormError[] = [];
    if (!f.name.trim()) e.push({ fieldId: "cf-name", message: "Enter your name" });
    if (!f.email.trim()) e.push({ fieldId: "cf-email", message: "Enter your email address" });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
      e.push({
        fieldId: "cf-email",
        message: "Enter an email address in the correct format, like name@example.com",
      });
    if (!f.reply) e.push({ fieldId: "cf-reply", message: "Select how you'd like us to reply" });
    else if (f.reply !== "email" && !f.phone.trim())
      e.push({ fieldId: "cf-phone", message: "Enter a phone number so we can call or text you" });
    if (!f.topic) e.push({ fieldId: "cf-topic", message: "Select what your message is about" });
    if (!f.message.trim()) e.push({ fieldId: "cf-message", message: "Enter your message" });
    else if (left < 0)
      e.push({
        fieldId: "cf-message",
        message: `Your message must be ${MAX.toLocaleString()} characters or fewer`,
      });
    if (f.formatNeeded && !f.formats.length)
      e.push({ fieldId: "cf-formats", message: "Select the format you need" });
    if (f.formats.includes("other") && !f.otherFormat.trim())
      e.push({ fieldId: "cf-otherFormat", message: "Tell us the format you need" });
    setErrors(e);
    if (e.length || !f.topic || !w) return;

    // Match the person by email (any case) before adding anyone new.
    const people = useContactsStore.getState();
    let contactId =
      w.contacts.find(
        (c) => c.email && c.email.trim().toLowerCase() === f.email.trim().toLowerCase(),
      )?.id ?? null;
    if (!contactId) {
      const res = people.addContact({
        name: f.name.trim(),
        role: "parent",
        email: f.email.trim(),
        phone: f.phone.trim(),
        address: "",
        region: org.regionName,
        inRegion: true,
        preferredContact: f.reply || "email",
        tags: ["website"],
      });
      contactId = res.ok && "id" in res && typeof res.id === "string" ? res.id : null;
    }
    const formatLine = f.formatNeeded
      ? `\n\nReply in an accessible format: ${f.formats.map((x) => (x === "other" ? f.otherFormat.trim() : FORMATS[x])).join(", ")}`
      : "";
    const res = useInboxStore.getState().create({
      contactId,
      name: f.name.trim(),
      email: f.email.trim(),
      phone: f.phone.trim() || undefined,
      topic: f.topic,
      subject: f.message
        .trim()
        .split(/(?<=[.?!])\s|\n/)[0]
        .slice(0, 70),
      body: `${f.message.trim()}\n\nReply by: ${f.reply ? REPLY[f.reply].toLowerCase() : "email"}${formatLine}`,
      source: "website",
    });
    if (!res.ok) return setErrors([{ fieldId: "cf-message", message: res.reason }]);
    setSent(res.id ?? "");
    setTimeout(() => panel.current?.focus(), 0);
  };

  if (sent)
    return (
      <div className="rounded-2xl border-4 border-emerald-700 bg-white p-8">
        <h2 ref={panel} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
          Message sent
        </h2>
        <p className="mt-2 text-lg text-ink">
          Your reference is <strong className="font-semibold tabular-nums">{sent}</strong>
        </p>
        <p className="mt-4 text-base text-ink">
          We&apos;ll reply within {days} working {days === 1 ? "day" : "days"}
          {f.reply === "email"
            ? ` to ${f.email}`
            : f.reply
              ? ` by ${REPLY[f.reply].toLowerCase()}`
              : ""}
          . If it&apos;s urgent, call us on {org.phone}.
        </p>
      </div>
    );

  const countText = (n: number) =>
    n >= 0
      ? `You have ${n.toLocaleString()} characters remaining`
      : `You have ${(-n).toLocaleString()} characters too many`;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex max-w-xl flex-col gap-6"
    >
      <ErrorSummary errors={errors} />
      <TextField
        id="cf-name"
        label="Your name"
        autoComplete="name"
        value={f.name}
        onChange={set("name")}
        error={err("cf-name")}
      />
      <TextField
        id="cf-email"
        label="Email address"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={f.email}
        onChange={set("email")}
        error={err("cf-email")}
      />
      <TextField
        id="cf-phone"
        label="Phone number (optional)"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={f.phone}
        onChange={set("phone")}
        error={err("cf-phone")}
      />
      <RadioField
        id="cf-reply"
        legend="How should we reply?"
        columns={3}
        value={f.reply}
        options={REPLY}
        onChange={(v) => setF((p) => ({ ...p, reply: v }))}
        error={err("cf-reply")}
      />
      <RadioField
        id="cf-topic"
        legend="What is it about?"
        columns={2}
        value={f.topic}
        options={TOPICS}
        onChange={(v) => setF((p) => ({ ...p, topic: v }))}
        error={err("cf-topic")}
      />

      <div className={errorGroupClass(!!err("cf-message"))}>
        <Label htmlFor="cf-message" className="text-[15px] font-medium text-ink">
          Your message
        </Label>
        <p id="cf-message-hint" className="text-sm text-neutral-600">
          Please don&apos;t include private medical details.
        </p>
        <FieldError id="cf-message-error" message={err("cf-message")} />
        <Textarea
          id="cf-message"
          rows={7}
          value={f.message}
          onChange={(e) => set("message")(e.target.value)}
          aria-invalid={!!err("cf-message") || left < 0}
          aria-describedby={`cf-message-hint cf-message-count${err("cf-message") ? " cf-message-error" : ""}`}
          className={`mt-1.5 bg-background text-base ${left < 0 ? "border-red-700" : ""} ${focusRing}`}
        />
        <p
          id="cf-message-count"
          aria-hidden="true"
          className={`mt-1.5 text-[15px] ${left < 0 ? "font-semibold text-red-700" : "text-neutral-600"}`}
        >
          {countText(left)}
        </p>
        <p aria-live="polite" className="sr-only">
          {countText(spoken)}
        </p>
      </div>

      <div>
        <div className="flex min-h-11 items-center gap-3">
          <Checkbox
            id="cf-format"
            checked={f.formatNeeded}
            onCheckedChange={(v) =>
              setF((p) => ({
                ...p,
                formatNeeded: v === true,
                formats: v === true ? p.formats : [],
              }))
            }
            aria-controls="cf-format-reveal"
            className={`size-6 ${focusRing}`}
          />
          <Label htmlFor="cf-format" className="text-base font-normal">
            I need a reply in an accessible format
          </Label>
        </div>
        {f.formatNeeded && (
          <fieldset
            id="cf-format-reveal"
            className={`my-2 ml-3 border-l-4 border-neutral-300 pl-6 ${errorGroupClass(!!err("cf-formats"))}`}
            aria-describedby={err("cf-formats") ? "cf-formats-error" : undefined}
          >
            <legend className="text-[15px] font-medium text-ink">Which format?</legend>
            <FieldError id="cf-formats-error" message={err("cf-formats")} />
            {(Object.keys(FORMATS) as Format[]).map((k) => (
              <div key={k} className="flex min-h-11 items-center gap-3">
                <Checkbox
                  id={`cf-formats-${k}`}
                  checked={f.formats.includes(k)}
                  onCheckedChange={(v) =>
                    setF((p) => ({
                      ...p,
                      formats: v ? [...p.formats, k] : p.formats.filter((x) => x !== k),
                    }))
                  }
                  className={`size-5 ${focusRing}`}
                />
                <Label htmlFor={`cf-formats-${k}`} className="text-base font-normal">
                  {FORMATS[k]}
                </Label>
              </div>
            ))}
            {f.formats.includes("other") && (
              <div className="mt-2">
                <TextField
                  id="cf-otherFormat"
                  label="Tell us the format"
                  value={f.otherFormat}
                  onChange={set("otherFormat")}
                  error={err("cf-otherFormat")}
                />
              </div>
            )}
          </fieldset>
        )}
      </div>

      <Button
        type="submit"
        disabled={!w}
        className={`h-12 w-fit bg-brand px-8 text-base text-white hover:bg-brand-hover ${focusRing}`}
      >
        Send message
      </Button>
    </form>
  );
}

export function BeforeYouWrite() {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-3">
      {[
        { href: "/library/request/status", label: "Check a library request" },
        { href: "/events/booking", label: "Manage an event booking" },
        { href: "/families", label: "Find a family guide" },
      ].map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className={`flex min-h-14 items-center rounded-xl border border-border bg-white px-4 text-base ${link}`}
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
