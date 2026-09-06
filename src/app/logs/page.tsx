"use client";

import { useMemo, useState } from "react";
import {
  Siren,
  CheckCircle2,
  Clock3,
  MapPin,
  Users,
  Package,
  Stethoscope,
  Truck,
  Utensils,
  RotateCcw,
  Phone,
  MessageSquareText,
  Waves,
  Search,
  History,
} from "lucide-react";
import { useSosStore, formatCitizenPhone } from "@/store/sos-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";

const SOS_STATUS = {
  open: { cls: "border-danger/40 bg-danger/5", icon: "text-danger", dot: "bg-danger", label: "OPEN", labelCls: "text-danger" },
  claimed: { cls: "border-warn/40 bg-warn/5", icon: "text-warn", dot: "bg-warn", label: "TAKEN CONTROL", labelCls: "text-warn" },
  reached: { cls: "border-cyan/40 bg-cyan/5", icon: "text-cyan", dot: "bg-cyan", label: "ON SITE", labelCls: "text-cyan" },
  delivered: { cls: "border-border bg-panel-2/60 opacity-80", icon: "text-muted", dot: "bg-muted", label: "DELIVERED", labelCls: "text-muted" },
} as const;

const REQUEST_STATUS: Record<string, string> = {
  pending: "text-warn border-warn/40 bg-warn/10",
  dispatched: "text-cyan border-cyan/40 bg-cyan/10",
  received: "text-[#ffb02e] border-[rgba(255,176,46,0.3)] bg-[rgba(255,176,46,0.1)]",
  allocated: "text-safe border-safe/40 bg-safe/10",
};

const STAGE_CHIP = {
  ack: { label: "ACK", cls: "text-cyan border-cyan/30 bg-cyan/10" },
  claimed: { label: "TAKING CONTROL", cls: "text-warn border-warn/30 bg-warn/10" },
  reached: { label: "ON SITE", cls: "text-cyan border-cyan/30 bg-cyan/10" },
  delivered: { label: "DELIVERED", cls: "text-safe border-safe/30 bg-safe/10" },
} as const;

function updatedStamp(item: { timestamp: string; updatedAt?: string }) {
  return item.updatedAt || item.timestamp;
}

