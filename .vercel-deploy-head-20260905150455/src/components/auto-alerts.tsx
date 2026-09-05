"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Languages, Send, ShieldCheck } from "lucide-react";
import { getRainfall, rainfallBand, type RainfallPoint } from "@/lib/rainfall";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LANGS = [
  { code: "hi", name: "हिन्दी" },
  { code: "en", name: "English" },
  { code: "as", name: "অসমীয়া" },
  { code: "ml", name: "മലയാളം" },
  { code: "bn", name: "বাংলা" },
];

function template(region: RainfallPoint, lang: string): string {
  const rate = region.precipitation.toFixed(1);
  const pr = region.probability;
  switch (lang) {
    case "hi":
      return `⚠️ BARISH CHETAVANI — ${region.name} me ${rate} mm/ghanta bhari baarish (${pr}%). Flood ka khatra. Surakshit jagah par jayein, nadin se door rahein. — SDMA`;
    case "as":
      return `⚠️ BOROKHON SOTORKONI — ${region.name} ot ${rate} mm/ghonta bori borokhon (${pr}%). Banor bhititi. Niropod jaigat jao. — SDMA`;
    case "ml":
      return `⚠️ MALA MUNNIYARIPP — ${region.name} il ${rate} mm/manikkoor kanam mazha (${pr}%). Vellapokkam sakhyatha. Suvajrotha jagathekk machuka. — SDMA`;
    case "bn":
      return `⚠️ BRISHTI SOTORKONI — ${region.name} e ${rate} mm/ghonta prabal brishti (${pr}%). Bandher bhoy. Niropod jaygay jao. — SDMA`;
    default:
      return `⚠️ RAINFALL WARNING — Heavy rain of ${rate} mm/hr (${pr}% probability) in ${region.name}. Flood risk elevated. Move to higher ground. — SDMA`;
  }
}

export function AutoAlerts() {
  const [points, setPoints] = useState<RainfallPoint[] | null>(null);
  const [source, setSource] = useState<"live" | "seeded">("live");
  const [activeLang, setActiveLang] = useState(0);
  const [sent, setSent] = useState(false);
  const [via, setVia] = useState<"swytchcode" | "simulated" | null>(null);

  useEffect(() => {
    let alive = true;
    getRainfall().then(({ points: pts, source: src }) => {
      if (!alive) return;
      setPoints(pts);
      setSource(src);
    });
    return () => {
      alive = false;
    };
  }, []);

  const riskZones = useMemo(() => {
    const pts = points ?? [];
    return pts
      .filter((p) => rainfallBand(p.precipitation) !== "low")
      .sort((a, b) => b.precipitation - a.precipitation)
      .slice(0, 3);
  }, [points]);

  const active = LANGS[activeLang];
  const primary = riskZones[0];
  const alertText = primary
    ? template(primary, active.code)
    : `⚠️ NO WARNING — Rainfall within safe limits across monitored regions. — SDMA`;

  const handleSend = async () => {
    setSent(true);
    setVia(null);
    try {
      const res = await fetch("/api/alerts/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: active.code,
          region: primary?.name ?? "unknown",
          sms: alertText,
        }),
      });
      const json = (await res.json()) as { channel?: string };
      setVia(json?.channel === "swytchcode" ? "swytchcode" : "simulated");
    } catch {
      setVia("simulated");
    }
    setTimeout(() => setSent(false), 2600);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-safe" /> Automated Alerts
        </CardTitle>
        <Badge className="!text-[9px] text-safe border-safe/40 bg-safe/10">
          AI auto-generated · {source === "live" ? "live feed" : "cached"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {LANGS.map((l, i) => (
            <button
              key={l.code}
              onClick={() => setActiveLang(i)}
              className={cn(
                "rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors cursor-pointer",
                i === activeLang
                  ? "border-safe/60 bg-safe/10 text-safe"
                  : "border-border-strong text-muted hover:text-foreground"
              )}
            >
              {l.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {riskZones.map((z) => {
            const band = rainfallBand(z.precipitation);
            return (
              <span
                key={z.name}
                className={cn(
                  "rounded border px-2 py-0.5 font-mono text-[10px]",
                  band === "high" ? "border-danger/50 text-danger" : "border-warn/50 text-warn"
                )}
              >
                {z.name} {z.precipitation.toFixed(1)}mm
              </span>
            );
          })}
          {riskZones.length === 0 && (
            <span className="rounded border border-border px-2 py-0.5 font-mono text-[10px] text-muted">
              no risk zones
            </span>
          )}
        </div>

        <div className="relative rounded-md border border-border-strong bg-slate-50 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted">
              <Languages className="h-3 w-3" /> auto SMS · {active.code}
            </span>
            <span className="font-mono text-[9px] text-muted">
              triggered by rainfall threshold
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-foreground/90">{alertText}</p>
          {sent && (
            <div className="absolute inset-0 grid place-items-center rounded-md bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded border border-safe/50 bg-safe/10 px-4 py-2 font-mono text-[12px] text-safe">
                <Send className="h-3.5 w-3.5" />
                {via === "swytchcode"
                  ? "AUTO-BROADCAST EXECUTED VIA SWYTCHCODE"
                  : "AUTO-BROADCAST QUEUED (SIMULATED)"}
              </div>
            </div>
          )}
        </div>

        <Button variant="primary" size="md" className="w-full" onClick={handleSend} disabled={riskZones.length === 0}>
          <ShieldCheck className="h-3.5 w-3.5" />
          Auto-broadcast to affected regions
        </Button>
        <p className="font-mono text-[9px] text-muted">
          Rule: rainfall ≥ 2.5 mm/hr for 2 consecutive feeds → alert generation. Human-in-the-loop
          before dispatch.
        </p>
      </CardContent>
    </Card>
  );
}
