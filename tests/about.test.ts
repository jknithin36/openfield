import { test } from "vitest";

// Runs the full flow against the real stores; any failed check throws.
test("About pages: funding, team and impact", async () => {
  await import("./flows/about");
});
