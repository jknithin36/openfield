"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, PrinterIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { certificateCode, useLearning } from "@/store/learning";
import { lengthWords } from "@/lib/learn/public";
import { DEFAULT_ORG } from "@/data/settings";
import { focusRing } from "@/components/dashboard/shared/fields";
import { useCourses } from "@/components/site/learn/lesson-player";

/** Printable, landscape-friendly, black and white. Controls are hidden in print. */
export function Certificate({ slug }: { slug: string }) {
  const courses = useCourses();
  const p = useLearning()[slug];
  const name = (useSearchParams().get("name") ?? p?.certificateName ?? "").trim();
  const course = courses?.find((c) => c.slug === slug);
  const link = `rounded-sm font-medium text-brand underline underline-offset-4 ${focusRing}`;

  if (!courses) return <p className="p-8">Loading…</p>;
  if (!course || !course.certificate)
    return (
      <p className="p-8">
        This course doesn&apos;t have a certificate.{" "}
        <Link href="/learn" className={link}>
          See all free courses
        </Link>
      </p>
    );
  if (!p?.completedAt)
    return (
      <p className="p-8">
        Finish every lesson to get your certificate.{" "}
        <Link href={`/learn/${slug}`} className={link}>
          Back to {course.title}
        </Link>
      </p>
    );

  const date = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
    new Date(p.completedAt),
  );
  const code = p.certificateCode ?? certificateCode(slug, p.completedAt);

  return (
    <div className="min-h-svh bg-neutral-100 px-4 py-8 print:bg-white print:p-0">
      <style>{"@page { size: landscape; margin: 12mm; }"}</style>
      <div className="mx-auto mb-6 flex max-w-[1000px] flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/learn/${slug}`}
          className={`inline-flex min-h-11 items-center gap-1 text-base ${link}`}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="size-4"
          />
          Back to course
        </Link>
        <Button
          onClick={() => window.print()}
          className={`h-12 gap-1.5 bg-brand px-5 text-base text-white hover:bg-brand-hover ${focusRing}`}
        >
          <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} aria-hidden="true" />
          Print or save as PDF
        </Button>
      </div>

      <main className="mx-auto flex aspect-[1.414/1] max-w-[1000px] flex-col justify-between border-[6px] border-double border-ink bg-white p-[6%] text-center text-ink print:max-w-none print:border-black">
        <p className="text-lg font-semibold tracking-wide">{DEFAULT_ORG.name}</p>
        <div>
          <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
            Certificate of completion
          </h1>
          <p className="mt-6 text-lg">This is to certify that</p>
          <p className="mt-2 border-b border-ink pb-2 text-[clamp(1.5rem,3.6vw,2.5rem)] font-medium">
            {name || "Your name"}
          </p>
          <p className="mt-6 text-lg">has completed the free course</p>
          <p className="mt-2 text-[clamp(1.25rem,2.6vw,1.75rem)] font-semibold text-balance">
            {course.title}
          </p>
          <p className="mt-2 text-base">{lengthWords(course)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-left text-sm sm:text-base">
          <p>
            Completed on
            <br />
            <strong className="font-semibold">{date}</strong>
          </p>
          <p className="text-right">
            Verification code
            <br />
            <strong className="font-semibold tracking-wider">{code}</strong>
          </p>
          <p className="col-span-2 mt-2 text-center text-xs">
            Demo certificate — Openfield is a fictional organization.
          </p>
        </div>
      </main>
    </div>
  );
}
