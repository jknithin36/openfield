"use client";

// Event bookings from the public website. Contacts are matched by email
// (any case) across everyone we know before a new one is created.
import { useContactsStore } from "@/store/contacts";
import { useEventsStore } from "@/store/events";
import { allContacts } from "@/lib/events/selectors";
import type { AccommodationType, Contact, Registration, Role } from "@/lib/types";

export type BookingInput = {
  eventId: string;
  name: string;
  email: string;
  phone: string;
  role: Role | "other";
  guests: number;
  needs: Array<{ type: AccommodationType; details: string }>;
  note: string;
  regionName: string;
};

const everyone = (): Contact[] => {
  const lib = useContactsStore.getState().data?.contacts ?? [];
  const ev = useEventsStore.getState().data;
  return ev ? allContacts(lib, ev) : lib;
};
const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function submitEventBooking(
  b: BookingInput,
): { ok: true; ref: string; waitlisted: boolean } | { ok: false; reason: string } {
  if (!useEventsStore.getState().data || !useContactsStore.getState().data)
    return { ok: false, reason: "Please try again in a moment." };
  if (!b.name.trim()) return { ok: false, reason: "Enter your full name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim()))
    return {
      ok: false,
      reason: "Enter an email address in the correct format, like name@example.com",
    };

  let contact = everyone().find((c) => c.email && sameEmail(c.email, b.email));
  if (!contact) {
    const res = useContactsStore.getState().addContact({
      name: b.name.trim(),
      role: b.role === "other" ? "provider" : b.role,
      email: b.email.trim(),
      phone: b.phone.trim(),
      address: "",
      region: b.regionName,
      inRegion: true,
      tags: ["website", ...(b.role === "other" ? ["Role: other"] : [])],
    });
    if (!res.ok || !("id" in res) || typeof res.id !== "string")
      return { ok: false, reason: res.ok ? "Please try again." : res.reason };
    contact = useContactsStore.getState().data!.contacts.find((c) => c.id === res.id);
  }
  if (!contact) return { ok: false, reason: "Please try again." };

  const res = useEventsStore
    .getState()
    .addRegistration(b.eventId, { contactId: contact.id }, "website", b.needs, {
      guests: b.guests,
      notes: b.note,
    });
  if (!res.ok)
    return {
      ok: false,
      reason:
        res.reason === "This person is already registered."
          ? "You're already booked on this event. Use Manage your booking to see it."
          : res.reason,
    };
  const reg = useEventsStore.getState().data!.registrations.find((r) => r.id === res.id)!;
  return { ok: true, ref: reg.ref ?? reg.id, waitlisted: reg.status === "waitlisted" };
}

/** Reference + email must both match; callers show one generic error otherwise. */
export function findBooking(ref: string, email: string): Registration | null {
  const data = useEventsStore.getState().data;
  if (!data) return null;
  const want = ref
    .trim()
    .toUpperCase()
    .replace(/^E(\d)/, "E-$1");
  const reg = data.registrations.find((r) => r.ref?.toUpperCase() === want);
  if (!reg) return null;
  const c = everyone().find((x) => x.id === reg.contactId);
  return c && c.email && sameEmail(c.email, email) ? reg : null;
}

export function cancelBooking(regId: string) {
  return useEventsStore.getState().cancelRegistration(regId);
}
