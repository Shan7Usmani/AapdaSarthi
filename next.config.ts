import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",

  cacheOnNavigation: true,

  additionalPrecacheEntries: [
    {
      url: "/citizen",
      revision: "1",
    },
  ],
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);