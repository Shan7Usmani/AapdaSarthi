"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { haversineKm } from "@/lib/rainfall";

function nearestRescuer(
  rescuers: Rescuer[],
  lat: number,
  lng: number
): { rescuer: Rescuer; km: number } | null {
  let best: { rescuer: Rescuer; km: number } | null = null;
  for (const r of rescuers) {
    if (!r.online) continue;
    const km = haversineKm(lat, lng, r.lat, r.lng);
    if (!best || km < best.km)
      best = { rescuer: r, km: Math.round(km * 10) / 10 };
  }
  return best;
}

export type MediaKind = "voice" | "video" | "photo";

export interface MediaAttachment {
  kind: MediaKind;
  url: string;
  name: string;
}

export interface Rescuer {
  id: string;
  name: string;
  lat: number;
  lng: number;
  online: boolean;
  lastSeen: string;
}

export interface SosUpdate {
  id: string;
  by: string;
  role: "rescuer" | "hq";
  text: string;
  at: string;
}

/**
 * Outbound message sent back to the citizen who raised the SOS.
 * `to` is ALWAYS the number the citizen signalled from (captured in the SOS
 * form — browsers cannot read a phone's MSISDN), so the command centre talks
 * to exactly the same handset that contacted us.
 */
export interface CitizenMessage {
  id: string;
  sosId: string;
  to: string;
  citizenName: string;
  stage: "ack" | "claimed" | "reached" | "delivered";
  channel: "sms";
  text: string;
  at: string;
}

export interface SosItem {
  id: string;
  citizenName: string;
  message: string;
  peopleCount: number;
  location?: { lat: number; lng: number; accuracy?: number };
  media: MediaAttachment[];
  timestamp: string;
  updatedAt?: string;
  status: "open" | "claimed" | "reached" | "delivered";
  rescuerName?: string;
  reachedAt?: string;
  deliveredAt?: string;
  // the number THIS SOS came from; every confirmation goes back here
  citizenPhone?: string;
  // outbound confirmations sent to that number (simulated until a paid
  // gateway is configured) — rides the exact same sync path as the SOS row
  citizenMsgs?: CitizenMessage[];
  // live ground-info thread, appended to by the rescuer OR HQ as the
  // situation on the ground changes (rides the same sync path as the SOS)
  updates?: SosUpdate[];
  // nearest-rescuer routing (computed when the citizen sends the SOS)
  nearestRescuerName?: string;
  nearestDistanceKm?: number;
}

/** +91 97749 22001 (accepts any indian 10-digit mobile, with/without 91) */
export function formatCitizenPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 13 && d.startsWith("91")) d = d.slice(2);
  if (d.length !== 10) return raw;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

/** +91 •••• ••2001 — safe for crowded command-centre cards */
export function maskCitizenPhone(phone?: string): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  return `+91 •••• ••${d.slice(-4)}`;
}

/**
 * Compose the confirmation SMS for a lifecycle stage. Returns null when the
 * SOS carries no contact number (nothing to send back to).
 */
export function buildCitizenMsg(
  s: SosItem,
  stage: CitizenMessage["stage"],
  by?: string
): CitizenMessage | null {
  if (!s.citizenPhone) return null;
  const text =
    stage === "ack"
      ? `AapdaSaarthi: your signal was received. The command centre is tracking you — help is being coordinated. Stay reachable on this number.`
      : stage === "claimed"
        ? `AapdaSaarthi: ${by ?? "a rescue team"} has taken your request. Help is on the way to you now.`
        : stage === "reached"
          ? `AapdaSaarthi: ${by ?? "your rescue team"} is at your location. Follow their instructions.`
          : `AapdaSaarthi: item delivered to ${s.citizenName}. You are in safe hands. — Command Centre`;
  return {
    id: `${s.id}-${stage}-${Date.now()}`,
    sosId: s.id,
    to: formatCitizenPhone(s.citizenPhone),
    citizenName: s.citizenName,
    stage,
    channel: "sms",
    text,
    at: new Date().toISOString(),
  };
}

export interface ResourceRequest {
  id: string;
  sosId?: string;
  rescuerName: string;
  location?: { lat: number; lng: number };
  locationLabel?: string;
  peopleRescued: number;
  medkits: number;
  foodkits: number;
  transports: number;
  timestamp: string;
  updatedAt?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  allocatedAt?: string;
  status: "pending" | "dispatched" | "received" | "allocated" | "fulfilled";
}

