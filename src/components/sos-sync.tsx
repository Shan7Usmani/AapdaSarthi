"use client";

import { useEffect, useRef } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  useSosStore,
  type Rescuer,
  type ResourceRequest,
  type SosItem,
} from "@/store/sos-store";

/**
 * Optional cross-device SOS sync (mount once in the root layout).
 *
 * When Supabase creds are configured:
 *  - pulls existing SOS + resource requests + rescuers on mount and merges them in,
 *  - subscribes to Realtime so another browser/device sees updates live,
 *  - debounce-writes local changes up to the shared tables.
 *
 * When not configured, this component is a no-op and the app keeps its
 * existing localStorage-only behaviour (same-browser demo still works).
 */

const TABLES = {
  sos: "sos_items",
  requests: "resource_requests",
  rescuers: "rescuers",
} as const;

async function readAll<T extends { id: string }>(table: string): Promise<T[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db.from(table).select("data");
  if (error) return [];
  // Drop malformed rows (e.g. an old probe row that has no timestamp/lastSeen)
  // so junk data can never enter the store and crash a sorted view.
  const stampKey = table === TABLES.rescuers ? "lastSeen" : "timestamp";
  const rows = (data ?? [])
    .map((r) => r.data as T)
    .filter((r) => r && typeof (r as unknown as Record<string, unknown>)[stampKey] === "string");
  return rows;
}

export function SosSync() {
  const hydratedRef = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);

  // Subscribe to store changes and debounce-write them up.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const store = useSosStore;
    // hydration snapshot already happened via persist middleware; nothing to seed here.

    let debounce: ReturnType<typeof setTimeout> | null = null;

    const writeAll = () => {
      // Do not try to sync while the device is offline.
      if (!navigator.onLine) {
        return;
      }

      const { sos, requests, rescuers } =
        store.getState();

      const db = getSupabase();
      if (!db) return;
      const work = (async () => {
        for (const s of sos) {
          await db.from(TABLES.sos).upsert({ id: s.id, data: s });
        }
        for (const r of requests) {
          await db.from(TABLES.requests).upsert({ id: r.id, data: r });
        }
        for (const res of rescuers) {
          await db.from(TABLES.rescuers).upsert({ id: res.id, data: res });
        }
      })();
      inFlight.current = work;
      void work.finally(() => {
        inFlight.current = null;
      });
    };

    const handleOnline = () => {
      // Give the connection a moment to become usable.
      setTimeout(() => {
        writeAll();
      }, 1000);
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    const unsub = store.subscribe((state, prev) => {
      if (
        state.sos === prev.sos &&
        state.requests === prev.requests &&
        state.rescuers === prev.rescuers
      )
        return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(writeAll, 500);
    });

    return () => {
      if (debounce) {
        clearTimeout(debounce);
      }

      window.removeEventListener(
        "online",
        handleOnline
      );

      unsub();
    };
  }, []);

  // Pull once + realtime subscribe.
  useEffect(() => {
    if (!isSupabaseConfigured() || hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    hydratedRef.current = true;

    const db = getSupabase();
    if (!db) return;

    let disposed = false;

    (async () => {
      const [remoteSos, remoteRequests, remoteRescuers] = await Promise.all([
        readAll<SosItem>(TABLES.sos),
        readAll<ResourceRequest>(TABLES.requests),
        readAll<Rescuer>(TABLES.rescuers),
      ]);
      if (disposed) return;

      const { sos, requests, rescuers } = useSosStore.getState();
      const stampOf = <T extends { timestamp: string; updatedAt?: string }>(row: T) =>
        String(row.updatedAt || row.timestamp);
      const merge = <T extends { id: string; timestamp: string; updatedAt?: string }>(local: T[], remote: T[]): T[] => {
        const map = new Map(local.map((x) => [x.id, x]));
        for (const r of remote) {
          const existing = map.get(r.id);
          // remote wins when its latest edit is newer; older rows without
          // updatedAt still compare by their original timestamp.
          if (!existing) map.set(r.id, r);
          else if (stampOf(existing) < stampOf(r)) map.set(r.id, r);
        }
        return Array.from(map.values()).sort(
          (a, b) => String(b.timestamp).localeCompare(String(a.timestamp))
        );
      };
      const mergeRescuers = (local: Rescuer[], remote: Rescuer[]): Rescuer[] => {
        const map = new Map(local.map((x) => [x.id, x]));
        for (const r of remote) {
          const existing = map.get(r.id);
          if (!existing) map.set(r.id, r);
          else if (String(existing.lastSeen) < String(r.lastSeen)) map.set(r.id, r);
        }
        return Array.from(map.values());
      };
      useSosStore.setState({
        sos: merge(sos, remoteSos),
        requests: merge(requests, remoteRequests),
        rescuers: mergeRescuers(rescuers, remoteRescuers),
      });
    })();

    const channel = db
      .channel("aapdasarthi-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.sos },
(payload) => {
          const row = payload.new as { id: string; data: SosItem } | null;
          if (!row || !row.data || typeof row.data.timestamp !== "string") return;
          const cur = useSosStore.getState();
          const existing = cur.sos.find((s) => s.id === row.id);
          const existingStamp = existing?.updatedAt || existing?.timestamp;
          const incomingStamp = row.data.updatedAt || row.data.timestamp;
          // Last-write-wins: ignore our own echo (equal timestamp) AND any
          // STALE row a slower device re-uploads (older timestamp). Without
          // the freshness check an old "claimed" copy could overwrite a
          // freshly "delivered" one and the card would visibly revert.
          if (existing && String(existingStamp) >= String(incomingStamp)) return;
          const next = cur.sos.filter((s) => s.id !== row.id);
          useSosStore.setState({ sos: [row.data, ...next] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.requests },
(payload) => {
          const row = payload.new as { id: string; data: ResourceRequest } | null;
          if (!row || !row.data || typeof row.data.timestamp !== "string") return;
          const cur = useSosStore.getState();
          const existing = cur.requests.find((r) => r.id === row.id);
          const existingStamp = existing?.updatedAt || existing?.timestamp;
          const incomingStamp = row.data.updatedAt || row.data.timestamp;
          if (existing && String(existingStamp) >= String(incomingStamp)) return;
          const next = cur.requests.filter((r) => r.id !== row.id);
          useSosStore.setState({ requests: [row.data, ...next] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.rescuers },
        (payload) => {
          const row = payload.new as { id: string; data: Rescuer } | null;
          if (!row || !row.data || typeof row.data.lastSeen !== "string") return;
          const cur = useSosStore.getState();
          const existing = cur.rescuers.find((r) => r.id === row.id);
          if (existing && String(existing.lastSeen) >= String(row.data.lastSeen)) return;
          const next = cur.rescuers.filter((r) => r.id !== row.id);
          useSosStore.setState({ rescuers: [row.data, ...next] });
        }
      )
      .subscribe();

    return () => {
      disposed = true;
      db.removeChannel(channel);
    };
  }, []);

  return null;
}
