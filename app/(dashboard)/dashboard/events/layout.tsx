"use client";

import { canUseEvents } from "@/store/dashboard";
import { RoleGuard } from "@/components/dashboard/shared/role-guard";

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow={canUseEvents}>{children}</RoleGuard>;
}
