import { HugeiconsIcon } from "@hugeicons/react";
import {
  Book02Icon,
  Calendar03Icon,
  ClipboardIcon,
  EyeIcon,
  PackageIcon,
  SmartPhone01Icon,
  Tablet01Icon,
  Touch01Icon,
  ToyBrickIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "cn";

import type { ItemType, LibraryItem } from "@/lib/types";

type Glyph = typeof Book02Icon;

// One recognisable Hugeicons glyph per library item; new items fall back to
// their type. Decorative: the item name is always written next to it.
const BY_ITEM: Record<string, Glyph> = {
  "talk-easy-tablet": Tablet01Icon,
  "sensory-starter-kit": Touch01Icon,
  "eye-gaze-starter": EyeIcon,
  "switch-adapted-toys": ToyBrickIcon,
  "every-learner-belongs": Book02Icon,
  "visual-schedule-kit": Calendar03Icon,
  "social-stories-video": Video01Icon,
  "big-button-phone": SmartPhone01Icon,
};

const BY_TYPE: Record<ItemType, Glyph> = {
  device: Tablet01Icon,
  kit: PackageIcon,
  book: Book02Icon,
  video: Video01Icon,
  assessment: ClipboardIcon,
};

/** The glyph for an item (its own, or its type's). */
export const itemGlyph = (item: Pick<LibraryItem, "id" | "type">): Glyph =>
  BY_ITEM[item.id] ?? BY_TYPE[item.type];

export function ItemIcon({
  item,
  size = "md",
  className,
}: {
  item: Pick<LibraryItem, "id" | "type">;
  size?: "sm" | "md";
  className?: string;
}) {
  const glyph = BY_ITEM[item.id] ?? BY_TYPE[item.type];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand",
        size === "sm" ? "size-8" : "size-10",
        className,
      )}
    >
      <HugeiconsIcon
        icon={glyph}
        strokeWidth={1.7}
        className={size === "sm" ? "size-4" : "size-5"}
      />
    </span>
  );
}
