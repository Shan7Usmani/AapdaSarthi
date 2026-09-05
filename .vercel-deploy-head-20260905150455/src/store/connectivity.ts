"use client";

import { useSyncExternalStore } from "react";

type Listener = () => void;

/**
 * Lightweight external connectivity store shared across the app.
 *
 * Tracks the device's real online/offline state (via navigator.onLine and the
 * browser's online/offline events) so the offline-first SOS → local save →
 * SMS fallback → auto-sync-on-reconnect flow can work in genuine offline
 * conditions.
 *
 * Applications read the current state through useOnline().
 */

const listeners = new Set<Listener>();

let realOnline: boolean | null = null;

function computeReal(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

function emit() {
  for (const l of listeners) l();
}

function onBrowserChange() {
  realOnline = computeReal();
  emit();
}

if (typeof window !== "undefined") {
  realOnline = computeReal();
  window.addEventListener("online", onBrowserChange);
  window.addEventListener("offline", onBrowserChange);
}

/** Current effective online state. */
export function getEffectiveOnline(): boolean {
  return realOnline === null ? computeReal() : realOnline;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getEffectiveOnline, () => true);
}
