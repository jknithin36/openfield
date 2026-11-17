import { useLibraryStore as library } from "@/store/library";
import { useContactsStore as contacts } from "@/store/contacts";
import { submitPublicRequest } from "@/store/library-public";
import * as P from "@/lib/library/public";
import { getCounts, getAvailability } from "@/lib/library/selectors";

let f = 0;
const ok = (c: boolean, m: string) => {
  console.log(c ? "  ✓" : "  ✗", m);
  if (!c) f++;
};
const now = new Date();
library.getState().ensureSeeded();
contacts.getState().ensureSeeded();
const lib = () => ({ ...library.getState().data!, contacts: contacts.getState().data!.contacts });
const F = (p: Partial<P.Filters> = {}): P.Filters => ({
  q: "",
  types: [],
  centers: [],
  ages: [],
  availableOnly: false,
  sort: "popular",
  ...p,
});

console.log("Catalog");
const all = P.searchItems(lib(), F(), now);
ok(
  all.length === lib().items.filter((i) => !i.archived).length,
  `all ${all.length} lendable items`,
);
ok(!all.some((i) => i.archived), "archived never shown");
const c = P.facetCounts(lib(), F(), now);
ok(Object.values(c.types).reduce((a, b) => a + b, 0) === all.length, "type counts add up");
const devices = P.searchItems(lib(), F({ types: ["device"] }), now);
ok(
  devices.length === c.types.device && devices.every((i) => i.type === "device"),
  `Devices filter: ${devices.length}`,
);
const young = P.searchItems(lib(), F({ ages: ["0-5"] }), now);
ok(
  young.every((i) => P.minAge(i.ageRange) <= 5),
  `Ages 0–5: ${young.length}`,
);
ok(P.searchItems(lib(), F({ q: "charger" }), now).length > 0, "search matches parts (charger)");
const avail = P.searchItems(lib(), F({ availableOnly: true }), now);
ok(
  avail.length === c.available && avail.every((i) => getAvailability(lib(), i.id).free > 0),
  `available only: ${avail.length}`,
);
const az = P.searchItems(lib(), F({ sort: "az" }), now).map((i) => i.name);
ok(az.join() === [...az].sort((a, b) => a.localeCompare(b)).join(), "A to Z sorted");
const tablet = lib().items.find((i) => i.id === "talk-easy-tablet")!;
const ta = P.publicAvailability(lib(), tablet, now);
ok(
  !ta.available && /^All out — about \d+ weeks? wait$/.test(ta.text),
  `tablet: "${ta.text}", ${ta.waiting} waiting`,
);
console.log(
  "    popular:",
  P.popularItems(lib(), 4)
    .map((i) => i.name)
    .join(", "),
);

console.log("Requesting");
const before = getCounts(lib(), now);
const freeItem = all.find((i) => getAvailability(lib(), i.id).free > 0)!;
const n0 = contacts.getState().data!.contacts.length;
const base = {
  role: "parent" as const,
  name: "Rosa Lind",
  email: "rosa.lind@example.com",
  phone: "",
  preferredContact: "email" as const,
  delivery: "ship" as const,
  address: "12 Elm St, Riverbend 12345",
  note: "For my son",
  regionName: "Riverbend",
};
const r1 = submitPublicRequest({ ...base, itemId: freeItem.id });
ok(
  r1.ok && !r1.waitlisted && /^R-\d+$/.test(r1.ref),
  "available item → waiting request " + (r1.ok ? r1.ref : r1.reason),
);
const req1 = lib().requests.find((r) => r1.ok && r.id === r1.ref)!;
ok(
  req1.status === "waiting" && req1.source === "website" && req1.shipTo === base.address,
  "status waiting, source website, ship-to saved",
);
ok(getCounts(lib(), now).waiting === before.waiting + 1, "dashboard waiting count +1");
ok(contacts.getState().data!.contacts.length === n0 + 1, "new contact created");
const r2 = submitPublicRequest({
  ...base,
  email: "ROSA.LIND@example.com",
  itemId: tablet.id,
  delivery: "pickup",
  address: "",
});
ok(r2.ok && r2.waitlisted, "all-out item → waitlisted");
ok(
  contacts.getState().data!.contacts.length === n0 + 1,
  "same email (any case) → no duplicate contact",
);
if (r2.ok) {
  const rr = lib().requests.find((r) => r.id === r2.ref)!;
  ok(
    P.waitlistPosition(lib(), rr) === ta.waiting + 1,
    `waitlist position ${P.waitlistPosition(lib(), rr)} (after ${ta.waiting})`,
  );
}
const dup = submitPublicRequest({ ...base, itemId: freeItem.id });
ok(!dup.ok, "same item twice is blocked kindly: " + (dup.ok ? "" : dup.reason));
ok(!submitPublicRequest({ ...base, itemId: freeItem.id, email: "nope" }).ok, "bad email rejected");

console.log("Check a request");
if (r1.ok) {
  ok(
    P.findRequestByRefAndEmail(lib(), lib().contacts, r1.ref, "Rosa.Lind@Example.com")?.id ===
      r1.ref,
    "ref + email (any case) finds it",
  );
  ok(
    P.findRequestByRefAndEmail(lib(), lib().contacts, r1.ref, "other@example.com") === null,
    "wrong email → not found",
  );
  ok(
    P.findRequestByRefAndEmail(
      lib(),
      lib().contacts,
      r1.ref.replace("-", "").toLowerCase(),
      base.email,
    )?.id === r1.ref,
    "accepts r1091 without the dash",
  );
  const t0 = P.requestTimeline(lib().requests.find((r) => r.id === r1.ref)!);
  ok(
    t0[0].state === "done" && t0[1].state === "current",
    "timeline: received done, approval current",
  );
  ok(library.getState().approve(r1.ref).ok, "staff approve in dashboard");
  const it = lib().items.find((i) => i.id === lib().requests.find((r) => r.id === r1.ref)!.itemId)!;
  [...it.parts, "Return label"].forEach((part) => library.getState().togglePart(r1.ref, part));
  ok(library.getState().markShipped(r1.ref).ok, "staff pack every part and ship");
  const t1 = P.requestTimeline(lib().requests.find((r) => r.id === r1.ref)!);
  ok(
    t1.slice(0, 3).every((s) => s.state === "done") && t1[3].state === "current" && !!t1[3].at,
    "timeline: shipped, due back current with date",
  );
  ok(
    P.PUBLIC_STATUS[lib().requests.find((r) => r.id === r1.ref)!.status] === "On loan to you",
    "status in plain words",
  );
}
if (f) throw new Error(`${f} check(s) failed`);
