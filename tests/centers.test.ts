import { test } from "vitest";

// Runs the full flow against the real stores; any failed check throws.
test("Topic pages and Ask the team", async () => {
  await import("./flows/centers");
});
