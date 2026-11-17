"use client";

import { useEffect } from "react";

import { DEFAULT_ORG } from "@/data/settings";
import { hydrateSettings, useSettingsStore } from "@/store/settings";

const footerLink =
  "rounded-sm text-white/85 underline-offset-4 outline-none hover:text-white hover:underline focus-visible:ring-3 focus-visible:ring-ring";

// Follows Settings › Organization. Shows the defaults until saved settings load.
// PLACEHOLDER CONTACT DETAILS — (555) numbers and the address are fictional.
export function FooterContact() {
  useEffect(() => hydrateSettings(), []);
  const org = useSettingsStore((s) => (s.hydrated ? s.data?.org : null)) ?? DEFAULT_ORG;
  return (
    <address className="mt-5 flex flex-col gap-1.5 text-sm text-white/85 not-italic">
      <a
        href={`tel:${org.phone.replace(/[^\d+]/g, "")}`}
        className={`${footerLink} w-fit tabular-nums`}
      >
        {org.phone}
      </a>
      <a href={`mailto:${org.email}`} className={`${footerLink} w-fit`}>
        {org.email}
      </a>
      <span>{org.hours}</span>
      <span>{org.address}</span>
    </address>
  );
}
