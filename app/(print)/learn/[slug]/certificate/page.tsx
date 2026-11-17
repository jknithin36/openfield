import type { Metadata } from "next";
import { Suspense } from "react";

import { Certificate } from "@/components/site/learn/certificate";

export const metadata: Metadata = { title: "Certificate · Openfield", robots: { index: false } };

async function Cert({ params }: { params: Promise<{ slug: string }> }) {
  return <Certificate slug={(await params).slug} />;
}

// Outside the site layout: no header or footer, so it prints cleanly.
export default function CertificatePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <Cert params={params} />
    </Suspense>
  );
}
