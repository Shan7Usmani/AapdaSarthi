"use client";

import {
  Ship,
  Stethoscope,
  Package,
  Home,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Radio,
  Users,
} from "lucide-react";
import { useDashboard } from "@/store/dashboard-store";
import { useLiveStats } from "@/lib/live-stats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  boat: <Ship className="h-4 w-4" />,
  med: <Stethoscope className="h-4 w-4" />,
  rations: <Package className="h-4 w-4" />,
  shelter: <Home className="h-4 w-4" />,
  rescue: <ShieldAlert className="h-4 w-4" />,
  power: <Zap className="h-4 w-4" />,
};

const statusMeta = {
  dispatched: { label: "Dispatched", icon: <CheckCircle2 className="h-3 w-3" />, cls: "text-safe border-safe/40 bg-safe/10" },
  ready: { label: "Ready", icon: <Clock3 className="h-3 w-3" />, cls: "text-caution border-caution/40 bg-caution/10" },
  requested: { label: "Requested", icon: <HelpCircle className="h-3 w-3" />, cls: "text-warn border-warn/40 bg-warn/10" },
};

export function ResourcePanel() {
  const { scenario } = useDashboard();
  const live = useLiveStats();

  // Live mode: show real field resource requests + online teams. Fall back to
  // the demo scenario resource plan only when there are no live requests.
  const liveMode = live.pendingCount > 0 || live.fulfilledCount > 0 || live.onlineCount > 0;

  if (liveMode) {
    const resources = [
      { icon: "rescue", label: "Teams on ground", ward: "online & dispatched", quantity: live.onlineCount, unit: "teams", status: "dispatched" },
      { icon: "ratios" as string, label: "Pending requests", ward: "awaiting allocation", quantity: live.pendingCount, unit: "reqs", status: "requested" },
      { icon: "med", label: "Medkits requested", ward: "pending requests", quantity: live.totalMedkits, unit: "kits", status: "requested" },
      { icon: "rations", label: "Food kits requested", ward: "pending requests", quantity: live.totalFoodkits, unit: "kits", status: "requested" },
      { icon: "boat", label: "Transports requested", ward: "pending requests", quantity: live.totalTransports, unit: "units", status: "requested" },
      { icon: "shelter", label: "Fulfilled requests", ward: "people rescued", quantity: live.peopleRescued, unit: "people", status: "ready" },
    ];
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Resource Allocation Engine <Radio className="h-3.5 w-3.5 text-cyan" />
          </CardTitle>
          <span className="font-mono text-[10px] text-muted">live field requests · {live.fulfilledCount} fulfilled</span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {resources.map((r) => {
            const meta = statusMeta[r.status as keyof typeof statusMeta];
            return (
              <div
                key={r.label}
                className="flex items-center gap-3 rounded-md border border-border bg-panel-2/60 px-3 py-2.5"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-cyan/10 border border-cyan/30 text-cyan">
                  {iconMap[r.icon] ?? <Users className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-medium text-foreground">{r.label}</div>
                  <div className="truncate font-mono text-[10px] text-muted">{r.ward}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-cyan">{r.quantity.toLocaleString("en-IN")}</div>
                  <div className="font-mono text-[9px] uppercase text-muted">{r.unit}</div>
                </div>
                <Badge className={cn("!text-[9px]", meta.cls)}>{meta.label}</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Resource Allocation Engine</CardTitle>
        <span className="font-mono text-[10px] text-muted">rule-based + AI</span>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {scenario.resources.map((r) => {
          const meta = statusMeta[r.status as keyof typeof statusMeta] ?? statusMeta.ready;
          return (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-md border border-border bg-panel-2/60 px-3 py-2.5"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-cyan/10 border border-cyan/30 text-cyan">
                {iconMap[r.icon]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-foreground">{r.label}</div>
                <div className="truncate font-mono text-[10px] text-muted">{r.ward}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-cyan">
                  {r.quantity.toLocaleString("en-IN")}
                </div>
                <div className="font-mono text-[9px] uppercase text-muted">{r.unit}</div>
              </div>
              <Badge className={cn("!text-[9px]", meta.cls)}>{meta.label}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
