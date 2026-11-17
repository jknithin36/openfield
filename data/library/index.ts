// Builds the full demo library. Pure: pass `now` to get dates relative to it.
import type { LibraryData, LibrarySettings } from "@/lib/types";
import { HOLDS_COPY } from "@/lib/library/selectors";
import { createContacts } from "@/data/library/contacts";
import { makeDates } from "@/data/library/dates";
import { createItems } from "@/data/library/items";
import { createRequests } from "@/data/library/requests";

export const DEFAULT_SETTINGS: LibrarySettings = {
  defaultLoanDays: 28,
  loanLimitPerPerson: 3,
  waitingTargetDays: 2,
  extensionWeeks: [1, 2, 4],
};

/** Items whose every copy is out (so they carry a waitlist). */
const NO_SPARE = new Set(["talk-easy-tablet", "eye-gaze-starter"]);

export function createLibraryData(now: Date = new Date()): LibraryData {
  const d = makeDates(now);
  const items = createItems(d);
  const loanDays = (id: string) => items.find((i) => i.id === id)?.loanDays ?? 28;
  const requests = createRequests(d, loanDays);

  // Copies must cover every copy in use. Waitlisted items get no spare copy.
  for (const item of items) {
    const inUse = requests.filter(
      (r) => r.itemId === item.id && HOLDS_COPY.includes(r.status),
    ).length;
    item.copies = NO_SPARE.has(item.id) ? Math.max(inUse, 1) : Math.max(item.copies, inUse + 1);
  }

  return { items, contacts: createContacts(), requests, settings: DEFAULT_SETTINGS };
}
