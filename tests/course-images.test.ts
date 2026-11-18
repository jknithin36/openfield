import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

import { createCourses } from "@/data/content";
import { courseImage } from "@/lib/learn/images";

test("every course has a picture, and every picture file exists", () => {
  for (const c of createCourses(new Date())) {
    const img = courseImage(c.slug);
    expect(img, `${c.slug} has no picture`).not.toBeNull();
    expect(existsSync(join(process.cwd(), "public", img!.src)), `${img!.src} is missing`).toBe(
      true,
    );
    expect(img!.alt.length).toBeGreaterThan(20);
  }
});

test("every event has a picture, and every picture file exists", async () => {
  const { createEventsData } = await import("@/data/events");
  const { EVENT_IMAGE } = await import("@/lib/content");
  for (const e of createEventsData(new Date()).events) {
    const img = EVENT_IMAGE[e.slug];
    expect(img, `${e.slug} has no picture`).toBeDefined();
    expect(existsSync(join(process.cwd(), "public", img.src)), `${img.src} is missing`).toBe(true);
  }
});
