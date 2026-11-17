"use client";

import { canUseContent } from "@/store/dashboard";
import { RoleGuard } from "@/components/dashboard/shared/role-guard";

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow={canUseContent}>{children}</RoleGuard>;
}
