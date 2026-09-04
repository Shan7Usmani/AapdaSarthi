"use client";

import { useSyncExternalStore, useCallback } from "react";

type Listener = () => void;

/**
 * Lightweight external connectivity store shared across the app.
 *
 * Tracks the device's real online/offline state (via navigator.onLine and the
 * browser's online/offline events) plus an optional *simulated* override used
 * during the live pitch/demo to prove the offline-first flow without literally
 * cutting the network.
 *
 * Consumers read the "effective" online state through useOnline():
 *   - when the demo overlay is ON, effective = simulated value;
 *   - otherwise effective = the real navigator state.
 */

const listeners = new Set<Listener>();

let realOnline: boolean | null = null;

let simulatedOffline = false;

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

/** Effective online state after applying the demo override. */
export function getEffectiveOnline(): boolean {
  if (simulatedOffline) return false;
  return realOnline === null ? computeReal() : realOnline;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setSimulatedOffline(value: boolean) {
  const next = value;
  if (simulatedOffline === next) return;
  simulatedOffline = next;
  emit();
}

export function isSimulatingOffline(): boolean {
  return simulatedOffline;
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getEffectiveOnline, () => true);
}

export function useSimulatingOffline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => simulatedOffline,
    () => false
  );
}

/** Toggle the "simulate offline" demo overlay. */
export function useSimulateOfflineToggle() {
  return useCallback(() => {
    setSimulatedOffline(!simulatedOffline);
  }, []);
}
