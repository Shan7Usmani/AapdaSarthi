"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { RoleNav } from "@/components/role-nav";
import { LiveMap, type MapInfoData } from "@/components/live-map";
import { MapInfoPanel } from "@/components/map-info-panel";

export default function RiskPage() {
  const [mapInfo, setMapInfo] = useState<MapInfoData | null>(null);

  return (
    <div className="flex min-h-screen flex-col">
      <RoleNav active="risk" />
      <Header />

      <main className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-12">
        {/* live risk map */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="glass-2 relative h-[56vh] min-h-[480px] overflow-hidden rounded-2xl">
            <LiveMap onInfoUpdate={setMapInfo} />
          </div>
        </section>

        {/* risk intelligence — at-risk districts, rainfall, AI verdict, legend */}
        <section className="lg:col-span-4 flex flex-col gap-4 self-start">
          {mapInfo ? (
            <MapInfoPanel data={mapInfo} />
          ) : (
            <div className="glass-2 rounded-2xl px-4 py-6 text-center font-mono text-[11px] text-muted">
              loading risk intelligence…
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)] px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted backdrop-blur-sm">
        AAPDA SAARTHI · AI Disaster Response Intelligence Platform · Decode SIH 2026 · Bharat Shakti PS3
      </footer>
    </div>
  );
}