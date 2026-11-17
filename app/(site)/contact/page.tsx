import type { Metadata } from "next";
import { Suspense } from "react";

import { BeforeYouWrite, ContactDetails, ContactForm } from "@/components/site/contact-form";

export const metadata: Metadata = {
  title: "Contact us · Openfield",
  description: "Call, email or send us a message. A real person reads every one.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-ink sm:text-4xl">Contact us</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-neutral-700">
        Ask us anything. A real person reads every message.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-12">
          <section aria-labelledby="before-h">
            <h2 id="before-h" className="text-2xl font-medium text-ink">
              Before you write
            </h2>
            <p className="mt-2 text-base text-neutral-700">
              These might answer your question straight away.
            </p>
            <BeforeYouWrite />
          </section>
          <section aria-labelledby="send-h">
            <h2 id="send-h" className="text-2xl font-medium text-ink">
              Send us a message
            </h2>
            <div className="mt-6">
              <Suspense fallback={<p className="text-neutral-600">Loading the form…</p>}>
                <ContactForm />
              </Suspense>
            </div>
          </section>
        </div>
        <aside
          aria-labelledby="ways-h"
          className="order-first h-fit rounded-2xl bg-linear-to-br from-[#e8f0f2] to-[#e6eee4] p-6 lg:sticky lg:top-24 lg:order-none"
        >
          <h2 id="ways-h" className="mb-5 text-xl font-medium text-ink">
            Ways to reach us
          </h2>
          <ContactDetails />
        </aside>
      </div>
    </div>
  );
}
