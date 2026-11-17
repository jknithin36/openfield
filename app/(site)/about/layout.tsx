import { Suspense } from "react";

import { AboutContact } from "@/components/site/about/about-contact";
import { LiveSectionNav, SectionNav } from "@/components/site/about/section-nav";

// Every About page: content plus the "In this section" nav (top on phones, sidebar on desktop).
export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-10 lg:px-8 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-14">
        <div className="min-w-0">{children}</div>
        <div className="order-first flex flex-col gap-6 lg:order-none print:hidden">
          <div className="lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-6">
            <Suspense fallback={<SectionNav />}>
              <LiveSectionNav />
            </Suspense>
            <div className="mt-6 hidden lg:mt-0 lg:block">
              <AboutContact />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12 lg:hidden">
        <AboutContact />
      </div>
    </div>
  );
}
