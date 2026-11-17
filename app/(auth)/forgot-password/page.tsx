import type { Metadata } from "next";
import { Suspense } from "react";

import { ForgotPassword } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Reset your password · Openfield",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="text-neutral-600">Loading…</p>}>
      <ForgotPassword />
    </Suspense>
  );
}
