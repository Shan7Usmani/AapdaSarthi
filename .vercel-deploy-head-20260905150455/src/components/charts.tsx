"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  BarChart,
  Bar,
} from "recharts";
import { useLiveStats } from "@/lib/live-stats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNum } from "@/lib/utils";

export function RiskTrendChart() {
  const live = useLiveStats();
  const data = live.daily;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Live SOS Trend</CardTitle>
        <span className="font-mono text-[10px] text-muted">
          signals received · last 7 days
        </span>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, (dataMax: number) => Math.max(4, Math.ceil(dataMax * 1.2))]}
            />
            <RTooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: "#0f172a" }}
              formatter={(v) => [`${v ?? 0}`, "Signals"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#0284c7"
              strokeWidth={2}
              fill="url(#riskGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DistrictImpactChart() {
  const live = useLiveStats();
  const data = [...live.clusters]
    .sort((a, b) => b.people - a.people || b.count - a.count)
    .slice(0, 8)
    .map((c) => ({ name: c.label, affected: Math.max(c.people, c.count) }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>At-Risk Zones by People</CardTitle>
        <span className="font-mono text-[10px] text-muted">people in open signals</span>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: -4, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={72}
              tick={{ fill: "#64748b", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <RTooltip
              cursor={{ fill: "rgba(2,132,199,0.06)" }}
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: "#0f172a" }}
              formatter={(v) => [formatNum(Number(v ?? 0)), "People"]}
            />
            <Bar dataKey="affected" fill="#2563eb" radius={[0, 3, 3, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
