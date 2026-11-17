"use client";

import { canUseEvents } from "@/store/dashboard";
import { Announcer } from "@/components/dashboard/shared/announcer";
import { AuthGuard } from "@/components/dashboard/auth-guard";
import { RoleGuard } from "@/components/dashboard/shared/role-guard";

// Check-in runs without the dashboard chrome (tablet at the door).
export default function CheckInLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthGuard>
        <RoleGuard allow={canUseEvents}>{children}</RoleGuard>
      </AuthGuard>
      <Announcer />
    </>
  );
}
