import { test } from "vitest";

// Runs the full flow against the real stores; any failed check throws.
test("Library: a loan from request to return", async () => {
  await import("./flows/journey");
});
