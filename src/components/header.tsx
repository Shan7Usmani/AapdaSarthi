"use client";

import { useEffect, useState } from "react";
import { Activity, Radio, Waves } from "lucide-react";
import { useDashboard } from "@/store/dashboard-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const { liveMode, toggleLive } = useDashboard();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
      setNow(new Date());
    });
    const t = setInterval(() => {
      setNow(new Date());
      setUptime((u) => u + 1);
    }, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, []);

  const iso = now ? now.toISOString().slice(0, 19).replace("T", " ") : "--:--:--";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan text-white shadow-sm">
            <Waves className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-foreground">
              AAPDA SAARTHI
              <span className="ml-2 hidden sm:inline font-mono text-[10px] font-normal text-muted">
                /ɑːpədaː sɑːrthiː/
              </span>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan">
              Disaster Response Command Center
            </div>
          </div>
        </div>

        <div className="mx-2 hidden md:block h-8 w-px bg-slate-200" />

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-[12px] text-muted shadow-sm">
            <Radio className="h-3.5 w-3.5 text-cyan" />
            <span className="font-medium text-foreground">{mounted ? iso : "--:--:--"}</span>
            <span className="text-cyan">UTC</span>
          </div>

          <Button
            variant={liveMode ? "primary" : "outline"}
            size="sm"
            onClick={toggleLive}
            className="uppercase"
          >
            <Activity className={cn("h-3.5 w-3.5", liveMode && "blip")} />
            {liveMode ? "LIVE FEED" : "PAUSED"}
          </Button>
        </div>
      </div>

      {/* status ticker */}
      <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap border-t border-slate-100 bg-slate-50/80 px-4 py-1 text-[11px] font-medium text-slate-500">
        <span className="flex items-center gap-1.5 text-red-600">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-red-500" />
          ACTIVE ALERT
        </span>
        <span className="text-cyan">RISK ENGINE: ONLINE</span>
        <span className="text-emerald-600">GEMINI: CONNECTED</span>
        <span className="text-orange-600">OPEN-METEO: 12 feeds</span>
        <span className="text-slate-400">INDIA-WRIS: synced 6m ago</span>
        <span className="hidden md:inline text-slate-400">UPTIME {uptime}s</span>
        <span className="hidden md:inline text-slate-400">DECODE SIH 2026 · BHARAT SHAKTI PS3</span>
      </div>
    </header>
  );
}
