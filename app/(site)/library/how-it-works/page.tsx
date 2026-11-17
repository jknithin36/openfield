import type { Metadata } from "next";

import { HowItWorks } from "@/components/site/library/how-it-works";

export const metadata: Metadata = {
  title: "How borrowing works · Lending library · Openfield",
  description: "Who can borrow, how long you can keep things, and what to do if something breaks.",
};

export default function HowItWorksPage() {
  return <HowItWorks />;
}
