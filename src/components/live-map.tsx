"use client";

import "leaflet/dist/leaflet.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useMapEvents } from "react-leaflet";
import { CloudRain, WifiOff, RefreshCw, ZoomIn, Route, Navigation } from "lucide-react";
import { useDashboard } from "@/store/dashboard-store";
import { ASSAM_DISTRICTS } from "@/data/assam-districts";
import { KERALA_DISTRICTS } from "@/data/kerala-districts";
import type { DistrictShape } from "@/data/assam-districts";
import { getRainfall, BAND_META, rainfallBand, type RainfallPoint } from "@/lib/rainfall";
import { type DistrictRiskOutput, type RiskBand } from "@/lib/risk";
import { generateSafeRoute, fallbackRoute } from "@/lib/routing";
import type { DistrictRisk, EvacRoute } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), {
  ssr: false,
  loading: () => <MapLoading />,
});
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Polygon = dynamic(() => import("react-leaflet").then((m) => m.Polygon), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), {
  ssr: false,
});
const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Tooltip), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const ZoomControl = dynamic(() => import("react-leaflet").then((m) => m.ZoomControl), {
  ssr: false,
});

const severityColor: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MODERATE: "#ca8a04",
  LOW: "#16a34a",
};

const severityFill: Record<string, string> = {
  CRITICAL: "rgba(220,38,38,0.32)",
  HIGH: "rgba(234,88,12,0.28)",
  MODERATE: "rgba(202,138,4,0.24)",
  LOW: "rgba(22,163,74,0.22)",
};

const BRAHMAPUTRA: [number, number][] = [
  [26.24, 90.02], [26.31, 90.32], [26.38, 90.62], [26.44, 90.92], [26.5, 91.22],
  [26.55, 91.52], [26.58, 91.82], [26.61, 92.12], [26.65, 92.42], [26.7, 92.72],
  [26.76, 93.02], [26.83, 93.32], [26.9, 93.62], [26.97, 93.92], [27.05, 94.22],
  [27.14, 94.52], [27.24, 94.82], [27.33, 95.12], [27.42, 95.42],
];

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

function getDistrictRisk(name: string, districts: DistrictRisk[]): DistrictRisk | undefined {
  return districts.find((d) => d.name.toLowerCase() === name.toLowerCase());
}

