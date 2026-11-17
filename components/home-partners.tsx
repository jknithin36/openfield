import { HugeiconsIcon } from "@hugeicons/react";
import { Agreement01Icon, BankIcon, MapsIcon } from "@hugeicons/core-free-icons";

// PLACEHOLDER PARTNERS — fictional, government-style dummy logos.
// Replace with real partner logos (with permission) before launch.
const PARTNERS = [
  {
    name: "National Inclusion Leadership Council",
    lines: ["National", "Inclusion", "Leadership", "Council"],
    Icon: BankIcon,
    bg: "bg-[#24476b]",
  },
  {
    name: "Riverbend Interagency Work Group on Disability",
    lines: ["Riverbend", "Interagency Work Group", "on Disability"],
    Icon: MapsIcon,
    bg: "bg-[#9e2f36]",
  },
  {
    name: "Riverbend Department of Education",
    lines: ["Riverbend", "Department of", "Education"],
    Icon: Agreement01Icon,
    bg: "bg-[#2f5a46]",
  },
] as const;

export function HomePartners() {
  return (
    <section
      aria-labelledby="partners-heading"
      className="mx-auto w-full max-w-[1400px] px-6 pb-16 lg:px-8 lg:pb-20"
    >
      <h2
        id="partners-heading"
        className="text-center text-2xl leading-tight font-medium tracking-[-0.03em] text-ink sm:text-[28px]"
      >
        Supported by
      </h2>

      <ul className="mx-auto mt-8 grid max-w-5xl gap-5 sm:grid-cols-3">
        {PARTNERS.map(({ name, lines, Icon, bg }) => (
          <li key={name}>
            {/* Logo tile: role="img" + label so it reads as one logo */}
            <div
              role="img"
              aria-label={name}
              className={`${bg} flex aspect-[16/10] items-center justify-center p-3`}
            >
              <div className="flex size-full items-center justify-center gap-3 border-2 border-white/90 px-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white">
                  <HugeiconsIcon
                    icon={Icon}
                    strokeWidth={2}
                    className="size-6"
                    color="var(--brand)"
                    aria-hidden="true"
                  />
                </span>
                <span className="flex flex-col text-[15px] leading-tight font-bold text-white">
                  {lines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
