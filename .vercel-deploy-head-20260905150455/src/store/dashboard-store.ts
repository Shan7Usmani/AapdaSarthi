"use client";

import { create } from "zustand";
import { SCENARIOS } from "@/data/scenarios";
import type { Scenario } from "@/lib/types";

interface DashboardState {
  scenarioId: string;
  scenario: Scenario;
  selectedDistrict: string | null;
  liveMode: boolean;
  setScenario: (id: string) => void;
  setSelectedDistrict: (name: string | null) => void;
  toggleLive: () => void;
}

export const useDashboard = create<DashboardState>((set, get) => ({
  scenarioId: SCENARIOS[0].id,
  scenario: SCENARIOS[0],
  selectedDistrict: null,
  liveMode: true,
  setScenario: (id) => {
    const sc = SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
    set({ scenarioId: id, scenario: sc, selectedDistrict: null });
  },
  setSelectedDistrict: (name) => set({ selectedDistrict: name }),
  toggleLive: () => set({ liveMode: !get().liveMode }),
}));
