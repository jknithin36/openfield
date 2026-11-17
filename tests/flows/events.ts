import { useEventsStore as st } from "@/store/events";
import { createContacts } from "@/data/library/contacts";
import * as S from "@/lib/events/selectors";
const now = new Date();
const s = () => st.getState();
s().ensureSeeded();
const d = () => s().data!;
const contacts = () => S.allContacts(createContacts(), d());
let f = 0;
const ok = (c: boolean, m: string) => {
  console.log(c ? "  ✓" : "  ✗", m);
  if (!c) f++;
};
const c = S.eventCounts(d(), contacts(), now);
console.log(" ", JSON.stringify(c));
ok(
  c.upcoming === 6 && c.drafts === 1 && c.cancelled === 1 && c.past === 2,
  "6 upcoming, 1 draft, 1 cancelled, 2 past",
);
const tid = S.eventById(d(), "ev-try-it-day")!;
ok(S.seatsText(d(), tid) === "25 / 25 · 5 waitlisted", "Try-it day full: " + S.seatsText(d(), tid));
ok(S.seatsText(d(), S.eventById(d(), "ev-family-night")!) === "38 / 40", "Family night 38 / 40");
const fnLines = S.readinessLines(d(), contacts(), S.eventById(d(), "ev-family-night")!, now).map(
  (l) => l.label,
);
console.log("   ", fnLines.join(" | "));
ok(
  fnLines.some((l) => l.startsWith("ASL interpreters: 2 needed, not arranged — book by")),
  "ASL line with deadline",
);
const rows = S.accommodationRows(d(), contacts()).filter((r) => S.needsArranging(r, now));
const capt = rows.find((r) => r.acc.type === "captions")!;
ok(
  S.deadlineWording(capt.deadline, now).overdue,
  "captions deadline passed: " + S.deadlineWording(capt.deadline, now).text,
);
const firstWait = S.waitlistFor(d(), tid.id)[0];
const reg = S.registrationsFor(d(), tid.id).find((r) => r.status === "registered")!;
const cr = s().cancelRegistration(reg.id);
ok(
  cr.ok && S.registrationById(d(), firstWait.id)!.status === "registered",
  "cancel → oldest waitlisted promoted",
);
ok(
  S.seatsText(d(), S.eventById(d(), tid.id)!) === "25 / 25 · 4 waitlisted",
  "still full, waitlist 4",
);
if (cr.ok) s().undo(cr.undoId);
ok(
  S.seatsText(d(), S.eventById(d(), tid.id)!) === "25 / 25 · 5 waitlisted",
  "undo restores exactly",
);
const full = s().addRegistration(
  tid.id,
  { person: { name: "Test Person", role: "parent" } },
  "phone",
);
ok(full.ok && full.message?.includes("waitlist") === true, "add to full event → waitlisted");
const fnReg = S.registrationsFor(d(), "ev-family-night").find((r) => r.status === "registered")!;
ok(s().checkIn(fnReg.id).ok && !s().checkIn(fnReg.id).ok, "check in once, second time blocked");
const oh = s().markNoShows("ev-at-open-house");
ok(oh.ok && oh.message === "7", "7 no-shows marked");
ok(
  S.attendance(d(), "ev-at-open-house").percent === 79,
  "attendance 27/34 = 79%: " + S.attendance(d(), "ev-at-open-house").percent,
);
ok(
  s().sendFollowUp("ev-at-open-house").ok && !s().sendFollowUp("ev-at-open-house").ok,
  "follow-up once",
);
ok(!s().sendFollowUp("ev-family-night").ok, "no follow-up before the event");
const asl = rows
  .filter((r) => r.acc.type === "asl" && r.event.id === "ev-family-night")
  .map((r) => r.acc.id);
const am = s().arrangeMany(asl);
ok(am.ok && am.count === 2, "Mark 2 arranged");
ok(
  !s().markUnable(capt.acc.id, "").ok && s().markUnable(capt.acc.id, "No captioner free").ok,
  "unable needs a note",
);
const lower = s().updateEvent("ev-family-night", {
  ...S.eventById(d(), "ev-family-night")!,
  seats: 10,
});
ok(
  !lower.ok && lower.reason.includes("can't be lower"),
  "seats can't drop below registered: " + (lower.ok ? "" : lower.reason),
);
ok(
  s().publishEvent("ev-sign-families").ok && S.eventCounts(d(), contacts(), now).upcoming === 7,
  "draft → published",
);
const ce = s().cancelEvent("ev-calm-spaces", "");
ok(!ce.ok, "cancel needs a reason");
s().resetDemoData();
ok(JSON.stringify(S.eventCounts(d(), contacts(), now)) === JSON.stringify(c), "reset restores");
if (f) throw new Error(`${f} check(s) failed`);
