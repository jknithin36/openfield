"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, Search01Icon } from "@hugeicons/core-free-icons";

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
import { canUseContent, canUseEvents, canUseLibrary, isAdmin } from "@/store/dashboard";
import { ALL_DASHBOARD_ITEMS, dashboardHref } from "@/lib/dashboard";
import { formatMonthDay } from "@/lib/format";
import { effectiveStatus } from "@/lib/events/selectors";
import { MSG_STATUS_LABEL, visibleTo } from "@/lib/inbox/selectors";
import { STAGE_LABEL } from "@/lib/guides/selectors";
import { COURSE_FORMAT_LABEL } from "@/lib/courses/selectors";
import { getAvailability } from "@/lib/library/selectors";
import { join, ROLE_LABEL } from "@/lib/library/views";
import type { RequestStatus } from "@/lib/types";
import { REQUEST_STATUS } from "@/components/dashboard/shared/status-text";
import { useWorkspace } from "@/components/dashboard/shared/use-workspace";

/** Where a request lives in the journey (opens its panel there). */
function requestHref(id: string, status: RequestStatus, itemId: string): string {
  const q = `id=${encodeURIComponent(id)}`;
  switch (status) {
    case "waiting":
    case "waitlisted":
    case "declined":
      return `/dashboard/library/requests?status=${status}&${q}`;
    case "approved":
      return `/dashboard/library/to-ship`;
    case "on-loan":
      return `/dashboard/library/on-loan?${q}`;
    case "returned":
      return `/dashboard/library/returns`;
    case "in-repair":
      return `/dashboard/library/returns?tab=in-repair`;
    default:
      return `/dashboard/library/catalog/${itemId}`;
  }
}

type Hit = { key: string; label: string; meta: string; href: string; value: string };
const RECENT_KEY = "openfield-recent";
const readRecent = (): Hit[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as Hit[];
  } catch {
    return [];
  }
};

const itemClass = "justify-between gap-3 px-2.5 py-2";
const MAX_PER_GROUP = 8;

