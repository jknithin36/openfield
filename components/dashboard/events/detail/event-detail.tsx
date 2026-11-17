"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Login03Icon,
  Mail01Icon,
  PencilEdit02Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEventsStore } from "@/store/events";
import type { Contact, EventsData, OFEvent } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { formatDay, plural } from "@/lib/format";
import {
  attendance,
  EVENT_TYPE_LABEL,
  effectiveStatus,
  eventById,
  FORMAT_LABEL,
  isEventDay,
  REG_STATUS_LABEL,
  reachByRole,
  readinessLines,
  registeredThisWeek,
  registrationsFor,
  seatsTaken,
  waitlistFor,
} from "@/lib/events/selectors";
import { parseOne, ROLE_LABEL } from "@/lib/library/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { notifyResult } from "@/components/dashboard/shared/notify";
import { StatusText } from "@/components/dashboard/shared/status-text";
import { useEvents } from "@/components/dashboard/shared/use-events";
import { useUrlState } from "@/components/dashboard/shared/use-url-state";
import { NoteConfirmForm } from "@/components/dashboard/library/on-loan/lost-form";
import {
  AccommodationList,
  accommodationsForTab,
  type AccTab,
} from "@/components/dashboard/events/accommodations/accommodation-list";
import { RegistrationsTab } from "@/components/dashboard/events/detail/registrations-tab";
import { timeRange } from "@/components/dashboard/events/list/events-list";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";
const TABS = ["overview", "registrations", "accommodations", "follow-up"] as const;
const TAB_LABEL = {
  overview: "Overview",
  registrations: "Registrations",
  accommodations: "Accommodations",
  "follow-up": "Follow-up",
} as const;

export function EventDetail({ id }: { id: string }) {
  const ev = useEvents();
  if (!ev) return <PageHeader title="Event" description="Loading…" />;
  const event = eventById(ev.data, id);
  if (!event)
    return (
      <PageHeader
        breadcrumb={[{ label: "Events", href: "/dashboard/events" }, { label: "Not found" }]}
        title="Event not found"
        description="It may have been removed."
      />
    );
  return <Detail data={ev.data} contacts={ev.contacts} event={event} />;
}

