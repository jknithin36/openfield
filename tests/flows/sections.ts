import { useInboxStore as inbox } from "@/store/inbox";
import { useContentStore as content } from "@/store/content";
import { useSettingsStore as settings } from "@/store/settings";
import { useContactsStore as contacts } from "@/store/contacts";
import { useLibraryStore as library } from "@/store/library";
import { useEventsStore as events } from "@/store/events";
import * as I from "@/lib/inbox/selectors";
import * as G from "@/lib/guides/selectors";
import * as C from "@/lib/courses/selectors";
import { canDeleteContact } from "@/lib/contacts/rules";
import { timeline, rightNow } from "@/lib/contacts/selectors";
import { analyze } from "@/lib/readability";
import { buildReport, periodRange, reportCsv } from "@/lib/reports";
import { getNeedsAction, ROLE_ACCESS } from "@/lib/today";
import { getNavCounts } from "@/lib/dashboard-counts";
import { allContacts } from "@/lib/events/selectors";
import { undoAnywhere } from "@/lib/undo-registry";
import "@/store/register-undo";

let f = 0;
const ok = (c: boolean, m: string) => {
  console.log(c ? "  ✓" : "  ✗", m);
  if (!c) f++;
};
const now = new Date();
[inbox, content, settings, contacts, library, events].forEach((s) => s.getState().ensureSeeded());
const msgs = () => inbox.getState().data!.messages;
const set = () => settings.getState().data!;
const lib = () => ({ ...library.getState().data!, contacts: contacts.getState().data!.contacts });
const ev = () => ({
  data: events.getState().data!,
  contacts: allContacts(lib().contacts, events.getState().data!),
});

console.log("Inbox");
const counts = {
  unanswered: msgs().filter((m) => m.status === "unanswered").length,
  overTarget: msgs().filter((m) => I.isOverTarget(m, set().inboxRules, now)).length,
};
console.log("   ", JSON.stringify(counts));
ok(counts.unanswered > 0 && counts.overTarget > 0, "some unanswered, some past target");
const m = msgs().find((x) => x.status === "unanswered")!;
ok(!inbox.getState().reply(m.id, "   ", "Sam").ok, "empty reply blocked");
const rep = inbox.getState().reply(m.id, "Thanks, we'll call you.", "Sam Morgan");
ok(
  rep.ok && msgs().find((x) => x.id === m.id)!.status === "waiting-on-them",
  "reply → waiting on them",
);
ok(
  inbox.getState().addNote(m.id, "Called, left voicemail", "Sam").ok &&
    msgs().find((x) => x.id === m.id)!.internalNotes.length > 0,
  "internal note saved",
);
ok(
  inbox.getState().resolve(m.id).ok && !inbox.getState().reply(m.id, "x", "Sam").ok,
  "resolved → reply blocked until reopened",
);
ok(inbox.getState().reopen(m.id).ok, "reopen works");
const asg = inbox.getState().assign(m.id, "library", "s2");
ok(asg.ok && msgs().find((x) => x.id === m.id)!.assignedTo === "s2", "assign to Leah");
ok(
  I.visibleTo(
    msgs().find((x) => x.id === m.id)!,
    "library",
    "s2",
  ),
  "library role sees it",
);
const lc = msgs()
  .filter((x) => I.visibleTo(x, "content", "s4"))
  .every(
    (x) =>
      ["training", "family-support"].includes(x.topic) ||
      x.team === "content" ||
      x.team === "family" ||
      x.assignedTo === "s4",
  );
ok(lc, "content role only sees training/family messages");
const nm = inbox.getState().create({
  contactId: null,
  name: "Rosa Lind",
  email: "rosa@example.com",
  topic: "general",
  subject: "Hello",
  body: "Hi",
  source: "website",
});
ok(
  nm.ok && msgs().some((x) => x.id === nm.id && x.status === "unanswered"),
  "website message lands unanswered",
);
if (rep.ok) ok(undoAnywhere(asg.ok ? asg.undoId : ""), "undo via registry");

console.log("Contacts");
const withLoan = lib().requests.find((r) => r.status === "on-loan")!;
ok(!canDeleteContact(withLoan.contactId, lib()).ok, "can't delete someone with a loan");
const person = lib().contacts.find((c) => c.id === withLoan.contactId)!;
ok(timeline(person, lib(), ev().data, msgs()).length > 0, "timeline has entries");
ok(rightNow(person, lib(), ev().data, msgs(), now).loans.length > 0, "right now shows the loan");

console.log("Courses");
const cs = () => content.getState().data!.courses;
const noCap = cs().find((c) => c.status === "published" && C.missingCaptions(c))!;
ok(!!noCap, "a published course is missing captions: " + noCap?.title);
const draft = cs().find((c) => c.status === "draft" && C.isVideo(c) && !c.accessibility.captions);
if (draft)
  ok(
    !content.getState().setCourseStatus(draft.id, "published").ok,
    "video draft without captions can't publish",
  );
