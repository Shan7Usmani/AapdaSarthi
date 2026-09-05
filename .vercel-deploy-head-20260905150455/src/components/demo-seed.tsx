"use client";

import { useEffect } from "react";
import { useSosStore } from "@/store/sos-store";

/**
 * Seeds the demo with realistic SOS + resource-request data so judges see a
 * populated command centre instantly (runs once, only when the store is empty
 * — never overwrites user-generated signals).
 */
export function DemoSeed() {
  useEffect(() => {
    useSosStore.getState().seedOnce();
  }, []);
  return null;
}
