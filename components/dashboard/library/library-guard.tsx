"use client";

import { canUseLibrary } from "@/store/dashboard";
import { RoleGuard } from "@/components/dashboard/shared/role-guard";

/** Library pages are for Admin and Library staff only. */
export function LibraryGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow={canUseLibrary}>{children}</RoleGuard>;
}
