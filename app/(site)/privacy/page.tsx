import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, legalLink } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Privacy · Openfield",
  description: "What information we collect, why, how long we keep it, and your rights.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="2026-11-01"
      intro={
        <>
          <p>We only collect the information we need to help you, and we never sell it.</p>
          <p className="mt-3 rounded-xl border-l-4 border-brand bg-brand-soft p-4 text-base">
            In this demo, everything you type is saved in your browser only. Nothing is sent to a
            server.
          </p>
        </>
      }
      sections={[
        {
          id: "what",
          title: "What we collect",
          body: (
            <>
              <p>Only what you give us in a form:</p>
              <ul>
                <li>Your name, email address and phone number</li>
                <li>Your address, if we&apos;re shipping something to you</li>
                <li>
                  What you&apos;ve asked for, like a library item, an event place or a question
                </li>
                <li>Any access needs you tell us about, so we can arrange them</li>
              </ul>
              <p>
                Courses don&apos;t need an account. Your course progress stays on your own device.
              </p>
            </>
          ),
        },
        {
          id: "why",
          title: "Why we collect it",
          body: (
            <p>
              To lend you items, book your event place, answer your questions and arrange the
              support you ask for. We also count how many people we help, without names, to report
              to our funders.
            </p>
          ),
        },
        {
          id: "how-long",
          title: "How long we keep it",
          body: (
            <p>
              We keep your details while you&apos;re using our services and for 2 years after your
              last contact with us. Then we delete them. Event access needs are deleted 30 days
              after the event.
            </p>
          ),
        },
        {
          id: "sharing",
          title: "Who we share it with",
          body: (
            <p>
              No one, unless the law requires it. Shipping companies get only your name and address
              to deliver library items.
            </p>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          body: (
            <>
              <p>You can ask us to:</p>
              <ul>
                <li>Show you the information we have about you</li>
                <li>Correct anything that&apos;s wrong</li>
                <li>Delete your information</li>
                <li>Stop contacting you</li>
              </ul>
              <p>
                <Link href="/contact" className={legalLink}>
                  Contact us
                </Link>{" "}
                to ask. We&apos;ll reply within a month.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies and browser storage",
          body: (
            <p>
              We don&apos;t use advertising or tracking cookies. We save a few settings in your
              browser, like your text size and your course progress, so the site works the way you
              left it.
            </p>
          ),
        },
      ]}
    />
  );
}
