import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

// Slim bar above the header. Scrolls away; the header below stays sticky.
export function DonateBar() {
  return (
    <aside aria-label="Donate" className="bg-brand text-white">
      <div className="mx-auto flex min-h-10 w-full max-w-[1400px] flex-wrap items-center justify-center gap-x-3 gap-y-0.5 px-6 py-2 text-center text-sm lg:px-8">
        <p className="text-white/90">
          <span className="hidden sm:inline">
            Every gift keeps our training and lending library free for families.
          </span>
          <span className="sm:hidden">Keep our help free for families.</span>
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/donate" />}
          variant="link"
          className="extend-touch-target h-auto gap-1 p-0 font-semibold text-white underline underline-offset-4 hover:text-white hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring"
        >
          Donate now
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            aria-hidden="true"
            data-icon="inline-end"
          />
        </Button>
      </div>
    </aside>
  );
}
