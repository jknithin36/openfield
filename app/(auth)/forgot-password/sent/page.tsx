import type { Metadata } from "next";
import { Suspense } from "react";

import { ForgotPasswordSent } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Check your email · Openfield",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="text-neutral-600">Loading…</p>}>
      <ForgotPasswordSent />
    </Suspense>
  );
}
