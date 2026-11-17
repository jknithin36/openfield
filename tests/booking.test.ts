import { test } from "vitest";

// Runs the full flow against the real stores; any failed check throws.
test("Public event booking and contact messages", async () => {
  await import("./flows/booking");
});
