"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { DonateBar } from "@/components/donate-bar";
import { SiteSearch } from "@/components/site-search";
import { tactile, tactileBase } from "@/components/tactile-button";

const NAV_LINKS = [
  { href: "/centers", label: "Topics" },
  { href: "/learn", label: "Learn" },
  { href: "/library", label: "Library" },
  { href: "/events", label: "Events" },
  { href: "/families", label: "Families" },
  { href: "/about", label: "About" },
] as const;

// Full-strength amber ring (--ring is amber in globals.css).
const focusRing = "focus-visible:ring-3 focus-visible:ring-ring";

// Current page: bold + teal. NavigationMenuLink sets data-active when `active`.
const activeLink =
  "data-active:bg-transparent data-active:font-semibold data-active:text-brand dark:data-active:text-brand-soft";

/** Reads the URL to highlight the current section. */
export function SiteHeader() {
  return <SiteHeaderView pathname={usePathname()} />;
}

/** The header itself. Also used (with no current section) as the Suspense fallback. */
export function SiteHeaderView({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <Button
        nativeButton={false}
        render={<a href="#main-content" />}
        variant="outline"
        className={cn(
          "sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:px-3 focus:shadow-lg",
          focusRing,
        )}
      >
        Skip to content
      </Button>

      <div className="print:hidden">
        <DonateBar />
      </div>

      {/* Sizes follow ui.shadcn.com: h-14 → lg:h-16, 1400px container, px-6 → lg:px-8.
          Three equal side columns keep the logo exactly centered. */}
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        render={
          <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/70 print:hidden" />
        }
      >
        <div className="mx-auto grid h-14 w-full max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 lg:h-16 lg:px-8">
          {/* Left: menu links (laptop) / menu toggle (phone) */}
          <div className="flex items-center justify-self-start">
            <NavigationMenu aria-label="Main" className="hidden lg:flex">
              <NavigationMenuList>
                {NAV_LINKS.map(({ href, label }) => (
                  <NavigationMenuItem key={href}>
                    <NavigationMenuLink
                      active={isActive(href)}
                      render={<Link href={href} />}
                      className={cn(
                        "extend-touch-target h-8 px-2.5 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground",
                        activeLink,
                        focusRing,
                      )}
                    >
                      {label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            <CollapsibleTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={open ? "Close menu" : "Open menu"}
                  className={cn("extend-touch-target lg:hidden", focusRing)}
                />
              }
            >
              <HugeiconsIcon
                icon={open ? Cancel01Icon : Menu01Icon}
                strokeWidth={2}
                className="size-5"
                aria-hidden="true"
              />
            </CollapsibleTrigger>
          </div>

          {/* Center: logo + name */}
          <Button
            nativeButton={false}
            render={<Link href="/" onClick={() => setOpen(false)} />}
            variant="ghost"
            className={cn(
              "extend-touch-target gap-2 px-1 text-base font-semibold hover:bg-transparent",
              focusRing,
            )}
          >
            <Image
              src="/logo.svg"
              alt=""
              width={24}
              height={24}
              className="size-6 dark:invert"
              priority
            />
            Openfield
          </Button>

          {/* Right: search + log in */}
          <div className="flex items-center gap-2 justify-self-end">
            <SiteSearch />
            <Button
              nativeButton={false}
              render={<Link href="/sign-in" />}
              aria-current={isActive("/sign-in") ? "page" : undefined}
              className={cn(
                tactileBase,
                tactile.primary,
                "extend-touch-target hidden lg:inline-flex",
              )}
            >
              Staff sign in
            </Button>
          </div>
        </div>

        {/* Phone menu, opens below the header */}
        <CollapsibleContent className="border-t border-border lg:hidden">
          <div className="flex flex-col gap-4 px-6 py-6">
            <p className="text-sm font-medium text-muted-foreground">Menu</p>
            <NavigationMenu
              aria-label="Main"
              orientation="vertical"
              className="max-w-none items-stretch"
            >
              <NavigationMenuList className="flex-col items-stretch gap-1">
                {NAV_LINKS.map(({ href, label }) => (
                  <NavigationMenuItem key={href}>
                    <NavigationMenuLink
                      active={isActive(href)}
                      render={<Link href={href} onClick={() => setOpen(false)} />}
                      className={cn("h-11 px-2 text-lg font-medium", activeLink, focusRing)}
                    >
                      {label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <div className="flex flex-col gap-2">
              <Button
                nativeButton={false}
                render={<Link href="/sign-in" onClick={() => setOpen(false)} />}
                aria-current={isActive("/sign-in") ? "page" : undefined}
                size="lg"
                className={cn(tactileBase, tactile.primary, "extend-touch-target w-full")}
              >
                Staff sign in
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/contact" onClick={() => setOpen(false)} />}
                aria-current={isActive("/contact") ? "page" : undefined}
                variant="outline"
                size="lg"
                className={cn(tactileBase, tactile.secondary, "extend-touch-target w-full")}
              >
                Contact us
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
