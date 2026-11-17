import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "cn";

import type { RequestStatus } from "@/lib/types";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE: Record<Tone, { className: string; icon?: typeof Alert02Icon }> = {
  neutral: { className: "text-neutral-700" },
  info: { className: "text-brand", icon: InformationCircleIcon },
  success: { className: "text-emerald-800", icon: CheckmarkCircle02Icon },
  warning: { className: "font-medium text-amber-800", icon: Alert02Icon },
  danger: { className: "font-medium text-red-700", icon: Alert02Icon },
};

/** Status always in words; colour and icon are extra, never the only signal. */
export function StatusText({
  tone = "neutral",
  icon = true,
  className,
  children,
}: {
  tone?: Tone;
  icon?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5", t.className, className)}>
      {icon && t.icon && (
        <HugeiconsIcon
          icon={t.icon}
          strokeWidth={2}
          aria-hidden="true"
          className="size-4 shrink-0"
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  waiting: { label: "Waiting for a decision", tone: "neutral" },
  waitlisted: { label: "On the waitlist", tone: "neutral" },
  approved: { label: "Approved", tone: "info" },
  "on-loan": { label: "On loan", tone: "neutral" },
  returned: { label: "Returned, to check", tone: "warning" },
  "in-repair": { label: "In repair", tone: "warning" },
  closed: { label: "Closed", tone: "success" },
  declined: { label: "Declined", tone: "neutral" },
  lost: { label: "Lost", tone: "danger" },
};
