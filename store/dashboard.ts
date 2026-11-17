"use client";

// Dashboard view state: the demo role. (Data lives in the section stores.)
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type DashboardRole = "admin" | "library" | "events" | "content";

export const ROLE_LABELS: Record<DashboardRole, string> = {
  admin: "Admin",
  library: "Library staff",
  events: "Event coordinator",
  content: "Content editor",
};

/** Roles that can see and use the Library section. */
export const canUseLibrary = (role: DashboardRole) => role === "admin" || role === "library";
export const canUseEvents = (role: DashboardRole) => role === "admin" || role === "events";
export const canUseContent = (role: DashboardRole) => role === "admin" || role === "content";
export const isAdmin = (role: DashboardRole) => role === "admin";

type DashboardState = {
  role: DashboardRole;
  /** Demo session only — swap for a real auth provider. */
  signedIn: boolean;
  signIn: (role?: DashboardRole) => void;
  signOut: () => void;
  hydrated: boolean;
  ensureSeeded: () => void;
  setRole: (role: DashboardRole) => void;
  resetDemoData: () => void;
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      role: "admin",
      signedIn: false,
      hydrated: false,
      signIn: (role) => set((s) => ({ signedIn: true, role: role ?? s.role })),
      signOut: () => set({ signedIn: false }),
      ensureSeeded: () => set({ hydrated: true }),
      setRole: (role) => set({ role }),
      resetDemoData: () => set({ role: "admin" }),
    }),
    {
      name: "openfield-dashboard-v2",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ role: s.role, signedIn: s.signedIn }),
    },
  ),
);

let started = false;
export function hydrateDashboard(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  Promise.resolve(useDashboardStore.persist.rehydrate()).then(() =>
    useDashboardStore.getState().ensureSeeded(),
  );
}
