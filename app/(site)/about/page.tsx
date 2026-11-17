import type { Metadata } from "next";

import { AboutHome } from "@/components/site/about/about-home";

export function generateMetadata(): Metadata {
  return {
    title: "About Openfield",
    description: "Who we are, what we do, and how we work. Everything we offer is free to use.",
  };
}

export default function AboutPage() {
  return <AboutHome />;
}
