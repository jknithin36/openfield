// Class names that dress a shadcn Button in a tactile finish: a top-to-bottom
// gradient, a light inner edge, a soft drop shadow and a faint grain
// (public/noise.svg) laid over the top.
//
// Adapted from jknithin36/nithin_ (components/portfolio/tactile-button.ts).
// Differences: the grain layer is clipped with `rounded-[inherit]` instead of
// `overflow-hidden`, so `extend-touch-target`'s larger tap area isn't clipped;
// focus rings stay amber (theme --ring) for accessibility.
export const tactileBase =
  "relative isolate rounded-lg px-3.5 text-sm before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[url(/noise.svg)] before:bg-[length:160px] before:opacity-[0.12] before:mix-blend-overlay focus-visible:ring-3 focus-visible:ring-ring";

export const tactile = {
  // Navy, matching the donate bar at the top of the page.
  primary:
    "border-brand-hover bg-linear-to-b from-brand-light to-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_color-mix(in_oklab,var(--brand)_35%,transparent),0_3px_8px_color-mix(in_oklab,var(--brand)_18%,transparent)] hover:to-brand-hover hover:text-white",
  secondary:
    "border-black/10 bg-linear-to-b from-white to-neutral-50 text-neutral-900 shadow-[inset_0_-1px_0_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.06)] hover:to-neutral-100 hover:text-neutral-900",
};
