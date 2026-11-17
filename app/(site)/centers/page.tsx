import type { Metadata } from "next";

import { CentersIndex } from "@/components/site/centers/centers-index";

export function generateMetadata(): Metadata {
  return {
    title: "Find help by topic · Openfield",
    description:
      "Courses, library items, events and guides for autism, assistive technology, early childhood, inclusive learning, life after school and deaf-blind.",
  };
}

export default function CentersPage() {
  return <CentersIndex />;
}
