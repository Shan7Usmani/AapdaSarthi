"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  MapPin,
  LocateFixed,
  Users,
  MessageSquareText,
  Mic,
  Video,
  ImagePlus,
  Radio,
  CheckCircle2,
  Package,
  Send,
  Navigation,
  Clock3,
} from "lucide-react";
import { useSosStore, type SosItem } from "@/store/sos-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";
import { haversineKm } from "@/lib/rainfall";

function MediaChips({ sos }: { sos: SosItem }) {
  if (sos.media.length === 0) return null;
  return (
    <div className="flex gap-1.5">
      {sos.media.map((m, i) => {
        const Icon = m.kind === "photo" ? ImagePlus : m.kind === "video" ? Video : Mic;
        return (
          <span
            key={i}
            className="flex items-center gap-1 rounded border border-border bg-panel-2/70 px-1.5 py-0.5 font-mono text-[9px] text-muted"
          >
            <Icon className="h-2.5 w-2.5 text-cyan" />
            {m.kind}
          </span>
        );
      })}
    </div>
  );
}

export function RescuerPanel() {
  const { sos, requests, rescuerName, setRescuerName, claimSos, resolveSos, addRequest, registerRescuer } =
    useSosStore();
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [tab, setTab] = useState<"signals" | "rescues">("signals");

  // request form state
  const [formFor, setFormFor] = useState<string | null>(null);
  const [peopleRescued, setPeopleRescued] = useState(1);
  const [medkits, setMedkits] = useState(0);
  const [foodkits, setFoodkits] = useState(0);
  const [transports, setTransports] = useState(0);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("error");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLoc(loc);
        setLocStatus("ok");
        if (rescuerName.trim()) registerRescuer(rescuerName, loc.lat, loc.lng);
      },
      () => setLocStatus("error"),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const openSos = useMemo(
    () =>
      sos
        .filter((s) => s.status === "open")
        .map((s) => ({
          ...s,
          distance:
            myLoc && s.location
              ? haversineKm(myLoc.lat, myLoc.lng, s.location.lat, s.location.lng)
              : undefined,
        }))
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)),
    [sos, myLoc]
  );

  // Keep this rescuer registered + online while on this console with a live
  // location, so citizen SOS signals can be routed to the nearest team.
  useEffect(() => {
    if (!rescuerName.trim() || !myLoc) return;
    registerRescuer(rescuerName, myLoc.lat, myLoc.lng);
  }, [rescuerName, myLoc, registerRescuer]);

  const myRescues = useMemo(
    () =>
      sos
        .filter((s) => s.status === "claimed" && s.rescuerName === rescuerName)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [sos, rescuerName]
  );

  const submitRequest = (sosId: string) => {
    const item = sos.find((s) => s.id === sosId);
    addRequest({
      sosId,
      rescuerName: rescuerName || "Rescuer",
      location: item?.location,
      locationLabel: item ? `${item.location?.lat.toFixed(3)}, ${item.location?.lng.toFixed(3)}` : undefined,
      peopleRescued,
      medkits,
      foodkits,
      transports,
    });
    setFormFor(null);
    setMedkits(0);
    setFoodkits(0);
    setTransports(0);
    setPeopleRescued(1);
  };

  const pendingRequests = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      {/* identity + location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-warn" /> Rescuer identity
          </CardTitle>
          <Badge>{pendingRequests} pending requests</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5 sm:flex-row">
          <input
            value={rescuerName}
            onChange={(e) => setRescuerName(e.target.value)}
            placeholder="Your name / team ID · e.g. SDRF Team 4"
            className="flex-1 rounded-md border border-border-strong bg-slate-50 px-3 py-2 text-[13px] text-foreground placeholder:text-muted/50 focus:border-cyan/60 focus:outline-none"
          />
          <Button
            variant={locStatus === "ok" ? "primary" : "outline"}
            size="md"
            onClick={fetchLocation}
            className="sm:flex-none"
          >
            <LocateFixed className={cn("h-3.5 w-3.5", locStatus === "loading" && "blip")} />
            {locStatus === "ok"
              ? `Located · ${myLoc!.lat.toFixed(4)}, ${myLoc!.lng.toFixed(4)}`
              : "Set my location"}
          </Button>
        </CardContent>
      </Card>

      {/* tabs */}
      <div className="flex gap-1.5">
        {(["signals", "rescues"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer",
              tab === t
                ? "border-warn/60 bg-warn/10 text-warn"
                : "border-border-strong text-muted hover:text-foreground"
            )}
          >
            {t === "signals" ? `Incoming signals (${openSos.length})` : `My rescues (${myRescues.length})`}
          </button>
        ))}
      </div>

      {tab === "signals" && (
        <div className="flex flex-col gap-3">
          {openSos.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-safe" />
                <p className="text-sm font-semibold">No open SOS signals</p>
                <p className="max-w-sm text-[12px] text-muted">
                  When a citizen reports distress, it appears here instantly — sorted by distance
                  from your location.
                </p>
                <Link href="/citizen" className="font-mono text-[11px] text-cyan hover:underline">
                  Simulate a citizen SOS →
                </Link>
              </CardContent>
            </Card>
          )}

          {openSos.map((s) => (
            <Card key={s.id} className="border-danger/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-danger">
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-danger" />
                    LIVE SOS · {timeAgo(s.timestamp)}
                  </span>
                  <span className="font-mono text-[9px] text-muted">#{s.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  {s.distance !== undefined && (
                    <Badge className="!text-[9px]">
                      <Navigation className="h-2.5 w-2.5" />
                      {s.distance < 1 ? `${Math.round(s.distance * 1000)}m` : `${s.distance.toFixed(1)}km`}
                    </Badge>
                  )}
                  {s.nearestRescuerName === rescuerName && (
                    <Badge severity="CRITICAL" className="!text-[9px] !text-safe !border-safe/40 !bg-safe/10">
                      <Radio className="h-2.5 w-2.5" /> ROUTED TO YOU
                    </Badge>
                  )}
                  {s.nearestRescuerName && s.nearestRescuerName !== rescuerName && (
                    <Badge className="!text-[9px]">
                      routed → {s.nearestRescuerName}
                      {s.nearestDistanceKm !== undefined
                        ? ` · ${s.nearestDistanceKm}km`
                        : ""}
                    </Badge>
                  )}
                  <span className="font-mono text-[10px] text-muted">{s.citizenName}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2 rounded-md border border-border bg-panel-2/60 px-3 py-2">
                  <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
                  <p className="text-[12px] leading-relaxed text-foreground/90">{s.message}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-warn" /> {s.peopleCount} people
                  </span>
                  {s.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-cyan" />
                      {s.location.lat.toFixed(4)}, {s.location.lng.toFixed(4)}
                    </span>
                  )}
                  {s.location?.accuracy && (
                    <span>±{Math.round(s.location.accuracy)}m</span>
                  )}
                </div>
                <MediaChips sos={s} />

                {formFor === s.id ? (
                  <div className="flex flex-col gap-2 rounded-md border border-warn/40 bg-warn/5 p-3">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-warn">
                      <Package className="h-3 w-3" /> Request resources from HQ
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["peopleRescued", "People rescued", setPeopleRescued, peopleRescued],
                          ["medkits", "Medkits", setMedkits, medkits],
                          ["foodkits", "Food kits", setFoodkits, foodkits],
                          ["transports", "Transports", setTransports, transports],
                        ] as const
                      ).map(([_, label, setter, val]) => (
                        <div key={_}>
                          <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-muted">
                            {label}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={val}
                            onChange={(e) => setter(Math.max(0, Number(e.target.value)))}
                            className="w-full rounded-md border border-border-strong bg-slate-50 px-2.5 py-1.5 font-mono text-[12px] text-foreground focus:border-cyan/60 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" size="md" className="flex-1" onClick={() => submitRequest(s.id)}>
                        <Send className="h-3.5 w-3.5" /> Send to HQ
                      </Button>
                      <Button variant="ghost" size="md" onClick={() => setFormFor(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="danger"
                    size="md"
                    disabled={!rescuerName.trim()}
                    onClick={() => {
                      claimSos(s.id);
                      setFormFor(s.id);
                      setTab("rescues");
                    }}
                  >
                    <Radio className="h-3.5 w-3.5" /> Take control
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "rescues" && (
        <div className="flex flex-col gap-3">
          {myRescues.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-[12px] text-muted">
                No rescues taken yet. Claim a signal to begin.
              </CardContent>
            </Card>
          )}
          {myRescues.map((s) => (
            <Card key={s.id} className="border-warn/40">
              <CardHeader>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-warn">
                  <Clock3 className="h-3 w-3" /> TAKEN CONTROL · {s.citizenName}
                </span>
                <Badge severity="HIGH">In progress</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                <p className="text-[12px] leading-relaxed text-foreground/90">{s.message}</p>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-warn" /> {s.peopleCount} people
                  </span>
                  <MediaChips sos={s} />
                </div>
                {formFor === s.id ? (
                  <div className="flex flex-col gap-2 rounded-md border border-warn/40 bg-warn/5 p-3">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-warn">
                      <Package className="h-3 w-3" /> Request resources from HQ
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["peopleRescued", "People rescued", setPeopleRescued, peopleRescued],
                          ["medkits", "Medkits", setMedkits, medkits],
                          ["foodkits", "Food kits", setFoodkits, foodkits],
                          ["transports", "Transports", setTransports, transports],
                        ] as const
                      ).map(([_, label, setter, val]) => (
                        <div key={_}>
                          <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-muted">
                            {label}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={val}
                            onChange={(e) => setter(Math.max(0, Number(e.target.value)))}
                            className="w-full rounded-md border border-border-strong bg-slate-50 px-2.5 py-1.5 font-mono text-[12px] text-foreground focus:border-cyan/60 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" size="md" className="flex-1" onClick={() => submitRequest(s.id)}>
                        <Send className="h-3.5 w-3.5" /> Send to HQ
                      </Button>
                      <Button variant="ghost" size="md" onClick={() => setFormFor(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      className="flex-1"
                      onClick={() => setFormFor(s.id)}
                    >
                      <Package className="h-3.5 w-3.5" /> Request resources
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => resolveSos(s.id)}
                      title="Mark resolved"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
