import { useLibraryStore as library } from "@/store/library";
import { useContactsStore as contacts } from "@/store/contacts";
import { useContentStore as content } from "@/store/content";
import { useEventsStore as events } from "@/store/events";
import { useInboxStore as inbox } from "@/store/inbox";
import { submitCenterQuestion } from "@/store/center-question";
import * as C from "@/lib/centers/public";
import { visibleTo } from "@/lib/inbox/selectors";

let f = 0;
const ok = (c: boolean, m: string) => {
  console.log(c ? "  ✓" : "  ✗", m);
  if (!c) f++;
};
[library, contacts, content, events, inbox].forEach((s) => s.getState().ensureSeeded());
const now = new Date();
const src = (): C.CenterSources => ({
  lib: { ...library.getState().data!, contacts: contacts.getState().data!.contacts },
  courses: content.getState().data!.courses,
  ev: events.getState().data!,
  guides: content.getState().data!.guides,
  now,
});

ok(
  C.CENTERS.length === 6 && !C.CENTERS.some((c) => c.slug === "family-support"),
  "6 topics, no family support page",
);
for (const c of C.CENTERS) {
  const s = src();
  const counts = C.getCenterCounts(s, c.slug);
  const pop = C.getPopularForCenter(s, c.slug);
  console.log(
    `    ${c.shortName.padEnd(22)} ${C.countsText(counts).padEnd(55)} Popular: ${pop?.label}`,
  );
  ok(
    C.getCenterCourses(s, c.slug).every((x) => x.center === c.slug && x.status === "published"),
    `${c.slug}: only its own published courses`,
  );
  ok(
    C.getCenterItems(s, c.slug).every((x) => x.center === c.slug && !x.archived),
    `${c.slug}: only its own lendable items`,
  );
  ok(
    C.getCenterEvents(s, c.slug).every((x) => x.center === c.slug),
    `${c.slug}: only its own events`,
  );
  ok(
    C.getCenterGuides(s, c).length === (c.featuredGuideSlugs ?? []).length,
    `${c.slug}: every featured guide exists and is published`,
  );
  ok(!!pop, `${c.slug}: has a popular resource`);
  ok(
    c.startHere.length >= 3 && c.startHere.length <= 5 && c.team.length >= 2 && c.team.length <= 3,
    `${c.slug}: 3–5 questions, 2–3 people`,
  );
}
const top = [...C.getCenterCourses(src(), "autism")].sort(
  (a, b) => b.enrollments - a.enrollments,
)[0];
ok(
  C.getPopularForCenter(src(), "autism")?.label === top.title,
  "autism popular = most-enrolled course",
);

const n0 = contacts.getState().data!.contacts.length;
const m0 = inbox.getState().data!.messages.length;
const q = {
  center: "autism" as const,
  centerName: "Autism",
  name: "Ada Park",
  email: "ada.park@example.com",
  phone: "",
  question: "Is there a group for siblings? My daughter feels left out.",
  contactBy: "email" as const,
  regionName: "Riverbend",
};
const r = submitCenterQuestion(q);
ok(r.ok, "question sent");
const msg = inbox.getState().data!.messages.find((m) => r.ok && m.id === r.ref)!;
ok(
  inbox.getState().data!.messages.length === m0 + 1 &&
    msg.center === "autism" &&
    msg.source === "website" &&
    msg.status === "unanswered",
  "message in Inbox: center autism, website, unanswered",
);
ok(msg.subject.startsWith("Autism: Is there a group for siblings?"), "subject: " + msg.subject);
ok(
  visibleTo(msg, "content", "s4") && visibleTo(msg, "admin", "s1"),
  "content editors and admins see it",
);
ok(
  contacts.getState().data!.contacts.length === n0 + 1 && msg.contactId !== null,
  "new contact created and linked",
);
submitCenterQuestion({ ...q, email: "ADA.PARK@example.com", question: "Second question" });
ok(contacts.getState().data!.contacts.length === n0 + 1, "same email → no duplicate contact");
ok(
  !submitCenterQuestion({ ...q, question: "  " }).ok &&
    !submitCenterQuestion({ ...q, email: "nope" }).ok,
  "empty question and bad email rejected",
);
if (f) throw new Error(`${f} check(s) failed`);
