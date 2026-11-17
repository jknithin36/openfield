// Organization + staff. DEMO ONLY — fictional.
import type { ContentRules, InboxRules, OrganizationSettings, Staff } from "@/lib/types";

export const DEFAULT_ORG: OrganizationSettings = {
  name: "Openfield",
  tagline: "Free training, devices to borrow, and guides for families.",
  email: "help@openfield.example",
  phone: "(555) 014-2200",
  address: "Openfield Center, 200 Main Street, Riverbend",
  hours: "Mon–Fri, 9 am–5 pm",
  regionName: "Riverbend",
  social: [
    { label: "Newsletter", url: "https://example.com/openfield/newsletter" },
    { label: "Video channel", url: "https://example.com/openfield/videos" },
  ],
};

export const DEFAULT_INBOX_RULES: InboxRules = { replyTargetDays: 2 };
export const DEFAULT_CONTENT_RULES: ContentRules = { guideReviewMonths: 12, maxReadingLevel: 8 };

export function createStaff(now: Date = new Date()): Staff[] {
  const ago = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
  return [
    {
      id: "s1",
      name: "Sam Morgan",
      email: "sam@openfield.example",
      role: "admin",
      team: "admin",
      active: true,
      lastActiveAt: ago(0),
    },
    {
      id: "s2",
      name: "Leah Okonjo",
      email: "leah@openfield.example",
      role: "library",
      team: "library",
      active: true,
      lastActiveAt: ago(1),
    },
    {
      id: "s3",
      name: "Diego Marín",
      email: "diego@openfield.example",
      role: "events",
      team: "events",
      active: true,
      lastActiveAt: ago(0),
    },
    {
      id: "s4",
      name: "Ana Kowal",
      email: "ana@openfield.example",
      role: "content",
      team: "content",
      active: true,
      lastActiveAt: ago(3),
    },
    {
      id: "s5",
      name: "Ruth Ellison",
      email: "ruth@openfield.example",
      role: "library",
      team: "library",
      active: false,
      lastActiveAt: ago(120),
    },
  ];
}
