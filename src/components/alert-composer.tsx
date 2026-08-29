"use client";

import { useState } from "react";
import { Send, Copy, Check, Languages, Users, MessageSquareText } from "lucide-react";
import { useDashboard } from "@/store/dashboard-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatNum } from "@/lib/utils";

export function AlertComposer() {
  const { scenario } = useDashboard();
  const [activeLang, setActiveLang] = useState(0);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const alerts = scenario.alerts;
  const active = alerts[activeLang] ?? alerts[0];
  const totalRecipients = alerts.reduce((a, al) => a + al.recipients, 0);

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
              {active.sms.length} chars · 1 segment
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
