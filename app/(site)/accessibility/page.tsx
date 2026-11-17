import type { Metadata } from "next";
import Link from "next/link";

import { DEFAULT_ORG } from "@/data/settings";
import { LegalPage, legalLink } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Accessibility statement · Openfield",
  description: "How accessible this website is, what doesn't work yet, and how to get help.",
};

const tel = DEFAULT_ORG.phone.replace(/[^\d+]/g, "");

export default function AccessibilityPage() {
  return (
    <LegalPage
      title="Accessibility statement"
      updated="2026-11-01"
      intro={
        <p>
          We want everyone to be able to use this website, including people who use screen readers,
          keyboards, voice control or magnification. This page explains how accessible the site is,
          what we know doesn&apos;t work well yet, and how to get help.
        </p>
      }
      sections={[
        {
          id: "standard",
          title: "The standard we aim for",
          body: (
            <p>
              We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. We
              check new pages against this standard before they go live.
            </p>
          ),
        },
        {
          id: "what-you-can-do",
          title: "What you can do on this site",
          body: (
            <ul>
              <li>Zoom in up to 400% without text spilling off the screen</li>
              <li>Use every page with a keyboard only</li>
              <li>Use a screen reader such as NVDA, JAWS or VoiceOver</li>
              <li>Make lesson and guide text bigger with the Text size control</li>
              <li>Read a transcript for every course video</li>
              <li>Turn off animation by setting “reduce motion” on your device</li>
            </ul>
          ),
        },
        {
          id: "known-issues",
          title: "What doesn't work well yet",
          body: (
            <>
              <p>We know about these problems and are working on them:</p>
              <ul>
                <li>
                  Course videos aren&apos;t included in this demo. Every video lesson has a full
                  transcript instead.
                </li>
                <li>
                  Some printable worksheets are simple web pages and may not read well with every
                  screen reader when printed to PDF.
                </li>
                <li>
                  Older documents, like past annual reports, may not be fully accessible. Ask us and
                  we&apos;ll send them in a format that works for you.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "report",
          title: "Report a problem",
          body: (
            <p>
              If something on this site doesn&apos;t work for you, please tell us.{" "}
              <Link href="/contact?topic=accessibility" className={legalLink}>
                Send us a message
              </Link>{" "}
              or call{" "}
              <a href={`tel:${tel}`} className={legalLink}>
                {DEFAULT_ORG.phone}
              </a>{" "}
              ({DEFAULT_ORG.hours}). We&apos;ll reply within 2 working days.
            </p>
          ),
        },
        {
          id: "testing",
          title: "How we tested this site",
          body: (
            <>
              <p>We test in three ways:</p>
              <ul>
                <li>Automated checks with accessibility testing tools</li>
                <li>Manual checks with a keyboard, screen readers and 200% and 400% zoom</li>
                <li>
                  Testing by our advisory group, who are disabled people and parents, before new
                  services launch
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "formats",
          title: "Other formats",
          body: (
            <p>
              We can send our information in large print, easy read or audio, or read it to you over
              the phone.{" "}
              <Link href="/contact?topic=accessibility" className={legalLink}>
                Tell us what you need
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
