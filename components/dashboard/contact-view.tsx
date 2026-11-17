"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Call02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useContactsStore } from "@/store/contacts";
import type { Contact } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { dueWording, formatDay, formatMonthDay } from "@/lib/format";
import { canDeleteContact } from "@/lib/contacts/rules";
import { rightNow, timeline, TIMELINE_LABEL, type TimelineKind } from "@/lib/contacts/selectors";
import { ROLE_LABEL } from "@/lib/library/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { focusRing } from "@/components/dashboard/shared/fields";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { useWorkspace, type Workspace } from "@/components/dashboard/shared/use-workspace";
import { ContactForm } from "@/components/dashboard/contacts/contact-form";
import { LogCallDialog } from "@/components/dashboard/inbox/log-call-dialog";

const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;

function Section({
  title,
  id,
  children,
  action,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-border pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="text-lg font-medium text-ink">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-3 text-[15px]">{children}</div>
    </section>
  );
}

export function ContactView({ id }: { id: string }) {
  const w = useWorkspace();
  if (!w) return <PageHeader title="Contact" description="Loading…" />;
  const c = w.contacts.find((x) => x.id === id);
  if (!c)
    return (
      <PageHeader
        breadcrumb={[
          { label: "People" },
          { label: "Contacts", href: "/dashboard/contacts" },
          { label: "Not found" },
        ]}
        title="Contact not found"
        description="They may have been deleted."
      />
    );
  return <Detail w={w} c={c} />;
}

