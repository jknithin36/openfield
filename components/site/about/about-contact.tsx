"use client";

import Link from "next/link";
import { useEffect } from "react";

import { DEFAULT_ORG } from "@/data/settings";
import { hydrateSettings, useSettingsStore } from "@/store/settings";
import { focusRing } from "@/components/dashboard/shared/fields";

const link = `rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand ${focusRing}`;

/** Name, phone and hours follow Settings › Organization. */
export function useOrg() {
  useEffect(() => hydrateSettings(), []);
  return useSettingsStore((s) => (s.hydrated ? s.data?.org : null)) ?? DEFAULT_ORG;
}

export function AboutContact() {
  const org = useOrg();
  return (
    <aside aria-labelledby="about-q" className="rounded-2xl bg-neutral-50 p-5 print:hidden">
      <h2 id="about-q" className="text-base font-semibold text-ink">
        Questions about us?
      </h2>
      <p className="mt-1.5 text-[15px] text-neutral-700">
        <Link href="/contact" className={link}>
          Contact us
        </Link>{" "}
        or call{" "}
        <a href={`tel:${org.phone.replace(/[^\d+]/g, "")}`} className={link}>
          {org.phone}
        </a>
        , {org.hours}.
      </p>
    </aside>
  );
}
