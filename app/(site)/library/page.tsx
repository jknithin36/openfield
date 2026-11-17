import type { Metadata } from "next";
import { Suspense } from "react";

import { LibraryCatalog } from "@/components/site/library/catalog";

export const metadata: Metadata = {
  title: "Lending library · Openfield",
  description:
    "Borrow devices, kits, books and videos for free. We ship them to you and pay for the return.",
};

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-[1400px] px-6 py-14 text-neutral-600">Loading the library…</p>
      }
    >
      <LibraryCatalog />
    </Suspense>
  );
}
