import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

export const legalLink =
  "rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand focus-visible:ring-3 focus-visible:ring-ring";

/** Plain layout for trust pages: h1, last updated, "On this page", sections. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  const date = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
    new Date(`${updated}T12:00:00`),
  );
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 lg:px-8 lg:py-14">
      <Breadcrumb className="print:hidden">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article aria-labelledby="legal-h" className="min-w-0">
          <h1 id="legal-h" className="text-3xl font-medium tracking-[-0.03em] text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-base text-neutral-700">
            Last updated <time dateTime={updated}>{date}</time>
          </p>
          <div className="mt-6 max-w-[65ch] text-lg leading-relaxed text-ink">{intro}</div>

          <nav
            aria-label="On this page"
            className="mt-8 rounded-xl bg-neutral-50 px-5 py-4 lg:hidden"
          >
            <p className="text-sm font-semibold text-ink">On this page</p>
            <ul className="mt-1 flex flex-col">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`inline-flex min-h-11 items-center text-base ${legalLink}`}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-10 flex flex-col gap-10">
            {sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24">
                <h2 id={`${s.id}-h`} className="text-2xl font-medium tracking-[-0.02em] text-ink">
                  {s.title}
                </h2>
                <div className="mt-3 flex max-w-[65ch] flex-col gap-3 text-lg leading-relaxed text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-6">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </article>
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-2 text-sm font-semibold text-ink">On this page</p>
            <ul className="flex flex-col gap-0.5 border-l-2 border-border">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-0.5 flex min-h-11 items-center border-l-2 border-transparent px-3 text-[15px] text-ink outline-none hover:border-brand hover:text-brand focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}
