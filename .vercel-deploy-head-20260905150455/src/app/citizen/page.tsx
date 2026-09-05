import { RoleNav } from "@/components/role-nav";
import { SosComposer } from "@/components/sos-composer";
import { Siren, Radio, Users } from "lucide-react";

export const metadata = {
  title: "Citizen SOS — Aapda Saarthi",
};

export default function CitizenPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <RoleNav active="citizen" />
      <main className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
        <div className="max-w-md text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-red-600">
            <Siren className="h-4 w-4" /> Citizen distress channel
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Report an SOS</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            Describe what&apos;s happening, how many are with you, and let us pin your exact live
            location. Attach a photo, video or record a voice note.
          </p>
        </div>
        <SosComposer />
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[12px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-cyan" /> routed to nearest rescuer
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-cyan" /> multilingual confirmation
          </span>
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white/70 px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
        AAPDA SAARTHI · Citizen SOS · Decode SIH 2026
      </footer>
    </div>
  );
}
