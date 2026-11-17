import { test } from "vitest";

// Runs the full flow against the real stores; any failed check throws.
test("Public library: search, request and check status", async () => {
  await import("./flows/public-library");
});
