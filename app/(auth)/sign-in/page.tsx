import type { Metadata } from "next";
import { Suspense } from "react";

import { SignIn } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Sign in to the staff dashboard · Openfield",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="text-neutral-600">Loading…</p>}>
      <SignIn />
    </Suspense>
  );
}
