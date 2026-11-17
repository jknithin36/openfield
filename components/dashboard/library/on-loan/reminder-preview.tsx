"use client";

import { Button } from "@/components/ui/button";
import type { Contact, LibraryItem, LoanRequest } from "@/lib/types";
import { dueWording, formatDay } from "@/lib/format";
import { OPENFIELD_PHONE } from "@/lib/library/views";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";

/** Friendly, plain-language reminder email; staff check it, then send. */
export function reminderEmail(
  request: LoanRequest,
  item: LibraryItem,
  contact: Contact,
  now: Date,
) {
  const first = contact.name.split(" ")[0];
  const due = request.dueAt ? formatDay(request.dueAt) : "soon";
  const late = request.dueAt ? dueWording(request.dueAt, now).late : false;
  return {
    subject: late ? `Your ${item.name} is overdue` : `Your ${item.name} is due back ${due}`,
    body: [
      `Hi ${first},`,
      late
        ? `We hope ${item.name} has been helpful. It was due back on ${due}. Please send it back when you can.`
        : `Just a friendly reminder that ${item.name} is due back on ${due}.`,
      request.delivery === "ship"
        ? "Use the prepaid return label that came in the box. If you can't find it, reply and we'll send a new one."
        : "You can drop it off at the Openfield Center front desk.",
      `Need more time, or have a question? Call us on ${OPENFIELD_PHONE}.`,
      "Thank you,\nThe Openfield library team",
    ],
  };
}

export function ReminderPreview({
  request,
  item,
  contact,
  now,
  onSend,
  onCancel,
}: {
  request: LoanRequest;
  item: LibraryItem;
  contact: Contact;
  now: Date;
  onSend: () => void;
  onCancel: () => void;
}) {
  const email = reminderEmail(request, item, contact, now);
  return (
    <section className="border-t border-border px-5 py-4" aria-labelledby="reminder-heading">
      <h3 id="reminder-heading" className="text-sm font-semibold text-ink">
        Reminder email
      </h3>
      <dl className="mt-2 text-[15px]">
        <div className="flex gap-2">
          <dt className="text-neutral-600">To:</dt>
          <dd>{contact.email}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-neutral-600">Subject:</dt>
          <dd className="font-medium">{email.subject}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-neutral-50 p-4 text-[15px] leading-relaxed whitespace-pre-line text-neutral-800">
        {email.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={onSend}
          className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
        >
          Send reminder<span className="sr-only"> to {contact.name}</span>
        </Button>
        <Button variant="outline" onClick={onCancel} className={`h-11 px-4 ${focus}`}>
          Go back
        </Button>
      </div>
    </section>
  );
}
