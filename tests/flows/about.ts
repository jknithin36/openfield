import * as A from "@/lib/about/public";
import { ABOUT } from "@/data/about";
import { createStaff } from "@/data/settings";
import { buildReport, periodRange } from "@/lib/reports";
import { createLibraryData } from "@/data/library";
import { createEventsData } from "@/data/events";
import { createCourses, createGuides } from "@/data/content";
import { createMessages } from "@/data/inbox";
import { createPeople } from "@/data/people";
import { DEFAULT_INBOX_RULES } from "@/data/settings";

let f = 0;
const ok = (c: boolean, m: string) => {
  console.log(c ? "  ✓" : "  ✗", m);
  if (!c) f++;
};
const now = new Date();

for (const y of ABOUT.funding.map((x) => x.year)) {
  const s = A.getFundingSummary(y);
  ok(s.total === s.spent, `${y}: income ${A.money(s.total)} = spending ${A.money(s.spent)}`);
  ok(
    s.kinds.reduce((a, k) => a + k.pct, 0) === 100 &&
      s.costs.reduce((a, c) => a + c.pct, 0) === 100,
    `${y}: income and spending shares add to 100%`,
  );
  ok(s.kinds.reduce((a, k) => a + k.amount, 0) === s.total, `${y}: types add up to the total`);
  console.log(`    ${y}: ${s.servicesCents} cents of every $1 to services`);
}
ok(A.money(1240000) === "$1,240,000", "money format $1,240,000");
ok(A.percents([1, 1, 1]).join() === "34,33,33", "percents always total 100");

const staff = createStaff(now);
const groups = A.getActiveStaffByTeam(staff);
const names = groups.flatMap((g) => g.people.map((p) => p.name));
ok(!names.includes("Ruth Ellison"), "inactive staff hidden");
ok(names.filter((n) => n === "Leah Okonjo").length === 1, "no one listed twice");
console.log("   ", groups.map((g) => `${g.group}: ${g.people.length}`).join(" · "));
const renamed = A.getActiveStaffByTeam(
  staff.map((s) => (s.id === "s3" ? { ...s, name: "Diego Marín-Lopez" } : s)),
);
ok(
  renamed.flatMap((g) => g.people.map((p) => p.name)).includes("Diego Marín-Lopez"),
  "staff changes in Settings show on Team",
);

ok(ABOUT.board.length >= 5 && ABOUT.board.length <= 7, "5–7 board members");
ok(
  ABOUT.board.filter((b) => /parent/i.test(b.background)).length >= 2 &&
    ABOUT.board.filter((b) => /disab|wheelchair|autistic self/i.test(b.background)).length >= 2,
  "at least 2 parents and 2 disabled people on the board",
);

const lib = { ...createLibraryData(now), contacts: createPeople(now) };
const input = {
  lib,
  ev: createEventsData(now),
  contacts: lib.contacts,
  messages: createMessages(lib.contacts, now),
  courses: createCourses(now),
  guides: createGuides(now),
  inboxRules: DEFAULT_INBOX_RULES,
  now,
};
const y = A.getYearImpact(input, "this-year");
const r = buildReport(input, periodRange("this-year", now)!);
ok(
  JSON.stringify(y.sections) === JSON.stringify(r),
  "Impact (this year) = dashboard Reports (this year)",
);
console.log(
  `    this year: people ${A.metric(y.sections, "reach", "People helped")}, lent ${A.metric(y.sections, "library", "Items lent")}, avg wait ${y.averageWaitDays} days, certificates ${y.certificates}`,
);
const last = A.getYearImpact(input, "last-year");
console.log(`    last year (${last.range.label}): empty = ${last.empty}`);
if (f) throw new Error(`${f} check(s) failed`);
