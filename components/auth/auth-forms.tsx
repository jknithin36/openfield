"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hydrateDashboard, useDashboardStore } from "@/store/dashboard";
import {
  ErrorSummary,
  FieldError,
  errorGroupClass,
  type FormError,
} from "@/components/dashboard/shared/form-errors";
import { focusRing } from "@/components/dashboard/shared/fields";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;
const input = `mt-1.5 h-12 bg-white px-3.5 text-base ${focusRing}`;
const primary = `h-12 w-full bg-brand text-base text-white hover:bg-brand-hover ${focusRing}`;

function useTitle(title: string, hasErrors: boolean) {
  useEffect(() => {
    document.title = `${hasErrors ? "Error: " : ""}${title} · Openfield`;
  }, [title, hasErrors]);
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={errorGroupClass(!!error)}>
      <Label htmlFor={id} className="text-base font-medium text-ink">
        {label}
      </Label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-neutral-600">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
      {children}
    </div>
  );
}

// ── /sign-in ──────────────────────────────────────────────────────────────
export function SignIn() {
  const router = useRouter();
  const signedOut = useSearchParams().get("signedout") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  useTitle("Sign in to the staff dashboard", errors.length > 0);
  useEffect(() => hydrateDashboard(), []);
  const err = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const go = () => router.push("/dashboard");

  const submit = () => {
    const e: FormError[] = [];
    if (!email.trim()) e.push({ fieldId: "email", message: "Enter your email address" });
    else if (!EMAIL.test(email.trim()))
      e.push({
        fieldId: "email",
        message: "Enter an email address in the correct format, like name@example.com",
      });
    if (!password) e.push({ fieldId: "password", message: "Enter your password" });
    setErrors(e);
    if (e.length) return;
    // Demo: any valid email and password signs in as the current demo role.
    useDashboardStore.getState().signIn();
    go();
  };

  return (
    <div className="w-full max-w-[440px]">
      {signedOut && (
        <p
          role="status"
          className="mb-6 rounded-xl border-l-4 border-emerald-700 bg-white p-4 text-base text-ink"
        >
          You&apos;ve signed out.
        </p>
      )}
      <h1 className="text-[28px] leading-tight font-medium tracking-[-0.03em] text-ink">
        Sign in to the staff dashboard
      </h1>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mt-6 flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 sm:p-8"
      >
        <ErrorSummary errors={errors} />
        <Field id="email" label="Email address" error={err("email")}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!err("email")}
            aria-describedby={err("email") ? "email-error" : undefined}
            className={input}
          />
        </Field>
        <Field id="password" label="Password" error={err("password")}>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!err("password")}
              aria-describedby={err("password") ? "password-error" : undefined}
              className={`${input} pr-20`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-pressed={show}
              className={`absolute top-1/2 right-1.5 mt-[3px] min-h-10 -translate-y-1/2 rounded-md px-3 text-sm font-medium text-brand hover:bg-brand-soft ${focusRing}`}
            >
              {show ? "Hide" : "Show"}
              <span className="sr-only"> password</span>
            </button>
          </div>
        </Field>
        <Link href="/forgot-password" className={`w-fit text-base ${link}`}>
          Forgot your password?
        </Link>
        <Button type="submit" className={primary}>
          Sign in
        </Button>
      </form>

      <section
        aria-labelledby="demo-h"
        className="mt-6 rounded-2xl border border-dashed border-brand/40 bg-white p-6"
      >
        <h2 id="demo-h" className="text-lg font-medium text-ink">
          Exploring the template?
        </h2>
        <p className="mt-1 text-base text-neutral-700">
          Try the dashboard with demo data. No password needed.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            useDashboardStore.getState().signIn("admin");
            go();
          }}
          className={`mt-4 h-12 w-full border-brand text-base text-brand hover:bg-brand-soft ${focusRing}`}
        >
          Try the demo dashboard
        </Button>
      </section>

      <p className="mt-6 text-base text-neutral-700">
        Not staff? You don&apos;t need an account to borrow items, take courses or register for
        events.{" "}
        <Link href="/" className={link}>
          Go to the website
        </Link>
      </p>
    </div>
  );
}

// ── /forgot-password ──────────────────────────────────────────────────────
export function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormError[]>([]);
  useTitle("Reset your password", errors.length > 0);
  const err = errors[0]?.message;
  return (
    <div className="w-full max-w-[440px]">
      <Link href="/sign-in" className={`text-base ${link}`}>
        Back to sign in
      </Link>
      <h1 className="mt-6 text-[28px] leading-tight font-medium tracking-[-0.03em] text-ink">
        Reset your password
      </h1>
      <p className="mt-2 text-base text-neutral-700">
        Enter the email you use to sign in. We&apos;ll send you a link to set a new password.
      </p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const x = !email.trim()
            ? "Enter your email address"
            : !EMAIL.test(email.trim())
              ? "Enter an email address in the correct format, like name@example.com"
              : "";
          setErrors(x ? [{ fieldId: "fp-email", message: x }] : []);
          if (!x) router.push(`/forgot-password/sent?email=${encodeURIComponent(email.trim())}`);
        }}
        className="mt-6 flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 sm:p-8"
      >
        <ErrorSummary errors={errors} />
        <Field id="fp-email" label="Email address" error={err}>
          <Input
            id="fp-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!err}
            aria-describedby={err ? "fp-email-error" : undefined}
            className={input}
          />
        </Field>
        <Button type="submit" className={primary}>
          Send reset link
        </Button>
      </form>
    </div>
  );
}

export function ForgotPasswordSent() {
  const email = useSearchParams().get("email") ?? "your email";
  const h = useRef<HTMLHeadingElement>(null);
  useTitle("Check your email", false);
  useEffect(() => h.current?.focus(), []);
  return (
    <div className="w-full max-w-[440px]">
      <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
        <h1
          ref={h}
          tabIndex={-1}
          className="text-[28px] leading-tight font-medium tracking-[-0.03em] text-ink outline-none"
        >
          Check your email
        </h1>
        <p className="mt-3 text-lg text-ink">
          If an account exists for <strong className="font-semibold break-words">{email}</strong>,
          we&apos;ve sent a link to reset your password.
        </p>
        <p className="mt-3 text-base text-neutral-700">
          The link works for 30 minutes. If it doesn&apos;t arrive, check your spam folder or ask
          your manager.
        </p>
        <p className="mt-6 text-base">
          <Link href="/sign-in" className={link}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
