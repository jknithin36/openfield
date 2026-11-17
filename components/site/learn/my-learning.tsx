"use client";

import { useState } from "react";
import Link from "next/link";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { clearLearning, useLearning } from "@/store/learning";
import { focusRing } from "@/components/dashboard/shared/fields";
import { link, nextStep } from "@/components/site/learn/course-page";
import { useCourses } from "@/components/site/learn/lesson-player";

export function MyLearning() {
  const courses = useCourses();
  const learning = useLearning();
  const [confirm, setConfirm] = useState(false);
  const entries = Object.entries(learning).flatMap(([slug, p]) => {
    const c = courses?.find((x) => x.slug === slug);
    return c ? [{ c, p }] : [];
  });
  const inProgress = entries
    .filter((e) => !e.p.completedAt)
    .sort((a, b) => b.p.startedAt.localeCompare(a.p.startedAt));
  const done = entries.filter((e) => e.p.completedAt);

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-10 lg:py-14">
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-ink sm:text-4xl">My learning</h1>
      <p className="mt-3 text-lg text-neutral-700">
        Saved on this device only. Clearing your browser data will remove it.
      </p>

      {!courses ? (
        <p className="mt-8 text-neutral-600">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-border p-8 text-center text-lg text-ink">
          You haven&apos;t started any courses yet.{" "}
          <Link href="/learn" className={link}>
            Browse free courses
          </Link>
        </p>
      ) : (
        <>
          {inProgress.length > 0 && (
            <section aria-labelledby="ip-h" className="mt-10">
              <h2 id="ip-h" className="text-2xl font-medium text-ink">
                In progress
              </h2>
              <ul className="mt-4 flex flex-col divide-y divide-border border-y border-border">
                {inProgress.map(({ c, p }) => {
                  const go = nextStep(c, p);
                  return (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-5"
                    >
                      <div>
                        <h3 className="text-lg">
                          <Link href={`/learn/${c.slug}`} className={link}>
                            {c.title}
                          </Link>
                        </h3>
                        <p className="text-[15px] text-neutral-700">
                          {p.completedLessonIds.length} of {c.lessons.length} lessons done
                        </p>
                      </div>
                      <Link
                        href={go.href}
                        className={`inline-flex min-h-11 items-center rounded-lg border border-brand px-4 text-base font-medium text-brand hover:bg-brand-soft ${focusRing}`}
                      >
                        {go.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {done.length > 0 && (
            <section aria-labelledby="done-h" className="mt-10">
              <h2 id="done-h" className="text-2xl font-medium text-ink">
                Completed
              </h2>
              <ul className="mt-4 flex flex-col divide-y divide-border border-y border-border">
                {done.map(({ c, p }) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-5">
                    <div>
                      <h3 className="text-lg">
                        <Link href={`/learn/${c.slug}`} className={link}>
                          {c.title}
                        </Link>
                      </h3>
                      <p className="text-[15px] text-neutral-700">
                        Finished{" "}
                        {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
                          new Date(p.completedAt!),
                        )}
                      </p>
                    </div>
                    {c.certificate && (
                      <Link
                        href={
                          p.certificateName
                            ? `/learn/${c.slug}/certificate?name=${encodeURIComponent(p.certificateName)}`
                            : `/learn/${c.slug}/complete`
                        }
                        className={`inline-flex min-h-11 items-center text-base ${link}`}
                      >
                        {p.certificateName ? "View certificate" : "Get certificate"}
                        <span className="sr-only">: {c.title}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <Button
            variant="outline"
            onClick={() => setConfirm(true)}
            className={`mt-10 h-11 px-4 text-red-700 ${focusRing}`}
          >
            Clear my learning history
          </Button>
        </>
      )}

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear your learning history?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your progress and certificates from this device. It can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={`h-11 px-4 ${focusRing}`}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearLearning()}
              className={`h-11 bg-red-700 px-4 text-white hover:bg-red-800 ${focusRing}`}
            >
              Clear history
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
