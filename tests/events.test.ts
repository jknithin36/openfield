import { test } from "vitest";

// Runs the full flow against the real stores; any failed check throws.
test("Events: seats, waitlist, check-in and readiness", async () => {
  await import("./flows/events");
});
