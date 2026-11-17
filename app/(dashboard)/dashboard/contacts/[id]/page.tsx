import { Suspense } from "react";

import { ContactView } from "@/components/dashboard/contact-view";
import { PageHeader } from "@/components/dashboard/page-header";

async function Contact({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContactView id={id} />;
}

export default function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageHeader title="Contact" description="Loading…" />}>
      <Contact params={params} />
    </Suspense>
  );
}
