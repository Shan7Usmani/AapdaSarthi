"use client";

import {
  Siren,
  CheckCircle2,
  Clock3,
  MapPin,
  Users,
  Package,
  Stethoscope,
  Truck,
  Utensils,
  RotateCcw,
  Radio,
} from "lucide-react";
import { useSosStore, type ResourceRequest, type SosItem } from "@/store/sos-store";
import { SosUpdates } from "@/components/sos-updates";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";

const SOS_STATUS = {
  open: {
    cls: "border-danger/40 bg-danger/5",
    icon: "text-danger",
    dot: "bg-danger live-dot",
    label: "LIVE SOS",
    labelCls: "text-danger",
  },
  claimed: {
    cls: "border-warn/40 bg-warn/5",
    icon: "text-warn",
    dot: "bg-warn",
    label: "TAKEN CONTROL",
    labelCls: "text-warn",
  },
  reached: {
    cls: "border-cyan/40 bg-cyan/5",
    icon: "text-cyan",
    dot: "bg-cyan",
    label: "ON SITE",
    labelCls: "text-cyan",
  },
  delivered: {
    cls: "border-border bg-panel-2/60 opacity-70",
    icon: "text-muted",
    dot: "bg-muted",
    label: "DELIVERED",
    labelCls: "text-muted",
  },
} as const;

function updatedStamp(item: { timestamp: string; updatedAt?: string }) {
  return item.updatedAt || item.timestamp;
}

function SosCard({ s, onUpdate }: { s: SosItem; onUpdate: (id: string, text: string) => void }) {
  const st = SOS_STATUS[s.status] ?? SOS_STATUS.open;
  return (
    <div className={cn("flex items-start gap-2.5 rounded-md border px-3 py-2", st.cls)}>
      <div className="mt-0.5 flex flex-col items-center gap-1">
        <Siren className={cn("h-4 w-4", st.icon)} />
        <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[12px] font-medium">{s.citizenName}</span>
          <span className="shrink-0 font-mono text-[9px] text-muted">
            {timeAgo(updatedStamp(s))}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px]">
          <span className={cn("uppercase tracking-wider", st.labelCls)}>{st.label}</span>
          {s.status !== "open" && s.rescuerName && (
            <span className="truncate text-muted">· {s.rescuerName}</span>
          )}
          {s.status === "reached" && s.reachedAt && (
            <span className="text-muted">· reached {timeAgo(s.reachedAt)}</span>
          )}
          {s.status === "delivered" && s.deliveredAt && (
            <span className="text-muted">· {timeAgo(s.deliveredAt)}</span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{s.message}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[9px] text-muted">
          <span className="flex items-center gap-1">
            <Users className="h-2.5 w-2.5" /> {s.peopleCount}
          </span>
          {s.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {s.location.lat.toFixed(3)}, {s.location.lng.toFixed(3)}
            </span>
          )}
          {s.status === "delivered" && (
            <span className="flex items-center gap-1 text-safe">
              <CheckCircle2 className="h-2.5 w-2.5" /> item delivered
            </span>
          )}
          {s.nearestRescuerName && !s.rescuerName && (
            <span className="flex items-center gap-1 text-cyan">
              routed → {s.nearestRescuerName}
              {s.nearestDistanceKm !== undefined ? ` · ${s.nearestDistanceKm}km` : ""}
            </span>
          )}
        </div>
        <div className="mt-1.5">
          <SosUpdates
            sos={s}
            onPost={(text) => onUpdate(s.id, text)}
            placeholder="HQ advisory / dispatch note…"
          />
        </div>
      </div>
    </div>
  );
}