interface SosState {
  sos: SosItem[];
  requests: ResourceRequest[];
  rescuerName: string;
  rescuers: Rescuer[];
  setRescuerName: (name: string) => void;
  registerRescuer: (name: string, lat: number, lng: number) => string;
  updateRescuerLocation: (id: string, lat: number, lng: number) => void;
  setRescuerOnline: (id: string, online: boolean) => void;
  unregisterRescuer: (id: string) => void;
  addSos: (s: Omit<SosItem, "id" | "timestamp" | "status">) => string;
  claimSos: (id: string) => void;
  markReached: (id: string) => void;
  markDelivered: (id: string) => void;
  addUpdate: (id: string, text: string, role: SosUpdate["role"]) => void;
  addRequest: (r: Omit<ResourceRequest, "id" | "timestamp" | "status">) => void;
  updateRequest: (
    id: string,
    patch: Partial<Omit<ResourceRequest, "id" | "timestamp" | "rescuerName" | "sosId">>
  ) => void;
  dispatchRequest: (id: string) => void;
  receiveRequest: (id: string) => void;
  allocateRequest: (id: string) => void;
  fulfillRequest: (id: string) => void;
  seedOnce: () => void;
  resetDemo: () => void;
}

let seedDone = false;

let uid = 0;
function nextId(prefix: string): string {
  uid += 1;
  return `${prefix}-${Date.now().toString(36)}-${uid}`;
}