function Detail({
  data,
  contacts,
  event,
}: {
  data: EventsData;
  contacts: Contact[];
  event: OFEvent;
}) {
  const [now] = useState(() => new Date());
  const router = useRouter();
  const { searchParams, setParams } = useUrlState();
  const [cancelling, setCancelling] = useState(false);
  const tab = parseOne(searchParams.get("tab"), TABS, "overview");
  const status = effectiveStatus(event, now);
  const store = () => useEventsStore.getState();
  const taken = seatsTaken(data, event.id);
  const people = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const where = event.format === "online" ? "Online" : (event.venue?.name ?? "");

  const primary =
    status === "draft"
      ? {
          label: "Publish",
          onClick: () =>
            notifyResult(store().publishEvent(event.id), {
              success: `${event.title} is published.`,
              undone: "Back to draft",
            }),
          icon: <HugeiconsIcon icon={SentIcon} strokeWidth={2} aria-hidden="true" />,
        }
      : status === "completed"
        ? {
            label: "Send follow-up",
            onClick: () => setParams({ tab: "follow-up" }),
            icon: <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} aria-hidden="true" />,
          }
        : status === "published" && isEventDay(event, now)
          ? {
              label: "Open check-in",
              href: `/dashboard/events/${event.id}/check-in`,
              icon: <HugeiconsIcon icon={Login03Icon} strokeWidth={2} aria-hidden="true" />,
            }
          : status === "published"
            ? {
                label: "Edit event",
                href: `/dashboard/events/${event.id}/edit`,
                icon: <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} aria-hidden="true" />,
              }
            : undefined;

  const exportAttendees = () =>
    downloadCsv(`openfield-${event.slug}-attendees`, [
      ["Name", "Role", "Email", "Phone", "Status", "Registered", "Source"],
      ...registrationsFor(data, event.id).map((r) => {
        const c = people.get(r.contactId);
        return [
          c?.name,
          c ? ROLE_LABEL[c.role] : "",
          c?.email,
          c?.phone,
          REG_STATUS_LABEL[r.status],
          r.registeredAt.slice(0, 10),
          r.source,
        ];
      }),
    ]);

  const accCount = accommodationsForTab(data, contacts, "to-arrange", now, event.id).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: "Events", href: "/dashboard/events" }, { label: event.title }]}
        title={event.title}
        description={
          <>
            <time dateTime={event.startsAt}>{formatDay(event.startsAt)}</time> · {timeRange(event)}{" "}
            · {where} · {taken} / {event.seats}
            {status !== "published" && (
              <>
                {" "}
                ·{" "}
                <StatusText tone={status === "cancelled" ? "danger" : "neutral"} icon={false}>
                  {status === "draft"
                    ? "Draft"
                    : status === "cancelled"
                      ? "Cancelled"
                      : "Completed"}
                </StatusText>
              </>
            )}
          </>
        }
        primaryAction={primary}
        moreActions={[
          ...(status !== "completed" && status !== "cancelled"
            ? [{ label: "Edit", onSelect: () => router.push(`/dashboard/events/${event.id}/edit`) }]
            : []),
          ...(status === "published"
            ? [
                {
                  label: "Open check-in",
                  onSelect: () => router.push(`/dashboard/events/${event.id}/check-in`),
                },
              ]
            : []),
          {
            label: "Duplicate",
            onSelect: () => {
              const res = store().duplicateEvent(event.id);
              if (
                notifyResult(res, { success: "Copy saved as a draft.", undone: "Copy removed" }) &&
                res.ok &&
                res.id
              )
                router.push(`/dashboard/events/${res.id}`);
            },
          },
          { label: "Export attendees (CSV)", onSelect: exportAttendees },
          ...(status === "published" || status === "draft"
            ? [{ label: "Cancel event", onSelect: () => setCancelling(true) }]
            : []),
        ]}
        tabs={{
          label: "Event sections",
          param: "tab",
          current: tab,
          defaultValue: "overview",
          items: TABS.map((t) => ({
            value: t,
            label: TAB_LABEL[t],
            count: t === "registrations" ? taken : t === "accommodations" ? accCount : undefined,
          })),
        }}
      />

      {status === "cancelled" && event.cancelReason && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-[15px] text-red-900">
          <StatusText tone="danger">Cancelled.</StatusText> {event.cancelReason}
        </p>
      )}

      {tab === "overview" && <Overview data={data} contacts={contacts} event={event} now={now} />}
      {tab === "registrations" && (
        <RegistrationsTab data={data} contacts={contacts} event={event} now={now} />
      )}
      {tab === "accommodations" && (
        <AccTabView data={data} contacts={contacts} event={event} now={now} />
      )}
      {tab === "follow-up" && <FollowUp data={data} contacts={contacts} event={event} now={now} />}

      <AlertDialog open={cancelling} onOpenChange={setCancelling}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {event.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              {plural(taken + waitlistFor(data, event.id).length, "person", "people")} will be
              emailed. All registrations will be cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <NoteConfirmForm
            id="cancel-reason"
            intro={null}
            label="Reason (included in the email)"
            requiredMessage="Write a reason for cancelling"
            confirmLabel="Cancel event"
            onConfirm={(reason) => {
              if (
                notifyResult(store().cancelEvent(event.id, reason), {
                  success: `${event.title} cancelled. Registrants will be emailed.`,
                  undone: "Event restored",
                })
              )
                setCancelling(false);
            }}
            onCancel={() => setCancelling(false)}
          />
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Overview({
  data,
  contacts,
  event,
  now,
}: {
  data: EventsData;
  contacts: Contact[];
  event: OFEvent;
  now: Date;
}) {
  const lines = readinessLines(data, contacts, event, now);
  const regs = registrationsFor(data, event.id).filter(
    (r) => r.status === "registered" || r.status === "attended",
  );
  const waiting = waitlistFor(data, event.id).length;
  const web = registeredThisWeek(data, event.id, now, "website");
  const roles = reachByRole(regs, contacts);
  const todo = lines.filter((l) => !l.done).length;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <section aria-labelledby="ready-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ready-heading" className="text-lg font-medium text-ink">
            Ready?
          </h2>
          {todo === 0 ? (
            <StatusText tone="success">Ready</StatusText>
          ) : (
            <StatusText tone="warning">{plural(todo, "thing", "things")} to do</StatusText>
          )}
        </div>
        <ul className="mt-3 flex flex-col divide-y divide-border rounded-lg border border-border bg-white">
          {lines.map((l) =>
            l.kind === "check" ? (
              <li key={l.key} className="flex min-h-12 items-center gap-3 px-4 py-2">
                <Checkbox
                  id={`ready-${l.key}`}
                  checked={l.done}
                  onCheckedChange={() =>
                    notifyResult(useEventsStore.getState().toggleReadiness(event.id, l.key), {
                      success: `${l.label}: ${l.done ? "not done" : "done"}.`,
                      undone: "Undone",
                    })
                  }
                  className={`size-5 ${focus}`}
                />
                <Label
                  htmlFor={`ready-${l.key}`}
                  className={`text-[15px] font-normal ${l.done ? "text-neutral-600" : "text-ink"}`}
                >
                  {l.label}
                </Label>
              </li>
            ) : (
              <li key={l.type} className="flex min-h-12 items-center gap-3 px-4 py-2 text-[15px]">
                <StatusText tone={l.done ? "success" : "warning"}>{l.label}</StatusText>
                {!l.done && (
                  <Link
                    href={`?tab=accommodations`}
                    className="ml-auto shrink-0 rounded-sm text-sm font-medium text-brand underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    Arrange
                  </Link>
                )}
              </li>
            ),
          )}
        </ul>
      </section>

      <section aria-labelledby="numbers-heading" className="flex flex-col gap-4">
        <h2 id="numbers-heading" className="text-lg font-medium text-ink">
          Key numbers
        </h2>
        <p className="text-[15px] leading-relaxed text-neutral-800">
          {regs.length} registered{waiting ? `, ${waiting} on the waitlist` : ""}, {web} from the
          website this week.{" "}
          {event.seats - regs.length > 0
            ? `${plural(event.seats - regs.length, "seat", "seats")} left.`
            : "The event is full."}
        </p>
        <p className="text-[15px] text-neutral-700">
          {EVENT_TYPE_LABEL[event.type]} · {FORMAT_LABEL[event.format]}
          {event.price ? ` · $${event.price}` : " · Free"}
        </p>
        <h3 className="text-[15px] font-medium text-ink">Who&apos;s coming</h3>
        {roles.length ? (
          <ul className="flex flex-col gap-1 text-[15px]">
            {roles.map((r) => (
              <li key={r.role} className="flex justify-between gap-4 tabular-nums">
                <span className="text-neutral-700">{r.label}</span>
                <span className="font-medium text-ink">
                  {r.percent}% <span className="font-normal text-neutral-600">({r.count})</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-600">No registrations yet.</p>
        )}
        {event.summary && (
          <p className="text-[15px] leading-relaxed text-neutral-800">{event.summary}</p>
        )}
      </section>
    </div>
  );
}

function AccTabView({
  data,
  contacts,
  event,
  now,
}: {
  data: EventsData;
  contacts: Contact[];
  event: OFEvent;
  now: Date;
}) {
  const [sub, setSub] = useState<AccTab>("to-arrange");
  const rows = accommodationsForTab(data, contacts, sub, now, event.id);
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Accommodation status" className="flex flex-wrap gap-2">
        {(["to-arrange", "arranged", "unable"] as const).map((t) => (
          <Button
            key={t}
            variant={sub === t ? "default" : "outline"}
            aria-pressed={sub === t}
            onClick={() => setSub(t)}
            className={`h-11 px-4 ${sub === t ? "bg-brand text-white hover:bg-brand-hover" : ""} ${focus}`}
          >
            {t === "to-arrange" ? "To arrange" : t === "arranged" ? "Arranged" : "Unable"} (
            {accommodationsForTab(data, contacts, t, now, event.id).length})
          </Button>
        ))}
      </div>
      <AccommodationList
        data={data}
        contacts={contacts}
        rows={rows}
        now={now}
        tab={sub}
        showEventHeadings={false}
      />
    </div>
  );
}

function FollowUp({
  data,
  contacts,
  event,
  now,
}: {
  data: EventsData;
  contacts: Contact[];
  event: OFEvent;
  now: Date;
}) {
  const [link, setLink] = useState(event.followUp?.resourcesUrl ?? "");
  const status = effectiveStatus(event, now);
  const a = attendance(data, event.id);
  const store = () => useEventsStore.getState();
  void contacts;

  if (status !== "completed")
    return (
      <p className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-neutral-600">
        Follow-up opens after the event on{" "}
        <time dateTime={event.endsAt}>{formatDay(event.endsAt)}</time>.
      </p>
    );

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <section aria-labelledby="attendance-heading" className="flex flex-col gap-4">
        <h2 id="attendance-heading" className="text-lg font-medium text-ink">
          Attendance
        </h2>
        <p className="text-[15px] text-neutral-800">
          <span className="text-2xl font-medium text-ink tabular-nums">
            {a.attended} of {a.expected}
          </span>{" "}
          attended ({a.percent}%).
          {a.noShow > 0 && <> {plural(a.noShow, "person didn't", "people didn't")} come.</>}
        </p>
        {a.notCheckedIn > 0 ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-[15px] text-neutral-700">
              {plural(a.notCheckedIn, "person wasn't", "people weren't")} checked in.
            </p>
            <Button
              onClick={() =>
                notifyResult(store().markNoShows(event.id), {
                  success: `${plural(a.notCheckedIn, "no-show", "no-shows")} marked.`,
                  undone: "Undone",
                })
              }
              className={`h-11 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
            >
              Mark {plural(a.notCheckedIn, "no-show", "no-shows")}
            </Button>
          </div>
        ) : (
          <StatusText tone="success">Everyone is checked in or marked.</StatusText>
        )}
      </section>

      <section aria-labelledby="followup-heading" className="flex flex-col gap-4">
        <h2 id="followup-heading" className="text-lg font-medium text-ink">
          Follow-up email
        </h2>
        {event.followUp ? (
          <StatusText tone="success">
            Sent <time dateTime={event.followUp.sentAt}>{formatDay(event.followUp.sentAt)}</time>
            {event.followUp.resourcesUrl ? " with a resources link" : ""}
          </StatusText>
        ) : (
          <>
            <div>
              <Label htmlFor="fu-link">Resources link (optional)</Label>
              <Input
                id="fu-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://"
                className={`mt-1.5 h-11 bg-background text-base ${focus}`}
              />
            </div>
            <EmailPreview
              title={`To ${a.attended} who came`}
              lines={[
                `Thank you for coming to ${event.title}.`,
                link ? `Slides and resources: ${link}` : "We'll share resources soon.",
                "Questions? Reply to this email or call (555) 014-2200.",
              ]}
            />
            <EmailPreview
              title={`To ${a.noShow + a.notCheckedIn} who couldn't make it`}
              lines={[
                `Sorry we missed you at ${event.title}. We hope everything is okay.`,
                link ? `You can still see the resources: ${link}` : "We'll share resources soon.",
                "We'd love to see you at a future event.",
              ]}
            />
            <Button
              onClick={() =>
                notifyResult(store().sendFollowUp(event.id, link), {
                  success: "Follow-up sent.",
                  undone: "Follow-up undone",
                })
              }
              className={`h-11 w-fit gap-1.5 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`}
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} aria-hidden="true" />
              Send follow-up
            </Button>
          </>
        )}
      </section>
    </div>
  );
}

function EmailPreview({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <h3 className="text-[15px] font-medium text-ink">{title}</h3>
      <div className="mt-1.5 flex flex-col gap-2 rounded-md border border-border bg-neutral-50 p-4 text-[15px] leading-relaxed text-neutral-800">
        {lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
    </div>
  );
}
