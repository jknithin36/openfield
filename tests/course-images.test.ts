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
