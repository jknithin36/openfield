"use client";

// Sending a request from the public website. Finds the person by email (or
// adds them), then creates the request in the same store the dashboard reads.
import { useContactsStore } from "@/store/contacts";
import { useLibraryStore } from "@/store/library";
import type { Delivery, Role } from "@/lib/types";

export type PublicRequestInput = {
  itemId: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  preferredContact: "email" | "phone" | "text";
  delivery: Delivery;
  address: string;
  note: string;
  regionName: string;
};

export function submitPublicRequest(
  input: PublicRequestInput,
): { ok: true; ref: string; waitlisted: boolean } | { ok: false; reason: string } {
  const people = useContactsStore.getState();
  if (!people.data) return { ok: false, reason: "Please try again in a moment." };
  if (!input.name.trim()) return { ok: false, reason: "Enter your full name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
    return {
      ok: false,
      reason: "Enter an email address in the correct format, like name@example.com",
    };

  const email = input.email.trim().toLowerCase();
  const existing = people.data.contacts.find((c) => c.email.trim().toLowerCase() === email);
  let contactId: string;
  if (existing) {
    contactId = existing.id;
    // Fill gaps only; never overwrite what staff already know.
    const patch = {
      ...(!existing.phone && input.phone.trim() ? { phone: input.phone.trim() } : {}),
      ...(!existing.address && input.delivery === "ship" ? { address: input.address.trim() } : {}),
      ...(!existing.preferredContact ? { preferredContact: input.preferredContact } : {}),
    };
    if (Object.keys(patch).length) people.updateContact(existing.id, patch);
  } else {
    const res = people.addContact({
      name: input.name.trim(),
      role: input.role,
      email: input.email.trim(),
      phone: input.phone.trim(),
      address: input.delivery === "ship" ? input.address.trim() : "",
      region: input.regionName,
      inRegion: true,
      preferredContact: input.preferredContact,
      tags: ["website"],
    });
    if (!res.ok || !("id" in res) || typeof res.id !== "string")
      return { ok: false, reason: res.ok ? "Please try again." : res.reason };
    contactId = res.id;
  }

  return useLibraryStore.getState().addPublicRequest({
    itemId: input.itemId,
    contactId,
    note: input.note,
    delivery: input.delivery,
    shipTo: input.delivery === "ship" ? input.address : undefined,
  });
}
