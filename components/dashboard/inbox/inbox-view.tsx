"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Call02Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Globe02Icon,
  Mail01Icon,
  NoteEditIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useContactsStore } from "@/store/contacts";
import { useInboxStore } from "@/store/inbox";
import type { Message, MessageSource, Team, ThreadEntry } from "@/lib/types";
import { formatDay, formatMonthDay, relativeDay } from "@/lib/format";
import { findDuplicate } from "@/lib/contacts/selectors";
import {
  contactFromMessage,
  isOverTarget,
  messageAgeDays,
  MSG_SOURCE_LABEL,
  MSG_STATUS_LABEL,
  relatedContext,
  TEAM_LABEL,
  TOPIC_LABEL,
  visibleTo,
} from "@/lib/inbox/selectors";
import { parseOne, ROLE_LABEL } from "@/lib/library/views";
import { CENTERS } from "@/data/centers";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { focusRing, RadioField } from "@/components/dashboard/shared/fields";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { StatusText, type Tone } from "@/components/dashboard/shared/status-text";
import { Toolbar } from "@/components/dashboard/shared/toolbar";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { useWorkspace, type Workspace } from "@/components/dashboard/shared/use-workspace";
import { LogCallDialog } from "@/components/dashboard/inbox/log-call-dialog";

const TABS = ["unanswered", "mine", "waiting", "resolved", "all"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  unanswered: "Unanswered",
  mine: "Assigned to me",
  waiting: "Waiting on them",
  resolved: "Resolved",
  all: "All",
};
const EMPTY: Record<Tab, string> = {
  unanswered: "Nothing unanswered. Everyone has heard back.",
  mine: "Nothing assigned to you right now.",
  waiting: "No one owes us a reply.",
  resolved: "No resolved messages yet.",
  all: "No messages.",
};
const SOURCE_ICON: Record<MessageSource, typeof Mail01Icon> = {
  website: Globe02Icon,
  phone: Call02Icon,
  email: Mail01Icon,
};
const STATUS_TONE: Record<Message["status"], Tone> = {
  unanswered: "warning",
  assigned: "info",
  "waiting-on-them": "neutral",
  resolved: "success",
};
const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;

const SNIPPETS = [
  {
    label: "Library loan: how it works",
    body: "Our lending library is free for families in the Riverbend region. Loans last four weeks, and we send a prepaid return label with every item.",
  },
  {
    label: "Event: you're registered",
    body: "You're registered. We'll send a reminder two days before, with directions and the accessibility details you asked about.",
  },
  {
    label: "We'll call you",
    body: "Thanks for getting in touch. One of our team will call you within two working days at the number you gave us.",
  },
  {
    label: "Point to a family guide",
    body: "We have a short, plain-language guide that covers this. You can find it under Families on our website.",
  },
];

export function InboxView() {
  const w = useWorkspace();
  return w ? <Inbox w={w} /> : <PageHeader title="Inbox" description="Loading…" />;
}