export const useSosStore = create<SosState>()(
  persist(
    (set, get) => ({
      sos: [],
      requests: [],
      rescuerName: "",
      rescuers: [],
      setRescuerName: (name) => set({ rescuerName: name }),
      registerRescuer: (name, lat, lng) => {
        const now = new Date().toISOString();
        const existing = get().rescuers.find(
          (r) => r.name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        if (existing) {
          get().updateRescuerLocation(existing.id, lat, lng);
          get().setRescuerOnline(existing.id, true);
          return existing.id;
        }
        const id = nextId("res");
        const rescuer: Rescuer = {
          id,
          name: name.trim(),
          lat,
          lng,
          online: true,
          lastSeen: now,
        };
        set({ rescuers: [...get().rescuers, rescuer] });
        return id;
      },
      updateRescuerLocation: (id, lat, lng) =>
        set({
          rescuers: get().rescuers.map((r) =>
            r.id === id ? { ...r, lat, lng, lastSeen: new Date().toISOString() } : r
          ),
        }),
      setRescuerOnline: (id, online) =>
        set({
          rescuers: get().rescuers.map((r) =>
            r.id === id ? { ...r, online, lastSeen: new Date().toISOString() } : r
          ),
        }),
      unregisterRescuer: (id) =>
        set({ rescuers: get().rescuers.filter((r) => r.id !== id) }),
addSos: (s) => {
        const id = nextId("sos");
        const now = new Date().toISOString();
        const item: SosItem = {
          ...s,
          id,
          timestamp: now,
          updatedAt: now,
          status: "open",
        };
        // Route to the nearest online rescuer when a live location is provided.
        if (item.location) {
          const match = nearestRescuer(
            get().rescuers,
            item.location.lat,
            item.location.lng
          );
          if (match) {
            item.nearestRescuerName = match.rescuer.name;
            item.nearestDistanceKm = match.km;
          }
        }
        // Acknowledge straight back to the number the signal came from.
        const ack = buildCitizenMsg(item, "ack");
        if (ack) item.citizenMsgs = [ack];
        set({ sos: [item, ...get().sos] });
        return id;
      },
      claimSos: (id) => {
        const target = get().sos.find((t) => t.id === id);
        const by = (get().rescuerName || "").trim() || "Rescuer";
        const msg = target ? buildCitizenMsg(target, "claimed", by) : null;
        set({
          sos: get().sos.map((s) => {
            if (s.id !== id) return s;
            const now = new Date().toISOString();
            return {
              ...s,
              status: "claimed",
              rescuerName: by,
              citizenMsgs: msg ? [...(s.citizenMsgs ?? []), msg] : s.citizenMsgs,
              updatedAt: now,
            };
          }),
        });
      },
      markReached: (id) =>
        set({
          sos: get().sos.map((s) => {
            if (s.id !== id) return s;
            const now = new Date().toISOString();
            const msg = buildCitizenMsg(s, "reached", s.rescuerName);
            return {
              ...s,
              status: "reached",
              reachedAt: now,
              citizenMsgs: msg ? [...(s.citizenMsgs ?? []), msg] : s.citizenMsgs,
              updatedAt: now,
            };
          }),
        }),
      markDelivered: (id) =>
        set({
          sos: get().sos.map((s) => {
            if (s.id !== id) return s;
            const now = new Date().toISOString();
            const msg = buildCitizenMsg(s, "delivered", s.rescuerName);
            return {
              ...s,
              status: "delivered",
              deliveredAt: now,
              citizenMsgs: msg ? [...(s.citizenMsgs ?? []), msg] : s.citizenMsgs,
              updatedAt: now,
            };
          }),
        }),
      addUpdate: (id, text, role) =>
        set({
          sos: get().sos.map((s) => {
            if (s.id !== id) return s;
            const now = new Date().toISOString();
            const by =
              role === "hq" ? "HQ" : (get().rescuerName || "").trim() || "Rescuer";
            const updates = s.updates ?? [];
            return {
              ...s,
              updates: [
                ...updates,
                { id: `${s.id}-u${Date.now()}`, by, role, text: text.trim(), at: now },
              ],
              updatedAt: now,
            };
          }),
        }),
      addRequest: (r) =>
        set({
          requests: [
            {
              ...r,
              id: nextId("req"),
              timestamp: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: "pending",
            },
            ...get().requests,
          ],
        }),
      updateRequest: (id, patch) =>
        set({
          requests: get().requests.map((r) =>
            r.id === id
              ? { ...r, ...patch, updatedAt: new Date().toISOString(), status: "pending" }
              : r
          ),
        }),
      dispatchRequest: (id) =>
        set({
          requests: get().requests.map((r) => {
            if (r.id !== id) return r;
            const now = new Date().toISOString();
            return { ...r, status: "dispatched", dispatchedAt: now, updatedAt: now };
          }),
        }),
      receiveRequest: (id) =>
        set({
          requests: get().requests.map((r) => {
            if (r.id !== id) return r;
            const now = new Date().toISOString();
            return { ...r, status: "received", receivedAt: now, updatedAt: now };
          }),
        }),
      allocateRequest: (id) =>
        set((state) => {
          const now = new Date().toISOString();
          const request = state.requests.find((r) => r.id === id);
          return {
            requests: state.requests.map((r) =>
              r.id === id ? { ...r, status: "allocated", allocatedAt: now, updatedAt: now } : r
            ),
            sos: request?.sosId
              ? state.sos.map((s) =>
                  s.id === request.sosId
                    ? { ...s, status: "delivered", deliveredAt: now, updatedAt: now }
                    : s
                )
              : state.sos,
          };
        }),
      fulfillRequest: (id) =>
        set({
          requests: get().requests.map((r) =>
            r.id === id ? { ...r, status: "allocated", updatedAt: new Date().toISOString() } : r
          ),
        }),
      seedOnce: () => {
        if (seedDone || get().sos.length > 0) return;
        seedDone = true;
        const now = Date.now();
        const iso = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString();
        const seedRescuers: Rescuer[] = [
          {
            id: "res-seed-1",
            name: "NDRF Alpha",
            lat: 26.14,
            lng: 91.74,
            online: true,
            lastSeen: iso(2),
          },
          {
            id: "res-seed-2",
            name: "SDRF Team 4",
            lat: 26.45,
            lng: 90.99,
            online: true,
            lastSeen: iso(5),
          },
          {
            id: "res-seed-3",
            name: "SDRF Team 7",
            lat: 26.14,
            lng: 90.02,
            online: true,
            lastSeen: iso(8),
          },
        ];
        const mk = (
          id: string,
          citizenName: string,
          message: string,
          peopleCount: number,
          lat: number,
          lng: number,
          minsAgo: number,
          status: SosItem["status"] = "open",
          rescuerName?: string,
          extra: Partial<SosItem> = {}
        ): SosItem => ({
          id,
          citizenName,
          message,
          peopleCount,
          location: { lat, lng, accuracy: 9 },
          media: [],
          timestamp: iso(minsAgo),
          status,
          rescuerName,
          ...extra,
        });
        const seedSos: SosItem[] = [
          mk(
            "sos-seed-1",
            "Ritu Sharma",
            "Water entered our street overnight and is rising fast. We are on the first floor with neighbours — need rescue boats.",
            8,
            26.1445, 90.0226,
            6
          ),
          mk(
            "sos-seed-2",
            "Md. Arif",
            "Elderly mother cannot walk. We are trapped near the market, water is chest-deep. Please send a medical team.",
            4,
            26.4512, 90.9961,
            22,
            "claimed",
            "SDRF Team 4",
            {
              updates: [
                {
                  id: "u-seed-2-a",
                  by: "SDRF Team 4",
                  role: "rescuer",
                  text: "On route — water is chest-deep near the market, need the boat crew.",
                  at: iso(20),
                },
                {
                  id: "u-seed-2-b",
                  by: "HQ",
                  role: "hq",
                  text: "Medkits + 2 life jackets dispatched. ETA 12 min.",
                  at: iso(14),
                },
              ],
            }
          ),
          mk(
            "sos-seed-3",
            "Priya Dev",
            "Village access road is cut off, crops underwater. 5 families need transport to the relief camp.",
            17,
            27.5910, 94.7594,
            47,
            "delivered",
            "NDRF Alpha",
            {
              deliveredAt: iso(44),
              updates: [
                {
                  id: "u-seed-3-a",
                  by: "NDRF Alpha",
                  role: "rescuer",
                  text: "Water receding here — campsite walkable now.",
                  at: iso(46),
                },
                {
                  id: "u-seed-3-b",
                  by: "HQ",
                  role: "hq",
                  text: "Relief transport completed. 17 people safe at camp.",
                  at: iso(44),
                },
              ],
            }
          ),
          mk(
            "sos-seed-4",
            "Sunil Boro",
            "Flood water inside home, baby has fever. We need food and medical help as soon as possible.",
            6,
            26.1022, 91.4778,
            95,
            "reached",
            "SDRF Team 4",
            {
              reachedAt: iso(90),
              updates: [
                {
                  id: "u-seed-4-a",
                  by: "SDRF Team 4",
                  role: "rescuer",
                  text: "Location reached. Baby’s fever stabilising — requesting a paramedic.",
                  at: iso(88),
                },
              ],
            }
          ),
          mk(
            "sos-seed-5",
            "Meena Kachari",
            "A boat capsized near the river bend; 3 people missing. Urgent rescue at the coordinates.",
            1,
            26.5451, 90.2664,
            130,
            "open"
          ),
        ];
        const seedRequests: ResourceRequest[] = [
          {
            id: "req-seed-1",
            sosId: "sos-seed-2",
            rescuerName: "SDRF Team 4",
            location: { lat: 26.4512, lng: 90.9961 },
            locationLabel: "near Barpeta market",
            peopleRescued: 2,
            medkits: 6,
            foodkits: 12,
            transports: 1,
            timestamp: iso(18),
            status: "pending",
          },
          {
            id: "req-seed-2",
            sosId: "sos-seed-3",
            rescuerName: "NDRF Alpha",
            location: { lat: 27.591, lng: 94.7594 },
            locationLabel: "Dhemaji relief zone",
            peopleRescued: 17,
            medkits: 4,
            foodkits: 20,
            transports: 2,
            timestamp: iso(40),
            status: "allocated",
          },
          {
            id: "req-seed-3",
            sosId: "sos-seed-1",
            rescuerName: "SDRF Team 7",
            location: { lat: 26.1445, lng: 90.0226 },
            locationLabel: "Dhuburi north",
            peopleRescued: 12,
            medkits: 3,
            foodkits: 16,
            transports: 0,
            timestamp: iso(3),
            status: "pending",
          },
        ];
        set({
          sos: [...seedSos, ...get().sos],
          requests: [...seedRequests, ...get().requests],
          rescuers: [...seedRescuers, ...get().rescuers],
        });
      },
      resetDemo: () => set({ sos: [], requests: [], rescuerName: "", rescuers: [] }),
    }),
    {
      name: "aapdasarthi-sos",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // v1: map legacy "resolved" → "delivered" so old persisted demo data
      // renders in the 4-stage lifecycle (open → claimed → reached → delivered).
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<SosState> | undefined;
        if (state && version < 1 && Array.isArray(state.sos)) {
          state.sos = state.sos.map((s) =>
            s && (s.status as string) === "resolved"
              ? { ...s, status: "delivered", deliveredAt: s.deliveredAt ?? new Date().toISOString() }
              : s
          );
        }
        return state as SosState;
      },
    }
  )
);
