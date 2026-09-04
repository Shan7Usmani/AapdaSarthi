"use client";

import { BrainCircuit, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useDashboard } from "@/store/dashboard-store";
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
  const { scenario, selectedDistrict, setSelectedDistrict } = useDashboard();
  const live = useLiveStats();

  // Live mode: risk zones derived from actual open SOS signals. Fall back to
  // the demo scenario districts only when there are no live signals at all.
  const liveMode = live.openCount > 0;
  const zones = liveMode
    ? live.clusters.map((c) => ({
        name: c.label,
        severity: c.risk as "CRITICAL" | "HIGH" | "MODERATE" | "LOW",
        riskScore: Math.min(99, c.count * 15 + c.people),
        affected: c.people || c.count,
        trend: "rising" as const,
        live: true,
      }))
    : scenario.districts.map((d) => ({ ...d, live: false }));

  const sorted = [...zones].sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
  const critical = zones.filter((d) => d.severity === "CRITICAL").length;
  const high = zones.filter((d) => d.severity === "HIGH").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <BrainCircuit className="h-3.5 w-3.5 text-cyan" /> AI Risk Prediction
        </CardTitle>
        <Badge severity={critical > 0 ? "CRITICAL" : high > 0 ? "HIGH" : "MODERATE"}>
          {critical} Critical · {high} High
        </Badge>
      </CardHeader>
      <CardContent className="space-y-1.5 p-2.5">
        <div className="rounded border border-cyan/25 bg-cyan/5 px-3 py-2 font-mono text-[11px] leading-relaxed text-cyan/90">
          <span className="text-muted">» AI verdict:</span>{" "}
          {liveMode ? (
            <>
              {live.openCount} live open signal
              {live.openCount === 1 ? "" : "s"} across {live.clusters.length} risk zone
              {live.clusters.length === 1 ? "" : "s"} ·{" "}
              <span className="text-danger font-semibold">
                {critical > 0 ? "CRITICAL" : "HIGH"}
              </span>{" "}
              priority zones now.
            </>
          ) : (
            <>
              {critical} district
              {critical > 1 ? "s" : ""} at{" "}
              <span className="text-danger font-semibold">
                {critical > 0 ? "CRITICAL" : "HIGH"}
              </span>{" "}
              risk in next 48h based on rainfall + river-level telemetry.
            </>
          )}
        </div>

        <div className="space-y-1">
          {sorted.slice(0, 12).map((d) => {
            const active = selectedDistrict === d.name;
            const Trend =
              d.trend === "rising" ? TrendingUp : d.trend === "falling" ? TrendingDown : Minus;
            return (
              <button
                key={d.name}
                onClick={() => setSelectedDistrict(active ? null : d.name)}
                className={cn(
                  "group flex w-full items-center gap-2 rounded border px-2.5 py-1.5 text-left transition-colors cursor-pointer",
                  active
                    ? "border-cyan/50 bg-cyan/10"
                    : "border-border hover:border-border-strong hover:bg-panel-2"
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: severityColor[d.severity] }}
                />
                <span className="flex-1 truncate text-[12px] text-foreground">{d.name}</span>
                <Trend
                  className={cn(
                    "h-3 w-3 shrink-0",
                    d.trend === "rising"
                      ? "text-danger"
                      : d.trend === "falling"
                        ? "text-safe"
                        : "text-muted"
                  )}
                />
                <span className="font-mono text-[11px] text-muted">
                  {formatNum(d.affected)}
                </span>
                <span className="font-mono text-[11px] font-semibold text-foreground w-7 text-right">
                  {d.riskScore}
                </span>
                <ChevronRight className="h-3 w-3 text-muted opacity-0 group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
