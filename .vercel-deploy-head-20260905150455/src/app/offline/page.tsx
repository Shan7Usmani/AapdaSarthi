import Link from "next/link";
import { WifiOff, Siren, MapPin, MessageSquareText, Home } from "lucide-react";

/**
 * Offline fallback page served by the service worker's `navigateFallback`
 * when a user tries to open a route that isn't cached and has no connection.
 *
 * It reassures + instructs: your SOS screen is cached and reachable; if you're
 * in trouble and offline, jump to the citizen screen or use your phone's SMS.
 */
export default function OfflinePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-100/70 to-transparent" />

      <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-amber-500 text-white shadow-sm">
        <WifiOff className="h-8 w-8" />
      </div>

      <div className="relative max-w-md">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          You&apos;re offline
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-slate-500">
          This page isn&apos;t stored on your device yet, and there&apos;s no
          connection to fetch it. But the emergency SOS screen is cached and
          always reachable — even with no signal.
        </p>
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          <Siren className="h-3.5 w-3.5 text-danger" />
          Still need help?
        </div>
        <ul className="mt-3 space-y-2.5 text-[13px] text-slate-600">
          <li className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
            <span>
              Open the <strong>Citizen SOS</strong> screen — it works offline and
              saves locally, then auto-transmits when signal returns.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
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
          className="inline-flex items-center gap-2 rounded-xl bg-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan/90"
        >
          <Siren className="h-4 w-4" />
          Open Citizen SOS
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-300"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>
    </div>
  );
}
