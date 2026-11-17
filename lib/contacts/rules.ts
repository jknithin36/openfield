import type { LibraryData, RuleResult } from "@/lib/types";
import { activeLoanCount } from "@/lib/contacts/selectors";

export function canDeleteContact(contactId: string, lib: LibraryData): RuleResult {
  const n = activeLoanCount(contactId, lib);
  return n
    ? {
        ok: false,
        reason: `This person has ${n} active ${n === 1 ? "loan" : "loans"}. Close them before deleting.`,
      }
    : { ok: true };
}

export function validateContact(v: {
  name: string;
  email: string;
}): Array<{ field: string; message: string }> {
  const errs: Array<{ field: string; message: string }> = [];
  if (!v.name.trim()) errs.push({ field: "name", message: "Enter the person's name" });
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()))
    errs.push({
      field: "email",
      message: "Enter an email address in the right format, like name@example.com",
    });
  return errs;
}
