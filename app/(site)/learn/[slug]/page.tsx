import type { Metadata } from "next";
import { Suspense } from "react";

import { STATIC_COURSES, staticCourse } from "@/lib/learn/static-courses";
import { CoursePage } from "@/components/site/learn/course-page";
import { JsonLd } from "@/components/site/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return STATIC_COURSES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const c = staticCourse((await params).slug);
  return c
    ? { title: `${c.title} · Free courses · Openfield`, description: c.summary }
    : { title: "Free courses · Openfield" };
}

async function Course({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = staticCourse(slug);
  return (
    <>
      {c && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Course",
            name: c.title,
            description: c.summary,
            url: `${SITE_URL}/learn/${c.slug}`,
            isAccessibleForFree: true,
            inLanguage: "en",
            provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
            offers: { "@type": "Offer", price: 0, priceCurrency: "USD", category: "Free" },
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "online",
              courseWorkload: `PT${c.lessons.reduce((n, l) => n + l.minutes, 0)}M`,
            },
          }}
        />
      )}
      <CoursePage slug={slug} />
    </>
  );
}

export default function CourseRoute({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-[1100px] px-6 py-14 text-neutral-600">Loading…</p>}
    >
      <Course params={params} />
    </Suspense>
  );
}
