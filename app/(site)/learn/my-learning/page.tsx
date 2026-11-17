import type { Metadata } from "next";

import { MyLearning } from "@/components/site/learn/my-learning";

export const metadata: Metadata = { title: "My learning · Openfield", robots: { index: false } };

export default function MyLearningPage() {
  return <MyLearning />;
}
