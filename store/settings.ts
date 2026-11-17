"use client";

// Settings: organization, staff, inbox + content rules. Library and event
// rules live in their own stores (so their selectors update instantly);
// the Settings page edits them there.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  createStaff,
  DEFAULT_CONTENT_RULES,
  DEFAULT_INBOX_RULES,
  DEFAULT_ORG,
} from "@/data/settings";
import { newId, nowIso, storeKit, type UndoEntry } from "@/lib/store-kit";
import type {
  ActionResult,
  ContentRules,
  InboxRules,
  OrganizationSettings,
  Staff,
  StaffRole,
  Team,
} from "@/lib/types";

export type SettingsData = {
  org: OrganizationSettings;
  staff: Staff[];
  inboxRules: InboxRules;
  contentRules: ContentRules;
};

type State = {
  data: SettingsData | null;
  undoStack: UndoEntry[];
  hydrated: boolean;
  ensureSeeded: () => void;
  resetDemoData: () => void;
  undo: (id: string) => boolean;
  setOrg: (org: OrganizationSettings) => ActionResult;
  invite: (name: string, email: string, role: StaffRole) => ActionResult;
  changeRole: (id: string, role: StaffRole) => ActionResult;
  setActive: (id: string, active: boolean) => ActionResult;
  setInboxRules: (r: InboxRules) => ActionResult;
  setContentRules: (r: ContentRules) => ActionResult;
  replaceAll: (data: SettingsData) => void;
};

const TEAM_FOR: Record<StaffRole, Team> = {
  admin: "admin",
  library: "library",
  events: "events",
  content: "content",
};
const fresh = (): SettingsData => ({
  org: DEFAULT_ORG,
  staff: createStaff(new Date()),
  inboxRules: DEFAULT_INBOX_RULES,
  contentRules: DEFAULT_CONTENT_RULES,
});

export const useSettingsStore = create<State>()(
  persist(
    (set, get) => {
      const kit = storeKit<SettingsData>(get, set);
      const staff = (id: string) => get().data?.staff.find((s) => s.id === id);
      const lastAdmin = (id: string) => {
        const admins = get().data!.staff.filter((s) => s.active && s.role === "admin");
        return admins.length === 1 && admins[0].id === id;
      };
      return {
        data: null,
        undoStack: [],
        hydrated: false,
        ensureSeeded: () => {
          if (!get().data) set({ data: fresh() });
          set({ hydrated: true });
        },
        resetDemoData: () => set({ data: fresh(), undoStack: [] }),
        undo: (id) => kit.undo(id),
        setOrg: (org) => {
          if (!org.name.trim()) return { ok: false, reason: "Enter the organization's name" };
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(org.email))
            return {
              ok: false,
              reason: "Enter an email address in the right format, like help@example.com",
            };
          return { ok: true, undoId: kit.commit("Organization details", { fields: { org } }) };
        },
        invite: (name, email, role) => {
          if (!name.trim()) return { ok: false, reason: "Enter their name" };
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return {
              ok: false,
              reason: "Enter an email address in the right format, like name@example.com",
            };
          if (get().data!.staff.some((s) => s.email.toLowerCase() === email.toLowerCase()))
            return { ok: false, reason: "Someone with this email is already on the team." };
          const s: Staff = {
            id: `s${newId()}`,
            name: name.trim(),
            email: email.trim(),
            role,
            team: TEAM_FOR[role],
            active: true,
            lastActiveAt: nowIso(),
          };
          return { ok: true, undoId: kit.commit("Invite", { created: { staff: [s] } }) };
        },
        changeRole: (id, role) => {
          const s = staff(id);
          if (!s) return { ok: false, reason: "Person not found." };
          if (s.role === "admin" && role !== "admin" && lastAdmin(id))
            return {
              ok: false,
              reason: `${s.name} is the only active admin. Make someone else an admin first.`,
            };
          return {
            ok: true,
            undoId: kit.commit("Change role", {
              updated: { staff: [{ ...s, role, team: TEAM_FOR[role] }] },
            }),
          };
        },
        setActive: (id, active) => {
          const s = staff(id);
          if (!s) return { ok: false, reason: "Person not found." };
          if (!active && s.role === "admin" && lastAdmin(id))
            return {
              ok: false,
              reason: `${s.name} is the only active admin, so they can't be deactivated.`,
            };
          return {
            ok: true,
            undoId: kit.commit(active ? "Reactivate" : "Deactivate", {
              updated: { staff: [{ ...s, active }] },
            }),
          };
        },
        setInboxRules: (r) =>
          r.replyTargetDays >= 1 && Number.isInteger(r.replyTargetDays)
            ? { ok: true, undoId: kit.commit("Inbox rules", { fields: { inboxRules: r } }) }
            : { ok: false, reason: "Enter the reply target in whole days, like 2" },
        setContentRules: (r) =>
          r.guideReviewMonths >= 1 && r.maxReadingLevel >= 1
            ? { ok: true, undoId: kit.commit("Content rules", { fields: { contentRules: r } }) }
            : { ok: false, reason: "Enter whole numbers above 0" },
        replaceAll: (data) => set({ data }),
      };
    },
    {
      name: "openfield-settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ data: s.data, undoStack: s.undoStack }),
    },
  ),
);

let started = false;
export function hydrateSettings(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  Promise.resolve(useSettingsStore.persist.rehydrate()).then(() =>
    useSettingsStore.getState().ensureSeeded(),
  );
}
