import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

// Staff pages: a minimal top bar (logo + back link), no site header/footer.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-3 focus:ring-ring"
      >
        Skip to content
      </a>

      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-6 lg:h-16 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-sm text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            <Image src="/logo.svg" alt="" width={24} height={24} className="size-6" />
            Openfield
          </Link>
          <Button
            nativeButton={false}
            render={<Link href="/" />}
            variant="ghost"
            className="extend-touch-target gap-1 text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              aria-hidden="true"
              data-icon="inline-start"
            />
            Back to website
          </Button>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 justify-center bg-linear-to-br from-[#e8f0f2] to-[#e6eee4] px-6 py-12 outline-none sm:py-20"
      >
        {children}
      </main>
    </>
  );
}
