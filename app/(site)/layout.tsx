import { Suspense } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, SiteHeaderView } from "@/components/site-header";
import { JsonLd } from "@/components/site/json-ld";
import { DEFAULT_ORG } from "@/data/settings";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Public website: full header (with donate bar) and footer.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<SiteHeaderView pathname="" />}>
        <SiteHeader />
      </Suspense>
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "NGO",
              "@id": `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/logo.svg`,
              description: SITE_DESCRIPTION,
              email: DEFAULT_ORG.email,
              telephone: DEFAULT_ORG.phone,
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              url: SITE_URL,
              name: SITE_NAME,
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
          ],
        }}
      />
    </>
  );
}
