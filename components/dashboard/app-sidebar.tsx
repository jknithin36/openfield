"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DASHBOARD_NAV,
  DASHBOARD_SETTINGS,
  dashboardHref,
  type DashboardItem,
} from "@/lib/dashboard";
import { getNavCounts, type Badge } from "@/lib/dashboard-counts";
import { canUseContent, canUseEvents, canUseLibrary, isAdmin } from "@/store/dashboard";
import { useRole } from "@/components/dashboard/shared/use-dashboard";
import { useWorkspace, workView } from "@/components/dashboard/shared/use-workspace";

// Openfield navy (same as the site footer and donate bar), soft white text.
// Current page: a clean solid white row with navy text — nothing else.
const buttonClass =
  "h-9 gap-2 rounded-md px-3 text-[15px] text-white/75 hover:bg-white/[0.06] hover:text-white focus-visible:ring-3 focus-visible:ring-ring data-active:bg-white data-active:font-medium data-active:text-brand-strong data-active:hover:bg-white data-active:hover:text-brand-strong";

const ALL_SLUGS = [
  ...DASHBOARD_NAV.flatMap((s) => s.items.map((i) => i.slug)),
  DASHBOARD_SETTINGS.slug,
];
/** The nav item that owns a path: the longest slug that matches (so Accommodations wins over Events). */
function ownerSlug(pathname: string) {
  return ALL_SLUGS.filter((slug) => {
    const href = dashboardHref(slug);
    return slug ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href;
  }).sort((a, b) => b.length - a.length)[0];
}

function NavItem({ item, badge }: { item: DashboardItem; badge?: Badge }) {
  const pathname = usePathname();
  const href = dashboardHref(item.slug);
  // Pages stay active on their sub-pages (e.g. catalog/[id]).
  const active = ownerSlug(pathname) === item.slug;
  const show = badge && badge.count > 0;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        aria-current={active ? "page" : undefined}
        render={<Link href={href} />}
        className={buttonClass}
      >
        <span>{item.title}</span>
        {/* Screen readers hear "Requests, 4 waiting" */}
        {show && (
          <span className="sr-only">
            , {badge.count} {badge.sr}
          </span>
        )}
      </SidebarMenuButton>
      {show && (
        <SidebarMenuBadge
          aria-hidden="true"
          className="top-2 right-3 h-5 rounded-none px-0 text-xs font-normal text-white/60 peer-hover/menu-button:text-white/80 peer-data-active/menu-button:font-medium peer-data-active/menu-button:text-brand-strong"
        >
          {badge.count}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const w = useWorkspace();
  const role = useRole();
  // Computed only in the browser, after demo data loads.
  const counts = useMemo<Record<string, Badge>>(
    () => (w ? getNavCounts(w.lib, w.ev, workView(w), w.role, new Date()) : {}),
    [w],
  );
  const allowed: Record<string, boolean> = {
    Library: canUseLibrary(role),
    Events: canUseEvents(role),
    Content: canUseContent(role),
  };
  const sections = DASHBOARD_NAV.map((s) => ({
    ...s,
    items: s.items.filter((i) => i.slug !== "reports" || isAdmin(role)),
  })).filter((s) => s.items.length && (!s.label || allowed[s.label] !== false));

  return (
    <Sidebar
      collapsible="none"
      className="w-full shrink-0 border-b border-white/10 md:h-full md:w-(--sidebar-width) md:overflow-y-auto md:border-b-0"
    >
      <SidebarHeader className="px-5 pt-6 pb-4">
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-2 rounded-sm text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          <Image src="/logo.svg" alt="" width={22} height={22} className="size-[22px] invert" />
          Openfield
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 bg-transparent">
        {sections.map((section, i) => (
          <SidebarGroup key={section.label ?? i} className="px-3 py-2">
            {section.label && (
              <SidebarGroupLabel className="h-7 px-3 text-xs font-medium text-white/55">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.slug} item={item} badge={counts[item.slug]} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-0 bg-transparent px-3 pt-2 pb-5">
        <SidebarMenu className="gap-0.5">
          {isAdmin(role) && <NavItem item={DASHBOARD_SETTINGS} />}
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<a href="/" target="_blank" rel="noopener noreferrer" />}
              className={buttonClass}
            >
              <span>View website</span>
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                strokeWidth={2}
                aria-hidden="true"
                className="ml-auto size-4 opacity-70"
              />
              <span className="sr-only"> (opens in a new tab)</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
