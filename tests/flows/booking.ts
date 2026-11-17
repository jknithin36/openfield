import { useEventsStore as events } from "@/store/events";
import { useContactsStore as contacts } from "@/store/contacts";
import { useInboxStore as inbox } from "@/store/inbox";
import { submitEventBooking, findBooking, cancelBooking } from "@/store/event-booking";
import * as S from "@/lib/events/selectors";
import * as P from "@/lib/events/public";

let f = 0;
const ok = (c: boolean, m: string) => {
  console.log(c ? "  ✓" : "  ✗", m);
  if (!c) f++;
};
[events, contacts, inbox].forEach((s) => s.getState().ensureSeeded());
const d = () => events.getState().data!;
const now = new Date();

const fn = d().events.find((e) => e.id === "ev-family-night")!;
const before = S.seatsLeft(d(), fn);
const accBefore = d().accommodations.length;
const n0 = contacts.getState().data!.contacts.length;
const base = {
  eventId: fn.id,
  name: "Mina Shah",
  email: "mina.shah@example.com",
  phone: "",
  role: "parent" as const,
  guests: 1,
  needs: [
    { type: "asl" as const, details: "" },
    { type: "childcare" as const, details: "2 children, ages 4 and 7" },
  ],
  note: "Vegetarian",
  regionName: "Riverbend",
};
const r = submitEventBooking(base);
ok(
  r.ok && /^E-\d+$/.test(r.ref) && !r.waitlisted,
  "booking with a guest: " + (r.ok ? r.ref : r.reason),
);
ok(
  S.seatsLeft(d(), fn) === before - 2,
  `guest takes a seat too (${before} → ${S.seatsLeft(d(), fn)})`,
);
ok(d().accommodations.length === accBefore + 2, "2 accommodation requests created");
ok(contacts.getState().data!.contacts.length === n0 + 1, "new contact created once");
ok(
  !submitEventBooking({ ...base, email: "MINA.SHAH@example.com" }).ok,
  "same person can't book twice (matched by email, any case)",
);
ok(contacts.getState().data!.contacts.length === n0 + 1, "no duplicate contact");

if (r.ok) {
  ok(
    findBooking(r.ref.toLowerCase(), "Mina.Shah@Example.com")?.ref === r.ref,
    "find booking: ref + email in any case",
  );
  ok(findBooking(r.ref, "someone@example.com") === null, "wrong email → not found");
}

const tid = d().events.find((e) => e.id === "ev-try-it-day")!;
const wl0 = S.waitlistFor(d(), tid.id).length;
const w = submitEventBooking({
  ...base,
  eventId: tid.id,
  email: "wait.list@example.com",
  name: "Wai Lee",
  guests: 0,
  needs: [],
});
ok(w.ok && w.waitlisted, "full event → waitlisted");
ok(S.waitlistFor(d(), tid.id).length === wl0 + 1, `waitlist now ${wl0 + 1}`);

// Cancelling frees seats; the oldest waitlisted party that fits gets them.
const firstWait = S.waitlistFor(d(), tid.id)[0];
const someone = S.registrationsFor(d(), tid.id).find((x) => x.status === "registered")!;
ok(
  cancelBooking(someone.id).ok && S.registrationById(d(), firstWait.id)!.status === "registered",
  "cancel → oldest waitlisted promoted",
);

ok(P.placesWords(d(), tid).full, "Try-it day still reads 'Full — join the waitlist'");
ok(
  P.eventIcs(fn, "https://example.org").includes("BEGIN:VEVENT") &&
    P.eventIcs(fn, "https://example.org").includes("SUMMARY:Family night: IEP meetings"),
  "calendar file builds",
);

const m = inbox.getState().create({
  contactId: null,
  name: "Test",
  email: "t@example.com",
  topic: "volunteering",
  subject: "Hi",
  body: "Hi",
  source: "website",
});
const m2 = inbox.getState().create({
  contactId: null,
  name: "Test",
  email: "t@example.com",
  topic: "careers",
  subject: "Hi",
  body: "Hi",
  source: "website",
});
ok(
  m.ok &&
    m2.ok &&
    /^M-\d{3,}$/.test(m.id!) &&
    Number(m2.id!.slice(2)) === Number(m.id!.slice(2)) + 1,
  `message refs count up: ${m.id}, ${m2.id}`,
);
void now;
if (f) throw new Error(`${f} check(s) failed`);
