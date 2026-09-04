"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, Copy, Check, Languages, Users, MessageSquareText } from "lucide-react";
import { getRainfall, rainfallBand, type RainfallPoint } from "@/lib/rainfall";
import { useLiveStats } from "@/lib/live-stats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatNum } from "@/lib/utils";

const LANGS = [
  { code: "en", lang: "English" },
  { code: "hi", lang: "हिन्दी" },
  { code: "as", lang: "অসমীয়া" },
  { code: "ml", lang: "മലയാളം" },
  { code: "bn", lang: "বাংলা" },
];

function template(region: string, code: string): string {
  switch (code) {
    case "hi":
      return `⚠️ BAADH CHETAVANI — ${region} aur aas-paas ke ilakon me bhari baarish ka khatra. Flood ki sthiti me turant uchch sthal par jayein, nadion aur halki naharon se door rahein. Evacuation ke liye aapda sahayak team se sampark karein. — SDMA`;
    case "as":
      return `⚠️ BAN POTHABORONI — ${region} aru nikot anchalot bori borokhonor khoti. Banor sthitit lagate niropod sthanoloi gobo. Nodi aru halka jal nojora kintu. Sankhaile onuprobesi dolot jonog. — SDMA`;
    case "ml":
      return `⚠️ VELLAPPOKKAM MUNNIYARIPP — ${region} ilum sameeppapradeshangalilum kanam mazha bhayam. Vellapokkam undayal udane suvajrotha sthalathekk machuka. Nadikalilum aazhukalilum peade veruka. Odapakachiyude teamumayi bandhappettukolluka. — SDMA`;
    case "bn":
      return `⚠️ BANNA SOTORKONI — ${region} o aashpash-er anchale prabal brishtir khoti. Banna poristhitite sleep-e niropod othan-e chole jan. Nadir o halka joler dhar kachhe jaoa theke birat thakun. Uddaarer jonno team-er sathe jogajog korun. — SDMA`;
    default:
      return `⚠️ FLOOD WARNING — Risk of heavy rain across ${region} and nearby areas. In case of flooding, move to higher ground immediately, stay away from rivers and low-lying floodplains. Contact the rescue command team for evacuation support. — SDMA`;
  }
}

export function AlertComposer() {
  const [points, setPoints] = useState<RainfallPoint[] | null>(null);
  const [activeLang, setActiveLang] = useState(0);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const live = useLiveStats();

  useEffect(() => {
    let alive = true;
    getRainfall().then(({ points: pts }) => {
      if (alive) setPoints(pts);
    });
    return () => {
      alive = false;
    };
  }, []);

  const focus = useMemo(() => {
    const pts = points ?? [];
    const zones = pts
      .filter((p) => rainfallBand(p.precipitation) !== "low")
      .sort((a, b) => b.precipitation - a.precipitation);
    return zones[0]?.name ?? null;
  }, [points]);

  const totalRecipients = live.openCount > 0 ? totalPeople(live.openSignals) : 1250;

  const alerts = useMemo(
    () =>
      LANGS.map((l) => ({
        lang: l.lang,
        code: l.code,
        sms: template(focus ?? "your area", l.code),
        recipients: totalRecipients,
      })),
    [focus, totalRecipients]
  );

  const active = alerts[activeLang] ?? alerts[0];

  const handleSend = () => {
    setSent(true);
    setTimeout(() => setSent(false), 2600);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(active.sms);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5 text-cyan" /> Multilingual Alert Composer
        </CardTitle>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
          <Users className="h-3 w-3" />
          {formatNum(totalRecipients)} recipients
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {alerts.map((a, i) => (
            <button
              key={a.code}
              onClick={() => setActiveLang(i)}
              className={cn(
                "rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors cursor-pointer",
                i === activeLang
                  ? "border-cyan/60 bg-cyan/10 text-cyan"
                  : "border-border-strong text-muted hover:text-foreground"
              )}
            >
              {a.lang}
            </button>
          ))}
        </div>

        <div className="relative rounded-md border border-border-strong bg-slate-50 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              SMS preview · {active.code}
            </span>
            <span className="font-mono text-[9px] text-muted">
              {active.sms.length} chars · 2-3 segments
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-foreground/90">{active.sms}</p>

          {sent && (
            <div className="absolute inset-0 grid place-items-center rounded-md bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded border border-safe/50 bg-safe/10 px-4 py-2 font-mono text-[12px] text-safe">
                <Send className="h-3.5 w-3.5" /> ALERT QUEUED → SMS gateway
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="md" onClick={handleSend} className="flex-1">
            <Send className="h-3.5 w-3.5" /> Broadcast to {formatNum(active.recipients)} people
          </Button>
          <Button variant="cyan" size="icon" onClick={handleCopy} title="Copy template">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-border bg-panel-2/50 px-3 py-1.5 font-mono text-[10px] text-muted">
          <MessageSquareText className="h-3 w-3 text-cyan" />
          Channels: SMS · WhatsApp · Cell-broadcast (CB-SMS) · IVR
        </div>
      </CardContent>
    </Card>
  );
}

function totalPeople(signals: { peopleCount?: number | string | null }[]): number {
  return signals.reduce((a, s) => a + (Number(s.peopleCount) || 0), 0);
}
