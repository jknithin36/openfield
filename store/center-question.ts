"use client";

// "Ask the team" on a topic page: match or add the person by email, then put
// the question in the Inbox (tagged with the topic) for the dashboard to answer.
import { useContactsStore } from "@/store/contacts";
import { useInboxStore } from "@/store/inbox";
import { CENTER_TOPIC } from "@/lib/centers/public";
import type { CenterSlug } from "@/lib/types";

export type CenterQuestion = {
  center: CenterSlug;
  centerName: string;
  name: string;
  email: string;
  phone: string;
  question: string;
  contactBy: "email" | "phone" | "text";
  regionName: string;
};

export function submitCenterQuestion(
  q: CenterQuestion,
): { ok: true; ref: string } | { ok: false; reason: string } {
  const people = useContactsStore.getState();
  if (!people.data || !useInboxStore.getState().data)
    return { ok: false, reason: "Please try again in a moment." };
  if (!q.name.trim()) return { ok: false, reason: "Enter your name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email.trim()))
    return {
      ok: false,
      reason: "Enter an email address in the correct format, like name@example.com",
    };
  if (!q.question.trim()) return { ok: false, reason: "Enter your question" };

  const email = q.email.trim().toLowerCase();
  let contact = people.data.contacts.find((c) => c.email.trim().toLowerCase() === email);
  if (!contact) {
    const res = people.addContact({
      name: q.name.trim(),
      role: "parent",
      email: q.email.trim(),
      phone: q.phone.trim(),
      address: "",
      region: q.regionName,
      inRegion: true,
      preferredContact: q.contactBy,
      tags: ["website", q.centerName],
    });
    if (!res.ok || !("id" in res) || typeof res.id !== "string")
      return { ok: false, reason: res.ok ? "Please try again." : res.reason };
    contact = useContactsStore.getState().data!.contacts.find((c) => c.id === res.id);
  }

  const first = q.question.trim().split(/(?<=[.?!])\s|\n/)[0];
  const res = useInboxStore.getState().create({
    contactId: contact?.id ?? null,
    name: q.name.trim(),
    email: q.email.trim(),
    phone: q.phone.trim() || undefined,
    topic: CENTER_TOPIC[q.center],
    subject: `${q.centerName}: ${first.length > 70 ? `${first.slice(0, 67)}…` : first}`,
    body: `${q.question.trim()}\n\nPrefers: ${q.contactBy === "email" ? "email" : q.contactBy === "phone" ? "a phone call" : "a text message"}`,
    source: "website",
    center: q.center,
  });
  return res.ok && res.id
    ? { ok: true, ref: res.id }
    : { ok: false, reason: res.ok ? "Please try again." : res.reason };
}
