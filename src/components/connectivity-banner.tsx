"use client";

import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnline, useSimulatingOffline } from "@/store/connectivity";

/**
 * Global connectivity banner mounted once in the root layout.
 *
 * Renders a slim, in-flow status bar at the very top of the app — but ONLY
 * when the user is offline (or the offline demo is active), so normal browsing
 * is never cluttered. It reassures the citizen that SOS are saved locally and
 * will auto-transmit when connectivity returns, and reminds them of the SMS
 * fallback for "signal but no data" situations. Works offline because the app
 * shell is cached by the service worker (Serwist PWA).
 */
export function ConnectivityBanner() {
  const online = useOnline();
  const simulating = useSimulatingOffline();

  if (online && !simulating) return null;

  return (
    <div
      className={cn(
        "relative z-30 flex items-center justify-center gap-2 bg-amber-500/95 px-4 py-2 text-center text-[12px] font-semibold text-slate-900"
      )}
      role="status"
      aria-live="polite"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span className="max-w-3xl">
        {simulating ? "Demo: simulating offline. " : "You're offline. "}
        Your SOS is saved on this device and will auto-transmit the moment
        signal returns. No data but have signal? Use the SMS fallback.
      </span>
    </div>
  );
}
