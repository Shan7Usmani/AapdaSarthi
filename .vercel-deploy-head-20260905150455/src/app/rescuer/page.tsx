import { RoleNav } from "@/components/role-nav";
import { RescuerPanel } from "@/components/rescuer-panel";
import { RescuerMap } from "@/components/rescuer-map";
import { ShieldAlert, Navigation, Radio, Package } from "lucide-react";

export const metadata = {
  title: "Rescuer Dispatch — Aapda Saarthi",
};

export default function RescuerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <RoleNav active="rescuer" />
      <main className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
        <div className="max-w-2xl text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
            <ShieldAlert className="h-4 w-4" /> Rescuer dispatch console
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Nearest-signal dispatch</h1>
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-slate-500">
            Incoming SOS signals appear instantly, sorted by distance from your live position. Take
            control, then request exactly what your team needs — medkits, food kits, transport —
            straight to headquarters.
          </p>
        </div>
        <div className="grid w-full max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
          <RescuerPanel />
          <div className="lg:sticky lg:top-4">
            <RescuerMap />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[12px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <Navigation className="h-4 w-4 text-cyan" /> distance-sorted
          </span>
          <span className="flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-cyan" /> one-tap takeover
          </span>
          <span className="flex items-center gap-1.5">
            <Package className="h-4 w-4 text-cyan" /> field → HQ requests
          </span>
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white/70 px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
        AAPDA SAARTHI · Rescuer Dispatch · Decode SIH 2026
      </footer>
    </div>
  );
}
