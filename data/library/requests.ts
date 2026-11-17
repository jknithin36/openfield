// ~90 fictional requests across every status, dated relative to now.
import type { LoanRequest, ReturnCheck } from "@/lib/types";
import type { Dates } from "@/data/library/dates";

type Draft = Omit<LoanRequest, "id" | "packedParts" | "reminders" | "delivery" | "note"> &
  Partial<Pick<LoanRequest, "packedParts" | "reminders" | "delivery" | "note">>;

const STAFF = "Sam Morgan";

/** Items to spread generic on-loan and closed history over (all have spare copies). */
const SPREAD = [
  "every-learner-belongs",
  "visual-schedule-kit",
  "social-stories-video",
  "big-button-phone",
  "reading-pen",
  "first-year-guide",
  "visual-timer",
  "calm-corner-kit",
  "single-message-talker",
  "fine-motor-kit",
  "sound-amplifier",
  "adaptive-cutlery",
  "growing-up-autism",
  "talking-clock",
  "communication-board-kit",
  "sign-basics-video",
  "weighted-blanket",
];

export function createRequests(d: Dates, loanDays: (itemId: string) => number): LoanRequest[] {
  const out: LoanRequest[] = [];
  let n = 1000;
  const add = (r: Draft) =>
    out.push({
      delivery: "ship",
      note: "",
      packedParts: [],
      reminders: [],
      ...r,
      id: `R-${++n}`,
    });
  const c = (i: number) => `c${String(i).padStart(2, "0")}`;
  const good = (at: string, parts: string[] = []): ReturnCheck => ({
    partsReturned: parts,
    condition: "good",
    cleaned: true,
    checkedBy: STAFF,
    checkedAt: at,
  });

  // ── Closed history (34), oldest first, for catalog stats and demand ──────
  for (let k = 0; k < 34; k++) {
    const itemId = k % 6 === 0 ? "talk-easy-tablet" : SPREAD[k % SPREAD.length];
    const req = 360 - k * 10;
    const wait = itemId === "talk-easy-tablet" ? 35 : 2 + (k % 4);
    const shipped = req - wait - 2;
    const returned = Math.max(shipped - loanDays(itemId) + 3, 2);
    add({
      itemId,
      contactId: c(31 + (k % 30)),
      status: "closed",
      requestedAt: d.daysAgo(req),
      approvedAt: d.daysAgo(req - wait),
      shippedAt: d.daysAgo(shipped),
      dueAt: d.daysAgo(shipped - loanDays(itemId)),
      returnedAt: d.daysAgo(returned),
      closedAt: d.daysAgo(returned - 1),
      returnCheck: {
        ...good(d.daysAgo(returned - 1)),
        notes: k % 9 === 0 ? "Case slightly worn; fine to lend." : undefined,
      },
    });
  }

  // ── Declined (5) and lost (1) ────────────────────────────────────────────
  add({
    itemId: "eye-gaze-starter",
    contactId: c(3),
    status: "declined",
    requestedAt: d.daysAgo(40),
    declineReason: "not-suitable",
    declineNote: "Suggested the Switch Interface Box instead.",
  });
  add({
    itemId: "braille-display",
    contactId: c(22),
    status: "declined",
    requestedAt: d.daysAgo(31),
    declineReason: "not-eligible",
    declineNote: "Lives outside the Riverbend region.",
  });
  add({
    itemId: "visual-timer",
    contactId: c(40),
    status: "declined",
    requestedAt: d.daysAgo(20),
    declineReason: "duplicate",
  });
  add({
    itemId: "job-skills-kit",
    contactId: c(44),
    status: "declined",
    requestedAt: d.daysAgo(12),
    declineReason: "other",
    declineNote: "Referred to the employment team for an assessment first.",
  });
  add({
    itemId: "weighted-blanket",
    contactId: c(48),
    status: "declined",
    requestedAt: d.daysAgo(6),
    declineReason: "not-suitable",
    declineNote: "Age range is 4+; child is 2.",
  });
  add({
    itemId: "reading-pen",
    contactId: c(33),
    status: "lost",
    requestedAt: d.daysAgo(80),
    approvedAt: d.daysAgo(78),
    shippedAt: d.daysAgo(76),
    dueAt: d.daysAgo(48),
    lostNote: "Borrower says it was left on a bus. Reported to transit lost and found.",
  });

  // ── Returned, to check (3) and in repair (1) ─────────────────────────────
  add({
    itemId: "switch-adapted-toys",
    contactId: c(4),
    status: "returned",
    requestedAt: d.daysAgo(48),
    approvedAt: d.daysAgo(47),
    shippedAt: d.daysAgo(45),
    dueAt: d.daysAgo(17),
    returnedAt: d.daysAgo(1),
  });
  add({
    itemId: "weighted-blanket",
    contactId: c(28),
    status: "returned",
    requestedAt: d.daysAgo(40),
    approvedAt: d.daysAgo(39),
    shippedAt: d.daysAgo(37),
    dueAt: d.daysAgo(9),
    returnedAt: d.daysAgo(2),
  });
  add({
    itemId: "sound-amplifier",
    contactId: c(29),
    status: "returned",
    requestedAt: d.daysAgo(50),
    approvedAt: d.daysAgo(49),
    shippedAt: d.daysAgo(47),
    dueAt: d.daysAgo(5),
    returnedAt: d.daysAgo(3),
  });
  add({
    itemId: "video-magnifier",
    contactId: c(30),
    status: "in-repair",
    requestedAt: d.daysAgo(70),
    approvedAt: d.daysAgo(69),
    shippedAt: d.daysAgo(67),
    dueAt: d.daysAgo(25),
    returnedAt: d.daysAgo(20),
    returnCheck: {
      partsReturned: ["Magnifier", "Charger", "Carry pouch", "Guide"],
      condition: "needs-repair",
      cleaned: true,
      notes: "Screen flickers when zoomed in. Sent to the repair partner.",
      checkedBy: STAFF,
      checkedAt: d.daysAgo(19),
    },
  });

  // ── On loan (27): 3 overdue, 5 due this week, 4 extended ─────────────────
  const onLoan = (
    itemId: string,
    contact: number,
    dueIn: number,
    extra: Partial<LoanRequest> = {},
  ) => {
    const shipped = Math.min(-dueIn + loanDays(itemId), 60);
    add({
      itemId,
      contactId: c(contact),
      status: "on-loan",
      requestedAt: d.daysAgo(shipped + 4),
      approvedAt: d.daysAgo(shipped + 2),
      shippedAt: d.daysAgo(shipped),
      dueAt: d.daysFromNow(dueIn, 17),
      ...extra,
    });
  };
  // Overdue: 9, 4 and 1 days late (the 9-day one reminded twice)
  onLoan("sensory-starter-kit", 6, -9, {
    reminders: [
      { at: d.daysAgo(8, 9), channel: "email", by: "auto" },
      { at: d.daysAgo(3, 14), channel: "phone", by: STAFF },
    ],
  });
  onLoan("big-button-phone", 5, -4, {
    reminders: [{ at: d.daysAgo(3, 9), channel: "email", by: "auto" }],
  });
  onLoan("social-stories-video", 10, -1);
  // Due this week (5)
  onLoan("talk-easy-tablet", 9, 1);
  onLoan("reading-pen", 14, 2);
  onLoan("visual-schedule-kit", 11, 3);
  onLoan("every-learner-belongs", 3, 5);
  onLoan("visual-timer", 25, 6);
  // Ethan Brooks (c09) reaches the 3-loan limit
  onLoan("big-button-phone", 9, 20);
  onLoan("social-stories-video", 9, 12);
  // The only copies of the two waitlisted items
  onLoan("talk-easy-tablet", 26, 30);
  onLoan("eye-gaze-starter", 27, 25);
  // Spread over the coming weeks (4 extended)
  const spreadDue = [8, 9, 11, 13, 15, 16, 18, 19, 21, 22, 24, 26, 28, 33, 40];
  spreadDue.forEach((dueIn, k) => {
    const extended = [2, 5, 9, 13].includes(k);
    onLoan(
      SPREAD[k % SPREAD.length],
      35 + k,
      dueIn,
      extended ? { extendedBy: 14, extensionCount: 1 } : {},
    );
  });

  // ── Approved: 3 to ship, 2 for pickup ────────────────────────────────────
  add({
    itemId: "talk-easy-tablet",
    contactId: c(1),
    status: "approved",
    requestedAt: d.daysAgo(45),
    approvedAt: d.daysAgo(2),
    packedParts: ["Tablet", "Charger"],
    note: "For my son's speech therapy at home.",
  });
  add({
    itemId: "visual-schedule-kit",
    contactId: c(2),
    status: "approved",
    requestedAt: d.daysAgo(4),
    approvedAt: d.daysAgo(1),
    note: "For my Year 2 class.",
  });
  add({
    itemId: "every-learner-belongs",
    contactId: c(8),
    status: "approved",
    requestedAt: d.daysAgo(2),
    approvedAt: d.daysAgo(0, 9),
    packedParts: ["Book", "Return label"],
  });
  add({
    itemId: "visual-schedule-kit",
    contactId: c(10),
    status: "approved",
    delivery: "pickup",
    requestedAt: d.daysAgo(5),
    approvedAt: d.daysAgo(3),
    packedParts: ["Schedule board", "Picture cards", "Velcro dots", "Guide"],
    readyForPickupAt: d.daysAgo(2, 15),
  });
  add({
    itemId: "every-learner-belongs",
    contactId: c(5),
    status: "approved",
    delivery: "pickup",
    requestedAt: d.daysAgo(3),
    approvedAt: d.daysAgo(1, 11),
  });

  // ── Waitlisted: 6 for the tablet, 4 for the eye-gaze set ─────────────────
  [40, 33, 26, 19, 12, 8].forEach((ago, k) =>
    add({
      itemId: "talk-easy-tablet",
      contactId: c(13 + k),
      status: "waitlisted",
      requestedAt: d.daysAgo(ago),
      note: "Would like to try a speech tablet at home.",
    }),
  );
  [30, 22, 15, 6].forEach((ago, k) =>
    add({
      itemId: "eye-gaze-starter",
      contactId: c(19 + k),
      status: "waitlisted",
      requestedAt: d.daysAgo(ago),
      note: "Interested in trying eye-gaze for school.",
    }),
  );

  // ── Waiting (4), 2 over the 2-day target ─────────────────────────────────
  add({
    itemId: "talk-easy-tablet",
    contactId: c(4),
    status: "waiting",
    requestedAt: d.daysAgo(5),
    note: "Our son is 6 and non-speaking. His speech therapist suggested we try a tablet with symbols at home before we buy one.",
  });
  add({
    itemId: "switch-interface-box",
    contactId: c(7),
    status: "waiting",
    requestedAt: d.daysAgo(3),
    note: "I use switches at my day program and want to try them at home.",
  });
  add({
    itemId: "sensory-starter-kit",
    contactId: c(9),
    status: "waiting",
    requestedAt: d.daysAgo(1, 14),
    note: "For our daughter, who finds busy places hard.",
  });
  add({
    itemId: "fine-motor-kit",
    contactId: c(12),
    status: "waiting",
    requestedAt: d.daysAgo(0, 8),
    note: "Our OT suggested activities to build hand strength.",
  });

  return out;
}
