"use client";

import { useSosStore, type SosItem, type Rescuer, type ResourceRequest } from "@/store/sos-store";

/**
 * Live aggregates derived straight from the real SOS store (synced across
 * devices via Supabase Realtime). Used by the HQ panels so they show the
 * latest actual incidents / rescuers / requests instead of baked-in demo
 * scenario numbers.
 */

export type RiskLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
const ACTIVE_SOS_STATUSES = new Set(["claimed", "reached", "delivered"]);

export interface RegionCluster {
  key: string;
  label: string;
  lat: number;
  lng: number;
  count: number;
  people: number;
  risk: RiskLevel;
}

export interface LiveStats {
  openSignals: SosItem[];
  claimedSignals: SosItem[];
  openCount: number;
  claimedCount: number;
  totalPeople: number;
  clusters: RegionCluster[];
  daily: { label: string; count: number }[];
  onlineTeams: Rescuer[];
  onlineCount: number;
  pendingRequests: ResourceRequest[];
  fulfilledRequests: ResourceRequest[];
  pendingCount: number;
  fulfilledCount: number;
  totalMedkits: number;
  totalFoodkits: number;
  totalTransports: number;
  peopleRescued: number;
}

const DAY = 86_400_000;

function riskFor(count: number, people: number): RiskLevel {
  const score = count * 2 + people / 5;
  if (score >= 12) return "CRITICAL";
  if (score >= 6) return "HIGH";
  if (score >= 2) return "MODERATE";
  return "LOW";
}

function clusterKey(lat: number, lng: number): string {
  return `${Math.round(lat * 10) / 10}:${Math.round(lng * 10) / 10}`;
}

export function deriveLiveStats(
  sos: SosItem[],
  requests: ResourceRequest[],
  rescuers: Rescuer[]
): LiveStats {
  const openSignals = sos.filter((s) => s && s.status === "open");
  const claimedSignals = sos.filter((s) => s && ACTIVE_SOS_STATUSES.has(s.status));
  const totalPeople = openSignals.reduce((a, s) => a + (Number(s.peopleCount) || 0), 0);

  // Cluster open signals into "risk zones" by ~0.1° grid cell.
  const byKey = new Map<string, RegionCluster>();
  for (const s of openSignals) {
    if (!s.location) continue;
    const key = clusterKey(s.location.lat, s.location.lng);
    const cur = byKey.get(key);
    const people = Number(s.peopleCount) || 0;
    if (cur) {
      cur.count += 1;
      cur.people += people;
      cur.risk = riskFor(cur.count, cur.people);
      cur.lat = (cur.lat * (cur.count - 1) + s.location.lat) / cur.count;
      cur.lng = (cur.lng * (cur.count - 1) + s.location.lng) / cur.count;
    } else {
      byKey.set(key, {
        key,
        label: `${s.location.lat.toFixed(2)}°, ${s.location.lng.toFixed(2)}°`,
        lat: s.location.lat,
        lng: s.location.lng,
        count: 1,
        people,
        risk: riskFor(1, people),
      });
    }
  }
  const clusters = Array.from(byKey.values()).sort((a, b) => b.count - a.count || b.people - a.people);

  // Daily SOS trend for the last 7 days.
  const daily: { label: string; count: number }[] = [];
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const start = new Date(now - i * DAY);
    const end = new Date(now - (i - 1) * DAY);
    const count = sos.filter((s) => {
      const t = new Date(s.timestamp).getTime();
      return !Number.isNaN(t) && t >= start.getTime() && t < end.getTime();
    }).length;
    daily.push({
      label: start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      count,
    });
  }

  const onlineTeams = rescuers.filter((r) => r && r.online);
  const pendingRequests = requests.filter((r) => r && r.status === "pending");
  const fulfilledRequests = requests.filter(
    (r) => r && (r.status === "allocated" || r.status === "fulfilled")
  );

  return {
    openSignals,
    claimedSignals,
    openCount: openSignals.length,
    claimedCount: claimedSignals.length,
    totalPeople,
    clusters,
    daily,
    onlineTeams,
    onlineCount: onlineTeams.length,
    pendingRequests,
    fulfilledRequests,
    pendingCount: pendingRequests.length,
    fulfilledCount: fulfilledRequests.length,
    totalMedkits: pendingRequests.reduce((a, r) => a + (Number(r.medkits) || 0), 0),
    totalFoodkits: pendingRequests.reduce((a, r) => a + (Number(r.foodkits) || 0), 0),
    totalTransports: pendingRequests.reduce((a, r) => a + (Number(r.transports) || 0), 0),
    peopleRescued: fulfilledRequests.reduce((a, r) => a + (Number(r.peopleRescued) || 0), 0),
  };
}

export function useLiveStats(): LiveStats {
  const { sos, requests, rescuers } = useSosStore();
  return deriveLiveStats(sos, requests, rescuers);
}