const notFeat = cs().find((c) => c.status === "published" && !c.featured)!;
ok(!content.getState().setFeatured(notFeat.id, true).ok, "4th featured blocked");
const old = cs().find((c) => c.featured)!;
ok(
  content.getState().setFeatured(notFeat.id, true, old.id).ok &&
    cs().filter((c) => c.featured).length === 3,
  "replace keeps 3 featured",
);

console.log("Guides");
const gs = () => content.getState().data!.guides;
const rules = set().contentRules;
const review = gs().filter((g) => G.needsReview(g, rules, now));
ok(review.length > 0, `${review.length} guides need review`);
const dense = gs().find((g) => g.title === "Your rights at an IEP meeting")!;
const a = analyze(dense.body);
ok(
  a.grade > 8 && a.longSentences.length > 0 && a.jargon.length > 0,
  `IEP guide: grade ${a.grade}, ${a.longSentences.length} long, ${a.jargon.length} jargon`,
);
const plain = analyze(gs().find((g) => g.title === "Starting school")!.body);
ok(plain.grade <= 8, "plain guide grade " + plain.grade);
const overdue = gs().find((g) => G.reviewOverdue(g, rules, now))!;
ok(!content.getState().markReviewed(overdue.id, "", "Ana").ok, "review needs a note");
ok(
  content.getState().markReviewed(overdue.id, "Checked links", "Ana").ok &&
    !G.reviewOverdue(
      gs().find((g) => g.id === overdue.id)!,
      rules,
      now,
    ),
  "marked reviewed → not overdue",
);

console.log("Settings");
ok(!settings.getState().changeRole("s1", "library").ok, "last admin can't lose admin");
ok(!settings.getState().setActive("s1", false).ok, "last admin can't be deactivated");
ok(settings.getState().invite("Kim Park", "kim@openfield.example", "admin").ok, "invite admin");
ok(settings.getState().changeRole("s1", "library").ok, "now Sam can change role");
ok(
  !settings.getState().invite("X", "kim@openfield.example", "content").ok,
  "duplicate email blocked",
);

console.log("Today and badges");
const work = {
  messages: msgs(),
  courses: cs(),
  guides: gs(),
  inboxRules: set().inboxRules,
  contentRules: rules,
};
const lines = getNeedsAction(lib(), ev(), work, now, ROLE_ACCESS.admin.actions);
console.log("   ", lines.map((l) => l.text).join("\n     "));
ok(
  lines.some((l) => l.key === "inbox") &&
    lines.some((l) => l.key === "captions") &&
    lines.some((l) => l.key === "guides"),
  "Today has inbox, captions and guides lines",
);
const content$ = getNeedsAction(lib(), ev(), work, now, ROLE_ACCESS.content.actions);
ok(
  content$.every((l) => l.category === "guides" || l.category === "inbox"),
  "content role: only content + inbox lines",
);
const badges = getNavCounts(lib(), ev(), work, "admin", now);
ok(
  badges.inbox.count === msgs().filter((x) => x.status === "unanswered").length &&
    badges["family-guides"].count === gs().filter((g) => G.needsReview(g, rules, now)).length,
  `badges: inbox ${badges.inbox.count}, guides ${badges["family-guides"].count}`,
);

console.log("Reports");
for (const k of ["this-quarter", "last-quarter", "this-year"] as const) {
  const r = periodRange(k, now)!;
  const rep2 = buildReport(
    {
      lib: lib(),
      ev: ev().data,
      contacts: ev().contacts,
      messages: msgs(),
      courses: cs(),
      guides: gs(),
      inboxRules: set().inboxRules,
      now,
    },
    r,
  );
  const people = rep2[0].metrics[0].value;
  console.log(
    `    ${r.label}: people ${people}, lent ${rep2[1].metrics[0].value}, events ${rep2[2].metrics[0].value}, attended ${rep2[2].metrics[1].value}, msgs ${rep2[5].metrics[0].value}, reply ${rep2[5].metrics[1].value}`,
  );
  ok(rep2.length === 6 && reportCsv(rep2, r).length > 10, `${k}: 6 sections, CSV rows`);
}
ok(
  periodRange("custom", now, "2026-05-10", "2026-05-01") === null,
  "custom: end before start rejected",
);
ok(
  periodRange("custom", now, "2026-02-30", "2026-03-01") === null,
  "custom: impossible date rejected",
);
ok(
  periodRange("custom", now, "2026-01-01", "2026-01-31")?.label === "Jan 1, 2026 to Jan 31, 2026",
  "custom label",
);

if (f) throw new Error(`${f} check(s) failed`);