function toLocal(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusFilter(status: string, all: string) {
  return all === "all" ? true : status === all;
}

export default function LogsPage() {
  const { sos, requests, rescuers, resetDemo } = useSosStore();
  const [sosFilter, setSosFilter] = useState<string>("all");
  const [reqFilter, setReqFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filteredSos = useMemo(
    () =>
      sos
        .filter((s) => s && typeof s.timestamp === "string")
        .filter((s) => statusFilter(s.status, sosFilter))
        .filter((s) =>
          !q
            ? true
            : [s.citizenName, s.message, s.rescuerName ?? "", s.citizenPhone ?? "", s.location?.lat.toString() ?? "", s.location?.lng.toString() ?? ""]
                .join(" ")
                .toLowerCase()
                .includes(q)
        )
        .sort((a, b) => updatedStamp(b).localeCompare(updatedStamp(a))),
    [sos, sosFilter, q]
  );

  const filteredRequests = useMemo(
    () =>
      requests
        .filter((r) => r && typeof r.timestamp === "string")
        .filter((r) => statusFilter(r.status === "fulfilled" ? "allocated" : r.status, reqFilter))
        .sort((a, b) => updatedStamp(b).localeCompare(updatedStamp(a))),
    [requests, reqFilter]
  );

  const validSos = useMemo(() => sos.filter((s) => s && typeof s.timestamp === "string"), [sos]);
  const validRequests = useMemo(() => requests.filter((r) => r && typeof r.timestamp === "string"), [requests]);
  const validMsgs = useMemo(
    () =>
      validSos.flatMap((s) => s.citizenMsgs ?? []).filter((m) => m && typeof m.at === "string"),
    [validSos]
  );

  // chronological event timeline reconstructed from SOS lifecycle + messages + updates + requests
  const timeline = useMemo(() => {
    type Ev = { at: string; type: string; text: string; sub?: string };
    const evs: Ev[] = [];
    validSos.forEach((s) => {
      evs.push({ at: s.timestamp, type: "sos", text: `SOS by ${s.citizenName} · ${s.peopleCount} people`, sub: s.message });
      if (s.status !== "open" && s.rescuerName) {
        evs.push({ at: s.updatedAt || s.timestamp, type: "claim", text: `${s.rescuerName} took control` });
      }
      if (s.status === "reached" || s.status === "delivered") {
        evs.push({ at: s.reachedAt || s.timestamp, type: "reach", text: `${s.rescuerName || "rescuer"} reached location` });
      }
      if (s.status === "delivered") {
        evs.push({ at: s.deliveredAt || s.timestamp, type: "deliver", text: `Item delivered to ${s.citizenName}` });
      }
      (s.citizenMsgs ?? []).forEach((m) => evs.push({ at: m.at, type: "sms", text: `SMS → ${m.to} (${STAGE_CHIP[m.stage].label})`, sub: m.text }));
      (s.updates ?? []).forEach((u) => evs.push({ at: u.at, type: "update", text: `${u.by} (${u.role})`, sub: u.text }));
    });
    validRequests.forEach((r) => {
      evs.push({
        at: r.timestamp,
        type: "request",
        text: `${r.rescuerName} requested resources`,
        sub: `medkits ${r.medkits} · food ${r.foodkits} · transport ${r.transports}`,
      });
      if (r.dispatchedAt) evs.push({ at: r.dispatchedAt, type: "dispatch", text: `Resources dispatched (${r.rescuerName})` });
      if (r.allocatedAt) evs.push({ at: r.allocatedAt, type: "allocated", text: `Resources delivered (${r.rescuerName})` });
    });
    return evs.sort((a, b) => a.at.localeCompare(b.at)).reverse();
  }, [validSos, validRequests]);

  const TYPE_META: Record<string, { icon: string; chip: string }> = {
    sos: { icon: "text-danger", chip: "bg-danger/15 text-danger border-danger/30" },
    claim: { icon: "text-warn", chip: "bg-warn/15 text-warn border-warn/30" },
    reach: { icon: "text-cyan", chip: "bg-cyan/15 text-cyan border-cyan/30" },
    deliver: { icon: "text-safe", chip: "bg-safe/15 text-safe border-safe/30" },
    sms: { icon: "text-cyan", chip: "bg-cyan/10 text-cyan border-cyan/20" },
    update: { icon: "text-muted", chip: "bg-muted/10 text-muted border-border" },
    request: { icon: "text-warn", chip: "bg-warn/10 text-warn border-warn/20" },
    dispatch: { icon: "text-cyan", chip: "bg-cyan/10 text-cyan border-cyan/20" },
    allocated: { icon: "text-safe", chip: "bg-safe/10 text-safe border-safe/20" },
  };

  const teamsOnline = rescuers.filter((r) => r.online).length;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 glass-1 border-b border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <a href="/hq" className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-muted hover:text-[#00b4d8] cursor-pointer">
            <Waves className="h-4 w-4" /> Back
          </a>
          <div className="mx-1 h-6 w-px bg-[rgba(255,255,255,0.08)]" />
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#ffb02e] to-[#d98f00] text-black shadow-[0_0_12px_rgba(255,176,46,0.3)]">
              <History className="h-4 w-4" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              operation logs
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted hidden sm:inline">
              {rescuers.length} teams registered · {teamsOnline} online
            </span>
            <button onClick={resetDemo} className="flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] px-2.5 py-1 text-[10px] font-mono text-muted hover:text-danger cursor-pointer">
              <RotateCcw className="h-3 w-3" /> reset demo
            </button>
          </div>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-12">
        {/* left column — event timeline */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-cyan" /> Full event timeline
              </CardTitle>
              <span className="font-mono text-[10px] text-muted">
                {timeline.length} events · newest first
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {timeline.length === 0 ? (
                <p className="rounded-md border border-dashed border-[rgba(255,255,255,0.1)] px-3 py-6 text-center text-[11px] text-muted">
                  No logged events yet. Send an SOS from the citizen console to begin the log.
                </p>
              ) : (
                timeline.slice(0, 100).map((ev, i) => {
                  const meta = TYPE_META[ev.type] ?? TYPE_META.update;
                  return (
                    <div key={i} className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-[rgba(255,255,255,0.02)]">
                      <div className="flex flex-col items-center pt-1">
                        <span className={cn("h-2 w-2 rounded-full", meta.icon)} style={{ background: "currentColor" }} />
                        {i < timeline.length - 1 && <span className="mt-1 h-full min-h-4 w-px bg-[rgba(255,255,255,0.06)]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("rounded px-1 py-px font-mono text-[8px] uppercase tracking-wider", meta.chip)}>
                            {ev.type}
                          </span>
                          <span className="shrink-0 font-mono text-[9px] text-muted">
                            {toLocal(ev.at)} · {timeAgo(ev.at)}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[12px] font-medium text-foreground">{ev.text}</div>
                        {ev.sub && <div className="text-[11px] text-muted line-clamp-2">{ev.sub}</div>}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

        {/* right column — full detail lists */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* search + SOS history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <Siren className="h-3.5 w-3.5 text-danger" /> All SOS history
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name / msg / coord…"
                    className="w-40 rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] py-1 pl-7 pr-2 font-mono text-[10px] text-foreground outline-none focus:border-[#00b4d8]"
                  />
                </div>
                {["all", "open", "claimed", "reached", "delivered"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSosFilter(f)}
                    className={cn(
                      "rounded px-2 py-0.5 font-mono text-[9px] uppercase transition-colors cursor-pointer",
                      sosFilter === f
                        ? "bg-[#00b4d8]/20 text-[#00b4d8] border border-[#00b4d8]/40"
                        : "text-muted hover:text-foreground border border-transparent"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[10px] text-muted">{filteredSos.length} records</span>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {filteredSos.length === 0 ? (
                <p className="rounded-md border border-dashed border-[rgba(255,255,255,0.1)] px-3 py-5 text-center text-[11px] text-muted">
                  No SOS records match.
                </p>
              ) : (
                filteredSos.map((s) => {
                  const st = SOS_STATUS[s.status] ?? SOS_STATUS.open;
                  return (
                    <div key={s.id} className={cn("rounded-md border px-3 py-2", st.cls)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <Siren className={cn("h-3.5 w-3.5", st.icon)} />
                          <span className="truncate text-[12px] font-medium">{s.citizenName}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[9px] text-muted">
                          {toLocal(updatedStamp(s))}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px]">
                        <span className={cn("uppercase tracking-wider", st.labelCls)}>{st.label}</span>
                        {s.rescuerName && <span className="truncate text-muted">· {s.rescuerName}</span>}
                        {s.deliveredAt && <span className="text-muted">· {timeAgo(s.deliveredAt)}</span>}
                      </div>
                      <p className="mt-1 line-clamp-1 text-[11px] text-muted">{s.message}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[9px] text-muted">
                        {s.citizenPhone && (
                          <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{formatCitizenPhone(s.citizenPhone)}</span>
                        )}
                        <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{s.peopleCount}</span>
                        {s.location && (
                          <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{s.location.lat.toFixed(3)},{s.location.lng.toFixed(3)}</span>
                        )}
                        {s.status === "delivered" && (
                          <span className="flex items-center gap-1 text-safe"><CheckCircle2 className="h-2.5 w-2.5" />delivered</span>
                        )}
                      </div>
                      {(s.updates && s.updates.length > 0) && (
                        <div className="mt-1.5 flex flex-col gap-1 border-t border-[rgba(255,255,255,0.06)] pt-1.5">
                          {s.updates.map((u) => (
                            <div key={u.id} className="flex items-start gap-1.5 text-[10px] text-muted">
                              <span className={cn("mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full", u.role === "hq" ? "bg-cyan" : "bg-warn")} />
                              <span>
                                <span className="font-mono text-[9px]">{u.by} · {u.role}</span>
                                <span className="ml-1">{u.text}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* resource requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-warn" /> Resource request history
              </CardTitle>
              <div className="flex items-center gap-2">
                {["all", "pending", "dispatched", "received", "allocated"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setReqFilter(f)}
                    className={cn(
                      "rounded px-2 py-0.5 font-mono text-[9px] uppercase transition-colors cursor-pointer",
                      reqFilter === f
                        ? "bg-[#ffb02e]/20 text-[#ffb02e] border border-[#ffb02e]/40"
                        : "text-muted hover:text-foreground border border-transparent"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[10px] text-muted">{filteredRequests.length} requests</span>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {filteredRequests.length === 0 ? (
                <p className="rounded-md border border-dashed border-[rgba(255,255,255,0.1)] px-3 py-5 text-center text-[11px] text-muted">
                  No resource requests logged.
                </p>
              ) : (
                filteredRequests.map((r) => {
                  const normalizedStatus = r.status === "fulfilled" ? "allocated" : r.status;
                  const statusMeta = REQUEST_STATUS[normalizedStatus] ?? REQUEST_STATUS.pending;
                  const items = [
                    { label: "Medkits", value: r.medkits, icon: Stethoscope },
                    { label: "Food", value: r.foodkits, icon: Utensils },
                    { label: "Transport", value: r.transports, icon: Truck },
                  ];
                  return (
                    <div key={r.id} className="rounded-md border border-border bg-panel-2/60 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[12px] font-medium">{r.rescuerName}</span>
                        <Badge className={cn("!text-[9px]", statusMeta)}>{normalizedStatus}</Badge>
                      </div>
                      {r.locationLabel && (
                        <div className="mt-0.5 flex items-center gap-1 font-mono text-[9px] text-muted">
                          <MapPin className="h-2.5 w-2.5" /> {r.locationLabel}
                        </div>
                      )}
                      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                        {items.map((it) => {
                          const Icon = it.icon;
                          return (
                            <div key={it.label} className="flex items-center gap-1 rounded border border-border bg-[rgba(255,255,255,0.04)] px-1.5 py-1">
                              <Icon className="h-3 w-3 text-cyan" />
                              <div className="leading-none">
                                <div className="font-mono text-[11px] font-bold text-foreground">{it.value}</div>
                                <div className="font-mono text-[8px] uppercase text-muted">{it.label}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 font-mono text-[9px] text-muted">
                        <span className="flex items-center gap-1"><Clock3 className="h-2.5 w-2.5" /> created {toLocal(r.timestamp)}</span>
                        {r.dispatchedAt && <span className="text-cyan">dispatched {toLocal(r.dispatchedAt)}</span>}
                        {r.receivedAt && <span className="text-warn">received {toLocal(r.receivedAt)}</span>}
                        {r.allocatedAt && <span className="text-safe">delivered {toLocal(r.allocatedAt)}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* citizen messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <MessageSquareText className="h-3.5 w-3.5 text-cyan" /> Citizen SMS log
              </CardTitle>
              <span className="font-mono text-[10px] text-muted">{validMsgs.length} messages</span>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {validMsgs.length === 0 ? (
                <p className="rounded-md border border-dashed border-[rgba(255,255,255,0.1)] px-3 py-5 text-center text-[11px] text-muted">
                  No outbound confirmations logged yet.
                </p>
              ) : (
                validMsgs
                  .sort((a, b) => b.at.localeCompare(a.at))
                  .slice(0, 30)
                  .map((m) => {
                    const st = STAGE_CHIP[m.stage];
                    return (
                      <div key={m.id} className="rounded-md border border-border bg-[rgba(255,255,255,0.03)] px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-mono text-[9px] text-foreground">{m.to}</span>
                          <span className="flex shrink-0 items-center gap-1.5 font-mono text-[8px] text-muted">
                            {toLocal(m.at)}
                            <span className="rounded border border-border-strong px-1 py-px text-[7px]">SIMULATED</span>
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={cn("rounded px-1 py-px font-mono text-[8px] uppercase tracking-wider", st.cls)}>{st.label}</span>
                          <span className="truncate text-[10px] text-muted">→ {m.citizenName}</span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-foreground/90">{m.text}</p>
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)] px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted backdrop-blur-sm">
        AAPDA SAARTHI · Operation Logs
      </footer>
    </div>
  );
}
