"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowDown01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardSearch } from "@/components/dashboard/dashboard-search";
import {
  canUseContent,
  canUseEvents,
  canUseLibrary,
  hydrateDashboard,
  isAdmin,
  ROLE_LABELS,
  useDashboardStore,
  type DashboardRole,
} from "@/store/dashboard";
import { hydrateLibrary } from "@/store/library";
import { hydrateSettings, useSettingsStore } from "@/store/settings";
import { currentStaff } from "@/lib/inbox/selectors";
import { useEffect } from "react";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";

// "+ New": only what the current role can create.
const NEW_ITEMS: Array<{ href: string; label: string; allow: (r: DashboardRole) => boolean }> = [
  { href: "/dashboard/inbox?call=1", label: "Phone call log", allow: () => true },
  { href: "/dashboard/contacts?new=1", label: "Contact", allow: () => true },
  { href: "/dashboard/library/catalog?new=1", label: "Library item", allow: canUseLibrary },
  { href: "/dashboard/events/new", label: "Event", allow: canUseEvents },
  { href: "/dashboard/courses/new", label: "Course", allow: canUseContent },
  { href: "/dashboard/family-guides/new", label: "Family guide", allow: canUseContent },
];

const ROLES = Object.keys(ROLE_LABELS) as DashboardRole[];

export function DashboardHeader() {
  const router = useRouter();
  useEffect(() => {
    hydrateDashboard();
    hydrateLibrary();
    hydrateSettings();
  }, []);
  const role = useDashboardStore((s) => s.role);
  const setRole = useDashboardStore((s) => s.setRole);
  const staff = useSettingsStore((s) => s.data?.staff);
  // Demo: the signed-in person is the first active staff member with this role.
  const me = (staff && currentStaff(staff, role)) ?? {
    name: "Sam Morgan",
    email: "sam@openfield.example",
  };
  const USER = {
    ...me,
    initials: me.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2),
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white px-4 sm:gap-3 lg:h-16 lg:px-6">
      {/* Search */}
      <div className="flex min-w-0 flex-1">
        <DashboardSearch />
      </div>

      {/* + New */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              className={`extend-touch-target h-9 gap-1.5 bg-brand px-3 text-white hover:bg-brand-hover ${focus}`}
            />
          }
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />
          <span className="hidden sm:inline">New</span>
          <span className="sr-only sm:hidden">New</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="hidden size-3.5 opacity-80 sm:block"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Create new</DropdownMenuLabel>
            {NEW_ITEMS.filter((i) => i.allow(role)).map(({ href, label }) => (
              <DropdownMenuItem key={label} render={<Link href={href} />}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Role */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              className={`extend-touch-target hidden h-9 gap-1.5 px-3 font-normal md:inline-flex ${focus}`}
            />
          }
        >
          <span className="sr-only">Viewing as </span>
          {ROLE_LABELS[role]}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="size-3.5 opacity-70"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>View dashboard as</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={role} onValueChange={(v) => setRole(v as DashboardRole)}>
              {ROLES.map((r) => (
                <DropdownMenuRadioItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Account */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className={`extend-touch-target size-9 rounded-full p-0 ${focus}`}
            />
          }
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">
              {USER.initials}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Account menu for {USER.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col">
              <span className="font-medium text-foreground">{USER.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{USER.email}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {isAdmin(role) && (
            <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
              Settings
            </DropdownMenuItem>
          )}
          <DropdownMenuItem render={<a href="/" target="_blank" rel="noopener noreferrer" />}>
            View website
            <span className="sr-only"> (opens in a new tab)</span>
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              strokeWidth={2}
              aria-hidden="true"
              className="ml-auto size-4 opacity-70"
            />
          </DropdownMenuItem>
          {isAdmin(role) && (
            <DropdownMenuItem render={<Link href="/dashboard/settings?section=demo" />}>
              Reset demo data…
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              useDashboardStore.getState().signOut();
              router.push("/sign-in?signedout=1");
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
