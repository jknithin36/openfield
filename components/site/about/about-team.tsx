"use client";

import Link from "next/link";

import { ABOUT } from "@/data/about";
import { getActiveStaffByTeam } from "@/lib/about/public";
import { useWorkspace } from "@/components/dashboard/shared/use-workspace";
import { AboutBreadcrumb, H2, link } from "@/components/site/about/about-home";

const initials = (name: string) =>
  name
    .replace(/^Dr\.\s*/, "")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Person({ name, role, bio }: { name: string; role: string; bio?: string }) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-base font-semibold text-brand"
      >
        {initials(name)}
      </span>
      <div>
        <h4 className="text-lg font-medium text-ink">{name}</h4>
        <p className="text-[15px] text-neutral-600">{role}</p>
        {bio && <p className="mt-1 text-base text-ink">{bio}</p>}
      </div>
    </li>
  );
}

export function AboutTeam() {
  const w = useWorkspace();
  const groups = w ? getActiveStaffByTeam(w.settings.staff) : [];
  return (
    <>
      <AboutBreadcrumb page="Our team" />
      <h1 className="mt-6 text-3xl font-medium tracking-[-0.03em] text-ink sm:text-5xl">
        Our team
      </h1>
      <p className="mt-4 max-w-3xl text-xl leading-relaxed text-ink">
        The people who run our services, the board that oversees us, and the group that keeps us
        honest.
      </p>

      <div className="mt-12 flex flex-col gap-14">
        <section aria-labelledby="staff-h">
          <H2 id="staff-h">Staff</H2>
          {!w ? (
            <p className="mt-4 text-neutral-600">Loading…</p>
          ) : (
            <div className="mt-6 flex flex-col gap-10">
              {groups.map((g) => (
                <section key={g.group} aria-labelledby={`g-${g.group}`}>
                  <h3
                    id={`g-${g.group}`}
                    className="border-b border-border pb-2 text-xl font-medium text-ink"
                  >
                    {g.group}
                  </h3>
                  <ul className="mt-5 grid gap-6 sm:grid-cols-2">
                    {g.people.map((p) => (
                      <Person key={p.name} {...p} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="board-h">
          <H2 id="board-h">Board</H2>
          <p className="mt-2 max-w-3xl text-base text-neutral-700">
            Volunteers who oversee our money and make sure we keep our promises. They aren&apos;t
            paid.
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            {ABOUT.board.map((b) => (
              <Person key={b.name} name={b.name} role={b.role} bio={b.background} />
            ))}
          </ul>
        </section>

        <section aria-labelledby="adv-h">
          <H2 id="adv-h">Advisory group</H2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink">
            {ABOUT.advisoryGroup.description} There are {ABOUT.advisoryGroup.memberCount} members.
            They meet {ABOUT.advisoryGroup.meets}, and are paid for their time.
          </p>
          <p className="mt-3 text-lg">
            Want to join?{" "}
            <Link href="/contact?topic=general" className={link}>
              Contact us
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
