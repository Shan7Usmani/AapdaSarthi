"use client";

import "leaflet/dist/leaflet.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";
import { MapPin, LocateFixed, Siren, Users, Radio, CheckCircle2 } from "lucide-react";
import type { LatLngExpression } from "leaflet";
import { useSosStore, type SosItem } from "@/store/sos-store";
import { haversineKm } from "@/lib/rainfall";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn, timeAgo } from "@/lib/utils";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), {
  ssr: false,
  loading: () => <MapSkeleton />,
});
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), {
  ssr: false,
});
const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Tooltip), { ssr: false });
/** default viewport when geolocation is unavailable (Dhubri, Assam flood hotspot) */
const DEFAULT_POS: [number, number] = [26.02, 89.98];

/** only signals within this radius of the rescuer's live position are shown on the map */
const NEAR_RADIUS_KM = 50;

/** flies the map to a target coordinate whenever it changes (auto-align on locate) */
function FlyTo({ target }: { target: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(target, Math.max(map.getZoom(), 10), { duration: 0.9 });
  }, [target, map]);
  return null;
}

function MapSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center rounded-xl border border-border bg-slate-100 font-mono text-[11px] text-muted">
      Loading live field map…
    </div>
  );
}

function distanceColor(km: number) {
  if (km < 5) return "#dc2626";
  if (km < 20) return "#ea580c";
  if (km < 50) return "#ca8a04";
  return "#16a34a";
}

