import { describe, expect, test } from "vitest";

import { answer, SUGGESTIONS, type HelperSources } from "@/lib/chat/helper";
import { createLibraryData } from "@/data/library";
import { createCourses, createGuides } from "@/data/content";
import { createEventsData } from "@/data/events";
import { DEFAULT_ORG } from "@/data/settings";

const now = new Date();
const s: HelperSources = {
  lib: createLibraryData(now),
  courses: createCourses(now),
  ev: createEventsData(now),
  guides: createGuides(now),
  org: DEFAULT_ORG,
  now,
};

describe("home page helper", () => {
  test("every suggestion gets a useful answer with links", () => {
    for (const q of SUGGESTIONS) {
      const r = answer(q, s);
      expect(r.text.length).toBeGreaterThan(10);
      expect(r.links.length).toBeGreaterThan(0);
    }
  });

  test("finds a library item and says if it's available", () => {
    const r = answer("Can I borrow a tablet?", s);
    expect(r.links.some((l) => l.href === "/library/talk-easy-tablet")).toBe(true);
    expect(r.links[0].label).toMatch(/Available|All out/);
  });

  test("matches courses, events and guides by topic", () => {
    expect(answer("course about IEP goals", s).links[0].href).toBe(
      "/learn/writing-a-good-iep-goal",
    );
    expect(answer("webinar about IEP meetings", s).links[0].href).toMatch(/^\/events\//);
    expect(answer("my child just got a diagnosis", s).links[0].href).toBe(
      "/families/just-got-a-diagnosis",
    );
  });

  test("hands over to a person with the real phone number", () => {
    expect(answer("I need to talk to someone", s).text).toContain(DEFAULT_ORG.phone);
    expect(answer("qwerty zzz", s).links[0].href).toBe("/contact");
  });
});
