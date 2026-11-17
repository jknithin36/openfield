import type { Metadata } from "next";

import { FamiliesHome } from "@/components/site/families/families";

export const metadata: Metadata = {
  title: "Help for families · Openfield",
  description:
    "Plain-language guides for each stage of your child's life, and a family team you can call.",
};

export default function FamiliesPage() {
  return <FamiliesHome />;
}
