import Link from "next/link";
import { WifiOff, Siren, MapPin, MessageSquareText, Home } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[rgba(255,176,46,0.08)] to-transparent" />

      <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-[rgba(255,176,46,0.15)] text-[#ffb02e] shadow-[0_0_24px_rgba(255,176,46,0.2)]">
        <WifiOff className="h-8 w-8" />
      </div>

      <div className="relative max-w-md">
        <h1 className="font-display text-3xl font-black tracking-tight text-foreground">
          You&apos;re offline
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          This page isn&apos;t stored on your device yet, and there&apos;s no
          connection to fetch it. But the emergency SOS screen is cached and
          always reachable — even with no signal.
        </p>
      </div>

      <div className="relative w-full max-w-md glass-2 rounded-2xl p-4 text-left">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
          <Siren className="h-3.5 w-3.5 text-[#ff3b5c]" />
          Still need help?
        </div>
        <ul className="mt-3 space-y-2.5 text-[13px] text-[rgba(232,238,242,0.7)]">
          <li className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#00b4d8]" />
            <span>
              Open the <strong className="text-foreground">Citizen SOS</strong> screen — it works offline and
              saves locally, then auto-transmits when signal returns.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#00ff7a]" />
            <span>
              With signal but no data, your SOS falls back to a pre-filled SMS
              sent over the cellular network.
            </span>
          </li>
        </ul>
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/citizen"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#0096b7] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_16px_-2px_rgba(0,180,216,0.5)] transition-all hover:shadow-[0_4px_24px_-2px_rgba(0,180,216,0.6)]"
        >
          <Siren className="h-4 w-4" />
          Open Citizen SOS
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl glass-1 px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-[rgba(0,180,216,0.3)]"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>
    </div>
  );
}