function Detail({ w, c }: { w: Workspace; c: Contact }) {
  const [now] = useState(() => new Date());
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [calling, setCalling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState<TimelineKind | "all">("all");
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [editNote, setEditNote] = useState<{ id: string; body: string } | null>(null);
  const editTrigger = useRef<HTMLElement | null>(null);
  const store = () => useContactsStore.getState();

  const items = useMemo(() => timeline(c, w.lib, w.ev.data, w.messages), [c, w]);
  const shown = filter === "all" ? items : items.filter((t) => t.kind === filter);
  const now$ = rightNow(c, w.lib, w.ev.data, w.messages, now);
  const del = canDeleteContact(c.id, w.lib);
  const since = c.createdAt ? new Date(c.createdAt).getFullYear() : null;
  const me = w.me?.name ?? "Sam Morgan";
  const kinds = [...new Set(items.map((t) => t.kind))];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        breadcrumb={[
          { label: "People" },
          { label: "Contacts", href: "/dashboard/contacts" },
          { label: c.name },
        ]}
        title={c.name}
        description={`${ROLE_LABEL[c.role]} · ${c.inRegion ? "Riverbend" : `${c.region} (outside the region)`}${since ? ` · Contact since ${since}` : ""}`}
        primaryAction={{
          label: "Log a call",
          onClick: () => setCalling(true),
          icon: <HugeiconsIcon icon={Call02Icon} strokeWidth={2} aria-hidden="true" />,
        }}
        moreActions={[
          {
            label: "Edit",
            onSelect: () => {
              editTrigger.current = document.activeElement as HTMLElement | null;
              setEditing(true);
            },
          },
          {
            label: "Export history",
            onSelect: () =>
              downloadCsv(`openfield-${c.name.replace(/\s+/g, "-").toLowerCase()}-history`, [
                ["Date", "Type", "What", "Detail"],
                ...items.map((t) => [
                  t.at.slice(0, 10),
                  TIMELINE_LABEL[t.kind],
                  t.title,
                  t.detail ?? "",
                ]),
              ]),
          },
          { label: "Delete", onSelect: () => setDeleting(true) },
        ]}
      />

      {c.accessibilityNeeds && (
        <p className="flex items-start gap-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-[17px] font-medium text-amber-950">
          <HugeiconsIcon
            icon={InformationCircleIcon}
            strokeWidth={2}
            aria-hidden="true"
            className="mt-0.5 size-6 shrink-0"
          />
          <span>
            <span className="sr-only">Accessibility needs: </span>
            {c.accessibilityNeeds}
          </span>
        </p>
      )}

      <Section id="summary" title="Summary">
        <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {[
            ["Role", ROLE_LABEL[c.role]],
            [
              "Email",
              c.email ? (
                <a key="e" href={`mailto:${c.email}`} className={link}>
                  {c.email}
                </a>
              ) : (
                "—"
              ),
            ],
            [
              "Phone",
              c.phone ? (
                <a key="p" href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className={link}>
                  {c.phone}
                </a>
              ) : (
                "—"
              ),
            ],
            ["Address", c.address || "—"],
            [
              "Region",
              c.inRegion
                ? "Riverbend region (eligible to borrow)"
                : `${c.region} — outside the region`,
            ],
            [
              "Prefers",
              c.preferredContact === "phone"
                ? "Phone"
                : c.preferredContact === "text"
                  ? "Text message"
                  : "Email",
            ],
            ["Tags", c.tags?.length ? c.tags.join(", ") : "—"],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex gap-2">
              <dt className="shrink-0 text-neutral-600">{k}:</dt>
              <dd className="text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="right-now" title="Right now">
        {now$.loans.length +
          now$.waiting.length +
          now$.registrations.length +
          now$.messages.length +
          now$.accommodations.length ===
        0 ? (
          <p className="text-neutral-600">Nothing open right now.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-white">
            {now$.loans.map(({ r, name, overdue }) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 p-3">
                <Link
                  href={
                    r.status === "on-loan"
                      ? `/dashboard/library/on-loan?id=${r.id}`
                      : "/dashboard/library/to-ship"
                  }
                  className={link}
                >
                  {name}
                </Link>
                {r.status === "approved" ? (
                  <span>Approved, being packed</span>
                ) : (
                  r.dueAt &&
                  (overdue ? (
                    <StatusText tone="danger">{dueWording(r.dueAt, now).text}</StatusText>
                  ) : (
                    <span>
                      On loan · due <time dateTime={r.dueAt}>{formatDay(r.dueAt)}</time>
                    </span>
                  ))
                )}
              </li>
            ))}
            {now$.waiting.map(({ r, name }) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 p-3">
                <Link
                  href={`/dashboard/library/requests?status=${r.status}&id=${r.id}`}
                  className={link}
                >
                  {name}
                </Link>
                <span>
                  {r.status === "waiting" ? "Request waiting for a decision" : "On the waitlist"}
                </span>
              </li>
            ))}
            {now$.registrations.map(({ r, event }) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 p-3">
                <Link
                  href={`/dashboard/events/${event.id}?tab=registrations&reg=${r.id}`}
                  className={link}
                >
                  {event.title}
                </Link>
                <span>
                  {r.status === "waitlisted" ? "On the waitlist" : "Registered"} ·{" "}
                  <time dateTime={event.startsAt}>{formatDay(event.startsAt)}</time>
                </span>
              </li>
            ))}
            {now$.messages.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2 p-3">
                <Link href={`/dashboard/inbox?status=all&id=${m.id}`} className={link}>
                  {m.subject}
                </Link>
                <span>
                  Open message · <time dateTime={m.receivedAt}>{formatMonthDay(m.receivedAt)}</time>
                </span>
              </li>
            ))}
            {now$.accommodations.map(({ a, event }) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 p-3">
                <Link href="/dashboard/events/accommodations" className={link}>
                  {a.type.replace("-", " ")} for {event?.title}
                </Link>
                <StatusText tone="warning">Not arranged yet</StatusText>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="timeline" title="Timeline">
        <div role="group" aria-label="Filter the timeline" className="mb-4 flex flex-wrap gap-2">
          {(["all", ...kinds] as Array<TimelineKind | "all">).map((k) => (
            <Button
              key={k}
              variant="outline"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={`h-11 px-3 ${filter === k ? "border-brand bg-brand-soft text-brand" : ""} ${focusRing}`}
            >
              {k === "all" ? "Everything" : `${TIMELINE_LABEL[k]}s`}
            </Button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="text-neutral-600">Nothing here yet.</p>
        ) : (
          <ol className="relative flex flex-col gap-4 border-l-2 border-border pl-6">
            {shown.slice(0, 60).map((t) => (
              <li key={t.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 -left-[31px] size-3 rounded-full border-2 border-white bg-brand"
                />
                <p className="text-sm text-neutral-600">
                  <time dateTime={t.at}>{formatDay(t.at)}</time> · {TIMELINE_LABEL[t.kind]}
                </p>
                <p className="text-ink">
                  {t.href ? (
                    <Link href={t.href} className={link}>
                      {t.title}
                    </Link>
                  ) : (
                    t.title
                  )}
                </p>
                {t.detail && <p className="text-sm text-neutral-700">{t.detail}</p>}
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section id="notes" title="Notes">
        <form
          noValidate
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return setNoteError("Write the note");
            if (
              notifyResult(store().addNote(c.id, note, me), {
                success: "Note added.",
                undone: "Note removed",
              })
            ) {
              setNote("");
              setNoteError("");
            }
          }}
        >
          <Label htmlFor="new-note">Add an internal note</Label>
          {noteError && (
            <p id="new-note-error" className="text-sm font-semibold text-red-700">
              <span className="sr-only">Error: </span>
              {noteError}
            </p>
          )}
          <Textarea
            id="new-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-invalid={!!noteError}
            aria-describedby={noteError ? "new-note-error" : undefined}
            className={`bg-background text-base ${focusRing}`}
          />
          <Button
            type="submit"
            className={`h-11 w-fit bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
          >
            Save note
          </Button>
        </form>
        <ul className="mt-4 flex flex-col gap-3">
          {(c.notes ?? []).map((n) => (
            <li key={n.id} className="rounded-lg border border-border bg-white p-3">
              <p className="text-sm text-neutral-600">
                <time dateTime={n.at}>{formatDay(n.at)}</time> · {n.by}
              </p>
              {editNote?.id === n.id ? (
                <div className="mt-2 flex flex-col gap-2">
                  <Label htmlFor={`edit-${n.id}`} className="sr-only">
                    Edit note
                  </Label>
                  <Textarea
                    id={`edit-${n.id}`}
                    rows={2}
                    value={editNote.body}
                    onChange={(e) => setEditNote({ id: n.id, body: e.target.value })}
                    className={`text-base ${focusRing}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (
                          notifyResult(store().editNote(c.id, n.id, editNote.body), {
                            success: "Note saved.",
                            undone: "Undone",
                          })
                        )
                          setEditNote(null);
                      }}
                      className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditNote(null)}
                      className={`h-11 px-4 ${focusRing}`}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p className="text-ink">{n.body}</p>
                  <Button
                    variant="ghost"
                    onClick={() => setEditNote({ id: n.id, body: n.body })}
                    className={`h-11 shrink-0 px-3 text-brand underline underline-offset-4 ${focusRing}`}
                  >
                    Edit<span className="sr-only"> note from {formatDay(n.at)}</span>
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="consent" title="Consent">
        <ul className="flex flex-col">
          {(["newsletter", "storiesAndPhotos"] as const).map((k) => (
            <li key={k} className="flex min-h-11 items-center gap-2.5">
              <Checkbox
                id={`consent-${k}`}
                checked={!!c.consent?.[k]}
                onCheckedChange={(v) =>
                  notifyResult(store().setConsent(c.id, k, v === true), {
                    success: "Consent updated.",
                    undone: "Undone",
                  })
                }
                className={`size-5 ${focusRing}`}
              />
              <Label htmlFor={`consent-${k}`} className="font-normal">
                {k === "newsletter" ? "Newsletter" : "Stories and photos may be shared"}
              </Label>
            </li>
          ))}
        </ul>
        {c.consent?.changedAt && (
          <p className="mt-1 text-sm text-neutral-600">
            Last changed{" "}
            <time dateTime={c.consent.changedAt}>{formatDay(c.consent.changedAt)}</time>
          </p>
        )}
      </Section>

      <ContactForm
        open={editing}
        onOpenChange={setEditing}
        contact={c}
        contacts={w.contacts}
        returnFocusRef={editTrigger}
      />
      <LogCallDialog
        open={calling}
        onOpenChange={setCalling}
        contacts={w.contacts}
        presetContactId={c.id}
      />

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {del.ok ? `Delete ${c.name}?` : `${c.name} can't be deleted yet`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {del.ok
                ? "Their record is removed. Loans and event history stay, without their name."
                : del.reason}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={`h-11 px-4 ${focusRing}`}>
              {del.ok ? "Cancel" : "Close"}
            </AlertDialogCancel>
            {del.ok && (
              <AlertDialogAction
                onClick={() => {
                  if (
                    notifyResult(store().deleteContact(c.id, true), {
                      success: `${c.name} deleted.`,
                      undone: "Contact restored",
                    })
                  )
                    router.push("/dashboard/contacts");
                }}
                className={`h-11 bg-red-700 px-4 text-white hover:bg-red-800 ${focusRing}`}
              >
                Delete contact
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
