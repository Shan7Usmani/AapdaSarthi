"use client";

import "leaflet/dist/leaflet.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useMapEvents } from "react-leaflet";
import { CloudRain, WifiOff, RefreshCw, ZoomIn, Route, Navigation } from "lucide-react";
import { useLiveStats } from "@/lib/live-stats";
import { getRainfall, BAND_META, rainfallBand, type RainfallPoint } from "@/lib/rainfall";
import { type DistrictRiskOutput, type RiskBand } from "@/lib/risk";
import { generateSafeRoute, fallbackRoute } from "@/lib/routing";
import type { EvacRoute } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), {
  ssr: false,
  loading: () => <MapLoading />,
});
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), {
  ssr: false,
});
const Circle = dynamic(() => import("react-leaflet").then((m) => m.Circle), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Tooltip), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const ZoomControl = dynamic(() => import("react-leaflet").then((m) => m.ZoomControl), {
  ssr: false,
});

const riskColor: Record<RiskBand, string> = {
  LOW: "#16a34a",
  MODERATE: "#eab308",
  HIGH: "#ea580c",
  CRITICAL: "#dc2626",
};

const DETAIL_ZOOM = 6.5;

function MapLoading() {
  return (
    <div className="grid h-full w-full place-items-center bg-panel-2">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan animate-pulse">
        Initializing national live map…
      </div>
    </div>
  );
}

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
  });
  return null;
}

