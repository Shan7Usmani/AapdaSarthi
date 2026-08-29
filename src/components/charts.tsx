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
import { useDashboard } from "@/store/dashboard-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNum } from "@/lib/utils";

export function RiskTrendChart() {
  const { scenario } = useDashboard();
  const data = scenario.timeline;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>District Risk Index Trend</CardTitle>
        <span className="font-mono text-[10px] text-muted">avg · last 6 days</span>
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
              domain={[0, 100]}
            />
            <RTooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: "#0f172a" }}
              formatter={(v) => [`Risk ${v ?? 0}`, "Index"]}
            />
            <Area
              type="monotone"
              dataKey="riskIndex"
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
  const { scenario } = useDashboard();
  const data = [...scenario.districts]
    .sort((a, b) => b.affected - a.affected)
    .slice(0, 8)
    .map((d) => ({ name: d.name, affected: d.affected }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Displaced Districts</CardTitle>
        <span className="font-mono text-[10px] text-muted">population</span>
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
              formatter={(v) => [formatNum(Number(v ?? 0)), "Displaced"]}
            />
            <Bar dataKey="affected" fill="#2563eb" radius={[0, 3, 3, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