export function RescuerMap() {
  const { sos, rescuerName, claimSos, registerRescuer } = useSosStore();

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<"loading" | "ok" | "error">("loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [claimedId, setClaimedId] = useState<string | null>(null);
  const [locError, setLocError] = useState(false);

  // Load the Leaflet runtime (needed for L.divIcon) lazily, matching the other
  // map layers. This replaces Leaflet's default placeholder icon with a
  // Google-Maps-style blue "your location" dot for the rescuer.
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  useEffect(() => {
    let alive = true;
    import("leaflet").then((mod) => {
      if (alive) setL(mod);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Google-Maps-style blue location pin (replaces the default Leaflet icon).
  const youIcon = useMemo(() => {
    if (!L) return undefined;
    return L.divIcon({
      className: "",
      html: `<div class="gmap-you"><span class="gmap-you-core"></span></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  }, [L]);

  const locate = useCallback(() => {
    setLocStatus("loading");
    setLocError(false);
    if (!navigator.geolocation) {
      setLocStatus("error");
      setLocError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(loc);
        setLocStatus("ok");
        if (rescuerName.trim()) registerRescuer(rescuerName, loc.lat, loc.lng);
      },
      () => {
        setLocStatus("error");
        setLocError(true);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, [rescuerName, registerRescuer]);

  // auto-fetch the rescuer's location on mount
  useEffect(() => {
    const t = setTimeout(() => locate(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep rescuer location in sync with the store whenever they move on this page
  useEffect(() => {
    if (!pos || !rescuerName.trim()) return;
    registerRescuer(rescuerName, pos.lat, pos.lng);
  }, [pos, rescuerName, registerRescuer]);

  const allSignals = useMemo(
    () =>
      sos
        .filter((s) => s.status === "open" && s.location)
        .map((s) => ({
          ...s,
          km: pos ? haversineKm(pos.lat, pos.lng, s.location!.lat, s.location!.lng) : undefined,
        }))
        .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity)),
    [sos, pos]
  );

  // backend matching: only people in danger NEAR this rescuer show on the map
  const openSignals = useMemo(
    () => allSignals.filter((s) => !pos || (s.km ?? Infinity) <= NEAR_RADIUS_KM),
    [allSignals, pos]
  );
  const nearbyTotal = allSignals.length;
  const excludedDistant = nearbyTotal - openSignals.length;

  const center: LatLngExpression = pos ? [pos.lat, pos.lng] : DEFAULT_POS;
  const selected: SosItem | undefined = sos.find((s) => s.id === selectedId);

  const handleSelect = (id: string) => setSelectedId((cur) => (cur === id ? null : id));

  const handleClaim = () => {
    if (!selectedId) return;
    claimSos(selectedId);
    setClaimedId(selectedId);
    setSelectedId(null);
    setTimeout(() => setClaimedId(null), 3200);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-orange-600" /> Live field map
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px]",
              locStatus === "ok"
                ? "border-safe/40 bg-safe/10 text-safe"
                : locStatus === "loading"
                  ? "border-cyan/40 bg-cyan/10 text-cyan"
                  : "border-danger/40 bg-danger/10 text-danger"
            )}
          >
            <LocateFixed className={cn("h-3 w-3", locStatus === "loading" && "blip")} />
            {locStatus === "ok"
              ? `You · ${pos!.lat.toFixed(4)}, ${pos!.lng.toFixed(4)}`
              : locStatus === "loading"
                ? "Fetching your location…"
                : "Location unavailable"}
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-danger/40 bg-danger/10 px-2 py-1 font-mono text-[10px] text-danger">
            <Siren className="h-3 w-3" /> {pos ? openSignals.length : nearbyTotal} in danger
            {pos ? " near you" : " (live)"}
          </span>
          {locStatus !== "ok" && (
            <Button variant="outline" size="sm" className="!h-7 !px-2 !text-[10px]" onClick={locate}>
              <LocateFixed className="h-3 w-3" /> Retry location
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative h-56 w-56 overflow-hidden rounded-xl border border-border shadow-sm">
          <MapContainer
            center={center}
            zoom={9}
            zoomSnap={0.5}
            minZoom={4}
            maxZoom={15}
            className="h-full w-full"
            scrollWheelZoom
          >
            <FlyTo target={center} />
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* rescuer position — Google-Maps-style blue location dot */}
            {pos && (
              <Marker position={[pos.lat, pos.lng]} icon={youIcon}>
                <Tooltip direction="top" offset={[0, -16]} opacity={1}>
                  <span className="gmap-you-label">
                    {rescuerName.trim() || "You"}
                  </span>
                </Tooltip>
              </Marker>
            )}

            {/* people in danger */}
            {openSignals.map((s) => (
              <CircleMarker
                key={s.id}
                center={[s.location!.lat, s.location!.lng]}
                radius={Math.max(7, 14 - (s.km ?? 0) / 6)}
                pathOptions={{
                  color: "#fff",
                  weight: 1.5,
                  fillColor: distanceColor(s.km ?? 999),
                  fillOpacity: 0.85,
                }}
                eventHandlers={{ click: () => handleSelect(s.id) }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                  <span className="font-mono text-[10px]">
                    {s.citizenName} · {s.peopleCount} people
                    {s.km !== undefined && (
                      <>
                        {" · "}
                        <span style={{ color: distanceColor(s.km) }}>{s.km.toFixed(1)} km</span>
                      </>
                    )}
                  </span>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {excludedDistant > 0 && (
          <p className="w-full text-center font-mono text-[10px] text-muted">
            {excludedDistant} signal{excludedDistant === 1 ? "" : "s"} beyond {NEAR_RADIUS_KM} km
            hidden from map — nearer to a different team (all signals still in the dispatch list).
          </p>
        )}

        {locError && (
          <p className="w-full text-center font-mono text-[10px] text-danger">
            Could not access your location — showing default command viewport. Enable location
            permissions or tap &ldquo;Retry location&rdquo;.
          </p>
        )}

        {/* selected signal action card */}
        {selected && (
          <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border-2 border-orange-400 bg-orange-50 p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-orange-700">
                <Siren className="h-3.5 w-3.5" /> {selected.citizenName}
              </div>
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-slate-700">
                {selected.message}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {selected.peopleCount} people
                </span>
                <span>{timeAgo(selected.timestamp)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                Close
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!rescuerName.trim()}
                onClick={handleClaim}
              >
                <Radio className="h-3.5 w-3.5" /> Take control
              </Button>
            </div>
          </div>
        )}

        {claimedId && (
          <div className="flex w-full items-center justify-center gap-2 rounded-md border border-safe/40 bg-safe/10 px-3 py-2 font-mono text-[11px] text-safe">
            <CheckCircle2 className="h-3.5 w-3.5" /> You took control — request medkits, food kits
            and transport below.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
