"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

import { ABOUT } from "@/data/about";
import type { Job } from "@/lib/types";
import { focusRing } from "@/components/dashboard/shared/fields";
import { AboutBreadcrumb, H2, link } from "@/components/site/about/about-home";
import { useOrg } from "@/components/site/about/about-contact";

const longDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(y, m - 1, d));
};

function JobItem({ job, email, phone }: { job: Job; email: string; phone: string }) {
  return (
    <li className="rounded-2xl border border-border bg-white p-6">
      <h3 className="text-xl font-medium text-ink">{job.title}</h3>
      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-base sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt className="text-neutral-600">Team</dt>
        <dd className="text-ink">{job.team}</dd>
        <dt className="text-neutral-600">Hours</dt>
        <dd className="text-ink">{job.hours}</dd>
        <dt className="text-neutral-600">Pay</dt>
        <dd className="font-medium text-ink">{job.pay}</dd>
        <dt className="text-neutral-600">Where</dt>
        <dd className="text-ink">{job.location}</dd>
        <dt className="text-neutral-600">Closing date</dt>
        <dd className="text-ink">
          <time dateTime={job.closingDate}>{longDate(job.closingDate)}</time>
        </dd>
      </dl>
      <p className="mt-4 text-lg text-ink">{job.summary}</p>
      <details className="group mt-4 border-t border-border pt-3">
        <summary
          className={`flex min-h-11 cursor-pointer list-none items-center gap-2 text-base font-medium text-brand underline underline-offset-4 [&::-webkit-details-marker]:hidden ${focusRing}`}
        >
          Read more<span className="sr-only"> about the {job.title} job</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <div className="mt-3 flex flex-col gap-5 text-base text-ink">
          <div>
            <h4 className="font-semibold">What you&apos;ll do</h4>
            <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-6">
              {job.responsibilities.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">What we&apos;re looking for</h4>
            <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-6">
              {job.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">How to apply</h4>
            <p className="mt-1.5">
              Email a short letter and your résumé to{" "}
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(`Application: ${job.title}`)}`}
                className={link}
              >
                {email}
              </a>{" "}
              by {longDate(job.closingDate)}. Or call{" "}
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={link}>
                {phone}
              </a>{" "}
              to apply by phone.
            </p>
            <p className="mt-2">{job.adjustmentsNote}</p>
          </div>
        </div>
      </details>
    </li>
  );
}

export function AboutCareers() {
  const org = useOrg();
  return (
    <>
      <AboutBreadcrumb page="Work with us" />
      <h1 className="mt-6 text-3xl font-medium tracking-[-0.03em] text-ink sm:text-5xl">
        Work with us
      </h1>
      <p className="mt-4 max-w-3xl text-xl leading-relaxed text-ink">
        We&apos;re a small team in one building, and we know the families we help by name. We offer
        flexible hours, time off to look after family, and training every year.
      </p>
      <p className="mt-4 max-w-3xl rounded-xl border-l-4 border-brand bg-brand-soft p-4 text-lg text-ink">
        We make adjustments at every stage. Tell us what you need — it won&apos;t affect your
        application.
      </p>

      <div className="mt-12 flex flex-col gap-14">
        <section aria-labelledby="jobs-h">
          <H2 id="jobs-h">Jobs</H2>
          {ABOUT.jobs.length === 0 ? (
            <p className="mt-4 text-lg text-ink">We don&apos;t have any open jobs right now.</p>
          ) : (
            <ul className="mt-5 flex flex-col gap-5">
              {ABOUT.jobs.map((j) => (
                <JobItem key={j.id} job={j} email={org.email} phone={org.phone} />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="vol-h">
          <H2 id="vol-h">Volunteer</H2>
          <p className="mt-3 max-w-3xl text-lg text-ink">
            Volunteers help at events, in the library and by testing new courses. We pay travel
            costs.
          </p>
          <ul className="mt-5 grid gap-5 md:grid-cols-3">
            {ABOUT.volunteerRoles.map((v) => (
              <li key={v.title} className="rounded-2xl border border-border bg-white p-5">
                <h3 className="text-lg font-medium text-ink">{v.title}</h3>
                <p className="mt-1 text-[15px] text-neutral-600">{v.commitment}</p>
                <p className="mt-2 text-base text-ink">{v.summary}</p>
              </li>
            ))}
          </ul>
          <Link
            href="/contact?topic=volunteering"
            className={`mt-6 inline-flex min-h-11 items-center text-lg ${link}`}
          >
            Ask about volunteering
          </Link>
        </section>
      </div>
    </>
  );
}
