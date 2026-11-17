"use client";

import { isAdmin } from "@/store/dashboard";
import { RoleGuard } from "@/components/dashboard/shared/role-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow={isAdmin}>{children}</RoleGuard>;
}
