// Library rules. Each returns { ok } or { ok: false, reason } in plain words,
// so the UI can show why an action is unavailable.
import type { LibraryData, LoanRequest, ReturnCheck, RuleResult } from "@/lib/types";
import { getAvailability, getWaitlist, isFullyPacked, itemById } from "@/lib/library/selectors";

const OK: RuleResult = { ok: true };
const no = (reason: string): RuleResult => ({ ok: false, reason });

const STATUS_WORDS: Record<LoanRequest["status"], string> = {
  waiting: "is waiting for a decision",
  waitlisted: "is on the waitlist",
  approved: "is approved",
  "on-loan": "is on loan",
  returned: "has been returned",
  "in-repair": "is in repair",
  closed: "is closed",
  declined: "was declined",
  lost: "was marked lost",
};
const wrongStatus = (r: LoanRequest) => no(`This request ${STATUS_WORDS[r.status]}.`);

export function canApprove(data: LibraryData, r: LoanRequest): RuleResult {
  if (r.status !== "waiting" && r.status !== "waitlisted") return wrongStatus(r);
  const item = itemById(data, r.itemId);
  if (!item || item.archived) return no("This item is archived.");
  if (getAvailability(data, r.itemId).free === 0)
    return no("No copy is free. Add the request to the waitlist instead.");
  return OK;
}

export function canWaitlist(data: LibraryData, r: LoanRequest): RuleResult {
  if (r.status !== "waiting") return wrongStatus(r);
  if (getAvailability(data, r.itemId).free > 0)
    return no("A copy is free, so this request can be approved now.");
  return OK;
}

export function canDecline(r: LoanRequest): RuleResult {
  return r.status === "waiting" || r.status === "waitlisted" ? OK : wrongStatus(r);
}

export function canTogglePart(r: LoanRequest): RuleResult {
  return r.status === "approved" ? OK : wrongStatus(r);
}

export function canShip(data: LibraryData, r: LoanRequest): RuleResult {
  if (r.status !== "approved") return wrongStatus(r);
  if (r.delivery !== "ship") return no("This item is for pickup, not shipping.");
  const item = itemById(data, r.itemId);
  if (!item || !isFullyPacked(item, r)) return no("Tick all parts to mark as shipped.");
  return OK;
}

export function canMarkReady(data: LibraryData, r: LoanRequest): RuleResult {
  if (r.status !== "approved") return wrongStatus(r);
  if (r.delivery !== "pickup") return no("This item is being shipped.");
  if (r.readyForPickupAt) return no("Already marked ready for pickup.");
  const item = itemById(data, r.itemId);
  if (!item || !isFullyPacked(item, r)) return no("Tick all parts first.");
  return OK;
}

export function canPickUp(r: LoanRequest): RuleResult {
  if (r.status !== "approved") return wrongStatus(r);
  if (r.delivery !== "pickup") return no("This item is being shipped.");
  if (!r.readyForPickupAt) return no("Mark it ready for pickup first.");
  return OK;
}

export function canExtend(data: LibraryData, r: LoanRequest): RuleResult {
  if (r.status !== "on-loan") return wrongStatus(r);
  const item = itemById(data, r.itemId);
  const max = item?.maxExtensions ?? 1;
  if ((r.extensionCount ?? 0) >= max)
    return no(
      max === 1
        ? "This loan has already been extended once."
        : `This loan has already been extended ${max} times.`,
    );
  const waiting = getWaitlist(data, r.itemId).length;
  if (waiting > 0)
    return no(
      `Can't extend: ${waiting} ${waiting === 1 ? "person is" : "people are"} waiting for this item.`,
    );
  return OK;
}

export function canRemind(r: LoanRequest): RuleResult {
  return r.status === "on-loan" ? OK : wrongStatus(r);
}

export function canCheckIn(r: LoanRequest): RuleResult {
  return r.status === "on-loan" ? OK : wrongStatus(r);
}

export function canMarkLost(r: LoanRequest, note: string): RuleResult {
  if (r.status !== "on-loan") return wrongStatus(r);
  if (!note.trim()) return no("Write a note about what happened");
  return OK;
}

/** Back on shelf after a return check. */
export function canShelve(data: LibraryData, r: LoanRequest, check: ReturnCheck): RuleResult {
  if (r.status !== "returned") return wrongStatus(r);
  if (check.condition !== "good")
    return no("Only items in good condition can go back on the shelf.");
  if (!check.cleaned) return no("Clean and disinfect the item first.");
  const item = itemById(data, r.itemId);
  const missing = (item?.parts ?? []).filter((p) => !check.partsReturned.includes(p));
  if (missing.length && !check.notes?.trim()) return no("Write a note about the missing parts");
  return OK;
}

export function canSendToRepair(r: LoanRequest, check: ReturnCheck): RuleResult {
  if (r.status !== "returned") return wrongStatus(r);
  if (!check.notes?.trim()) return no("Write a note about what needs repairing");
  return OK;
}

export function canFinishRepair(r: LoanRequest): RuleResult {
  return r.status === "in-repair" ? OK : wrongStatus(r);
}

export function canRetire(r: LoanRequest, note: string): RuleResult {
  if (r.status !== "in-repair") return wrongStatus(r);
  if (!note.trim()) return no("Write a note about why the item is being retired");
  return OK;
}

/** Copies can't drop below the number currently in use. */
export function canSetCopies(data: LibraryData, itemId: string, copies: number): RuleResult {
  if (!Number.isInteger(copies) || copies < 0) return no("Enter a whole number of copies");
  const { inUse } = getAvailability(data, itemId);
  if (copies < inUse)
    return no(
      `${inUse} ${inUse === 1 ? "copy is" : "copies are"} in use, so copies can't be lower than ${inUse}.`,
    );
  return OK;
}
