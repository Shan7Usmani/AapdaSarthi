"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Siren,
  ShieldAlert,
  Activity,
  Waves,
  MapPin,
  ArrowRight,
  CloudRain,
  Users,
  Radio,
  Globe2,
  Rocket,
  Satellite,
  Bot,
  Network,
} from "lucide-react";
import { getRainfall, BAND_META, rainfallBand, type RainfallPoint } from "@/lib/rainfall";
import { useSosStore } from "@/store/sos-store";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    key: "citizen",
    href: "/citizen",
    title: "I'm in trouble",
    role: "CITIZEN",
    desc: "Report an SOS with your live location, a message, photo, video or voice note. Help reaches the nearest rescuer automatically.",
    icon: Siren,
    chip: "bg-red-50 text-red-600 border-red-200",
    hover: "hover:border-red-300",
    cta: "Send SOS",
  },
  {
    key: "rescuer",
    href: "/rescuer",
    title: "I'm a rescuer",
    role: "RESCUER",
    desc: "See SOS signals sorted by distance, take control of a situation, and request medkits, foodkits & transport from HQ.",
    icon: ShieldAlert,
    chip: "bg-orange-50 text-orange-600 border-orange-200",
    hover: "hover:border-orange-300",
    cta: "Dispatch panel",
  },
  {
    key: "hq",
    href: "/hq",
    title: "I run the command center",
    role: "HQ · DISASTER CONTROL",
    desc: "Live all-India rainfall map, AI risk engine, resource allocation, incoming SOS board and automated multilingual alerts.",
    icon: Activity,
    chip: "bg-sky-50 text-sky-600 border-sky-200",
    hover: "hover:border-sky-300",
    cta: "Open command center",
  },
];

const FUTURE_SCOPE = [
  {
    phase: "01",
    icon: Network,
    title: "Resilient Reach · Offline-first",
    desc: "Service-worker PWA caching, local SOS queues that auto-sync on reconnection, and an SMS fallback so a citizen with no data can still signal for help.",
    status: "Live today",
    tag: "bg-emerald-50 text-emerald-600 border-emerald-200",
    chip: "bg-emerald-50 text-emerald-600",
  },
  {
    phase: "02",
    icon: Bot,
    title: "Autonomous Response · AI Dispatch",
    desc: "An AI dispatcher that triages SOS, auto-suggests the nearest available team and drafts multilingual alerts in real time from a single intake form.",
    status: "Next up",
    tag: "bg-sky-50 text-sky-600 border-sky-200",
    chip: "bg-sky-50 text-sky-600",
  },
  {
    phase: "03",
    icon: Satellite,
    title: "Mesh & Satellite · No network at all",
    desc: "Device-to-device mesh messaging and satellite backhaul for telemetry so coordination survives when cell towers and internet go down.",
    status: "On roadmap",
    tag: "bg-slate-50 text-slate-500 border-slate-200",
    chip: "bg-slate-100 text-slate-500",
  },
  {
    phase: "04",
    icon: Activity,
    title: "Smarter HQ · Forecast Fusion",
    desc: "Blend live rainfall, river-gauge and satellite flood models into a predictive risk score that tells HQ where danger is forming before it peaks.",
    status: "On roadmap",
    tag: "bg-slate-50 text-slate-500 border-slate-200",
    chip: "bg-slate-100 text-slate-500",
  },
  {
    phase: "05",
    icon: Globe2,
    title: "Scale to Nation · Open platform",
    desc: "A standardized API and pluggable SOS/resource integrations so any state disaster cell, NGO or volunteer network can join the same response loop.",
    status: "On roadmap",
    tag: "bg-slate-50 text-slate-500 border-slate-200",
    chip: "bg-slate-100 text-slate-500",
  },
];

