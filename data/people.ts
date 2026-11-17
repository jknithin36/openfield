// Everyone Openfield has helped: library contacts + event registrants,
// with profile fields. DEMO ONLY — fictional people.
import type { Contact } from "@/lib/types";
import { createContacts } from "@/data/library/contacts";
import { createEventsData } from "@/data/events";

const TAGS = [
  "speech therapist",
  "school district",
  "early intervention",
  "transition planning",
  "foster carer",
  "OT",
  "grandparent",
  "employer network",
];
const NEEDS: Record<number, string> = {
  0: "Prefers large print",
  5: "Deaf: use email or text, not phone",
  9: "Prefers calls after 4 pm",
  15: "Uses a screen reader",
  22: "Needs step-free access",
};

export function createPeople(now: Date = new Date()): Contact[] {
  const lib = createContacts();
  const extras = createEventsData(now).contacts;
  const day = 86400000;
  return [...lib, ...extras].map((c, i) => ({
    ...c,
    tags:
      i % 5 === 0
        ? [TAGS[i % TAGS.length]]
        : i % 7 === 0
          ? [TAGS[(i + 3) % TAGS.length], TAGS[(i + 5) % TAGS.length]]
          : [],
    preferredContact: i % 4 === 1 ? "phone" : i % 9 === 2 ? "text" : "email",
    accessibilityNeeds: NEEDS[i],
    consent: {
      newsletter: i % 3 !== 0,
      storiesAndPhotos: i % 6 === 0,
      changedAt: new Date(now.getTime() - (40 + i) * day).toISOString(),
    },
    createdAt: new Date(now.getTime() - (900 - i * 3) * day).toISOString(),
    notes:
      i === 0
        ? [
            {
              id: "n1",
              at: new Date(now.getTime() - 20 * day).toISOString(),
              by: "Sam Morgan",
              body: "Son starting first grade in the fall. Interested in AAC devices.",
            },
          ]
        : i === 8
          ? [
              {
                id: "n2",
                at: new Date(now.getTime() - 9 * day).toISOString(),
                by: "Leah Okonjo",
                body: "Has 3 items out. Talked about returning the phone first.",
              },
            ]
          : [],
  }));
}
