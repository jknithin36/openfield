// Inbox selectors. Pure.
import type {
  Contact,
  EventsData,
  InboxRules,
  LibraryData,
  Message,
  MessageStatus,
  MessageTopic,
  Staff,
  Team,
} from "@/lib/types";
import type { DashboardRole } from "@/store/dashboard";
import { dayDiff } from "@/lib/library/selectors";
import { effectiveStatus } from "@/lib/events/selectors";

export const TOPIC_LABEL: Record<MessageTopic, string> = {
  general: "General",
  library: "Library",
  training: "Training",
  "family-support": "Family support",
  events: "Events",
  accessibility: "Accessibility",
  volunteering: "Volunteering",
  careers: "Careers",
};
export const TEAM_LABEL: Record<Team, string> = {
  library: "Library",
  events: "Events",
  family: "Family",
  content: "Content",
  admin: "Admin",
};
export const MSG_SOURCE_LABEL = { website: "Website", phone: "Phone", email: "Email" } as const;
export const MSG_STATUS_LABEL: Record<MessageStatus, string> = {
  unanswered: "Unanswered",
  assigned: "Assigned",
  "waiting-on-them": "Waiting on them",
  resolved: "Resolved",
};

export const messageAgeDays = (m: Message, now: Date) => Math.max(0, dayDiff(m.receivedAt, now));
/** Open and older than the reply target. */
export const isOverTarget = (m: Message, rules: InboxRules, now: Date) =>
  (m.status === "unanswered" || m.status === "assigned") &&
  m.replies.length === 0 &&
  messageAgeDays(m, now) >= rules.replyTargetDays;

/** Which messages a role sees (Admin: all). */
export function visibleTo(m: Message, role: DashboardRole, staffId: string | null): boolean {
  if (role === "admin") return true;
  if (staffId && m.assignedTo === staffId) return true;
  if (role === "library") return m.topic === "library" || m.team === "library";
  if (role === "events") return m.topic === "events" || m.team === "events";
  return (
    m.topic === "training" ||
    m.topic === "family-support" ||
    m.team === "content" ||
    m.team === "family"
  );
}

/** The staff member the current demo role is acting as. */
export const currentStaff = (staff: Staff[], role: DashboardRole): Staff | undefined =>
  staff.find((s) => s.active && s.role === role);

export type RelatedContext = {
  loans: Array<{ id: string; label: string; href: string; due?: string; overdue: boolean }>;
  requests: Array<{ id: string; label: string; href: string }>;
  registrations: Array<{ id: string; label: string; href: string; date: string }>;
  accommodations: Array<{ id: string; label: string; href: string }>;
};

/** Everything open for this person across Library and Events. */
export function relatedContext(
  contactId: string,
  lib: LibraryData,
  ev: EventsData,
  now: Date,
): RelatedContext {
  const items = new Map(lib.items.map((i) => [i.id, i]));
  const mine = lib.requests.filter((r) => r.contactId === contactId);
  const regs = ev.registrations.filter((r) => r.contactId === contactId);
  const events = new Map(ev.events.map((e) => [e.id, e]));
  return {
    loans: mine
      .filter((r) => r.status === "on-loan" || r.status === "approved")
      .map((r) => ({
        id: r.id,
        label: `${items.get(r.itemId)?.name ?? r.itemId} (${r.id})`,
        href:
          r.status === "on-loan"
            ? `/dashboard/library/on-loan?id=${r.id}`
            : `/dashboard/library/to-ship`,
        due: r.dueAt,
        overdue: r.status === "on-loan" && !!r.dueAt && dayDiff(r.dueAt, now) > 0,
      })),
    requests: mine
      .filter((r) => r.status === "waiting" || r.status === "waitlisted")
      .map((r) => ({
        id: r.id,
        label: `${items.get(r.itemId)?.name ?? r.itemId} (${r.status === "waiting" ? "waiting" : "waitlisted"})`,
        href: `/dashboard/library/requests?status=${r.status}&id=${r.id}`,
      })),
    registrations: regs
      .filter(
        (r) =>
          (r.status === "registered" || r.status === "waitlisted") &&
          events.get(r.eventId) &&
          effectiveStatus(events.get(r.eventId)!, now) === "published",
      )
      .map((r) => ({
        id: r.id,
        label: `${events.get(r.eventId)!.title}${r.status === "waitlisted" ? " (waitlist)" : ""}`,
        href: `/dashboard/events/${r.eventId}?tab=registrations&reg=${r.id}`,
        date: events.get(r.eventId)!.startsAt,
      })),
    accommodations: ev.accommodations
      .filter(
        (a) =>
          a.status === "requested" &&
          regs.some((r) => r.id === a.registrationId && r.status !== "cancelled"),
      )
      .map((a) => {
        const reg = regs.find((r) => r.id === a.registrationId)!;
        return {
          id: a.id,
          label: `${a.type.replace("-", " ")} for ${events.get(reg.eventId)?.title ?? "an event"}`,
          href: `/dashboard/events/accommodations`,
        };
      }),
  };
}

/** Hours from received to first reply (null if never replied). */
export const firstReplyHours = (m: Message) =>
  m.replies.length
    ? (new Date(m.replies[0].at).getTime() - new Date(m.receivedAt).getTime()) / 3600000
    : null;

export const contactFromMessage = (m: Message, contacts: Contact[]) =>
  m.contactId ? contacts.find((c) => c.id === m.contactId) : undefined;
