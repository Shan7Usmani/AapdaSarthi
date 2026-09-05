import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",

  cacheOnNavigation: true,

  additionalPrecacheEntries: [
    // Precache every key route so the whole app — citizen SOS, rescuer
    // dispatch, HQ board, landing — keeps working offline, not just /citizen.
    { url: "/", revision: "1" },
    { url: "/citizen", revision: "1" },
    { url: "/rescuer", revision: "1" },
    { url: "/hq", revision: "1" },
    // Branded offline fallback used by navigateFallback.
    { url: "/offline", revision: "1" },
  ],
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["@swytchcode/runtime"],
};

export default withSerwist(nextConfig);