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
  if (!hydrated || !signedIn)
    return (
      <p className="p-8 text-neutral-600" aria-busy="true">
        Checking you&apos;re signed in…
      </p>
    );
  return <>{children}</>;
}
