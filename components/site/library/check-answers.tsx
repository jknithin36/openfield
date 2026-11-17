"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { submitPublicRequest } from "@/store/library-public";
import type { LibraryItem, OrganizationSettings, LibraryData } from "@/lib/types";
import { itemBySlug } from "@/lib/library/public";
import { activeLoansFor } from "@/lib/library/selectors";
import { ErrorSummary, type FormError } from "@/components/dashboard/shared/form-errors";
import { focusRing } from "@/components/dashboard/shared/fields";
import { usePublicLibrary } from "@/components/site/library/use-public-library";
import {
  addressText,
  CONTACT_BY,
  firstMissing,
  useDraft,
  WHO,
  WHO_ROLE,
} from "@/components/site/library/request-steps/draft";
import {
  BackLink,
  link,
  RequestShell,
  usePageTitle,
} from "@/components/site/library/request-steps/request-steps";

export function CheckAnswers({ slug }: { slug: string }) {
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
  return <Check item={item} lib={d.lib} org={d.org} />;
}

function Check({
  item,
  lib,
  org,
}: {
  item: LibraryItem;
  lib: LibraryData;
  org: OrganizationSettings;
}) {
  const router = useRouter();
  const { draft, clear } = useDraft(item.slug);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [sending, setSending] = useState(false);
  const h1 = useRef<HTMLHeadingElement>(null);
  const missing = firstMissing(draft);
  const base = `/library/${item.slug}/request`;
  usePageTitle(`Check your answers · Borrow ${item.name}`, errors.length > 0);

  // Arriving here with gaps (e.g. a bookmarked link) goes back to the first one.
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

  const known = lib.contacts.find(
    (c) => c.email.trim().toLowerCase() === draft.email.trim().toLowerCase(),
  );
  const loans = known ? activeLoansFor(lib, known.id) : 0;
  const limit = lib.settings.loanLimitPerPerson;
  const change = (step: number) => `${base}?step=${step}&from=check`;

  const rows: Array<{ k: string; v: React.ReactNode; step?: number; what?: string }> = [
    { k: "Item", v: item.name },
    { k: "Who it's for", v: draft.who ? WHO[draft.who] : "", step: 1, what: "who it's for" },
    { k: "Region", v: `Lives or works in the ${org.regionName} region`, step: 2, what: "region" },
    { k: "Name", v: draft.name, step: 3, what: "name" },
    { k: "Email", v: draft.email, step: 3, what: "email address" },
    { k: "Phone", v: draft.phone || "Not given", step: 3, what: "phone number" },
    {
      k: "Contact by",
      v: draft.contactBy ? CONTACT_BY[draft.contactBy] : "",
      step: 3,
      what: "how we contact you",
    },
    {
      k: "Delivery",
      v: draft.delivery === "ship" ? "Ship it to me" : `Pick it up at ${org.address.split(",")[0]}`,
      step: 4,
      what: "delivery",
    },
    ...(draft.delivery === "ship"
      ? [{ k: "Address", v: addressText(draft), step: 4, what: "address" }]
      : []),
    { k: "Note", v: draft.note.trim() || "None", step: 5, what: "note" },
  ];

  const send = () => {
    if (sending) return;
    setSending(true);
    const res = submitPublicRequest({
      itemId: item.id,
      role: WHO_ROLE[draft.who!],
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      preferredContact: draft.contactBy ?? "email",
      delivery: draft.delivery ?? "ship",
      address: addressText(draft),
      note: draft.note,
      regionName: org.regionName,
    });
    if (!res.ok) {
      setSending(false);
      setErrors([{ fieldId: "send", message: res.reason }]);
      return;
    }
    clear();
    router.push(`/library/request/sent?ref=${encodeURIComponent(res.ref)}`);
  };

  return (
    <RequestShell>
      <BackLink href={`${base}?step=5`} />
      <div className="mt-6 flex flex-col gap-6">
        <ErrorSummary errors={errors} />
        <div>
          <p className="text-base text-neutral-600">Borrow: {item.name}</p>
          <h1
            ref={h1}
            tabIndex={-1}
            className="mt-1 text-3xl font-medium tracking-[-0.03em] text-ink outline-none"
          >
            Check your answers
          </h1>
        </div>

        {loans >= limit && (
          <div className="border-l-4 border-brand bg-brand-soft p-4 text-base text-ink">
            You already have {loans} items on loan, which is our limit. You can still send this
            request and we&apos;ll hold it until one comes back.
          </div>
        )}

        <dl className="border-t border-border">
          {rows.map((r) => (
            <div
              key={r.k}
              className="grid gap-1 border-b border-border py-4 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:gap-4"
            >
              <dt className="text-base font-semibold text-ink">{r.k}</dt>
              <dd className="text-base break-words whitespace-pre-line text-ink">{r.v}</dd>
              <dd className="sm:text-right">
                {r.step && (
                  <Link
                    href={change(r.step)}
                    className={`inline-flex min-h-11 items-center sm:min-h-0 ${link}`}
                  >
                    Change<span className="sr-only"> {r.what}</span>
                  </Link>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div>
          <h2 className="text-xl font-medium text-ink">Now send your request</h2>
          <p className="mt-2 text-base text-neutral-700">
            We&apos;ll use your details to handle this request.{" "}
            <Link href="/privacy" className={link}>
              Privacy policy
            </Link>
          </p>
        </div>
        <Button
          id="send"
          onClick={send}
          disabled={sending}
          className={`h-12 w-fit bg-brand px-8 text-base text-white hover:bg-brand-hover ${focusRing}`}
        >
          {sending ? "Sending…" : "Send request"}
        </Button>
      </div>
    </RequestShell>
  );
}
