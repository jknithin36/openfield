"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { submitCenterQuestion } from "@/store/center-question";
import type { Center } from "@/lib/types";
import { ErrorSummary, type FormError } from "@/components/dashboard/shared/form-errors";
import { focusRing, RadioField, TextField } from "@/components/dashboard/shared/fields";
import { useWorkspace } from "@/components/dashboard/shared/use-workspace";

const CONTACT_BY = { email: "Email", phone: "Phone call", text: "Text message" } as const;
type ContactBy = keyof typeof CONTACT_BY;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AskTeamForm({
  center,
  replyDays,
  ready,
}: {
  center: Center;
  replyDays: number;
  ready: boolean;
}) {
  const w = useWorkspace();
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    question: "",
    contactBy: "" as ContactBy | "",
  });
  const [errors, setErrors] = useState<FormError[]>([]);
  const [sent, setSent] = useState(false);
  const panel = useRef<HTMLHeadingElement>(null);
  const set = (k: "name" | "email" | "phone" | "question") => (v: string) =>
    setF((p) => ({ ...p, [k]: v }));
  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const team = `${center.shortName.toLowerCase()} team`;

  const submit = () => {
    const e: FormError[] = [];
    if (!f.name.trim()) e.push({ fieldId: "ask-name", message: "Enter your name" });
    if (!f.email.trim()) e.push({ fieldId: "ask-email", message: "Enter your email address" });
    else if (!EMAIL.test(f.email.trim()))
      e.push({
        fieldId: "ask-email",
        message: "Enter an email address in the correct format, like name@example.com",
      });
    if (!f.question.trim()) e.push({ fieldId: "ask-question", message: "Enter your question" });
    if (!f.contactBy) e.push({ fieldId: "ask-by", message: "Select how you'd like us to reply" });
    else if (f.contactBy !== "email" && !f.phone.trim())
      e.push({ fieldId: "ask-phone", message: "Enter a phone number so we can call or text you" });
    setErrors(e);
    if (e.length || !f.contactBy) return;
    const res = submitCenterQuestion({
      center: center.slug,
      centerName: center.shortName,
      ...f,
      contactBy: f.contactBy,
      regionName: w?.settings.org.regionName ?? "Riverbend",
    });
    if (!res.ok) return setErrors([{ fieldId: "ask-question", message: res.reason }]);
    setSent(true);
    setTimeout(() => panel.current?.focus(), 0);
  };

  if (sent)
    return (
      <div className="max-w-2xl rounded-2xl border-4 border-emerald-700 bg-white p-6">
        <h3 ref={panel} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
          Thanks, we&apos;ve got your question
        </h3>
        <p className="mt-2 text-lg text-ink">
          The {team} usually replies within {replyDays} working {replyDays === 1 ? "day" : "days"}.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setF({
              name: f.name,
              email: f.email,
              phone: f.phone,
              question: "",
              contactBy: f.contactBy,
            });
          }}
          className={`mt-3 min-h-11 rounded-sm text-base font-medium text-brand underline underline-offset-4 ${focusRing}`}
        >
          Ask another question
        </button>
      </div>
    );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex max-w-2xl flex-col gap-6"
      >
        <p className="text-lg text-neutral-700">
          Got a question about {center.shortName.toLowerCase()}? Our team will get back to you.
        </p>
        <ErrorSummary errors={errors} />
        <TextField
          id="ask-name"
          label="Your name"
          autoComplete="name"
          value={f.name}
          onChange={set("name")}
          error={err("ask-name")}
        />
        <TextField
          id="ask-email"
          label="Email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={f.email}
          onChange={set("email")}
          error={err("ask-email")}
        />
        <TextField
          id="ask-question"
          label="Your question"
          multiline
          rows={5}
          value={f.question}
          onChange={set("question")}
          error={err("ask-question")}
          hint="Please don't include private medical details."
        />
        <RadioField
          id="ask-by"
          legend="How should we reply?"
          columns={1}
          value={f.contactBy}
          options={CONTACT_BY}
          onChange={(v) => setF((p) => ({ ...p, contactBy: v }))}
          error={err("ask-by")}
        />
        {f.contactBy && f.contactBy !== "email" && (
          <TextField
            id="ask-phone"
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={f.phone}
            onChange={set("phone")}
            error={err("ask-phone")}
          />
        )}
        <Button
          type="submit"
          disabled={!ready}
          className={`h-12 w-fit bg-brand px-8 text-base text-white hover:bg-brand-hover ${focusRing}`}
        >
          Send question
        </Button>
      </form>
      <aside
        aria-label="Other ways to reach the team"
        className="h-fit rounded-2xl bg-neutral-50 p-5 text-base"
      >
        <p className="font-medium text-ink">Rather email?</p>
        <p className="mt-1">
          <a
            href={`mailto:${center.contactEmail}`}
            className={`rounded-sm font-medium text-brand underline underline-offset-4 ${focusRing}`}
          >
            {center.contactEmail}
          </a>
        </p>
      </aside>
    </div>
  );
}
