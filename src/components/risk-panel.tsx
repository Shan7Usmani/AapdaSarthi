"use client";

import { BrainCircuit, ChevronRight, TrendingUp, TrendingDown, Minus, RadioTower } from "lucide-react";
import { useLiveStats } from "@/lib/live-stats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { severityOrder, cn, formatNum } from "@/lib/utils";

const severityColor: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MODERATE: "#eab308",
  LOW: "#22c55e",
};

export function RiskPanel() {
  const live = useLiveStats();

  // Live risk zones derived directly from actual open SOS field signals.
  const zones = live.clusters.map((c) => ({
    name: c.label,
    severity: c.risk as "CRITICAL" | "HIGH" | "MODERATE" | "LOW",
    riskScore: Math.min(99, c.count * 15 + c.people),
    affected: c.people || c.count,
    trend: "rising" as const,
    live: true,
  }));

  const sorted = [...zones].sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
  const critical = zones.filter((d) => d.severity === "CRITICAL").length;
  const high = zones.filter((d) => d.severity === "HIGH").length;
  const liveMode = live.openCount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <BrainCircuit className="h-3.5 w-3.5 text-cyan" /> AI Risk Prediction
        </CardTitle>
        {liveMode && (
          <Badge severity={critical > 0 ? "CRITICAL" : high > 0 ? "HIGH" : "MODERATE"}>
            {critical} Critical · {high} High
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-1.5 p-2.5">
        {liveMode ? (
          <>
            <div className="rounded border border-cyan/25 bg-cyan/5 px-3 py-2 font-mono text-[11px] leading-relaxed text-cyan/90">
              <span className="text-muted">» AI verdict:</span>{" "}
              {live.openCount} live open signal
              {live.openCount === 1 ? "" : "s"} across {live.clusters.length} risk zone
              {live.clusters.length === 1 ? "" : "s"} ·{" "}
              <span className="text-danger font-semibold">
                {critical > 0 ? "CRITICAL" : "HIGH"}
              </span>{" "}
              priority zones now.
            </div>

            <div className="space-y-1">
              {sorted.slice(0, 12).map((d) => {
                const Trend =
                  d.trend === "rising" ? TrendingUp : d.trend === "falling" ? TrendingDown : Minus;
                return (
                  <div
                    key={d.name}
                    className="flex w-full items-center gap-2 rounded border border-border px-2.5 py-1.5"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ background: severityColor[d.severity] }}
                    />
                    <span className="flex-1 truncate text-[12px] text-foreground">{d.name}</span>
                    <Trend className={cn("h-3 w-3 shrink-0 text-danger")} />
                    <span className="font-mono text-[11px] text-muted">
                      {formatNum(d.affected)}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-foreground w-7 text-right">
                      {d.riskScore}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted opacity-0" />
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <RadioTower className="h-6 w-6 text-muted/60" />
            <div className="font-mono text-[12px] text-muted">
              No live field signals yet
            </div>
            <div className="font-mono text-[10px] text-muted">
              Awaiting SOS data from citizen &amp; rescuer devices…
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
