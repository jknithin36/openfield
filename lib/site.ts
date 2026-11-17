// Site-wide settings for SEO. Set NEXT_PUBLIC_SITE_URL in production; on
// Vercel the production URL is used automatically.
export const SITE_NAME = "Openfield";
export const SITE_DESCRIPTION =
  "Free courses, devices to borrow, events and plain-language guides for people with disabilities, their families, and the teachers and employers who support them.";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");
