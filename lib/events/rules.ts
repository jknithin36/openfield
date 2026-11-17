// Event rules → { ok } | { ok: false, reason } in plain words.
import type {
  AccommodationRequest,
  EventsData,
  OFEvent,
  Registration,
  RuleResult,
} from "@/lib/types";
import { effectiveStatus, eventById, seatsTaken } from "@/lib/events/selectors";

const OK: RuleResult = { ok: true };
const no = (reason: string): RuleResult => ({ ok: false, reason });

export type EventInput = Pick<
  OFEvent,
  | "title"
  | "type"
  | "center"
  | "summary"
  | "description"
  | "startsAt"
  | "endsAt"
  | "format"
  | "venue"
  | "onlineLink"
  | "seats"
  | "price"
  | "accessibilityProvided"
>;

/** Field checks shared by the form and the store (GOV.UK wording). */
export function validateEvent(input: EventInput): Array<{ field: string; message: string }> {
  const errs: Array<{ field: string; message: string }> = [];
  if (!input.title.trim()) errs.push({ field: "title", message: "Enter a title" });
  if (!input.summary.trim()) errs.push({ field: "summary", message: "Enter a short summary" });
  if (Number.isNaN(Date.parse(input.startsAt)))
    errs.push({ field: "start", message: "Enter a start date and time" });
  if (Number.isNaN(Date.parse(input.endsAt)))
    errs.push({ field: "end", message: "Enter an end time" });
  else if (
    !Number.isNaN(Date.parse(input.startsAt)) &&
    new Date(input.endsAt) <= new Date(input.startsAt)
  )
    errs.push({ field: "end", message: "Enter an end time after the start time" });
  if (input.format !== "online" && !input.venue?.name.trim())
    errs.push({ field: "venue", message: "Enter a venue for in-person events" });
  if (input.format !== "in-person" && !input.onlineLink?.trim())
    errs.push({ field: "link", message: "Enter the online link" });
  if (!Number.isInteger(input.seats) || input.seats < 1)
    errs.push({ field: "seats", message: "Enter the number of seats, like 40" });
  if (!(input.price >= 0)) errs.push({ field: "price", message: "Enter a price, or 0 for free" });
  return errs;
}

export function canLowerSeats(data: EventsData, eventId: string, seats: number): RuleResult {
  const taken = seatsTaken(data, eventId);
  if (seats < taken)
    return no(`${taken} people are registered, so seats can't be lower than ${taken}.`);
  return OK;
}

export function canPublish(e: OFEvent): RuleResult {
  if (e.status !== "draft") return no("Only drafts can be published.");
  const errs = validateEvent(e);
  return errs.length ? no(errs[0].message) : OK;
}

export function canCancelEvent(e: OFEvent, reason: string, now: Date): RuleResult {
  const s = effectiveStatus(e, now);
  if (s === "cancelled") return no("This event is already cancelled.");
  if (s === "completed") return no("This event has already happened.");
  if (!reason.trim()) return no("Write a reason for cancelling");
  return OK;
}

export function canRegister(e: OFEvent | undefined, now: Date): RuleResult {
  if (!e) return no("Event not found.");
  if (effectiveStatus(e, now) !== "published") return no("Registration is closed for this event.");
  return OK;
}

export function canCancelRegistration(r: Registration): RuleResult {
  return r.status === "registered" || r.status === "waitlisted"
    ? OK
    : no("This registration can't be cancelled.");
}

export function canPromote(data: EventsData, r: Registration): RuleResult {
  if (r.status !== "waitlisted") return no("This person isn't on the waitlist.");
  const e = eventById(data, r.eventId);
  if (!e) return no("Event not found.");
  if (seatsTaken(data, e.id) >= e.seats)
    return no("The event is full. Cancel a registration or add seats first.");
  return OK;
}

export function canCheckIn(data: EventsData, r: Registration): RuleResult {
  const e = eventById(data, r.eventId);
  if (!e || e.status === "cancelled") return no("This event was cancelled.");
  if (r.status !== "registered")
    return no(
      r.status === "attended" ? "Already checked in." : "Only registered people can be checked in.",
    );
  return OK;
}

export function canMarkNoShows(e: OFEvent, now: Date): RuleResult {
  return effectiveStatus(e, now) === "completed"
    ? OK
    : no("No-shows can be marked after the event.");
}

export function canSendFollowUp(e: OFEvent, now: Date): RuleResult {
  if (effectiveStatus(e, now) !== "completed") return no("Follow-ups are sent after the event.");
  if (e.followUp) return no("The follow-up has already been sent.");
  return OK;
}

export function canArrange(a: AccommodationRequest): RuleResult {
  return a.status === "requested"
    ? OK
    : no(a.status === "arranged" ? "Already arranged." : "Marked as unable to arrange.");
}

export function canMarkUnable(a: AccommodationRequest, note: string): RuleResult {
  if (a.status !== "requested") return no("Only open requests can be marked unable.");
  if (!note.trim()) return no("Write a note about why it can't be arranged");
  return OK;
}