export default function Landing() {
  const [points, setPoints] = useState<RainfallPoint[] | null>(null);
  const [live, setLive] = useState<boolean>(true);
  const openSos = useSosStore((s) => s.sos.filter((x) => x.status === "open").length);
  const claimedSos = useSosStore((s) =>
    s.sos.filter((x) => x.status === "claimed" || x.status === "reached" || x.status === "delivered").length
  );
  const rescuersOnline = useSosStore((s) => s.rescuers.filter((r) => r.online).length);
  const pendingReq = useSosStore((s) => s.requests.filter((r) => r.status === "pending").length);

  useEffect(() => {
    let alive = true;
    getRainfall().then(({ points: pts, source }) => {
      if (!alive) return;
      setPoints(pts);
      setLive(source === "live");
    });
    return () => {
      alive = false;
    };
  }, []);

  const high = points?.filter((p) => rainfallBand(p.precipitation) === "high").length ?? 0;
  const moderate = points?.filter((p) => rainfallBand(p.precipitation) === "moderate").length ?? 0;

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* soft top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-sky-100/70 to-transparent" />

      <div className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan text-white shadow-sm">
            <Waves className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight">AAPDA SAARTHI</div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              Disaster Response Intelligence Platform
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-medium text-muted shadow-sm">
          <Radio className="h-3.5 w-3.5 text-cyan" />
          DECODE SIH 2026 · BHARAT SHAKTI · PS3
        </div>
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-9 px-5 py-10 sm:px-8">
        <div className="max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan shadow-sm">
            <CloudRain className="h-4 w-4" />
            {live ? "Live rainfall telemetry" : "Rainfall telemetry"} · Open-Meteo
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
            When disaster hits,
            <br />
            <span className="bg-gradient-to-r from-cyan to-blue-600 bg-clip-text text-transparent">
              Aapda Saarthi responds.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-slate-500">
            One platform connecting citizens in trouble, the nearest rescuer, and the command
            center that allocates boats, medkits and rations. Live rainfall feeds, AI risk scoring,
            automated multilingual alerts.
          </p>
        </div>

        {/* live system status */}
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              <span className="h-2 w-2 rounded-full bg-safe live-dot" /> System live
            </span>
            <Link href="/hq" className="font-mono text-[10px] uppercase tracking-wider text-cyan hover:underline">
              open command center →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="flex flex-col items-center rounded-lg border border-border bg-panel-2/60 px-2 py-2.5">
              <div className="text-xl font-black text-danger">{openSos}</div>
              <div className="font-mono text-[9px] uppercase text-muted">open SOS</div>
            </div>
            <div className="flex flex-col items-center rounded-lg border border-border bg-panel-2/60 px-2 py-2.5">
              <div className="text-xl font-black text-warn">{claimedSos}</div>
              <div className="font-mono text-[9px] uppercase text-muted">active rescues</div>
            </div>
            <div className="flex flex-col items-center rounded-lg border border-border bg-panel-2/60 px-2 py-2.5">
              <div className="text-xl font-black text-cyan">{rescuersOnline}</div>
              <div className="font-mono text-[9px] uppercase text-muted">teams online</div>
            </div>
            <div className="flex flex-col items-center rounded-lg border border-border bg-panel-2/60 px-2 py-2.5">
              <div className="text-xl font-black text-safe">{pendingReq}</div>
              <div className="font-mono text-[9px] uppercase text-muted">reqs pending</div>
            </div>
          </div>
        </div>

        {points && (
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] font-medium text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_META.high.color }} />
              {high} heavy-rain regions
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: BAND_META.moderate.color }}
              />
              {moderate} moderate
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_META.low.color }} />
              {points.length - high - moderate} dry
            </span>
          </div>
        )}

        <div className="grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.key}
                href={r.href}
                className={cn(
                  "group flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
                  r.hover
                )}
              >
                <div className={cn("grid h-12 w-12 place-items-center rounded-xl border", r.chip)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {r.role}
                </div>
                <div className="text-lg font-bold leading-snug text-slate-900">{r.title}</div>
                <p className="text-[13px] leading-relaxed text-slate-500">{r.desc}</p>
                <div className="mt-auto flex items-center gap-1.5 pt-1 text-[13px] font-semibold text-cyan">
                  {r.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 text-[12px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-cyan" /> 3 roles · one platform
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-cyan" /> live geolocation SOS
          </span>
          <span className="flex items-center gap-1.5">
            <Globe2 className="h-4 w-4 text-cyan" /> real rainfall · Open-Meteo
          </span>
        </div>
      </main>

      <section className="relative z-10 w-full border-t border-slate-200 bg-slate-50/60 px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan">
            <Rocket className="h-4 w-4" />
            Future scope &amp; roadmap
          </div>
          <h2 className="mb-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            From a working prototype to a national response loop
          </h2>
          <p className="mb-8 max-w-2xl text-[14px] leading-relaxed text-slate-500">
            Aapda Saarthi ships as an offline-first platform today. Here is the
            path from that foundation to a system that keeps coordinating even
            when the network — and the forecast — fail together.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FUTURE_SCOPE.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.phase}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className={cn("grid h-10 w-10 place-items-center rounded-xl border", f.chip)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", f.tag)}>
                      {f.status}
                    </span>
                  </div>
                  <div className="text-[18px] font-bold leading-snug text-slate-900">{f.title}</div>
                  <p className="text-[13px] leading-relaxed text-slate-500">{f.desc}</p>
                  <div className="mt-auto font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Phase {f.phase}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/70 px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
        AAPDA SAARTHI · AI Disaster Response Intelligence Platform · Decode SIH 2026 · Bharat Shakti PS3
      </footer>
    </div>
  );
}
