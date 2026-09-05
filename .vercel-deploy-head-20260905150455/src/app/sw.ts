import { defaultCache } from "@serwist/next/worker";
import type {
  PrecacheEntry,
  SerwistGlobalConfig,
} from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope
    extends SerwistGlobalConfig {
    __SW_MANIFEST:
      | (PrecacheEntry | string)[]
      | undefined;
  }
}

// Serwist reads navigateFallback + allowlist from the worker global scope.
// Declared here (not via SerwistGlobalConfig) to keep the types self-contained.
interface OfflineGlobals {
  navigateFallback?: string;
  navigateFallbackAllowlist?: RegExp[];
}

declare const self: ServiceWorkerGlobalScope & OfflineGlobals;

// Serve the branded offline screen for any navigation that isn't precached and
// can't reach the network (e.g. first visit with no signal).
self.navigateFallback = "/offline";
self.navigateFallbackAllowlist = [/^\/.+$/];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,

  skipWaiting: true,
  clientsClaim: true,

  navigationPreload: true,

  runtimeCaching: defaultCache,
});

serwist.addEventListeners();