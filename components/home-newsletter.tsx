"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { hydrateContacts, useContactsStore } from "@/store/contacts";
import type { Role } from "@/lib/types";
import { ErrorSummary, type FormError } from "@/components/dashboard/shared/form-errors";
import { focusRing, TextField } from "@/components/dashboard/shared/fields";

/** Best match for what someone typed, e.g. "SEN teacher" → teacher. Their own words are kept as a tag. */
function guessRole(text: string): Role {
  const t = text.toLowerCase();
  if (/teach|school|educat|classroom|aide/.test(t)) return "teacher";
  if (/employ|manager|hr\b|business|hiring/.test(t)) return "employer";
  if (/self|autistic|disabled|myself|advoca/.test(t)) return "self-advocate";
  if (/parent|mom|mum|dad|father|mother|carer|caregiver|grand|family|guardian/.test(t))
    return "parent";
  return "provider";
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter sign-up. Saves the person as a contact with newsletter consent
 * (matched by email first, so no one is added twice).
 */
export function HomeNewsletter() {
  useEffect(() => hydrateContacts(), []);
  const ready = useContactsStore((s) => s.hydrated);
  const [f, setF] = useState({ first: "", last: "", role: "", zip: "", email: "" });
  const [errors, setErrors] = useState<FormError[]>([]);
  const [done, setDone] = useState<null | "new" | "already">(null);
  const panel = useRef<HTMLHeadingElement>(null);
  const set = (k: "first" | "last" | "role" | "zip" | "email") => (v: string) =>
    setF((p) => ({ ...p, [k]: v }));
  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;

  const submit = () => {
    const e: FormError[] = [];
    if (!f.first.trim()) e.push({ fieldId: "nl-first", message: "Enter your first name" });
    if (!f.last.trim()) e.push({ fieldId: "nl-last", message: "Enter your last name" });
    if (!f.role.trim()) e.push({ fieldId: "nl-role", message: "Enter your role" });
    if (!f.zip.trim()) e.push({ fieldId: "nl-zip", message: "Enter your ZIP code" });
    else if (!/^\d{5}(-\d{4})?$/.test(f.zip.trim()))
      e.push({ fieldId: "nl-zip", message: "Enter a ZIP code in the correct format, like 12345" });
    if (!f.email.trim()) e.push({ fieldId: "nl-email", message: "Enter your email address" });
    else if (!EMAIL.test(f.email.trim()))
      e.push({
        fieldId: "nl-email",
        message: "Enter an email address in the correct format, like name@example.com",
      });
    setErrors(e);
    if (e.length) return;

    const store = useContactsStore.getState();
    const email = f.email.trim().toLowerCase();
    const known = store.data?.contacts.find((c) => c.email.trim().toLowerCase() === email);
    if (known) {
      if (known.consent?.newsletter) return finish("already");
      store.setConsent(known.id, "newsletter", true);
      return finish("new");
    }
    const res = store.addContact({
      name: `${f.first.trim()} ${f.last.trim()}`,
      role: guessRole(f.role),
      email: f.email.trim(),
      phone: "",
      address: `ZIP ${f.zip.trim()}`,
      region: "Riverbend",
      inRegion: true,
      tags: ["newsletter", f.role.trim()],
    });
    if (!res.ok || !("id" in res) || typeof res.id !== "string")
      return setErrors([
        { fieldId: "nl-email", message: res.ok ? "Please try again." : res.reason },
      ]);
    store.setConsent(res.id, "newsletter", true);
    finish("new");
  };
  const finish = (kind: "new" | "already") => {
    setDone(kind);
    setTimeout(() => panel.current?.focus(), 0);
  };

  return (
    <section aria-labelledby="newsletter-heading">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 lg:px-8 lg:py-20">
        <h2
          id="newsletter-heading"
          className="mb-8 text-center text-2xl leading-tight font-medium tracking-[-0.03em] text-ink sm:text-[28px]"
        >
          Get our newsletter
        </h2>

        {done ? (
          <div className="rounded-2xl border-4 border-emerald-700 bg-white p-8 text-center">
            <h3 ref={panel} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
              {done === "already" ? "You're already signed up" : "You're signed up"}
            </h3>
            <p className="mt-2 text-lg text-ink">
              {done === "already"
                ? `${f.email.trim()} already gets our newsletter.`
                : `Your first newsletter will go to ${f.email.trim()}.`}
            </p>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex flex-col gap-5"
          >
            <ErrorSummary errors={errors} />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                id="nl-first"
                label="First name"
                autoComplete="given-name"
                value={f.first}
                onChange={set("first")}
                error={err("nl-first")}
              />
              <TextField
                id="nl-last"
                label="Last name"
                autoComplete="family-name"
                value={f.last}
                onChange={set("last")}
                error={err("nl-last")}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                id="nl-role"
                label="Role"
                value={f.role}
                onChange={set("role")}
                error={err("nl-role")}
              />
              <TextField
                id="nl-zip"
                label="ZIP code"
                inputMode="numeric"
                autoComplete="postal-code"
                value={f.zip}
                onChange={set("zip")}
                error={err("nl-zip")}
              />
            </div>
            <TextField
              id="nl-email"
              label="Email address"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={f.email}
              onChange={set("email")}
              error={err("nl-email")}
            />
            <Button
              type="submit"
              disabled={!ready}
              className={`h-12 w-full bg-brand text-base text-white hover:bg-brand-hover ${focusRing}`}
            >
              Sign up
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
