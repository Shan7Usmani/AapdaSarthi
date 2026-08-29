import { Header } from "@/components/header";
import { RoleNav } from "@/components/role-nav";
import { LiveMap } from "@/components/live-map";
import { RiskPanel } from "@/components/risk-panel";
import { ResourcePanel } from "@/components/resource-panel";
import { AlertComposer } from "@/components/alert-composer";
import { AutoAlerts } from "@/components/auto-alerts";
import { HqSosBoard } from "@/components/hq-sos-board";
import { RiskTrendChart, DistrictImpactChart } from "@/components/charts";

export const metadata = {
  title: "HQ Command Center — Aapda Saarthi",
};

export default function HqPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <RoleNav active="hq" />
      <Header />

      <main className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-12">
        {/* left — map + analytics */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="panel-glow relative h-[52vh] min-h-[460px] overflow-hidden rounded-xl border border-slate-200 bg-panel">
            <LiveMap />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <RiskTrendChart />
            <DistrictImpactChart />
          </div>

          <ResourcePanel />
        </section>

        {/* right rail — live response ops */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <HqSosBoard />
          <AutoAlerts />
          <RiskPanel />
          <AlertComposer />
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/70 px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
        AAPDA SAARTHI · AI Disaster Response Intelligence Platform · Decode SIH 2026 · Bharat Shakti PS3
      </footer>
    </div>
  );
}
