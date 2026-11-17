"use client";

import Link from "next/link";

import type { DashboardRole } from "@/store/dashboard";
import { useRole } from "@/components/dashboard/shared/use-dashboard";
import { PageHeader } from "@/components/dashboard/page-header";

/** Blocks a section for roles that can't use it, with a way back to Today. */
export function RoleGuard({
  allow,
  children,
}: {
  allow: (role: DashboardRole) => boolean;
  children: React.ReactNode;
}) {
  const role = useRole();
  if (allow(role)) return <>{children}</>;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="You don't have access to this page"
        description="Your role can't see this section. Switch roles in the top bar if you're exploring the template."
      />
      <Link
        href="/dashboard"
        className="w-fit rounded-sm font-medium text-brand underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring"
      >
        Go back to Today
      </Link>
    </div>
  );
}
