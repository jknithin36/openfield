import { test } from "vitest";

// Runs the full flow against the real stores; any failed check throws.
test("Library pages and Today show the right numbers", async () => {
  await import("./flows/views");
});
