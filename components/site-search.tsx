"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowTurnBackwardIcon,
  ArrowUp01Icon,
  Book02Icon,
  Calendar03Icon,
  File01Icon,
  Layers01Icon,
  Mortarboard01Icon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { tactile, tactileBase } from "@/components/tactile-button";
import { CENTERS as TOPICS } from "@/data/centers";
import { lengthWords } from "@/lib/learn/public";
import { STATIC_COURSES } from "@/lib/learn/static-courses";
import { EVENTS, FAMILY_GUIDES, LIBRARY_ITEMS, PAGES } from "@/lib/content";

type Result = {
  href: string;
  title: string;
  subtitle?: string;
  meta?: string;
  /** Extra words that should match (not shown). */
  keywords?: string[];
};

type Group = {
  heading: string;
  icon: typeof File01Icon;
  results: Result[];
};

// Everything searchable, grouped by type. Courses, items and events show a
// short tag on the right so people can tell them apart at a glance.
const GROUPS: Group[] = [
  {
    heading: "Courses",
    icon: Mortarboard01Icon,
    results: STATIC_COURSES.map((c) => ({
      href: `/learn/${c.slug}`,
      title: c.title,
      subtitle: c.summary,
      meta: lengthWords(c),
      keywords: ["course", ...c.audiences, ...(c.outcomes ?? [])],
    })),
  },
  {
    heading: "Library items",
    icon: Book02Icon,
    results: LIBRARY_ITEMS.map((i) => ({
      href: `/library/${i.slug}`,
      title: i.name,
      subtitle: `${i.type} · ${i.loan}`,
      meta: i.available ? "Available" : "On loan",
      keywords: ["borrow", "loan", "library", i.type.toLowerCase()],
    })),
  },
  {
    heading: "Events",
    icon: Calendar03Icon,
    results: EVENTS.map((e) => ({
      href: `/events/${e.slug}`,
      title: e.title,
      subtitle: e.description,
      meta: e.day,
      keywords: ["event", e.type.toLowerCase()],
    })),
  },
  {
    heading: "Topics",
    icon: Layers01Icon,
    results: TOPICS.map((c) => ({
      href: `/centers/${c.slug}`,
      title: c.name,
      subtitle: c.summary,
      keywords: ["center", "topic", ...c.whoItsFor],
    })),
  },
  {
    heading: "Family guides",
    icon: UserGroupIcon,
    results: FAMILY_GUIDES.map((g) => ({
      href: g.href,
      title: g.label,
      subtitle: "Guide for parents and carers",
      keywords: ["family", "parent", "guide"],
    })),
  },
  {
    heading: "Pages",
    icon: File01Icon,
    results: PAGES.map((p) => ({
      href: p.href,
      title: p.label,
      subtitle: p.hint,
    })),
  },
];

export function SiteSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // ⌘K / Ctrl+K opens search, like ui.shadcn.com.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className={cn(
          tactileBase,
          tactile.secondary,
          "extend-touch-target text-muted-foreground max-lg:size-8 max-lg:px-0 lg:w-44 lg:justify-between",
          className,
        )}
      >
        <span className="flex items-center gap-2">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} aria-hidden="true" />
          <span className="hidden lg:inline">Search…</span>
        </span>
        <KbdGroup className="hidden lg:inline-flex" aria-hidden="true">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Openfield"
        description="Search courses, library items, events, centers and guides"
        className="top-1/2 -translate-y-1/2 sm:max-w-2xl"
      >
        <Command className="rounded-xl">
          <div className="p-2 pb-0">
            <CommandInput placeholder="Search courses, library items, events…" />
          </div>
          <CommandList className="max-h-[min(28rem,60vh)] px-1 pb-1">
            <CommandEmpty className="py-10">
              <p className="font-medium text-foreground">No results found</p>
              <p className="mt-1 text-muted-foreground">
                Try a different word, like “tablet” or “autism”.
              </p>
            </CommandEmpty>

            {GROUPS.map(({ heading, icon, results }, gi) => (
              <div key={heading}>
                {gi > 0 && <CommandSeparator className="mx-1 my-1" />}
                <CommandGroup heading={heading}>
                  {results.map(({ href, title, subtitle, meta, keywords }) => (
                    <CommandItem
                      key={href}
                      value={`${title} ${subtitle ?? ""} ${heading}`}
                      keywords={keywords}
                      onSelect={() => go(href)}
                      className="gap-3 px-2.5 py-2"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand"
                      >
                        <HugeiconsIcon icon={icon} strokeWidth={1.8} className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-foreground">{title}</span>
                        {subtitle && (
                          <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
                        )}
                      </span>
                      {meta && (
                        <span className="ml-2 shrink-0 text-xs text-muted-foreground tabular-nums">
                          {meta}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ))}
          </CommandList>

          {/* Keyboard hints (laptops) */}
          <div
            aria-hidden="true"
            className="hidden items-center gap-4 border-t px-4 py-2.5 text-xs text-muted-foreground sm:flex"
          >
            <span className="flex items-center gap-1.5">
              <KbdGroup>
                <Kbd>
                  <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-3" />
                </Kbd>
                <Kbd>
                  <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3" />
                </Kbd>
              </KbdGroup>
              to move
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>
                <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} className="size-3" />
              </Kbd>
              to open
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>esc</Kbd>
              to close
            </span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