function RequestCard({
  r,
  onFulfill,
}: {
  r: ResourceRequest;
  onFulfill: (id: string) => void;
}) {
  const items = [
    { label: "Medkits", value: r.medkits, icon: Stethoscope },
    { label: "Food kits", value: r.foodkits, icon: Utensils },
    { label: "Transports", value: r.transports, icon: Truck },
  ];
  return (
    <div className="rounded-md border border-border bg-panel-2/60 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[12px] font-medium">{r.rescuerName}</span>
        <Badge
          className={cn(
            "!text-[9px]",
            r.status === "pending"
              ? "text-warn border-warn/40 bg-warn/10"
              : "text-safe border-safe/40 bg-safe/10"
          )}
        >
          {r.status === "pending" ? "pending" : "fulfilled"}
        </Badge>
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
            <div key={it.label} className="flex items-center gap-1 rounded border border-border bg-slate-50 px-1.5 py-1">
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
        {r.status === "pending" && (
          <Button
            variant="primary"
            size="sm"
            className="!h-6 !text-[10px]"
            onClick={() => onFulfill(r.id)}
          >
            <Package className="h-3 w-3" /> Allocate & fulfill
          </Button>
        )}
      </div>
    </div>
  );
}

export function HqSosBoard() {
  const { sos, requests, rescuers, fulfillRequest, addUpdate, resetDemo } = useSosStore();
  const validSos = sos.filter((s) => s && typeof s.timestamp === "string");
  const latest = [...validSos].sort((a, b) => updatedStamp(b).localeCompare(updatedStamp(a))).slice(0, 6);
  const openCount = validSos.filter((s) => s.status === "open").length;
  const inFieldCount = validSos.filter((s) => s.status === "claimed" || s.status === "reached").length;
  const deliveredCount = validSos.filter((s) => s.status === "delivered").length;
  const pendingRequests = requests.filter((r) => r && r.status === "pending").length;
  const teamsOnline = rescuers.filter((r) => r.online).length;
  const requestsSorted = [...requests]
    .filter((r) => r && typeof r.timestamp === "string")
    .sort((a, b) => updatedStamp(b).localeCompare(updatedStamp(a)));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Siren className="h-3.5 w-3.5 text-danger" /> Live SOS + Resource Requests
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className="!text-[9px] text-danger border-danger/40 bg-danger/10">
            {openCount} open
          </Badge>
          <Badge className="!text-[9px] text-warn border-warn/40 bg-warn/10">
            {inFieldCount} in field
          </Badge>
          <Badge className="!text-[9px] text-safe border-safe/40 bg-safe/10">
            {deliveredCount} delivered
          </Badge>
          <Badge className="!text-[9px] text-cyan border-cyan/40 bg-cyan/10">
            <Radio className="h-2.5 w-2.5" /> {teamsOnline} online
          </Badge>
          <Button variant="ghost" size="sm" className="!h-6 !px-2 !text-[9px]" onClick={resetDemo}>
            <RotateCcw className="h-3 w-3" /> reset demo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
              Citizen signals
            </span>
            <span className="font-mono text-[9px] text-muted">{sos.length} total</span>
          </div>
          {latest.length === 0 ? (
            <div className="rounded-md border border-dashed border-border-strong px-3 py-4 text-center text-[11px] text-muted">
              No signals yet. Open the{" "}
              <a href="/citizen" className="text-cyan hover:underline">
                citizen
              </a>{" "}
              console to send one.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {latest.map((s) => (
                <SosCard key={s.id} s={s} onUpdate={(id, text) => addUpdate(id, text, "hq")} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
              Field resource requests
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px] text-muted">
              <Clock3 className="h-2.5 w-2.5" /> {pendingRequests} pending
            </span>
          </div>
          {requests.length === 0 ? (
            <div className="rounded-md border border-dashed border-border-strong px-3 py-4 text-center text-[11px] text-muted">
              Rescuers request medkits / food / transport here after taking control.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {requestsSorted.map((r) => (
                <RequestCard key={r.id} r={r} onFulfill={fulfillRequest} />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-md border border-border bg-panel-2/50 px-3 py-1.5 font-mono text-[10px] text-muted">
          <CheckCircle2 className="h-3 w-3 text-safe" />
          Resource Allocation Engine matches every fulfilled request to the nearest available stock.
        </div>
      </CardContent>
    </Card>
  );
}
