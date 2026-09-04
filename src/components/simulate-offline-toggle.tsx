"use client";

import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useOnline,
  useSimulatingOffline,
  setSimulatedOffline,
} from "@/store/connectivity";

/**
 * Discreet live-demo toggle (top-right, above the sticky nav) that lets the
 * pitch team flip the app into an "offline" simulation on stage.
 *
 * The toggle only overrides the *perceived* network state (see
 * `store/connectivity.ts`) so the offline-first SOS → local save → SMS
 * fallback → auto-sync-on-reconnect flow can be demonstrated without literally
 * disconnecting the demo machine.
 */
export function SimulateOfflineToggle() {
  const online = useOnline();
  const simulating = useSimulatingOffline();

  return (
    <button
      type="button"
      onClick={() => setSimulatedOffline(!simulating)}
      title={
        simulating
          ? "Stop offline simulation"
          : "Simulate offline (live demo)"
      }
      className={cn(
        "fixed right-4 top-16 z-[55] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm transition-colors cursor-pointer",
        simulating
          ? "border-amber-400 bg-amber-100 text-amber-800"
          : "border-slate-200 bg-white text-slate-500 hover:border-cyan hover:text-cyan"
      )}
    >
      {simulating ? (
        <>
          <WifiOff className="h-3.5 w-3.5" /> Simulated offline · ON
        </>
      ) : online ? (
        <>
          <Wifi className="h-3.5 w-3.5" /> Offline demo
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" /> Offline demo
        </>
      )}
    </button>
  );
}