/* ---------- rainfall layer (all-India, always visible) ---------- */
function RainfallMarkers({ points }: { points: RainfallPoint[] | null }) {
  if (!points) return null;
  return (
    <>
      {points.map((p) => {
        const band = rainfallBand(p.precipitation);
        if (band === "low") return null;
        const meta = BAND_META[band];
        return (
          <CircleMarker
            key={p.name}
            center={[p.lat, p.lon]}
            radius={band === "high" ? 11 : band === "moderate" ? 8 : 6}
            pathOptions={{
              color: meta.color,
              weight: 2,
              fillColor: meta.fill,
              fillOpacity: 0.85,
              opacity: 0.95,
            }}
          >
            <Tooltip sticky direction="top" className="district-tooltip" opacity={1}>
              <div className="font-semibold">{p.name}</div>
              <div className="mt-0.5 font-mono text-[10px]">
                <span style={{ color: meta.color }}>{meta.risk}</span>
                {" · "}
                {p.precipitation.toFixed(1)} mm/hr · {p.probability}%
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

/* ---------- all-India live risk layer ---------- */
interface RiskApiResp {
  districts?: DistrictRiskOutput[];
  source?: "live" | "seeded";
  provider?: "groq" | "gemini" | "deterministic";
  summary?: { summary: string; actions: string[]; riskZones: string[] };
}

/** Approximate flood-affected footprint (metres) per severity band. */
const ZONE_RADIUS: Record<RiskBand, number> = {
  LOW: 0,
  MODERATE: 45_000,
  HIGH: 80_000,
  CRITICAL: 120_000,
};

const ZONE_FILL: Record<RiskBand, number> = {
  LOW: 0,
  MODERATE: 0.18,
  HIGH: 0.26,
  CRITICAL: 0.34,
};

function LiveRiskLayer({ points }: { points: DistrictRiskOutput[] | null }) {
  if (!points) return null;
  return (
    <>
      {points.map((d) => {
        const band = (d.severity as RiskBand) ?? "LOW";
        const radius = ZONE_RADIUS[band] ?? 0;
        if (!radius || d.riskScore <= 0) return null;
        const color = riskColor[band];
        return (
          <Circle
            key={`riski-${d.name}`}
            center={[d.lat, d.lon]}
            radius={radius}
            pathOptions={{
              color,
              weight: 1,
              fillColor: color,
              fillOpacity: ZONE_FILL[band] ?? 0.2,
              opacity: 0.75,
            }}
          >
            <Tooltip sticky direction="top" className="district-tooltip" opacity={1}>
              <div className="font-semibold">{d.name}</div>
              <div className="mt-0.5 font-mono text-[10px]">
                <span style={{ color }}>{d.severity}</span> {"·"} Risk {d.riskScore}/100
              </div>
              <div className="font-mono text-[9px] text-muted">
                {d.precipitation.toFixed(1)} mm/hr · {Math.round(d.precipitation24h)} mm/24h
              </div>
            </Tooltip>
          </Circle>
        );
      })}
    </>
  );
}

function LiveRiskSummary({ summary, source }: { summary: string; source: string }) {
  return (
    <div className="pointer-events-none absolute bottom-24 left-3 z-[1000] max-w-[240px] rounded border border-border-strong bg-white/92 px-3 py-2 shadow-sm backdrop-blur">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan">AI Risk Verdict</div>
      <p className="mt-1 text-[11px] leading-snug text-foreground/90">{summary}</p>
      <div className="mt-1 font-mono text-[8px] uppercase text-muted">live · {source}</div>
    </div>
  );
}

/* ---------- interactive safe-route generator ---------- */
function MapClickHandler({
  onPick,
}: {
  onPick: (ll: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

function SafeRouteBanner({
  origin,
  route,
  loading,
  error,
  onClear,
  onRandomize,
}: {
  origin: { lat: number; lng: number; label: string } | null;
  route: EvacRoute | null;
  loading: boolean;
  error: string | null;
  onClear: () => void;
  onRandomize: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-[1000] w-[min(520px,calc(100%-1.5rem))] -translate-x-1/2 rounded-xl border border-border-strong bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
          <Route className="h-3.5 w-3.5" /> Safe Route Generator
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={onRandomize}
            className="rounded border border-border-strong px-2 py-1 font-mono text-[10px] text-muted hover:text-foreground cursor-pointer"
            disabled={loading}
          >
            random demo
          </button>
          <button
            onClick={onClear}
            className="rounded border border-border-strong px-2 py-1 font-mono text-[10px] text-muted hover:text-danger cursor-pointer"
          >
            clear
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-2 flex items-center gap-2 font-mono text-[11px] text-muted">
          <Navigation className="h-3.5 w-3.5 blip text-cyan" /> routing via OSRM road network…
        </p>
      ) : route ? (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded border border-border bg-panel-2/60 px-2.5 py-1.5">
            <div className="font-mono text-[8px] uppercase text-muted">from</div>
            <div className="truncate text-[12px] font-medium text-foreground">{route.from}</div>
          </div>
          <div className="rounded border border-border bg-panel-2/60 px-2.5 py-1.5">
            <div className="font-mono text-[8px] uppercase text-muted">to</div>
            <div className="truncate text-[12px] font-medium text-foreground">{route.to}</div>
          </div>
          <div className="rounded border border-safe/40 bg-safe/10 px-2.5 py-1.5">
            <div className="font-mono text-[8px] uppercase text-safe">safe distance</div>
            <div className="text-[12px] font-bold text-foreground">{route.lengthKm} km</div>
          </div>
        </div>
      ) : (
        <p className="mt-2 font-mono text-[11px] text-muted">
          {origin
            ? "Pick a destination (higher ground) on the map → road-safe route drawn."
            : "Click any flood point on the map → auto route to higher ground drawn."}
        </p>
      )}
      {error && <p className="mt-1.5 font-mono text-[10px] text-danger">{error}</p>}
    </div>
  );
}

/* ---------- main map ---------- */
export function LiveMap() {
  const [zoom, setZoom] = useState(4.5);
  const [points, setPoints] = useState<RainfallPoint[] | null>(null);
  const [source, setSource] = useState<"live" | "seeded" | "loading">("loading");
  const [error, setError] = useState(false);

  // all-India live risk
  const [riskPoints, setRiskPoints] = useState<DistrictRiskOutput[] | null>(null);
  const [riskSummary, setRiskSummary] = useState<{ summary: string; source: string } | null>(null);

  // safe-route mode
  const [routeMode, setRouteMode] = useState<"none" | "origin" | "destination">("none");
  const [routeOrigin, setRouteOrigin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [routeDestination, setRouteDestination] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [route, setRoute] = useState<EvacRoute | null>(null);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const live = useLiveStats();

  const load = useCallback(() => {
    setError(false);
    setSource("loading");
    getRainfall()
      .then(({ points: pts, source: src }) => {
        setPoints(pts);
        setSource(src);
      })
      .catch(() => setError(true));
  }, []);

  const loadRisk = useCallback(async () => {
    try {
      const res = await fetch(`/api/risk?limit=594${routeMode !== "none" ? "&ai=0" : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`risk ${res.status}`);
      const json = (await res.json()) as RiskApiResp;
      const districts = json.districts ?? [];
      setRiskPoints(districts);
      if (json.summary?.summary) {
        setRiskSummary({
          summary: json.summary.summary,
          source: `${json.source ?? "live"} · ${json.provider ?? "ai"}`,
        });
      } else {
        const c = districts.filter((d) => d.severity === "CRITICAL").length;
        const h = districts.filter((d) => d.severity === "HIGH").length;
        setRiskSummary({
          summary:
            c + h === 0
              ? "No districts at HIGH or CRITICAL flood risk in the next 48h based on live rainfall telemetry."
              : `${c} district${c === 1 ? "" : "s"} CRITICAL, ${h} HIGH flood risk in the next 48h — see map.`,
          source: json.source ?? "live",
        });
      }
    } catch {
      setRiskSummary({
        summary: "Risk engine unavailable — showing cached district telemetry.",
        source: "cached",
      });
    }
  }, [routeMode]);

  useEffect(() => {
    const raf = requestAnimationFrame(load);
    const t = setInterval(load, 10 * 60 * 1000);
    const r = requestAnimationFrame(loadRisk);
    const rt = setInterval(loadRisk, 15 * 60 * 1000);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(r);
      clearInterval(t);
      clearInterval(rt);
    };
  }, [load, loadRisk]);

  const detailed = zoom >= DETAIL_ZOOM;

  const handlePick = (ll: { lat: number; lng: number }) => {
    if (routeMode === "origin") {
      setRouteOrigin({ lat: ll.lat, lng: ll.lng, label: "Flood point" });
      setRouteMode("destination");
      setRoute(null);
      setRouteError(null);
    } else if (routeMode === "destination" && routeOrigin) {
      setRouting(true);
      setRouteDestination({ lat: ll.lat, lng: ll.lng, label: "Higher ground" });
      setRouteError(null);
    }
  };

  // compute the road-safe route whenever a destination is chosen
  useEffect(() => {
    if (!routeOrigin || !routeDestination) return;
    generateSafeRoute(
      [routeOrigin.lat, routeOrigin.lng],
      [routeDestination.lat, routeDestination.lng],
      "AI-safe evacuation route",
      routeOrigin.label,
      "Higher ground"
    )
      .then((r) => setRoute(r))
      .catch(() => {
        setRoute(
          fallbackRoute(
            [routeOrigin.lat, routeOrigin.lng],
            [routeDestination.lat, routeDestination.lng],
            "Safe evacuation line",
            routeOrigin.label,
            "Higher ground"
          )
        );
        setRouteError("OSRM unavailable — drew straight-line fallback.");
      })
      .finally(() => setRouting(false));
  }, [routeOrigin, routeDestination]);

  const randomizeRoute = () => {
    const zones = riskPoints?.filter((d) => d.severity === "HIGH" || d.severity === "CRITICAL") ?? [];
    const origin =
      zones[Math.floor(Math.random() * zones.length)] ??
      (riskPoints?.[Math.floor(Math.random() * (riskPoints?.length ?? 1))] as
        | DistrictRiskOutput
        | undefined);
    if (!origin) return;
    setRouteMode("none");
    setRouteDestination(null);
    setRouteError(null);
    setRouting(true);
    setRouteOrigin({ lat: origin.lat, lng: origin.lon, label: `${origin.name}, ${origin.state}` });
    setRouteDestination({
      lat: origin.lat + (Math.random() * 0.6 - 0.1),
      lng: origin.lon + (Math.random() * 0.6 - 0.2),
      label: "Higher ground",
    });
  };

  const clearRoute = () => {
    setRouteMode("none");
    setRouteOrigin(null);
    setRouteDestination(null);
    setRoute(null);
    setRouteError(null);
  };

  // Live headline numbers straight from the live risk engine + live SOS store.
  const critical = riskPoints?.filter((d) => d.severity === "CRITICAL").length ?? 0;
  const high = riskPoints?.filter((d) => d.severity === "HIGH").length ?? 0;
  const atRisk = critical + high;
  const totalOpenPeople = useMemo(
    () => live.openSignals.reduce((a, s) => a + (Number(s.peopleCount) || 0), 0),
    [live.openSignals]
  );

  const counts = points
    ? {
        high: points.filter((p) => rainfallBand(p.precipitation) === "high").length,
        moderate: points.filter((p) => rainfallBand(p.precipitation) === "moderate").length,
        low: points.filter((p) => rainfallBand(p.precipitation) === "low").length,
      }
    : { high: 0, moderate: 0, low: 0 };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={[22.6, 79.5]}
        zoom={4.5}
        zoomSnap={0.5}
        minZoom={4}
        maxZoom={13}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl={false}
      >
        <ZoomWatcher onZoom={setZoom} />
        <MapClickHandler onPick={handlePick} />
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="bottomright" />

        <RainfallMarkers points={points} />

        {/* all-India live risk layer (always) */}
        <LiveRiskLayer points={riskPoints} />

        {/* live SOS incident markers — real-time field signals (distinct from flood zones) */}
        {live.openSignals.map((s) =>
          s.location ? (
            <CircleMarker
              key={s.id}
              center={[s.location.lat, s.location.lng]}
              radius={8}
              pathOptions={{ color: "#fff", weight: 2, fillColor: "#b91c1c", fillOpacity: 0.95 }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]} opacity={1} className="sos-tag">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-amber-50">
                  SOS · {s.citizenName || "Signal"}
                </span>
              </Tooltip>
              <Tooltip sticky direction="bottom" offset={[0, 12]} opacity={1}>
                <span className="font-mono text-[10px]">
                  {s.citizenName || "Signal"} · {s.peopleCount || 1} people ·{" "}
                  {s.location.lat.toFixed(3)},{s.location.lng.toFixed(3)}
                </span>
              </Tooltip>
            </CircleMarker>
          ) : null
        )}

        {/* interactive safe route markers */}
        {routeOrigin && (
          <Marker position={[routeOrigin.lat, routeOrigin.lng]}>
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <span className="font-mono text-[10px]">ROUTE FROM · {routeOrigin.label}</span>
            </Tooltip>
          </Marker>
        )}
        {routeDestination && (
          <Marker position={[routeDestination.lat, routeDestination.lng]}>
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <span className="font-mono text-[10px] text-safe">HIGHER GROUND DESTINATION</span>
            </Tooltip>
          </Marker>
        )}
        {route && route.path.length > 1 && (
          <Polyline
            positions={route.path}
            pathOptions={{ color: "#0ea5e9", weight: 6, opacity: 0.18 }}
          />
        )}
        {route && route.path.length > 1 && (
          <Polyline
            positions={route.path}
            pathOptions={{
              color: "#0284c7",
              weight: 3,
              opacity: 0.95,
              dashArray: "8 8",
              lineCap: "round",
            }}
          />
        )}
      </MapContainer>

      {/* top-left overlay: live risk summary */}
      <div className="pointer-events-none absolute top-3 left-3 z-[1000] rounded border border-border-strong bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
          Live Flood Risk · All India
        </div>
        <div className="mt-1 font-mono text-[10px] text-muted">
          <span className="text-danger">{critical} CRITICAL</span> ·{" "}
          <span className="text-warn">{high} HIGH</span> districts
        </div>
        <div className="mt-1 font-mono text-[10px] text-danger">
          <span className="text-muted">LIVE SOS:</span> {live.openCount} open ·{" "}
          {live.claimedCount} claimed
        </div>
      </div>

      {/* left rail: at-risk district names (auto-updates with risk feed) */}
      {(() => {
        const zoneDistricts =
          riskPoints?.filter(
            (d) => d.severity === "CRITICAL" || d.severity === "HIGH"
          ) ?? [];
        return (
          <div className="absolute top-3 left-[13.5rem] z-[1000] flex max-h-[70%] w-[230px] flex-col rounded border border-border-strong bg-white/92 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between border-b border-border-strong px-3 py-2">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                At-Risk Districts
              </div>
              <div className="font-mono text-[8px] uppercase text-cyan">auto ✓</div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {zoneDistricts.length === 0 ? (
                <div className="px-3 py-3 font-mono text-[10px] text-muted">
                  No districts at HIGH or CRITICAL risk right now.
                </div>
              ) : (
                <ul className="divide-y divide-border-strong/40">
                  {zoneDistricts.map((d) => (
                    <li
                      key={d.name}
                      className="flex items-center gap-2 px-3 py-1.5"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: riskColor[d.severity as RiskBand] ?? riskColor.LOW }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium text-foreground">
                          {d.name}
                        </span>
                        <span className="block font-mono text-[9px] text-muted">
                          {d.state}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[10px] font-bold" style={{ color: riskColor[d.severity as RiskBand] }}>
                        {d.riskScore}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })()}

      {/* top-right: at-risk tally from live engine */}
      <div className="pointer-events-none absolute top-3 right-3 z-[1000] rounded border border-border-strong bg-white/90 px-3 py-2 text-right shadow-sm backdrop-blur">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          At-Risk Districts
        </div>
        <div className="font-mono text-lg font-bold text-danger">
          {atRisk.toLocaleString("en-IN")}
        </div>
        <div className="font-mono text-[9px] text-muted">
          CRITICAL + HIGH · {totalOpenPeople.toLocaleString("en-IN")} people in open signals
        </div>
      </div>

      {/* top center-right: rainfall source */}
      <div className="pointer-events-none absolute top-3 right-40 z-[1000] rounded border border-border-strong bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-cyan">
          <CloudRain className="h-3 w-3" /> Rainfall
        </div>
        <div className="mt-0.5 font-mono text-[10px]">
          <span className="text-danger">{counts.high} heavy</span> ·{" "}
          <span className="text-warn">{counts.moderate} mod</span> ·{" "}
          <span className="text-safe">{counts.low} dry</span>
          {source === "seeded" && <span className="ml-2 text-muted">(cached)</span>}
        </div>
      </div>

      {/* live risk summary */}
      {riskSummary && <LiveRiskSummary summary={riskSummary.summary} source={riskSummary.source} />}

      {/* zoom hint */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 rounded border border-border-strong bg-white/90 px-2.5 py-1.5 font-mono text-[9px] text-cyan shadow-sm">
          <ZoomIn className="h-3 w-3" />
          {detailed ? "district detail · routes live" : "zoom in to analyze districts"}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded border border-border-strong bg-white/90 px-2.5 py-1.5 font-mono text-[9px] text-muted shadow-sm">
            <span className="h-2 w-2 rounded-sm" style={{ background: riskColor.CRITICAL }} /> Critical zone
          </div>
          <div className="flex items-center gap-1.5 rounded border border-border-strong bg-white/90 px-2.5 py-1.5 font-mono text-[9px] text-muted shadow-sm">
            <span className="h-2 w-2 rounded-sm" style={{ background: riskColor.HIGH }} /> High zone
          </div>
          <div className="flex items-center gap-1.5 rounded border border-border-strong bg-white/90 px-2.5 py-1.5 font-mono text-[9px] text-muted shadow-sm">
            <span className="h-2 w-2 rounded-sm" style={{ background: riskColor.MODERATE }} /> Moderate zone
          </div>
          <div className="flex items-center gap-1.5 rounded border border-border-strong bg-white/90 px-2.5 py-1.5 font-mono text-[9px] text-muted shadow-sm">
            <span className="h-2 w-2 rounded-full border-2 border-white" style={{ background: "#b91c1c" }} /> SOS signal
          </div>
          {(Object.keys(BAND_META) as Array<keyof typeof BAND_META>).map((b) => (
            <div
              key={b}
              className="flex items-center gap-1.5 rounded border border-border-strong bg-white/90 px-2.5 py-1.5 font-mono text-[9px] text-muted shadow-sm"
            >
              <span className="h-2 w-2 rounded-sm" style={{ background: BAND_META[b].color }} />
              {BAND_META[b].label}
            </div>
          ))}
        </div>
      </div>

      {/* safe-route toggle */}
      <Button
        variant={routeMode !== "none" ? "primary" : "outline"}
        size="sm"
        onClick={() =>
          routeMode === "none"
            ? setRouteMode("origin")
            : setRouteMode("none")
        }
        className="absolute right-3 top-[6.5rem] z-[1000]"
      >
        <Route className="h-3 w-3" />
        {routeMode !== "none" ? "cancel route" : "safe route"}
      </Button>

      {/* safe-route banner */}
      {(routeMode !== "none" || route || routing) && (
        <SafeRouteBanner
          origin={routeOrigin}
          route={route}
          loading={routing}
          error={routeError}
          onClear={clearRoute}
          onRandomize={randomizeRoute}
        />
      )}

      {error && (
        <div className="absolute right-3 bottom-3 z-[1000] flex items-center gap-2 rounded border border-danger/50 bg-white/90 px-3 py-2 font-mono text-[10px] text-danger shadow-sm">
          <WifiOff className="h-3 w-3" /> feed unavailable
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={load}
        className={cn("absolute right-3 top-20 z-[1000]", source === "loading" && "opacity-50")}
        disabled={source === "loading"}
      >
        <RefreshCw className={cn("h-3 w-3", source === "loading" && "blip")} />
        refresh
      </Button>
    </div>
  );
}
