"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { hydrateDashboard, useDashboardStore } from "@/store/dashboard";

/**
 * Demo sign-in check (client-side). Signed-out visitors go to /sign-in.
 * Replace with a real server-side check when you add an auth provider.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useDashboardStore((s) => s.hydrated);
  const signedIn = useDashboardStore((s) => s.signedIn);
  useEffect(() => hydrateDashboard(), []);
  useEffect(() => {
    if (hydrated && !signedIn) router.replace("/sign-in");
  }, [hydrated, signedIn, router]);
  // Render the page as normal (so it can be prerendered and validated for
  // instant navigation). Only once we know the visitor is signed out do we
  // hide it and send them to sign in. Pages show demo data only after the
  // stores load in the browser, so nothing private appears before this.
  if (hydrated && !signedIn)
    return (
      <p className="p-8 text-neutral-600" aria-busy="true">
        Taking you to sign in…
      </p>
    );
  return <>{children}</>;
}