export function DashboardSearch() {
  const w = useWorkspace();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<Hit[]>([]);

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
  // Opening loads recent items; closing clears the search.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setRecent(readRecent());
    else setQuery("");
  }

  const go = (hit: Hit) => {
    const next = [hit, ...readRecent().filter((h) => h.key !== hit.key)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setOpen(false);
    router.push(hit.href);
  };

  // Everything this role can open, grouped. Matching is done here (not by
  // cmdk) so each group can be capped and stays quick with hundreds of records.
  const groups = useMemo(() => {
    if (!w) return [];
    const now = new Date();
    const lib = canUseLibrary(w.role);
    const ev = canUseEvents(w.role);
    const content = canUseContent(w.role);
    const g: Array<{ heading: string; hits: Hit[] }> = [
      {
        heading: "People",
        hits: w.contacts.map((c) => ({
          key: `c-${c.id}`,
          label: c.name,
          meta: ROLE_LABEL[c.role],
          href: `/dashboard/contacts/${c.id}`,
          value: `${c.name} ${c.email} ${c.phone}`,
        })),
      },
      {
        heading: "Messages",
        hits: w.messages
          .filter((m) => visibleTo(m, w.role, w.me?.id ?? null))
          .map((m) => ({
            key: `m-${m.id}`,
            label: m.subject,
            meta: `${m.name} · ${MSG_STATUS_LABEL[m.status]}`,
            href: `/dashboard/inbox?status=all&id=${m.id}`,
            value: `${m.subject} ${m.name} ${m.id}`,
          })),
      },
    ];
    if (ev)
      g.push({
        heading: "Events",
        hits: w.ev.data.events.map((e) => ({
          key: `e-${e.id}`,
          label: e.title,
          meta: `${formatMonthDay(e.startsAt)} · ${effectiveStatus(e, now) === "published" ? "Upcoming" : effectiveStatus(e, now)}`,
          href: `/dashboard/events/${e.id}`,
          value: e.title,
        })),
      });
    if (lib) {
      g.push({
        heading: "Library items",
        hits: w.lib.items.map((i) => {
          const a = getAvailability(w.lib, i.id);
          return {
            key: `i-${i.id}`,
            label: i.name,
            meta: i.archived ? "Archived" : `${a.free} of ${a.total} free`,
            href: `/dashboard/library/catalog/${i.id}`,
            value: `${i.name} ${i.type}`,
          };
        }),
      });
      g.push({
        heading: "Requests",
        hits: join(w.lib, w.lib.requests).map(({ request, item, contact }) => ({
          key: `r-${request.id}`,
          label: `${item.name} (${request.id})`,
          meta: `${contact.name} · ${REQUEST_STATUS[request.status].label}`,
          href: requestHref(request.id, request.status, item.id),
          value: `${request.id} ${item.name} ${contact.name}`,
        })),
      });
    }
    if (content) {
      g.push({
        heading: "Courses",
        hits: w.content.courses.map((c) => ({
          key: `co-${c.id}`,
          label: c.title,
          meta: `${COURSE_FORMAT_LABEL[c.format]} · ${c.status}`,
          href: `/dashboard/courses/${c.id}`,
          value: c.title,
        })),
      });
      g.push({
        heading: "Family guides",
        hits: w.content.guides.map((x) => ({
          key: `g-${x.id}`,
          label: x.title,
          meta: `${STAGE_LABEL[x.ageStage]} · ${x.status}`,
          href: `/dashboard/family-guides/${x.id}`,
          value: x.title,
        })),
      });
    }
    return g;
  }, [w]);

  const q = query.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  const matches = (h: Hit) =>
    terms.every((t) => `${h.label} ${h.value} ${h.meta}`.toLowerCase().includes(t));
  const results = q
    ? groups.map((g) => ({ ...g, hits: g.hits.filter(matches) })).filter((g) => g.hits.length)
    : [];
  const pages = ALL_DASHBOARD_ITEMS.filter((p) => {
    if (!w) return true;
    if (p.slug.startsWith("library")) return canUseLibrary(w.role);
    if (p.slug.startsWith("events")) return canUseEvents(w.role);
    if (p.slug === "courses" || p.slug === "family-guides") return canUseContent(w.role);
    if (p.slug === "reports" || p.slug === "settings") return isAdmin(w.role);
    return true;
  }).filter((p) => !q || `${p.title} ${p.description}`.toLowerCase().includes(q));

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label="Search the dashboard"
        className="extend-touch-target h-9 w-full max-w-md justify-between gap-3 border-border bg-neutral-50 px-3 font-normal text-neutral-600 hover:bg-neutral-100 focus-visible:ring-3 focus-visible:ring-ring max-sm:size-9 max-sm:w-9 max-sm:justify-center max-sm:px-0"
      >
        <span className="flex min-w-0 items-center gap-2">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} aria-hidden="true" />
          <span className="hidden truncate sm:inline">Search people, messages, items…</span>
        </span>
        <KbdGroup className="hidden sm:inline-flex" aria-hidden="true">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search the dashboard"
        description="Search people, messages, events, library items, requests, courses and guides"
        className="top-1/2 -translate-y-1/2 sm:max-w-xl"
      >
        <Command shouldFilter={false} className="rounded-xl">
          <div className="p-2 pb-0">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search people, messages, events, items…"
            />
          </div>
          <CommandList className="max-h-[min(28rem,62vh)] px-1 pb-1">
            <CommandEmpty className="py-10">No results for “{query}”.</CommandEmpty>

            {!q && recent.length > 0 && (
              <>
                <CommandGroup heading="Recently opened">
                  {recent.map((h) => (
                    <CommandItem
                      key={h.key}
                      value={h.key}
                      onSelect={() => go(h)}
                      className={itemClass}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="size-4 text-muted-foreground"
                        />
                        <span className="truncate font-medium">{h.label}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{h.meta}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator className="mx-1 my-1" />
              </>
            )}

            {results.map((g) => (
              <CommandGroup
                key={g.heading}
                heading={
                  g.hits.length > MAX_PER_GROUP
                    ? `${g.heading} (${g.hits.length}, showing ${MAX_PER_GROUP})`
                    : g.heading
                }
              >
                {g.hits.slice(0, MAX_PER_GROUP).map((h) => (
                  <CommandItem
                    key={h.key}
                    value={h.key}
                    onSelect={() => go(h)}
                    className={itemClass}
                  >
                    <span className="truncate font-medium">{h.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{h.meta}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            {pages.length > 0 && (
              <CommandGroup heading="Go to">
                {pages.map((item) => (
                  <CommandItem
                    key={item.slug || "today"}
                    value={`page-${item.slug}`}
                    onSelect={() =>
                      go({
                        key: `p-${item.slug}`,
                        label: item.title,
                        meta: "Page",
                        href: dashboardHref(item.slug),
                        value: item.title,
                      })
                    }
                    className={itemClass}
                  >
                    <span>{item.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
