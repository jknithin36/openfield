import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Library pages moved under /dashboard/library — old URLs still work
  // (the query string, e.g. ?status=…&id=…, is kept).
  async redirects() {
    const accommodations = {
      source: "/dashboard/accommodations",
      destination: "/dashboard/events/accommodations",
      permanent: true,
    };
    const lifeAfterSchool = {
      source: "/centers/life-after-school",
      destination: "/centers/life-transitions",
      permanent: true,
    };
    const login = { source: "/login", destination: "/sign-in", permanent: true };
    return [
      accommodations,
      lifeAfterSchool,
      login,
      ...["requests", "to-ship", "on-loan", "returns", "catalog"].flatMap((page) => [
        {
          source: `/dashboard/${page}`,
          destination: `/dashboard/library/${page}`,
          permanent: true,
        },
        {
          source: `/dashboard/${page}/:path+`,
          destination: `/dashboard/library/${page}/:path+`,
          permanent: true,
        },
      ]),
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
