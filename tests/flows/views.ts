import { useLibraryStore as st } from "@/store/library";
import { createEventsData } from "@/data/events";
import { createMessages } from "@/data/inbox";
import { createPeople } from "@/data/people";
import { createCourses, createGuides } from "@/data/content";
import { DEFAULT_INBOX_RULES, DEFAULT_CONTENT_RULES } from "@/data/settings";
import * as V from "@/lib/library/views";
import {
  getNeedsAction,
  ROLE_ACCESS,
  getHighDemand,
  getReadyToShip,
  getDueThisWeek,
} from "@/lib/today";
import { getNavCounts } from "@/lib/dashboard-counts";
const now = new Date();
st.getState().ensureSeeded();
const d = st.getState().data!;
const evd = createEventsData(now);
const ev = { data: evd, contacts: d.contacts };
const work = {
  messages: createMessages(createPeople(now), now),
  courses: createCourses(now),
  guides: createGuides(now),
  inboxRules: DEFAULT_INBOX_RULES,
  contentRules: DEFAULT_CONTENT_RULES,
};
let f = 0;
const ok = (c: boolean, m: string) => {
  console.log(c ? "  ✓" : "  ✗", m);
  if (!c) f++;
};
const req = V.requestsView(d, { tab: "waiting", q: "", type: null, role: null });
ok(
  JSON.stringify(req.counts) ===
    JSON.stringify({ all: 90, waiting: 4, waitlisted: 10, approved: 5, declined: 5 }),
  "Requests tabs " + JSON.stringify(req.counts),
);
ok(
  V.requestsView(d, { tab: "all", q: "ethan", type: null, role: null }).rows.every((r) =>
    r.contact.name.includes("Ethan"),
  ),
  "search by name",
);
const loans = V.loansView(d, { tab: "all", q: "", type: null }, now);
ok(
  loans.rows
    .slice(0, 3)
    .map((r) => r.late)
    .join() === "9,4,1",
  "On loan: overdue first, most late first",
);
ok(
  JSON.stringify(loans.counts) ===
    JSON.stringify({ all: 27, overdue: 3, "due-week": 5, extended: 4 }),
  "On loan tabs " + JSON.stringify(loans.counts),
);
ok(
  V.reminderSummary(loans.rows[0].request)?.startsWith("2 times, last") === true,
  "reminded: " + V.reminderSummary(loans.rows[0].request),
);
const ret = V.returnsView(d, "to-check", now);
ok(
  JSON.stringify(ret.counts).includes('"to-check":3') && ret.counts["in-repair"] === 1,
  "Returns tabs " + JSON.stringify(ret.counts),
);
const ship = V.toShipView(d, "ship", now);
ok(
  ship.counts.ship === 3 &&
    ship.counts.pickup === 2 &&
    ship.rows.filter((r) => r.fullyPacked).length === 1,
  "To ship 3/2, 1 fully packed",
);
const cat = V.catalogView(
  d,
  { tab: "all", q: "", center: null, avail: null, sort: "waiting" },
  now,
);
ok(
  cat.rows[0].item.name === "Talk-Easy Tablet" &&
    cat.rows[0].waitlist === 6 &&
    cat.activeItems === 40,
  "Catalog sort by most waiting: " + cat.rows[0].item.name + " " + cat.rows[0].waitlist,
);
ok(
  V.catalogView(
    d,
    { tab: "all", q: "", center: null, avail: "all-out", sort: "name" },
    now,
  ).rows.every((r) => r.free === 0),
  "Catalog 'All out' filter",
);
const lines = getNeedsAction(d, ev, work, now, ROLE_ACCESS.admin.actions);
console.log("   Today:", lines.map((l) => l.text).join(" | "));
ok(
  getHighDemand(d, now)[0].waiting === 6 &&
    getReadyToShip(d).length === 3 &&
    getDueThisWeek(d, now).length === 5,
  "Today: high demand 6 first, 3 to ship, 5 due this week",
);
const nav = getNavCounts(d, ev, work, "admin", now);
ok(
  nav["library/requests"].count === 4 &&
    nav["library/to-ship"].count === 5 &&
    nav["library/on-loan"].count === 3 &&
    nav["library/returns"].count === 3,
  "Sidebar badges 4 / 5 / 3 overdue / 3",
);
if (f) throw new Error(`${f} check(s) failed`);
