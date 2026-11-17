// Spot icons for the home page "How can we help?" links.
// Hugeicons only — navy stroke. Decorative: the card text carries the
// meaning, so each icon is aria-hidden.
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Book02Icon,
  BookOpen01Icon,
  BubbleChatIcon,
  HandHeartIcon,
  Mortarboard01Icon,
} from "@hugeicons/core-free-icons";

type Props = { className?: string };

function icon(glyph: typeof Book02Icon) {
  function Illustration({ className }: Props) {
    return (
      <HugeiconsIcon
        icon={glyph}
        strokeWidth={1.6}
        color="var(--brand)"
        aria-hidden="true"
        className={className}
      />
    );
  }
  return Illustration;
}

// Help cards
export const CapIllustration = icon(Mortarboard01Icon);
export const BookIllustration = icon(BookOpen01Icon);
export const FamilyIllustration = icon(HandHeartIcon);
export const TalkIllustration = icon(BubbleChatIcon);
