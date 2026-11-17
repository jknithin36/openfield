import type { Metadata } from "next";
import { Suspense } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Toaster } from "@/components/ui/sonner";
import { Announcer } from "@/components/dashboard/shared/announcer";
import { AuthGuard } from "@/components/dashboard/auth-guard";

export const metadata: Metadata = {
  title: "Staff dashboard · Openfield",
  robots: { index: false },
};

// Laptop: one screen tall — the sidebar fills the height and only the main
// area scrolls (the header stays pinned at its top).
// Demo sign-in check runs in the browser (AuthGuard). Add a real server-side
// check here when you connect an auth provider.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <AuthGuard>
      <SidebarProvider className="flex-col md:h-svh md:flex-row md:overflow-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-3 focus:ring-ring"
        >
          Skip to content
        </a>
        {/* The sidebar reads the URL (current page), so it sits in Suspense. */}
        <Suspense
          fallback={<div className="w-full shrink-0 bg-sidebar md:h-full md:w-(--sidebar-width)" />}
        >
          <AppSidebar />
        </Suspense>
        <SidebarInset
          id="main-content"
          tabIndex={-1}
          className="bg-white outline-none md:min-h-0 md:overflow-y-auto"
        >
          <DashboardHeader />
          <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-8 lg:py-10">{children}</div>
        </SidebarInset>
        <Toaster position="bottom-right" />
        <Announcer />
      </SidebarProvider>
    </AuthGuard>
  );
}
