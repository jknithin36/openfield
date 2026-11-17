"use client";

import Link from "next/link";
import { Fragment } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TabNav, type TabDef } from "@/components/dashboard/shared/tab-nav";

const focus = "focus-visible:ring-3 focus-visible:ring-ring";

export type Crumb = { label: string; href?: string };
export type MenuAction = { label: string; onSelect: () => void };
export type PrimaryAction =
  | { label: string; href: string; icon?: React.ReactNode }
  | { label: string; onClick: () => void; icon?: React.ReactNode };

/**
 * The page's only h1, plus optional breadcrumb, count, description, primary
 * action, More menu and tabs. Simple pages can pass just `title`.
 */
export function PageHeader({
  title,
  count,
  description,
  breadcrumb,
  primaryAction,
  moreActions,
  tabs,
}: {
  title: React.ReactNode;
  /** Shown after the title, e.g. "(4 waiting)". */
  count?: React.ReactNode;
  description?: React.ReactNode;
  breadcrumb?: Crumb[];
  primaryAction?: PrimaryAction;
  moreActions?: MenuAction[];
  tabs?: {
    items: TabDef[];
    current: string;
    defaultValue: string;
    param?: string;
    label: string;
  };
}) {
  const primaryClass = `extend-touch-target h-11 gap-1.5 bg-brand px-4 text-white hover:bg-brand-hover ${focus}`;

  return (
    <div className="flex flex-col gap-5">
      <header>
        {breadcrumb && breadcrumb.length > 0 && (
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              {breadcrumb.map((c, i) => (
                <Fragment key={c.label}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {i === breadcrumb.length - 1 ? (
                      <BreadcrumbPage>{c.label}</BreadcrumbPage>
                    ) : c.href ? (
                      <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
                    ) : (
                      c.label
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl leading-tight font-medium tracking-[-0.03em] text-ink sm:text-[28px]">
              {title}
              {count !== undefined && (
                <span className="font-normal text-neutral-600"> {count}</span>
              )}
            </h1>
            {description && <p className="mt-1 text-base text-neutral-600">{description}</p>}
          </div>

          {(primaryAction || moreActions?.length) && (
            <div className="flex flex-wrap gap-2">
              {primaryAction &&
                ("href" in primaryAction ? (
                  <Button
                    nativeButton={false}
                    render={<Link href={primaryAction.href} />}
                    className={primaryClass}
                  >
                    {primaryAction.icon}
                    {primaryAction.label}
                  </Button>
                ) : (
                  <Button onClick={primaryAction.onClick} className={primaryClass}>
                    {primaryAction.icon}
                    {primaryAction.label}
                  </Button>
                ))}
              {moreActions && moreActions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        className={`extend-touch-target h-11 gap-1.5 px-3 ${focus}`}
                      />
                    }
                  >
                    <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} aria-hidden="true" />
                    More
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {moreActions.map((a) => (
                      <DropdownMenuItem key={a.label} onClick={a.onSelect}>
                        {a.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </header>

      {tabs && (
        <TabNav
          tabs={tabs.items}
          current={tabs.current}
          defaultValue={tabs.defaultValue}
          param={tabs.param}
          label={tabs.label}
        />
      )}
    </div>
  );
}