function polygonsFor(state: string): DistrictShape[] {
  return state.toLowerCase() === "kerala" ? KERALA_DISTRICTS : ASSAM_DISTRICTS;
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

/* ---------- scenario layers (visible when zoomed in to analyze) ---------- */
function DistrictLabels({ show }: { show: boolean }) {
  const { scenario } = useDashboard();
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

  if (!L || !show) return null;

  return (
    <>
      {polygonsFor(scenario.state).map((d) => {
        const risk = getDistrictRisk(d.name, scenario.districts);
        if (!risk) return null;
        const icon = L.divIcon({
          className: "",
          html: `<div class="dist-label" data-sev="${risk.severity}">${d.name}</div>`,
          iconSize: [90, 18],
          iconAnchor: [45, 9],
        });
        return (
          <Marker
            key={`l-${d.name}`}
            position={[risk.centroid[1], risk.centroid[0]]}
            icon={icon}
            interactive={false}
          />
        );
      })}
    </>
  );
}

function StateIndicator({ show }: { show: boolean }) {
  const { scenario } = useDashboard();
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

  if (!L || !show) return null;

  const icon = L.divIcon({
    className: "",
    html: `<div class="state-pulse">${scenario.state.toUpperCase()} · FLOOD ACTIVE · ZOOM</div>`,
    iconSize: [208, 30],
    iconAnchor: [104, 15],
  });
  return <Marker position={scenario.center} icon={icon} interactive={false} />;
}

function EvacRouteLayer({ route }: { route: EvacRoute }) {
  const [step, setStep] = useState(0);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % route.path.length), 600);
    let alive = true;
    import("leaflet").then((mod) => {
      if (alive) setL(mod);
    });
    return () => {
      clearInterval(t);
      alive = false;
    };
  }, [route.path.length]);

  const pts = route.path as [number, number][];
  const head = pts[step];
  const startIcon = L
    ? L.divIcon({
        className: "",
        html: `<div class="route-start"><span>●</span> ${route.from}</div>`,
        iconSize: [70, 16],
        iconAnchor: [0, 8],
      })
    : undefined;
  const endIcon = L
    ? L.divIcon({
        className: "",
        html: `<div class="route-end"><span>▼</span> ${route.to}</div>`,
        iconSize: [90, 16],
        iconAnchor: [45, 16],
      })
    : undefined;

  return (
    <>
      <Polyline positions={pts} pathOptions={{ color: "#0ea5e9", weight: 6, opacity: 0.18 }} />
      <Polyline
        positions={pts}
        pathOptions={{
          color: "#0284c7",
          weight: 2.5,
          opacity: 0.9,
          dashArray: "6 8",
          lineCap: "round",
        }}
      />
      {head && (
        <CircleMarker
          center={head}
          radius={4.5}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#0ea5e9", fillOpacity: 1 }}
        />
      )}
      {startIcon && <Marker position={pts[0]} interactive={false} icon={startIcon} />}
      {endIcon && <Marker position={pts[pts.length - 1]} interactive={false} icon={endIcon} />}
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

function LiveRiskLayer({ points }: { points: DistrictRiskOutput[] | null }) {
  if (!points) return null;
  return (
    <>
      {points.map((d) => {
        const radius = d.severity === "CRITICAL" ? 9 : d.severity === "HIGH" ? 7 : d.severity === "MODERATE" ? 5 : 3.4;
        const color = riskColor[d.severity as RiskBand] ?? riskColor.LOW;
        return (
          <CircleMarker
            key={`riski-${d.name}`}
            center={[d.lat, d.lon]}
            radius={d.riskScore > 0 ? radius : 0}
            pathOptions={{
              color,
              weight: 1.2,
              fillColor: color,
              fillOpacity: d.severity === "CRITICAL" ? 0.85 : d.severity === "LOW" ? 0.45 : 0.72,
              opacity: 0.9,
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
          </CircleMarker>
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
  const { scenario, selectedDistrict, setSelectedDistrict } = useDashboard();
  const [hovered, setHovered] = useState<string | null>(null);
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

  const districtColors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const d of polygonsFor(scenario.state)) {
      const risk = getDistrictRisk(d.name, scenario.districts);
      map[d.name] = risk ? severityColor[risk.severity] : "#94a3b8";
    }
    return map;
  }, [scenario]);

  const critical = scenario.districts.filter((d) => d.severity === "CRITICAL").length;
  const high = scenario.districts.filter((d) => d.severity === "HIGH").length;
  const totalAffected = scenario.districts.reduce((a, d) => a + d.affected, 0);
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
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
        />
        <ZoomControl position="bottomright" />

        <RainfallMarkers points={points} />

        {/* all-India live risk layer (always) */}
        <LiveRiskLayer points={riskPoints} />

        {/* Brahmaputra river */}
        <Polyline positions={BRAHMAPUTRA} pathOptions={{ color: "#38bdf8", weight: 3, opacity: 0.8 }} />

        {/* scenario district polygons (state-aware) */}
        {polygonsFor(scenario.state).map((d) => {
          const risk = getDistrictRisk(d.name, scenario.districts);
          const active = selectedDistrict === d.name;
          return d.rings.map((ring, i) => (
            <Polygon
              key={`${d.name}-${i}`}
              positions={ring as [number, number][]}
              pathOptions={{
                color: districtColors[d.name],
                weight: active ? 2.5 : risk ? 1.6 : 0.8,
                fillColor: risk ? severityFill[risk.severity] : "#e2e8f0",
                fillOpacity: risk ? 0.8 : 0.5,
                opacity: hovered === d.name || active ? 1 : risk ? 0.95 : 0.7,
              }}
              eventHandlers={{
                mouseover: () => setHovered(d.name),
                mouseout: () => setHovered(null),
                click: () => setSelectedDistrict(selectedDistrict === d.name ? null : d.name),
              }}
            >
              <Tooltip sticky direction="top" className="district-tooltip" opacity={1}>
                <div className="font-semibold">{d.name}</div>
                {risk ? (
                  <div className="mt-0.5 font-mono text-[10px]">
                    <span className={cn(risk.severity === "CRITICAL" && "text-danger")}>
                      {risk.severity}
                    </span>{" "}
                    · Risk {risk.riskScore}/100 · {risk.affected.toLocaleString("en-IN")} displaced
                  </div>
                ) : (
                  <div className="mt-0.5 text-[10px] text-muted">No active risk</div>
                )}
              </Tooltip>
            </Polygon>
          ));
        })}

        <DistrictLabels show={detailed} />
        <StateIndicator show={!detailed} />

        {/* evacuation routes — shown when analyzing */}
        {detailed &&
          scenario.routes.map((r) => <EvacRouteLayer key={r.id} route={r} />)}

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

      {/* top-left overlay: scenario */}
      <div className="pointer-events-none absolute top-3 left-3 z-[1000] rounded border border-border-strong bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
          {scenario.name} · {scenario.state} {scenario.year}
        </div>
        <div className="mt-1 font-mono text-[10px] text-muted">
          <span className="text-danger">{critical} CRITICAL</span> ·{" "}
          <span className="text-warn">{high} HIGH</span>
        </div>
      </div>

      {/* top-right: displaced */}
      <div className="pointer-events-none absolute top-3 right-3 z-[1000] rounded border border-border-strong bg-white/90 px-3 py-2 text-right shadow-sm backdrop-blur">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Displaced</div>
        <div className="font-mono text-lg font-bold text-danger">
          {totalAffected.toLocaleString("en-IN")}
        </div>
        <div className="font-mono text-[9px] text-muted">
          people across {scenario.districts.length} districts
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
        <div className="flex gap-2">
          {(Object.keys(BAND_META) as Array<keyof typeof BAND_META>).map((b) => (
            <div
              key={b}
              className="flex items-center gap-1.5 rounded border border-border-strong bg-white/90 px-2.5 py-1.5 font-mono text-[9px] text-muted shadow-sm"
            >
              <span className="h-2 w-2 rounded-sm" style={{ background: BAND_META[b].color }} />
              {BAND_META[b].label}
            </div>
          ))}
          {detailed && (
            <>
              <div className="flex items-center gap-1.5 rounded border border-border-strong bg-white/90 px-2.5 py-1.5 font-mono text-[9px] text-muted shadow-sm">
                <span className="h-2 w-2 rounded-sm" style={{ background: "#dc2626" }} /> Critical
              </div>
              <div className="flex items-center gap-1.5 rounded border border-border-strong bg-white/90 px-2.5 py-1.5 font-mono text-[9px] text-muted shadow-sm">
                <span className="h-2 w-2 rounded-sm" style={{ background: "#ea580c" }} /> High
              </div>
              <div className="flex items-center gap-1.5 rounded border border-border-strong bg-white/90 px-2.5 py-1.5 font-mono text-[9px] text-muted shadow-sm">
                <span className="h-2 w-2 rounded-sm" style={{ background: "#16a34a" }} /> Safe
              </div>
            </>
          )}
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
