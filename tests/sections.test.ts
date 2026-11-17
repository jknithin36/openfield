import { test } from "vitest";

// Runs the full flow against the real stores; any failed check throws.
test("Inbox, contacts, courses, guides, settings and reports", async () => {
  await import("./flows/sections");
});