function Inbox({ w }: { w: Workspace }) {
  const [now] = useState(() => new Date());
  const { searchParams, setParams, hrefWith } = useUrlState();
  const [calling, setCalling] = useState(searchParams.get("call") === "1");
  const tab = parseOne(searchParams.get("status"), TABS, "unanswered");
  const id = searchParams.get("id");
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const topic = searchParams.get("topic");
  const team = searchParams.get("team");
  const source = searchParams.get("source");
  const center = searchParams.get("center");
  const rules = w.settings.inboxRules;
  const myId = w.me?.id ?? null;

  const visible = useMemo(
    () => w.messages.filter((m) => visibleTo(m, w.role, myId)),
    [w.messages, w.role, myId],
  );
  const inTab = (m: Message, t: Tab) =>
    t === "all"
      ? true
      : t === "unanswered"
        ? m.status === "unanswered"
        : t === "mine"
          ? m.assignedTo === myId && m.status !== "resolved"
          : t === "waiting"
            ? m.status === "waiting-on-them"
            : m.status === "resolved";

  const list = visible
    .filter((m) => inTab(m, tab))
    .filter((m) => !topic || m.topic === topic)
    .filter((m) => !team || m.team === team)
    .filter((m) => !source || m.source === source)
    .filter((m) => !center || m.center === center)
    .filter(
      (m) =>
        !q || [m.name, m.email, m.subject, m.body, m.id].some((x) => x?.toLowerCase().includes(q)),
    );
  // Waiting to be answered: oldest first (most urgent). Everything else: newest first.
  const rows = list.sort((a, b) =>
    tab === "unanswered"
      ? a.receivedAt.localeCompare(b.receivedAt)
      : b.receivedAt.localeCompare(a.receivedAt),
  );

  const selected = id ? visible.find((m) => m.id === id) : undefined;
  const counts = Object.fromEntries(
    TABS.map((t) => [t, visible.filter((m) => inTab(m, t)).length]),
  ) as Record<Tab, number>;
  const over = visible.filter((m) => isOverTarget(m, rules, now)).length;

  /** After closing a message out, move to the next one in the list. */
  const next = (current: string) => {
    const i = rows.findIndex((m) => m.id === current);
    const after = rows[i + 1] ?? rows[i - 1];
    return after && after.id !== current ? after.id : null;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "People" }, { label: "Inbox" }]}
        title="Inbox"
        count={counts.unanswered ? `(${counts.unanswered} unanswered)` : undefined}
        description={
          over
            ? `${over} ${over === 1 ? "message is" : "messages are"} past our ${rules.replyTargetDays}-day reply target.`
            : `Everyone gets a reply within ${rules.replyTargetDays} working days. We're on track.`
        }
        primaryAction={{
          label: "Log a phone call",
          onClick: () => setCalling(true),
          icon: <HugeiconsIcon icon={Call02Icon} strokeWidth={2} aria-hidden="true" />,
        }}
        tabs={{
          label: "Messages",
          current: tab,
          defaultValue: "unanswered",
          items: TABS.map((t) => ({ value: t, label: TAB_LABEL[t], count: counts[t] })),
        }}
      />

      <Toolbar
        searchLabel="Search messages"
        searchPlaceholder="Name, email, subject or words"
        filters={[
          {
            key: "topic",
            label: "Topic",
            options: Object.entries(TOPIC_LABEL).map(([value, label]) => ({ value, label })),
          },
          {
            key: "team",
            label: "Team",
            options: Object.entries(TEAM_LABEL).map(([value, label]) => ({ value, label })),
          },
          {
            key: "source",
            label: "Came in by",
            options: Object.entries(MSG_SOURCE_LABEL).map(([value, label]) => ({ value, label })),
          },
          {
            key: "center",
            label: "Topic page",
            options: CENTERS.map((c) => ({ value: c.slug, label: c.shortName })),
          },
        ]}
      />

      <div className="grid min-h-[560px] overflow-hidden rounded-xl border border-border bg-white lg:grid-cols-[minmax(320px,380px)_1fr]">
        {/* List pane. On small screens it hides while a message is open. */}
        <div className={`border-border lg:border-r ${selected ? "hidden lg:block" : ""}`}>
          <h2 className="sr-only">{TAB_LABEL[tab]} messages</h2>
          {rows.length === 0 ? (
            <div className="p-4">
              <EmptyState>
                {q || topic || team || source || center
                  ? "No messages match your search."
                  : EMPTY[tab]}
              </EmptyState>
            </div>
          ) : (
            <ul className="max-h-[720px] divide-y divide-border overflow-y-auto">
              {rows.map((m) => {
                const late = isOverTarget(m, rules, now);
                const active = m.id === selected?.id;
                return (
                  <li key={m.id}>
                    <Link
                      href={hrefWith({ id: m.id })}
                      scroll={false}
                      aria-current={active ? "true" : undefined}
                      className={`relative flex flex-col gap-1 px-4 py-3.5 outline-none hover:bg-neutral-50 focus-visible:z-10 ${focusRing} ${active ? "bg-brand-soft before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-brand hover:bg-brand-soft" : ""}`}
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span
                          className={`truncate text-[15px] text-ink ${m.status === "unanswered" ? "font-semibold" : "font-medium"}`}
                        >
                          {m.name}
                        </span>
                        <time dateTime={m.receivedAt} className="shrink-0 text-sm text-neutral-600">
                          {formatMonthDay(m.receivedAt)}
                        </time>
                      </span>
                      <span className="truncate text-[15px] text-neutral-800">{m.subject}</span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
                        <span className="inline-flex items-center gap-1">
                          <HugeiconsIcon
                            icon={SOURCE_ICON[m.source]}
                            strokeWidth={2}
                            aria-hidden="true"
                            className="size-3.5"
                          />
                          {MSG_SOURCE_LABEL[m.source]}
                        </span>
                        <span>{TOPIC_LABEL[m.topic]}</span>
                        {late && (
                          <StatusText tone="danger">
                            {messageAgeDays(m, now)} days, past target
                          </StatusText>
                        )}
                        {tab === "all" && !late && <span>{MSG_STATUS_LABEL[m.status]}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Reading pane. */}
        <div className={selected ? "" : "hidden lg:block"}>
          {selected ? (
            <MessagePane
              key={selected.id}
              w={w}
              m={selected}
              now={now}
              onBack={() => setParams({ id: null })}
              onClosed={() => setParams({ id: next(selected.id) })}
            />
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 p-8 text-center">
              <HugeiconsIcon
                icon={Mail01Icon}
                strokeWidth={1.5}
                aria-hidden="true"
                className="size-8 text-neutral-400"
              />
              <p className="text-[15px] text-neutral-600">Choose a message to read it.</p>
            </div>
          )}
        </div>
      </div>

      <LogCallDialog
        open={calling}
        onOpenChange={(o) => {
          setCalling(o);
          if (!o && searchParams.get("call")) setParams({ call: null });
        }}
        contacts={w.contacts}
      />
    </div>
  );
}

type Entry = ThreadEntry & { kind: "message" | "reply" | "note" };

function MessagePane({
  w,
  m,
  now,
  onBack,
  onClosed,
}: {
  w: Workspace;
  m: Message;
  now: Date;
  onBack: () => void;
  onClosed: () => void;
}) {
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const composer = useRef<HTMLTextAreaElement>(null);
  const store = () => useInboxStore.getState();
  const me = w.me?.name ?? "Openfield team";
  const contact = contactFromMessage(m, w.contacts);
  const ctx = contact ? relatedContext(contact.id, w.lib, w.ev.data, now) : null;
  const dup = !contact ? findDuplicate(w.contacts, m.email, m.phone ?? "") : undefined;
  const assignee = m.assignedTo ? w.settings.staff.find((s) => s.id === m.assignedTo) : undefined;
  const late = isOverTarget(m, w.settings.inboxRules, now);
  const closed = m.status === "resolved";
  const first = (m.name.split(" ")[0] || m.name).trim();

  const thread: Entry[] = [
    { kind: "message" as const, at: m.receivedAt, by: m.name, body: m.body },
    ...m.replies.map((r) => ({ ...r, kind: "reply" as const })),
    ...m.internalNotes.map((r) => ({ ...r, kind: "note" as const })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  const send = () => {
    if (!text.trim()) {
      setError(mode === "reply" ? "Write your reply" : "Write the note");
      composer.current?.focus();
      return;
    }
    const ok =
      mode === "reply"
        ? notifyResult(store().reply(m.id, text, me), {
            success: `Reply sent to ${m.name}. Now waiting on them.`,
            undone: "Reply withdrawn",
          })
        : notifyResult(store().addNote(m.id, text, me), {
            success: "Internal note added.",
            undone: "Note removed",
          });
    if (ok) {
      setText("");
      setError("");
      setPreview(false);
    }
  };

  const createContact = () => {
    const res = useContactsStore.getState().addContact({
      name: m.name,
      role: "parent",
      email: m.email,
      phone: m.phone ?? "",
      address: "",
      region: "Riverbend",
      inRegion: true,
    });
    if (!res.ok || !("id" in res) || typeof res.id !== "string")
      return notifyResult(res, { success: "" });
    notifyResult(store().linkContact(m.id, res.id), {
      success: `${m.name} added to contacts and linked.`,
      undone: "Unlinked",
    });
  };

  return (
    <article aria-labelledby="msg-subject" className="flex h-full flex-col">
      <div className="border-b border-border p-5 sm:p-6">
        <button
          type="button"
          onClick={onBack}
          className={`mb-3 -ml-1 inline-flex min-h-11 items-center gap-1 rounded-sm px-1 text-[15px] font-medium text-brand lg:hidden ${focusRing}`}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="size-4"
          />
          Back to messages
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="msg-subject" className="text-xl font-semibold text-balance text-ink">
              {m.subject}
            </h2>
            <p className="mt-1 text-[15px] text-neutral-700">
              From{" "}
              {contact ? (
                <Link href={`/dashboard/contacts/${contact.id}`} className={link}>
                  {m.name}
                </Link>
              ) : (
                <span className="font-medium text-ink">{m.name}</span>
              )}
              {contact && <span className="text-neutral-600"> · {ROLE_LABEL[contact.role]}</span>}
              {m.email && (
                <>
                  {" "}
                  ·{" "}
                  <a href={`mailto:${m.email}`} className={link}>
                    {m.email}
                  </a>
                </>
              )}
              {m.phone && (
                <>
                  {" "}
                  ·{" "}
                  <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`} className={link}>
                    {m.phone}
                  </a>
                </>
              )}
            </p>
          </div>
          <StatusText tone={STATUS_TONE[m.status]}>{MSG_STATUS_LABEL[m.status]}</StatusText>
        </div>
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-700">
          <div className="flex gap-1">
            <dt>Came in:</dt>
            <dd>
              {MSG_SOURCE_LABEL[m.source]},{" "}
              <time dateTime={m.receivedAt}>{relativeDay(m.receivedAt, now)}</time>
            </dd>
          </div>
          <div className="flex gap-1">
            <dt>Topic:</dt>
            <dd>{TOPIC_LABEL[m.topic]}</dd>
          </div>
          {m.center && (
            <div className="flex gap-1">
              <dt>Asked on:</dt>
              <dd>{CENTERS.find((c) => c.slug === m.center)?.shortName} page</dd>
            </div>
          )}
          <div className="flex gap-1">
            <dt>With:</dt>
            <dd>
              {assignee ? assignee.name : m.team ? `${TEAM_LABEL[m.team]} team` : "No one yet"}
            </dd>
          </div>
        </dl>
        {late && (
          <p className="mt-3">
            <StatusText tone="danger">
              Waiting {messageAgeDays(m, now)} days. Our target is{" "}
              {w.settings.inboxRules.replyTargetDays}.
            </StatusText>
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {closed ? (
            <Button
              onClick={() =>
                notifyResult(store().reopen(m.id), {
                  success: "Message reopened.",
                  undone: "Resolved again",
                })
              }
              className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
            >
              Reopen
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setAssigning(true)}
                className={`h-11 px-4 ${focusRing}`}
              >
                {m.team || m.assignedTo ? "Reassign" : "Assign"}
              </Button>
              {m.status !== "waiting-on-them" && (
                <Button
                  variant="outline"
                  onClick={() =>
                    notifyResult(store().markWaiting(m.id), {
                      success: "Marked as waiting on them.",
                      undone: "Undone",
                    })
                  }
                  className={`h-11 gap-1.5 px-4 ${focusRing}`}
                >
                  <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} aria-hidden="true" />
                  Waiting on them
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    notifyResult(store().resolve(m.id), {
                      success: "Resolved.",
                      undone: "Reopened",
                    })
                  )
                    onClosed();
                }}
                className={`h-11 gap-1.5 px-4 ${focusRing}`}
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} aria-hidden="true" />
                Resolve
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Who is this? Everything open for them, so the reply can be specific. */}
      <section
        aria-labelledby="msg-context"
        className="border-b border-border bg-neutral-50/70 px-5 py-4 sm:px-6"
      >
        <h3 id="msg-context" className="text-[15px] font-semibold text-ink">
          About {first}
        </h3>
        {contact && ctx ? (
          <>
            {contact.accessibilityNeeds && (
              <p className="mt-1.5 text-[15px] font-medium text-amber-900">
                {contact.accessibilityNeeds}
              </p>
            )}
            {ctx.loans.length +
              ctx.requests.length +
              ctx.registrations.length +
              ctx.accommodations.length ===
            0 ? (
              <p className="mt-1 text-[15px] text-neutral-600">Nothing open with us right now.</p>
            ) : (
              <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-2">
                {ctx.loans.map((l) => (
                  <li key={l.id}>
                    <Link href={l.href} className={link}>
                      {l.label}
                    </Link>
                    {l.overdue ? (
                      <StatusText tone="danger" className="ml-2 text-sm">
                        Overdue
                      </StatusText>
                    ) : (
                      l.due && (
                        <span className="text-sm text-neutral-600">
                          {" "}
                          · due {formatMonthDay(l.due)}
                        </span>
                      )
                    )}
                  </li>
                ))}
                {ctx.requests.map((r) => (
                  <li key={r.id}>
                    <Link href={r.href} className={link}>
                      {r.label}
                    </Link>
                  </li>
                ))}
                {ctx.registrations.map((r) => (
                  <li key={r.id}>
                    <Link href={r.href} className={link}>
                      {r.label}
                    </Link>
                    <span className="text-sm text-neutral-600"> · {formatMonthDay(r.date)}</span>
                  </li>
                ))}
                {ctx.accommodations.map((a) => (
                  <li key={a.id}>
                    <Link href={a.href} className={link}>
                      {a.label}
                    </Link>{" "}
                    <StatusText tone="warning" className="text-sm">
                      Not arranged
                    </StatusText>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[15px]">
            <span className="text-neutral-700">
              {dup
                ? `This looks like ${dup.name}, who is already in contacts.`
                : "Not in contacts yet."}
            </span>
            {dup ? (
              <Button
                variant="outline"
                onClick={() =>
                  notifyResult(store().linkContact(m.id, dup.id), {
                    success: `Linked to ${dup.name}.`,
                    undone: "Unlinked",
                  })
                }
                className={`h-11 px-3 ${focusRing}`}
              >
                Link to {dup.name}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={createContact}
                className={`h-11 gap-1.5 px-3 ${focusRing}`}
              >
                <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} aria-hidden="true" />
                Create contact
              </Button>
            )}
          </div>
        )}
      </section>

      <section aria-label="Conversation" className="flex-1 px-5 py-5 sm:px-6">
        <ol className="flex flex-col gap-4">
          {thread.map((e, i) => (
            <li
              key={i}
              className={
                e.kind === "note"
                  ? "rounded-lg border border-dashed border-amber-400 bg-amber-50/60 p-4"
                  : e.kind === "reply"
                    ? "ml-0 rounded-lg border border-brand/15 bg-brand-soft/60 p-4 sm:ml-10"
                    : "rounded-lg border border-border p-4 sm:mr-10"
              }
            >
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-600">
                {e.kind === "note" && (
                  <>
                    <HugeiconsIcon
                      icon={NoteEditIcon}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="size-4 text-amber-800"
                    />
                    <span className="font-semibold text-amber-900">Internal note, not sent</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span className="font-medium text-ink">
                  {e.kind === "reply" ? `${e.by} replied` : e.by}
                </span>
                <span aria-hidden="true">·</span>
                <time dateTime={e.at}>{formatDay(e.at)}</time>
              </p>
              <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line text-ink">
                {e.body || <span className="text-neutral-600">No message text.</span>}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {!closed && (
        <form
          noValidate
          aria-label={mode === "reply" ? `Reply to ${m.name}` : "Add an internal note"}
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-border p-5 sm:p-6"
        >
          <div
            role="group"
            aria-label="What are you writing?"
            className="mb-3 inline-flex rounded-lg border border-border p-0.5"
          >
            {(["reply", "note"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={mode === k}
                onClick={() => {
                  setMode(k);
                  setError("");
                  setPreview(false);
                }}
                className={`min-h-10 rounded-md px-3 text-[15px] font-medium ${focusRing} ${mode === k ? "bg-brand text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
              >
                {k === "reply" ? `Reply to ${first}` : "Internal note"}
              </button>
            ))}
          </div>

          <Label htmlFor="composer" className="sr-only">
            {mode === "reply" ? "Your reply" : "Internal note"}
          </Label>
          <p id="composer-hint" className="mb-1.5 text-sm text-neutral-600">
            {mode === "reply"
              ? `Sent by email to ${m.email || m.name}. We'll mark it as waiting on them.`
              : "Only staff can see this. It is never sent."}
          </p>
          {error && (
            <p id="composer-error" className="mb-1.5 text-[15px] font-semibold text-red-700">
              <span className="sr-only">Error: </span>
              {error}
            </p>
          )}

          {preview && mode === "reply" ? (
            <div
              aria-label="Email preview"
              role="region"
              className="rounded-lg border border-border bg-neutral-50 p-4 text-[15px] leading-relaxed text-ink"
            >
              <p className="text-sm text-neutral-600">
                To: {m.email || m.name} · Subject: Re: {m.subject}
              </p>
              <p className="mt-3">Hi {first},</p>
              <p className="mt-2 whitespace-pre-line">{text || "…"}</p>
              <p className="mt-3">
                Best wishes,
                <br />
                {me}
                <br />
                <span className="text-neutral-600">
                  {w.settings.org.name} · {w.settings.org.phone}
                </span>
              </p>
            </div>
          ) : (
            <Textarea
              ref={composer}
              id="composer"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={["composer-hint", error && "composer-error"]
                .filter(Boolean)
                .join(" ")}
              className={`bg-background text-base ${mode === "note" ? "border-amber-300" : ""} ${focusRing}`}
            />
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
            >
              {mode === "reply" ? "Send reply" : "Save note"}
            </Button>
            {mode === "reply" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={preview}
                  onClick={() => setPreview((p) => !p)}
                  className={`h-11 px-4 ${focusRing}`}
                >
                  {preview ? "Edit" : "Preview"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        className={`h-11 px-3 text-brand ${focusRing}`}
                      />
                    }
                  >
                    Insert a saved reply
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Saved replies</DropdownMenuLabel>
                      {SNIPPETS.map((s) => (
                        <DropdownMenuItem
                          key={s.label}
                          onClick={() => {
                            setText((t) => (t.trim() ? `${t.trimEnd()}\n\n${s.body}` : s.body));
                            setPreview(false);
                            setTimeout(() => composer.current?.focus(), 0);
                          }}
                        >
                          {s.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </form>
      )}

      <AssignDialog open={assigning} onOpenChange={setAssigning} w={w} m={m} />
    </article>
  );
}

function AssignDialog({
  open,
  onOpenChange,
  w,
  m,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  w: Workspace;
  m: Message;
}) {
  const [team, setTeam] = useState<Team | "">(m.team ?? "");
  const [person, setPerson] = useState(m.assignedTo ?? "");
  const [error, setError] = useState("");
  const people = w.settings.staff.filter(
    (s) => s.active && (!team || s.team === team || s.role === "admin"),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setTeam(m.team ?? "");
          setPerson(m.assignedTo ?? "");
          setError("");
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Who should handle this?</DialogTitle>
          <DialogDescription>{m.subject}</DialogDescription>
        </DialogHeader>
        <RadioField
          id="assign-team"
          legend="Team"
          value={team}
          options={TEAM_LABEL}
          onChange={(t) => {
            setTeam(t);
            setPerson("");
            setError("");
          }}
          error={error}
        />
        {team && (
          <fieldset>
            <legend className="text-[15px] font-medium text-ink">Person (optional)</legend>
            <div className="mt-1 flex flex-col">
              {[
                { id: "", name: `Anyone on the ${TEAM_LABEL[team].toLowerCase()} team` },
                ...people,
              ].map((s) => (
                <label
                  key={s.id || "any"}
                  className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]"
                >
                  <input
                    type="radio"
                    name="assign-person"
                    value={s.id}
                    checked={person === s.id}
                    onChange={() => setPerson(s.id)}
                    className={`size-5 accent-[var(--brand)] ${focusRing}`}
                  />
                  {s.name}
                  {s.id === w.me?.id && <span className="text-neutral-600">(you)</span>}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={`h-11 px-4 ${focusRing}`}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!team) return setError("Choose a team");
              const who = person
                ? w.settings.staff.find((s) => s.id === person)?.name
                : `the ${TEAM_LABEL[team].toLowerCase()} team`;
              if (
                notifyResult(useInboxStore.getState().assign(m.id, team, person || undefined), {
                  success: `Assigned to ${who}.`,
                  undone: "Assignment undone",
                })
              )
                onOpenChange(false);
            }}
            className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focusRing}`}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
