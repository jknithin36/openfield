import { useLibraryStore as st } from "@/store/library";
import * as S from "@/lib/library/selectors";
import { canExtend } from "@/lib/library/rules";
const now = new Date();
const s = () => st.getState();
const d = () => s().data!;
let fails = 0;
const ok = (c: boolean, m: string) => {
  console.log(c ? "  ✓" : "  ✗", m);
  if (!c) fails++;
};
s().ensureSeeded();
console.log("DEMO DATA");
const c = S.getCounts(d(), now);
console.log(
  " ",
  d().items.length,
  "items,",
  d().contacts.length,
  "contacts,",
  d().requests.length,
  "requests",
);
console.log(" ", JSON.stringify(c));
ok(c.waiting === 4 && c.waitingOverTarget === 2, "4 waiting, 2 over target");
ok(c.approvedShip === 3 && c.approvedPickup === 2, "3 ship + 2 pickup");
ok(
  c.onLoan === 27 && c.overdue === 3 && c.dueThisWeek === 5 && c.extended === 4,
  "27 on loan: 3 overdue, 5 this week, 4 extended",
);
ok(
  c.returnsToCheck === 3 && c.inRepair === 1 && c.declined === 5 && c.lost === 1,
  "3 to check, 1 repair, 5 declined, 1 lost",
);
const late = d()
  .requests.filter((r) => S.isOverdue(r, now))
  .map((r) => S.daysLate(r, now))
  .sort((a, b) => b - a);
ok(late.join() === "9,4,1", "overdue 9/4/1 days: " + late);
ok(
  S.getWaitlist(d(), "talk-easy-tablet").length === 6 &&
    S.getWaitlist(d(), "eye-gaze-starter").length === 4,
  "waitlists 6 and 4",
);
const neg = d().items.filter((i) => S.getAvailability(d(), i.id).inUse > i.copies);
ok(neg.length === 0, "no item has more copies in use than it owns");
ok(S.getAvailability(d(), "talk-easy-tablet").free === 0, "tablet: 0 free");
const ethan = d().contacts.find((x) => x.name === "Ethan Brooks")!;
ok(
  S.getEligibilityWarnings(d(), ethan).some((w) => w.includes("limit 3")),
  "Ethan at loan limit",
);
const marcus = d().contacts.find((x) => x.name === "Marcus Bell")!;
ok(!marcus.inRegion, "Marcus outside region");

console.log("FULL JOURNEY (Fine Motor Kit request)");
const id = d().requests.find((r) => r.status === "waiting" && r.itemId === "fine-motor-kit")!.id;
const free0 = S.getAvailability(d(), "fine-motor-kit").free;
ok(s().approve(id).ok, "approve");
ok(S.getAvailability(d(), "fine-motor-kit").free === free0 - 1, "reserves a copy");
const early = s().markShipped(id);
ok(
  !early.ok && !early.ok && early.reason.includes("Tick all parts"),
  "ship blocked until packed: " + (early.ok ? "" : early.reason),
);
const item = S.itemById(d(), "fine-motor-kit")!;
for (const p of S.partsToPack(item, S.requestById(d(), id)!)) s().togglePart(id, p);
ok(s().markShipped(id).ok && S.requestById(d(), id)!.status === "on-loan", "shipped → on-loan");
const ext = s().extendLoan(id, 2);
ok(ext.ok, "extend +2 weeks");
const ext2 = s().extendLoan(id, 1);
ok(
  !ext2.ok && ext2.reason === "This loan has already been extended once.",
  "second extension blocked: " + (ext2.ok ? "" : ext2.reason),
);
ok(s().checkIn(id).ok && S.requestById(d(), id)!.status === "returned", "checked in → returned");
const bad = s().backOnShelf(id, { partsReturned: item.parts, condition: "good", cleaned: false });
ok(!bad.ok, "shelf blocked until cleaned: " + (bad.ok ? "" : bad.reason));
ok(
  s().backOnShelf(id, { partsReturned: item.parts, condition: "good", cleaned: true }).ok &&
    S.requestById(d(), id)!.status === "closed",
  "back on shelf → closed",
);
ok(S.getAvailability(d(), "fine-motor-kit").free === free0, "copy freed again");

console.log("WAITLIST FLAG (tablet)");
const tabletLoan = d().requests.find(
  (r) => r.itemId === "talk-easy-tablet" && r.status === "on-loan",
)!;
ok(
  !canExtend(d(), tabletLoan).ok,
  "tablet loan can't extend: " + (canExtend(d(), tabletLoan) as { reason?: string }).reason,
);
s().checkIn(tabletLoan.id);
s().backOnShelf(tabletLoan.id, {
  partsReturned: S.itemById(d(), "talk-easy-tablet")!.parts,
  condition: "good",
  cleaned: true,
});
const flagged = [...S.getCopyAvailableIds(d())];
const oldest = S.getWaitlist(d(), "talk-easy-tablet")[0].id;
ok(flagged.includes(oldest), "oldest waitlisted flagged 'Copy available': " + oldest);

console.log("REPAIR + LOST + UNDO");
const ret = d().requests.find((r) => r.status === "returned" && r.itemId === "weighted-blanket")!;
const noNote = s().sendToRepair(ret.id, {
  partsReturned: [],
  condition: "needs-repair",
  cleaned: false,
});
ok(!noNote.ok, "repair needs a note: " + (noNote.ok ? "" : noNote.reason));
ok(
  s().sendToRepair(ret.id, {
    partsReturned: [],
    condition: "needs-repair",
    cleaned: false,
    notes: "Seam torn",
  }).ok,
  "sent to repair",
);
const copiesBefore = S.itemById(d(), "weighted-blanket")!.copies;
const r1 = s().retireFromRepair(ret.id, "Beyond repair");
ok(r1.ok && S.itemById(d(), "weighted-blanket")!.copies === copiesBefore - 1, "retire: copies −1");
const loan = d().requests.find((r) => r.status === "on-loan" && r.itemId === "reading-pen")!;
const before = JSON.stringify([S.requestById(d(), loan.id), S.itemById(d(), "reading-pen")]);
const lostNo = s().markLost(loan.id, "");
ok(!lostNo.ok && lostNo.reason === "Write a note about what happened", "lost needs note");
const lost = s().markLost(loan.id, "Left on a bus");
ok(lost.ok, "marked lost");
if (lost.ok) s().undo(lost.undoId);
ok(
  JSON.stringify([S.requestById(d(), loan.id), S.itemById(d(), "reading-pen")]) === before,
  "undo restores request AND item exactly",
);

ok(
  d().items.every((i) => S.getAvailability(d(), i.id).inUse <= i.copies),
  "availability never negative after all steps",
);
s().resetDemoData();
ok(JSON.stringify(S.getCounts(d(), now)) === JSON.stringify(c), "reset restores original counts");
if (fails) throw new Error(`${fails} check(s) failed`);
