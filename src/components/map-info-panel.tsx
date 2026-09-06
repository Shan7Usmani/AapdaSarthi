"use client";

import { CloudRain } from "lucide-react";
import { BAND_META } from "@/lib/rainfall";
import { type RiskBand } from "@/lib/risk";
import type { MapInfoData } from "@/components/live-map";

const riskColor: Record<RiskBand, string> = {
  LOW: "#16a34a",
  MODERATE: "#eab308",
  HIGH: "#ea580c",
  CRITICAL: "#dc2626",
};

export function MapInfoPanel({ data }: { data: MapInfoData }) {
  const atRiskDistricts = data.riskPoints.filter(
    (d) =>
      d.severity === "CRITICAL" ||
      d.severity === "HIGH" ||
      d.severity === "MODERATE"
  );

  return (
    <div className="flex flex-col gap-3">
      {/* risk summary */}
      <div className="glass-2 rounded-xl px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
          Live Flood Risk · All India
        </div>
        <div className="mt-1.5 flex items-center gap-3 font-mono text-[11px]">
          <span className="text-danger">{data.critical} CRITICAL</span>
          <span className="text-warn">{data.high} HIGH</span>
          <span className="text-muted">districts</span>
        </div>
        <div className="mt-1 font-mono text-[11px]">
          <span className="text-muted">LIVE SOS:</span> {data.liveOpenCount} open ·{" "}
          {data.liveClaimedCount} in the field
        </div>
      </div>

      {/* at-risk district count */}
      <div className="glass-2 rounded-xl px-4 py-3 text-right">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          At-Risk Districts
        </div>
        <div className="font-mono text-2xl font-bold text-danger">
          {data.atRisk.toLocaleString("en-IN")}
        </div>
        <div className="font-mono text-[9px] text-muted">
          CRITICAL + HIGH · {data.totalOpenPeople.toLocaleString("en-IN")} people in open signals
        </div>
      </div>

      {/* rainfall */}
      <div className="glass-2 rounded-xl px-4 py-3">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-cyan">
          <CloudRain className="h-3 w-3" /> Rainfall
        </div>
        <div className="mt-1.5 font-mono text-[11px]">
          <span className="text-danger">{data.counts.high} heavy</span> ·{" "}
          <span className="text-warn">{data.counts.moderate} mod</span> ·{" "}
          <span className="text-safe">{data.counts.low} dry</span>
          {data.source === "seeded" && <span className="ml-2 text-muted">(cached)</span>}
        </div>
      </div>

      {/* AI verdict */}
      {data.riskSummary && (
        <div className="glass-2 rounded-xl px-4 py-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan">
            AI Risk Verdict
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-foreground/90">
            {data.riskSummary.summary}
          </p>
          <div className="mt-1 font-mono text-[8px] uppercase text-muted">
            live · {data.riskSummary.source}
          </div>
        </div>
      )}

      {/* at-risk district list */}
      {atRiskDistricts.length > 0 && (
        <div className="glass-2 rounded-xl">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-4 py-2.5">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
              At-Risk Districts
            </div>
            <div className="font-mono text-[8px] uppercase text-cyan">auto ✓</div>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            <ul className="divide-y divide-[rgba(255,255,255,0.04)]">
              {atRiskDistricts.slice(0, 12).map((d) => (
                <li key={d.name} className="flex items-center gap-2 px-4 py-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: riskColor[d.severity as RiskBand] ?? riskColor.LOW }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium text-foreground">
                      {d.name}
                    </span>
                    <span className="block font-mono text-[9px] text-muted">{d.state}</span>
                  </span>
                  <span
                    className="shrink-0 font-mono text-[10px] font-bold"
                    style={{ color: riskColor[d.severity as RiskBand] }}
                  >
                    {d.riskScore}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* legend */}
      <div className="glass-2 rounded-xl px-4 py-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted mb-2">
          Legend
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted">
            <span className="h-2 w-2 rounded-sm" style={{ background: riskColor.CRITICAL }} /> Critical
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted">
            <span className="h-2 w-2 rounded-sm" style={{ background: riskColor.HIGH }} /> High
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted">
            <span className="h-2 w-2 rounded-sm" style={{ background: riskColor.MODERATE }} /> Moderate
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted">
            <span className="h-2 w-2 rounded-full border-2 border-white" style={{ background: "#b91c1c" }} /> SOS
          </div>
          {(Object.keys(BAND_META) as Array<keyof typeof BAND_META>).map((b) => (
            <div key={b} className="flex items-center gap-1.5 font-mono text-[9px] text-muted">
              <span className="h-2 w-2 rounded-sm" style={{ background: BAND_META[b].color }} />
              {BAND_META[b].label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
