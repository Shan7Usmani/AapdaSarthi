"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
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
import { ScrollReveal, StaggerContainer, staggerItem, AnimatedCounter, GlassCard } from "@/components/motion";

const HeroScene = dynamic(
  () => import("@/components/hero-scene").then((m) => m.HeroSceneInner),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-[#060a10]" /> }
);

const ROLES = [
  {
    key: "citizen",
    href: "/citizen",
    title: "I'm in trouble",
    role: "CITIZEN",
    desc: "Report an SOS with your live location, a message, photo, video or voice note. Help reaches the nearest rescuer automatically.",
    icon: Siren,
    neonClass: "neon-red",
    glowColor: "rgba(255,59,92,0.15)",
    borderColor: "rgba(255,59,92,0.3)",
    cta: "Send SOS",
  },
  {
    key: "rescuer",
    href: "/rescuer",
    title: "I'm a rescuer",
    role: "RESCUER",
    desc: "See SOS signals sorted by distance, take control of a situation, and request medkits, foodkits & transport from HQ.",
    icon: ShieldAlert,
    neonClass: "neon-amber",
    glowColor: "rgba(255,176,46,0.15)",
    borderColor: "rgba(255,176,46,0.3)",
    cta: "Dispatch panel",
  },
  {
    key: "hq",
    href: "/hq",
    title: "I run the command center",
    role: "HQ · DISASTER CONTROL",
    desc: "Live all-India rainfall map, AI risk engine, resource allocation, incoming SOS board and automated multilingual alerts.",
    icon: Activity,
    neonClass: "neon-cyan",
    glowColor: "rgba(0,217,255,0.15)",
    borderColor: "rgba(0,217,255,0.3)",
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
    statusColor: "neon-green",
  },
  {
    phase: "02",
    icon: Bot,
    title: "Autonomous Response · AI Dispatch",
    desc: "An AI dispatcher that triages SOS, auto-suggests the nearest available team and drafts multilingual alerts in real time from a single intake form.",
    status: "Next up",
    statusColor: "neon-cyan",
  },
  {
    phase: "03",
    icon: Satellite,
    title: "Mesh & Satellite · No network at all",
    desc: "Device-to-device mesh messaging and satellite backhaul for telemetry so coordination survives when cell towers and internet go down.",
    status: "On roadmap",
    statusColor: "text-muted",
  },
  {
    phase: "04",
    icon: Activity,
    title: "Smarter HQ · Forecast Fusion",
    desc: "Blend live rainfall, river-gauge and satellite flood models into a predictive risk score that tells HQ where danger is forming before it peaks.",
    status: "On roadmap",
    statusColor: "text-muted",
  },
  {
    phase: "05",
    icon: Globe2,
    title: "Scale to Nation · Open platform",
    desc: "A standardized API and pluggable SOS/resource integrations so any state disaster cell, NGO or volunteer network can join the same response loop.",
    status: "On roadmap",
    statusColor: "text-muted",
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
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* 3D Hero Scene */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="absolute inset-0 bg-[#060a10]" />}>
          <HeroScene />
        </Suspense>
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a10]/40 via-transparent to-[#060a10]" />
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#00b4d8] to-[#0096b7] text-white shadow-[0_0_20px_rgba(0,180,216,0.35)]">
            <Waves className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight text-foreground font-display">
              AAPDA SAARTHI
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              Disaster Response Intelligence Platform
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full glass-1 px-3.5 py-1.5 text-[11px] font-medium text-muted">
          <Radio className="h-3.5 w-3.5 text-[#00b4d8]" />
          DECODE SIH 2026 · BHARAT SHAKTI · PS3
        </div>
      </div>

      {/* Hero content */}
      <main className="relative z-20 flex flex-1 flex-col items-center justify-center gap-9 px-5 py-10 sm:px-8">
        <div className="max-w-3xl text-center">
          <ScrollReveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full glass-1 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00b4d8]">
              <CloudRain className="h-4 w-4" />
              {live ? "Live rainfall telemetry" : "Rainfall telemetry"} · Open-Meteo
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-6xl">
              When disaster hits,
              <br />
              <span className="gradient-text">
                Aapda Saarthi responds.
              </span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
              One platform connecting citizens in trouble, the nearest rescuer, and the command
              center that allocates boats, medkits and rations. Live rainfall feeds, AI risk scoring,
              automated multilingual alerts.
            </p>
          </ScrollReveal>
        </div>

        {/* Live system status */}
        <ScrollReveal delay={0.3}>
          <GlassCard depth={3} className="w-full max-w-3xl p-4" hover={false}>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                <span className="h-2 w-2 rounded-full bg-[#00ff7a] live-dot-green" /> System live
              </span>
              <Link href="/hq" className="font-mono text-[10px] uppercase tracking-wider text-[#00b4d8] hover:underline">
                open command center →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="flex flex-col items-center rounded-xl glass-1 px-2 py-3">
                <AnimatedCounter value={openSos} className="text-xl font-black text-[#ff3b5c]" />
                <div className="font-mono text-[9px] uppercase text-muted mt-1">open SOS</div>
              </div>
              <div className="flex flex-col items-center rounded-xl glass-1 px-2 py-3">
                <AnimatedCounter value={claimedSos} className="text-xl font-black text-[#ffb02e]" />
                <div className="font-mono text-[9px] uppercase text-muted mt-1">active rescues</div>
              </div>
              <div className="flex flex-col items-center rounded-xl glass-1 px-2 py-3">
                <AnimatedCounter value={rescuersOnline} className="text-xl font-black text-[#00b4d8]" />
                <div className="font-mono text-[9px] uppercase text-muted mt-1">teams online</div>
              </div>
              <div className="flex flex-col items-center rounded-xl glass-1 px-2 py-3">
                <AnimatedCounter value={pendingReq} className="text-xl font-black text-[#00ff7a]" />
                <div className="font-mono text-[9px] uppercase text-muted mt-1">reqs pending</div>
              </div>
            </div>
          </GlassCard>
        </ScrollReveal>

        {/* Rainfall legend */}
        {points && (
          <ScrollReveal delay={0.4}>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] font-medium text-muted">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_META.high.color }} />
                {high} heavy-rain regions
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_META.moderate.color }} />
                {moderate} moderate
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_META.low.color }} />
                {points.length - high - moderate} dry
              </span>
            </div>
          </ScrollReveal>
        )}

        {/* Role cards */}
        <StaggerContainer className="grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3" staggerDelay={0.1}>
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <motion.div key={r.key} variants={staggerItem}>
                <Link
                  href={r.href}
                  className="group flex h-full flex-col gap-3.5 glass-2 rounded-2xl p-6 glass-hover transition-all"
                  style={{ ["--glow-color" as string]: r.glowColor }}
                >
                  <div
                    className="grid h-12 w-12 place-items-center rounded-xl"
                    style={{ background: r.glowColor, border: `1px solid ${r.borderColor}` }}
                  >
                    <Icon className={cn("h-6 w-6", r.neonClass)} />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
                    {r.role}
                  </div>
                  <div className="text-lg font-bold leading-snug text-foreground font-display">{r.title}</div>
                  <p className="text-[13px] leading-relaxed text-muted">{r.desc}</p>
                  <div className="mt-auto flex items-center gap-1.5 pt-1 text-[13px] font-semibold text-[#00b4d8]">
                    {r.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </StaggerContainer>

        {/* Feature chips */}
        <ScrollReveal>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 text-[12px] font-medium text-muted">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#00b4d8]" /> 3 roles · one platform
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#00b4d8]" /> live geolocation SOS
            </span>
            <span className="flex items-center gap-1.5">
              <Globe2 className="h-4 w-4 text-[#00b4d8]" /> real rainfall · Open-Meteo
            </span>
          </div>
        </ScrollReveal>
      </main>

      {/* Wave divider */}
      <div className="relative z-10">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path d="M0 60L48 52C96 44 192 28 288 22C384 16 480 20 576 28C672 36 768 48 864 50C960 52 1056 44 1152 36C1248 28 1344 20 1392 16L1440 12V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0Z" fill="rgba(255,255,255,0.02)" />
        </svg>
      </div>

      {/* Roadmap section */}
      <section className="relative z-10 w-full border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.15)] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00b4d8]">
              <Rocket className="h-4 w-4" />
              Future scope &amp; roadmap
            </div>
            <h2 className="mb-2 font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              From a working prototype to a national response loop
            </h2>
            <p className="mb-8 max-w-2xl text-[14px] leading-relaxed text-muted">
              Aapda Saarthi ships as an offline-first platform today. Here is the
              path from that foundation to a system that keeps coordinating even
              when the network — and the forecast — fail together.
            </p>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
            {FUTURE_SCOPE.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.phase}
                  variants={staggerItem}
                  className="flex flex-col gap-3 glass-2 rounded-2xl p-5 glass-hover"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl glass-1">
                      <Icon className="h-5 w-5 text-[#00b4d8]" />
                    </div>
                    <span className={cn("rounded-full glass-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", f.statusColor)}>
                      {f.status}
                    </span>
                  </div>
                  <div className="text-[16px] font-bold leading-snug text-foreground font-display">{f.title}</div>
                  <p className="text-[13px] leading-relaxed text-muted">{f.desc}</p>
                  <div className="mt-auto font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    Phase {f.phase}
                  </div>
                </motion.div>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)] px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted backdrop-blur-sm">
        AAPDA SAARTHI · AI Disaster Response Intelligence Platform · Decode SIH 2026 · Bharat Shakti PS3
      </footer>
    </div>
  );
}
