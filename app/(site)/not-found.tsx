import Link from "next/link";

const link =
  "rounded-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 outline-none hover:decoration-brand focus-visible:ring-3 focus-visible:ring-ring";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-16 lg:py-24">
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-ink sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink">
        If you typed the web address, check it is correct.
      </p>
      <p className="mt-2 text-lg leading-relaxed text-ink">
        If you pasted the web address, check you copied the whole address.
      </p>
      <p className="mt-6 text-lg text-ink">
        You can{" "}
        <Link href="/centers" className={link}>
          find help by topic
        </Link>
        ,{" "}
        <Link href="/library" className={link}>
          browse the library
        </Link>{" "}
        or{" "}
        <Link href="/contact" className={link}>
          contact us
        </Link>
        .
      </p>
    </div>
  );
}
