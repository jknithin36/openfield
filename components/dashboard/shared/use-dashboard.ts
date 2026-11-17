"use client";

import { useEffect } from "react";

import { hydrateDashboard, useDashboardStore } from "@/store/dashboard";

/** Current demo role (Admin until saved data loads). */
export function useRole() {
  useEffect(() => hydrateDashboard(), []);
  return useDashboardStore((s) => s.role);
}
