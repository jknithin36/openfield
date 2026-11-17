import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, legalLink } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Terms of use · Openfield",
  description: "The rules for using our website, lending library, courses and events.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="2026-11-01"
      intro={
        <p>
          These are the rules for using our website and services. We&apos;ve kept them short. If
          anything is unclear,{" "}
          <Link href="/contact" className={legalLink}>
            ask us
          </Link>
          .
        </p>
      }
      sections={[
        {
          id: "demo",
          title: "This is a demo",
          body: (
            <p>
              Openfield is a fictional organization. This website is a template. No items are
              shipped, no emails are sent, and no real bookings are made.
            </p>
          ),
        },
        {
          id: "library",
          title: "Borrowing from the library",
          body: (
            <ul>
              <li>Only borrow items for the person you told us about.</li>
              <li>Send items back by the due date, or call us to ask for more time.</li>
              <li>
                If something breaks or gets lost, tell us. You won&apos;t be charged for normal wear
                and tear.
              </li>
            </ul>
          ),
        },
        {
          id: "courses",
          title: "Courses and guides",
          body: (
            <p>
              You can use our courses and guides for yourself, your family, your class or your team.
              Please don&apos;t sell them or share them as your own. Our guides give general
              information, not medical or legal advice.
            </p>
          ),
        },
        {
          id: "events",
          title: "Events",
          body: (
            <p>
              If you can&apos;t come, please cancel your place so someone on the waitlist can have
              it. We may need to change or cancel an event; if we do, we&apos;ll tell you as soon as
              we can.
            </p>
          ),
        },
        {
          id: "conduct",
          title: "Being respectful",
          body: (
            <p>
              Please be kind to our staff, volunteers and other visitors, online and in person. We
              may stop helping anyone who is abusive.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes to these terms",
          body: (
            <p>We&apos;ll update this page if our terms change, and show the date at the top.</p>
          ),
        },
      ]}
    />
  );
}
