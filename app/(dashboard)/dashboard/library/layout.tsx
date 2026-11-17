import { LibraryGuard } from "@/components/dashboard/library/library-guard";

export default function LibraryLayout({ children }: LayoutProps<"/dashboard/library">) {
  return <LibraryGuard>{children}</LibraryGuard>;
}
