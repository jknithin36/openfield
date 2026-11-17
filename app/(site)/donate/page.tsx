import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, legalLink } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Support our work · Openfield",
  description: "How you can help keep our services free.",
};

export default function DonatePage() {
  return (
    <LegalPage
      title="Support our work"
      updated="2026-11-01"
      intro={
        <p>
          Everything we offer is free to the people who use it. Gifts from people like you pay for
          about one in every nine dollars we spend.
        </p>
      }
      sections={[
        {
          id: "give",
          title: "Give money",
          body: (
            <p>
              This demo doesn&apos;t take payments. In a real site, this is where a secure donation
              form would go. To talk about giving,{" "}
              <Link href="/contact?topic=general" className={legalLink}>
                get in touch
              </Link>
              .
            </p>
          ),
        },
        {
          id: "time",
          title: "Give your time",
          body: (
            <p>
              Volunteers help at events, in the library, and by testing new courses.{" "}
              <Link href="/about/careers" className={legalLink}>
                See volunteering roles
              </Link>
              .
            </p>
          ),
        },
        {
          id: "where",
          title: "Where the money goes",
          body: (
            <p>
              For every $1 we spend, about 90 cents go directly to services.{" "}
              <Link href="/about/funding" className={legalLink}>
                See how we&apos;re funded
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
