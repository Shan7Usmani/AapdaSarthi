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
  MapPin,
  Truck,
  Utensils,
} from "lucide-react";
import { useLiveStats } from "@/lib/live-stats";
import { useSosStore, type ResourceRequest } from "@/store/sos-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";

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

function updatedStamp(item: { timestamp: string; updatedAt?: string }) {
  return item.updatedAt || item.timestamp;
}

const REQUEST_STATUS = {
  pending: { cls: "text-warn border-warn/40 bg-warn/10", label: "pending" },
  dispatched: { cls: "text-cyan border-cyan/40 bg-cyan/10", label: "dispatched" },
  received: { cls: "text-[#ffb02e] border-[rgba(255,176,46,0.3)] bg-[rgba(255,176,46,0.1)]", label: "received" },
  allocated: { cls: "text-safe border-safe/40 bg-safe/10", label: "allocated" },
} as const;

function FieldRequestCard({ r, onDispatch }: { r: ResourceRequest; onDispatch: (id: string) => void }) {
  const status = r.status === "fulfilled" ? "allocated" : r.status;
  const meta = REQUEST_STATUS[status as keyof typeof REQUEST_STATUS] ?? REQUEST_STATUS.pending;
  const items = [
    { label: "Medkits", value: r.medkits, icon: Stethoscope },
    { label: "Food kits", value: r.foodkits, icon: Utensils },
    { label: "Transports", value: r.transports, icon: Truck },
  ];
  return (
    <div className="rounded-md border border-border bg-panel-2/60 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[12px] font-medium">{r.rescuerName}</span>
        <Badge className={cn("!text-[9px]", meta.cls)}>{meta.label}</Badge>
      </div>
      {r.locationLabel && (
        <div className="mt-0.5 flex items-center gap-1 font-mono text-[9px] text-muted">
          <MapPin className="h-2.5 w-2.5" /> {r.locationLabel}
        </div>
      )}
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="flex items-center gap-1 rounded border border-border bg-[rgba(255,255,255,0.04)] px-1.5 py-1">
              <Icon className="h-3 w-3 text-cyan" />
              <div className="leading-none">
                <div className="font-mono text-[11px] font-bold text-foreground">{it.value}</div>
                <div className="font-mono text-[8px] uppercase text-muted">{it.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="font-mono text-[9px] text-muted">
          <Clock3 className="mr-1 inline h-2.5 w-2.5" />
          {timeAgo(updatedStamp(r))}
        </span>
        {status === "pending" && (
          <Button
            variant="primary"
            size="sm"
            className="!h-6 !text-[10px]"
            onClick={() => onDispatch(r.id)}
          >
            <Package className="h-3 w-3" /> Dispatch resources
          </Button>
        )}
      </div>
    </div>
  );
}

export function ResourcePanel() {
  const live = useLiveStats();
  const { requests, dispatchRequest } = useSosStore();

  // Live field resources + online teams derived from the real request store.
  const liveMode = live.pendingCount > 0 || live.fulfilledCount > 0 || live.onlineCount > 0;

  const activeRequests = requests
    .filter(
      (r) =>
        r && typeof r.timestamp === "string" && (r.status === "pending" || r.status === "dispatched" || r.status === "received")
    )
    .sort((a, b) => updatedStamp(b).localeCompare(updatedStamp(a)));

  if (liveMode) {
    const resources = [
      { icon: "rescue", label: "Teams on ground", ward: "online & dispatched", quantity: live.onlineCount, unit: "teams", status: "dispatched" },
      { icon: "ratios" as string, label: "Pending requests", ward: "awaiting allocation", quantity: live.pendingCount, unit: "reqs", status: "requested" },
      { icon: "med", label: "Medkits requested", ward: "pending requests", quantity: live.totalMedkits, unit: "kits", status: "requested" },
      { icon: "rations", label: "Food kits requested", ward: "pending requests", quantity: live.totalFoodkits, unit: "kits", status: "requested" },
      { icon: "boat", label: "Transports requested", ward: "pending requests", quantity: live.totalTransports, unit: "units", status: "requested" },
      { icon: "shelter", label: "Allocated resources", ward: "people reached", quantity: live.peopleRescued, unit: "people", status: "ready" },
    ];
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Resource Allocation Engine <Radio className="h-3.5 w-3.5 text-cyan" />
          </CardTitle>
          <span className="font-mono text-[10px] text-muted">live field requests · {live.fulfilledCount} allocated</span>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {resources.map((r) => {
              const meta = statusMeta[r.status as keyof typeof statusMeta];
              return (
                <div
                  key={r.label}
                  className="flex items-center gap-3 rounded-md border border-border bg-panel-2/60 px-3 py-2.5"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[rgba(0,180,216,0.1)] border border-[rgba(0,180,216,0.3)] text-cyan">
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
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
                Field resource requests
              </span>
              <span className="flex items-center gap-1 font-mono text-[9px] text-muted">
                <Clock3 className="h-2.5 w-2.5" /> {live.pendingCount} pending
              </span>
            </div>
            {activeRequests.length === 0 ? (
              <div className="rounded-md border border-dashed border-[rgba(255,255,255,0.1)] px-3 py-4 text-center text-[11px] text-muted">
                Rescuers request medkits / food / transport here after taking control.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {activeRequests.map((r) => (
                  <FieldRequestCard key={r.id} r={r} onDispatch={dispatchRequest} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Resource Allocation Engine <Radio className="h-3.5 w-3.5 text-cyan" />
        </CardTitle>
        <span className="font-mono text-[10px] text-muted">live field requests</span>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <ShieldAlert className="h-6 w-6 text-muted/60" />
        <div className="font-mono text-[12px] text-muted">No live field activity yet</div>
        <div className="font-mono text-[10px] text-muted">
          Waiting for resource requests from rescue teams…
        </div>
      </CardContent>
    </Card>
  );
}
