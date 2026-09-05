"use client";

import { useMemo } from "react";
import { MessageSquareText, Smartphone } from "lucide-react";
import { useSosStore } from "@/store/sos-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn, timeAgo } from "@/lib/utils";

const STAGE_CHIP = {
  ack: { label: "ACK", cls: "text-cyan border-cyan/30 bg-cyan/10" },
  claimed: { label: "TAKING CONTROL", cls: "text-warn border-warn/30 bg-warn/10" },
  reached: { label: "ON SITE", cls: "text-cyan border-cyan/30 bg-cyan/10" },
  delivered: { label: "DELIVERED", cls: "text-safe border-safe/30 bg-safe/10" },
} as const;

/**
 * HQ visibility of every confirmation the platform sends back to the citizens
 * (fired automatically on ack / take-control / on-site / delivered). The SMS
 * is SIMULATED until a real gateway is configured — the number targeted is
 * always the citizen's own, i.e. the number the SOS originated from.
 */
export function CitizenMessages() {
  const sos = useSosStore((s) => s.sos);

  const all = useMemo(
    () =>
      sos
        .flatMap((s) => s.citizenMsgs ?? [])
        .filter((m) => m && typeof m.at === "string")
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 8),
    [sos]
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <MessageSquareText className="h-3.5 w-3.5 text-cyan" /> Citizen notifications
        </CardTitle>
        <span className="flex items-center gap-1 font-mono text-[9px] text-muted">
          <Smartphone className="h-2.5 w-2.5" /> {all.length} SMS sent · to the SOS sender
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {all.length === 0 ? (
          <p className="rounded-md border border-dashed border-border-strong px-3 py-4 text-center text-[11px] text-muted">
            Confirmations fire automatically when a rescuer takes control of a signal.
          </p>
        ) : (
          all.map((m) => {
            const st = STAGE_CHIP[m.stage];
            return (
              <div key={m.id} className="rounded-md border border-border bg-panel-2/50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[9px] text-foreground">
                    {m.to}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 font-mono text-[8px] text-muted">
                    {timeAgo(m.at)}
                    <span className="rounded border border-border-strong px-1 py-px text-[7px]">
                      SIMULATED
                    </span>
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded px-1 py-px font-mono text-[8px] uppercase tracking-wider",
                      st.cls
                    )}
                  >
                    {st.label}
                  </span>
                  <span className="truncate text-[10px] text-muted">→ {m.citizenName}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground/90">{m.text}</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}