"use client";

import { useMemo } from "react";
import { MessageSquareText, Smartphone } from "lucide-react";
import { useSosStore } from "@/store/sos-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";

const STAGE_CHIP = {
  ack: { label: "ACKNOWLEDGED", cls: "text-cyan border-cyan/30 bg-cyan/10" },
  claimed: { label: "TAKING CONTROL", cls: "text-warn border-warn/30 bg-warn/10" },
  reached: { label: "TEAM ON SITE", cls: "text-cyan border-cyan/30 bg-cyan/10" },
  delivered: { label: "DELIVERED", cls: "text-safe border-safe/30 bg-safe/10" },
} as const;

/**
 * The citizen's own message thread. Filters the shared send-back stream to
 * the exact number this device raised an SOS from (`/citizen` + a sent SOS),
 * so it mirrors what that handset receives — the same phone on the other end.
 */
export function CitizenInbox() {
  const sos = useSosStore((s) => s.sos);
  const myDigits = useMemo(() => {
    if (typeof window === "undefined") return "";
    return (localStorage.getItem("aapda-saarthi-my-phone") || "").replace(/\D/g, "").slice(-10);
  }, []);

  const mine = useMemo(() => {
    if (!myDigits) return [];
    return sos
      .flatMap((s) => s.citizenMsgs ?? [])
      .filter((m) => m.to.replace(/\D/g, "").slice(-10) === myDigits)
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [sos, myDigits]);

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <MessageSquareText className="h-3.5 w-3.5 text-cyan" /> Messages from command centre
        </CardTitle>
        {myDigits && (
          <Badge className="!text-[9px] font-mono text-cyan border-cyan/40 bg-cyan/10">
            <Smartphone className="h-2.5 w-2.5" /> to {formatPhone(myDigits)}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {!myDigits ? (
          <p className="rounded-md border border-dashed border-border-strong px-3 py-4 text-center text-[11px] text-muted">
            Send an SOS with your contact number — every update from the rescuer team appears here, sent to{" "}
            <span className="text-foreground">the exact number you signalled from</span>.
          </p>
        ) : mine.length === 0 ? (
          <p className="rounded-md border border-dashed border-border-strong px-3 py-4 text-center text-[11px] text-muted">
            No updates yet for this number. When a rescuer takes your request, the SMS confirmation lands here.
          </p>
        ) : (
          mine.map((m) => {
            const st = STAGE_CHIP[m.stage];
            return (
              <div key={m.id} className="rounded-md border border-border bg-panel-2/50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("rounded px-1 py-px font-mono text-[8px] uppercase tracking-wider", st.cls)}>
                    {st.label}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[8px] text-muted">
                    {timeAgo(m.at)}
                    <span className="rounded border border-border-strong px-1 py-px text-[7px] text-muted">
                      SMS · SIMULATED
                    </span>
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-foreground/90">{m.text}</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function formatPhone(digits: string) {
  const t = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return t.length === 10 ? `+91 ${t.slice(0, 5)} ${t.slice(5)}` : `+91 ${t}`;
}