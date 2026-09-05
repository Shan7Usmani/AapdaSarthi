"use client";

import { useMemo, useState } from "react";
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
import { SosUpdates } from "@/components/sos-updates";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";
import { haversineKm } from "@/lib/rainfall";

function MediaChips({ sos }: { sos: SosItem }) {
  const media = sos.media ?? [];
  if (media.length === 0) return null;
  return (
    <div className="flex gap-1.5">
      {media.map((m, i) => {
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
  const {
    sos,
    requests,
    rescuerName,
    setRescuerName,
    claimSos,
    markReached,
    receiveRequest,
    allocateRequest,
    addUpdate,
    addRequest,
    updateRequest,
    registerRescuer,
    rescuers,
  } =
    useSosStore();
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [tab, setTab] = useState<"signals" | "rescues">("signals");

  // request form state
  const [formFor, setFormFor] = useState<string | null>(null);
  const [peopleRescued, setPeopleRescued] = useState(1);
  const [medkits, setMedkits] = useState(0);
  const [foodkits, setFoodkits] = useState(0);
  const [transports, setTransports] = useState(0);

  // Single source of truth for the rescuer's live position: the shared store
  // record (the map also writes + reads this). Deriving `myLoc` from the store
  // keeps this panel's distance sort and the map's markers on the SAME
  // coordinates — they can never show conflicting positions (the bug that made
  // the page glitch back and forth).
  const myRescuer = rescuers.find(
    (r) => r.name.trim().toLowerCase() === rescuerName.trim().toLowerCase()
  );
  const myLoc = useMemo(
    () => (myRescuer ? { lat: myRescuer.lat, lng: myRescuer.lng } : null),
    [myRescuer]
  );

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("error");
      return;
    }
    if (!rescuerName.trim()) {
      setLocStatus("error");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Write straight to the shared store record. The panel and map read the
        // same value, so there's no more two-compartment position bounce.
        registerRescuer(rescuerName, pos.coords.latitude, pos.coords.longitude);
        setLocStatus("ok");
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

  const myRescues = useMemo(
    () => {
      const mine = rescuerName.trim().toLowerCase() || "rescuer";
      return sos
        .filter(
          (s) =>
            (s.status === "claimed" || s.status === "reached" || s.status === "delivered") &&
            s.rescuerName?.trim().toLowerCase() === mine
        )
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    },
    [sos, rescuerName]
  );

  const submitRequest = (sosId: string) => {
    const item = sos.find((s) => s.id === sosId);
    const existing = requests.find((r) => r.sosId === sosId && r.status !== "allocated" && r.status !== "fulfilled");
    const payload = {
      location: item?.location,
      locationLabel: item
        ? `${item.location?.lat.toFixed(3)}, ${item.location?.lng.toFixed(3)}`
        : undefined,
      peopleRescued,
      medkits,
      foodkits,
      transports,
    };
    if (existing) {
      updateRequest(existing.id, payload);
    } else {
      addRequest({ sosId, rescuerName: rescuerName || "Rescuer", ...payload });
    }
    setFormFor(null);
    setMedkits(0);
    setFoodkits(0);
    setTransports(0);
    setPeopleRescued(1);
  };

  const takeControl = (sosId: string) => {
    if (!rescuerName.trim()) {
      setRescuerName("Rescuer");
    }
    claimSos(sosId);
    setFormFor(null);
    setTab("rescues");
  };

  const openForm = (s: SosItem) => {
    const existing = requests.find((r) => r.sosId === s.id && r.status !== "allocated" && r.status !== "fulfilled");
    if (existing) {
      setPeopleRescued(existing.peopleRescued);
      setMedkits(existing.medkits);
      setFoodkits(existing.foodkits);
      setTransports(existing.transports);
    }
    setFormFor(s.id);
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
            variant={myLoc ? "primary" : "outline"}
            size="md"
            onClick={fetchLocation}
            className="sm:flex-none"
          >
            <LocateFixed className={cn("h-3.5 w-3.5", locStatus === "loading" && "blip")} />
            {locStatus === "loading"
              ? "Locating…"
              : myLoc
                ? `Located · ${myLoc.lat.toFixed(4)}, ${myLoc.lng.toFixed(4)}`
                : "Set my location"}
          </Button>
        </CardContent>
        <p className="mx-1 mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-muted">
          <span>
            Claiming signals as{" "}
            <span className="font-semibold text-foreground">{rescuerName.trim() || "Rescuer"}</span>
            {!rescuerName.trim() && " — tap Take control and it self-assigns"}
          </span>
        </p>
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
                    onClick={() => {
                      takeControl(s.id);
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
          {myRescues.map((s) => {
            const isReached = s.status === "reached";
            const isDelivered = s.status === "delivered";
            const activeRequest = requests.find(
              (r) => r.sosId === s.id && r.status !== "allocated" && r.status !== "fulfilled"
            );
            const allocatedRequest = requests.find(
              (r) => r.sosId === s.id && (r.status === "allocated" || r.status === "fulfilled")
            );
            const st = isDelivered
              ? { label: "DELIVERED", cls: "text-safe", ring: "border-safe/40", Icon: CheckCircle2 }
              : isReached
                ? { label: "ON SITE", cls: "text-cyan", ring: "border-cyan/40", Icon: MapPin }
                : { label: "TAKEN CONTROL", cls: "text-warn", ring: "border-warn/40", Icon: Clock3 };
            const StatusIcon = st.Icon;
            return (
              <Card key={s.id} className={cn(st.ring, isDelivered && "opacity-70")}>
                <CardHeader>
                  <span className={cn("flex items-center gap-1.5 font-mono text-[10px]", st.cls)}>
                    <StatusIcon className="h-3 w-3" /> {st.label} · {s.citizenName}
                  </span>
                  <Badge severity={isDelivered ? "LOW" : isReached ? "MODERATE" : "HIGH"}>
                    {isDelivered ? "Delivered" : isReached ? "On site" : "In progress"}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-2.5">
                  <p className="text-[12px] leading-relaxed text-foreground/90">{s.message}</p>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-warn" /> {s.peopleCount} people
                    </span>
                    <MediaChips sos={s} />
                  </div>

                  {isDelivered && (
                    <p className="flex items-center gap-1 font-mono text-[10px] text-safe">
                      <CheckCircle2 className="h-3 w-3" />
                      Resources allocated {s.deliveredAt ? timeAgo(s.deliveredAt) : "to citizen"}
                    </p>
                  )}

                  {(activeRequest || allocatedRequest) && (
                    <div className="rounded-md border border-border bg-panel-2/60 px-3 py-2 font-mono text-[10px] text-muted">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Resources: medkits {activeRequest?.medkits ?? allocatedRequest?.medkits ?? 0},
                          food {activeRequest?.foodkits ?? allocatedRequest?.foodkits ?? 0},
                          transport {activeRequest?.transports ?? allocatedRequest?.transports ?? 0}
                        </span>
                        <Badge
                          className={cn(
                            "!text-[9px]",
                            activeRequest?.status === "pending"
                              ? "text-warn border-warn/40 bg-warn/10"
                              : activeRequest?.status === "dispatched"
                                ? "text-cyan border-cyan/40 bg-cyan/10"
                                : activeRequest?.status === "received"
                                  ? "text-orange-600 border-orange-300 bg-orange-50"
                                  : "text-safe border-safe/40 bg-safe/10"
                          )}
                        >
                          {activeRequest?.status === "pending"
                            ? "pending at HQ"
                            : activeRequest?.status === "dispatched"
                              ? "dispatched"
                              : activeRequest?.status === "received"
                                ? "received"
                                : "allocated"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {formFor === s.id ? (
                    <div className="flex flex-col gap-2 rounded-md border border-warn/40 bg-warn/5 p-3">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-warn">
                        <Package className="h-3 w-3" />{" "}
                        {isReached || isDelivered ? "Update resources required" : "Request resources from HQ"}
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
                          <Send className="h-3.5 w-3.5" /> {isReached || isDelivered ? "Update HQ" : "Send to HQ"}
                        </Button>
                        <Button variant="ghost" size="md" onClick={() => setFormFor(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {isDelivered ? (
                        <Button variant="outline" size="md" className="flex-1" onClick={() => openForm(s)}>
                          <Package className="h-3.5 w-3.5" /> Update resources required
                        </Button>
                      ) : activeRequest?.status === "dispatched" ? (
                        <Button
                          variant="primary"
                          size="md"
                          className="flex-1"
                          onClick={() => receiveRequest(activeRequest.id)}
                        >
                          <Package className="h-3.5 w-3.5" /> Received resources at location
                        </Button>
                      ) : activeRequest?.status === "received" ? (
                        <Button
                          variant="primary"
                          size="md"
                          className="flex-1"
                          onClick={() => allocateRequest(activeRequest.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Delivered to citizen
                        </Button>
                      ) : isReached ? (
                        <>
                          {activeRequest?.status === "pending" ? (
                            <Button variant="cyan" size="md" className="flex-1" disabled>
                              <Package className="h-3.5 w-3.5" /> Awaiting HQ dispatch
                            </Button>
                          ) : null}
                          <Button variant="outline" size="md" onClick={() => openForm(s)}>
                            <Package className="h-3.5 w-3.5" /> Update resources required
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="md"
                            className="flex-1"
                            onClick={() => markReached(s.id)}
                          >
                            <Navigation className="h-3.5 w-3.5" /> I have reached the location
                          </Button>
                          <Button variant="outline" size="md" onClick={() => openForm(s)}>
                            <Package className="h-3.5 w-3.5" /> Request resources
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  <SosUpdates
                    sos={s}
                    onPost={(text) => addUpdate(s.id, text, "rescuer")}
                    placeholder="Post ground info for HQ…"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
