"use client";

import {
  Siren,
  CheckCircle2,
  MapPin,
  Users,
  RotateCcw,
  Radio,
  Phone,
} from "lucide-react";
import { useSosStore, formatCitizenPhone, type SosItem } from "@/store/sos-store";
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

function SosCard({ s }: { s: SosItem }) {
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
        </div>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{s.message}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[9px] text-muted">
          {s.citizenPhone && (
            <span className="flex items-center gap-1">
              <Phone className="h-2.5 w-2.5" /> {formatCitizenPhone(s.citizenPhone)}
            </span>
          )}
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
      </div>
    </div>
  );
}

export function HqSosBoard() {
  const { sos, rescuers, resetDemo } = useSosStore();
  const validSos = sos.filter((s) => s && typeof s.timestamp === "string");
  const activeSos = validSos.filter((s) => s.status !== "delivered");
  const latest = [...activeSos].sort((a, b) => updatedStamp(b).localeCompare(updatedStamp(a))).slice(0, 6);
  const openCount = activeSos.filter((s) => s.status === "open").length;
  const inFieldCount = activeSos.filter((s) => s.status === "claimed" || s.status === "reached").length;
  const teamsOnline = rescuers.filter((r) => r.online).length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Siren className="h-3.5 w-3.5 text-danger" /> Live SOS Board
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className="!text-[9px] text-danger border-danger/40 bg-danger/10">
            {openCount} open
          </Badge>
          <Badge className="!text-[9px] text-warn border-warn/40 bg-warn/10">
            {inFieldCount} in field
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
            <div className="rounded-md border border-dashed border-[rgba(255,255,255,0.1)] px-3 py-4 text-center text-[11px] text-muted">
              No signals yet. Open the{" "}
              <a href="/citizen" className="text-cyan hover:underline">
                citizen
              </a>{" "}
              console to send one.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {latest.map((s) => (
                <SosCard key={s.id} s={s} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
