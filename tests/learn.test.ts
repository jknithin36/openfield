import { test } from "vitest";

// Runs the full flow against the real stores; any failed check throws.
test("Courses: progress, completion and certificates", async () => {
  await import("./flows/learn");
});
