import type { Metadata } from "next";

import { RequestStatus } from "@/components/site/library/request-status";

export const metadata: Metadata = {
  title: "Check a request · Openfield",
  description: "See where your library request is up to.",
};

export default function StatusPage() {
  return <RequestStatus />;
}
