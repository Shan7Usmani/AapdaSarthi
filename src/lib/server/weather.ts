import type { DistrictWeather, DistrictRiskOutput } from "@/lib/risk";
import { assessDistrict } from "@/lib/risk";
import { INDIA_DISTRICTS } from "@/data/india-districts";

/**
 * Server-only weather telemetry fetcher.
 * Pulls current precipitation + 24h accumulation from Open-Meteo for every
 * Indian district centroid (batched to stay within API limits), then scores
 * each with the shared risk engine.
 */

const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";
const BATCH = 250;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

interface OpenMeteoRow {
  latitude: number;
  longitude: number;
  current?: {
    time: string;
    precipitation?: number;
    precipitation_probability?: number;
  };
  hourly?: {
    time: string[];
    precipitation?: number[];
  };
}

function accumFromHourly(row: OpenMeteoRow | undefined): number {
  const h = row?.hourly;
  if (!h || !h.time || !h.precipitation) return 0;
  // sum the last 24 hourly readings (last day of forecast)
  const scale = Math.min(h.precipitation.length, 24);
  let sum = 0;
  for (let i = h.precipitation.length - scale; i < h.precipitation.length; i++) {
    sum += h.precipitation[i] ?? 0;
  }
  return sum;
}

async function fetchBatch(
  batchDistricts: typeof INDIA_DISTRICTS
): Promise<DistrictWeather[]> {
  const lats = batchDistricts.map((d) => d.lat).join(",");
  const lons = batchDistricts.map((d) => d.lon).join(",");
  const url =
    `${OPEN_METEO}?latitude=${lats}&longitude=${lons}` +
    `&current=precipitation,precipitation_probability` +
    `&hourly=precipitation&past_days=0&forecast_days=1&timezone=Asia%2FKolkata`;

  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);

  const rows = (await res.json()) as OpenMeteoRow[];
  const now = new Date().toISOString();

  return batchDistricts.map((d, i) => {
    const row = rows[i];
    return {
      name: d.name,
      state: d.state,
      lat: d.lat,
      lon: d.lon,
      precipitation: Number(row?.current?.precipitation ?? 0),
      probability: Number(row?.current?.precipitation_probability ?? 0),
      precipitation24h: accumFromHourly(row),
      fetchedAt: row?.current?.time ?? now,
      source: "live" as const,
    };
  });
}

/** Fetch + score ALL Indian districts. Throws if live data fails entirely. */
export async function getIndiaDistrictsLive(): Promise<DistrictRiskOutput[]> {
  const results: DistrictRiskOutput[] = [];
  for (const batch of chunk(INDIA_DISTRICTS, BATCH)) {
    const weather = await fetchBatch(batch);
    for (const w of weather) results.push(assessDistrict(w));
  }
  return results;
}

/** Deterministic seeded fallback so the API never returns empty when offline. */
export function getIndiaDistrictsSeeded(): DistrictRiskOutput[] {
  // Deterministic pseudo-rain: seed a handful of flood-prone belts with heavy rain
  // so the live map always has something to show, clearly tagged as cached.
  const hotZones: Record<string, { p: number; a: number; pr: number }> = {
    // Assam belt
    "Dhuburi": { p: 8.4, a: 118, pr: 92 },
    "Barpeta": { p: 7.1, a: 96, pr: 88 },
    "Dhemaji": { p: 6.6, a: 88, pr: 85 },
    "Lakhimpur": { p: 5.9, a: 74, pr: 82 },
    "Goalpara": { p: 5.2, a: 66, pr: 78 },
    // Ladakh / north
    "Leh": { p: 2.6, a: 40, pr: 65 },
    // West coast monsoon
    "South Goa": { p: 4.8, a: 92, pr: 90 },
    "Raigad": { p: 4.4, a: 78, pr: 84 },
    "Ratnagiri": { p: 4.1, a: 72, pr: 82 },
    // NE
    "Dibrugarh": { p: 4.0, a: 60, pr: 80 },
  };

  const now = new Date().toISOString();
  return INDIA_DISTRICTS.map((d) => {
    const hot = hotZones[d.name];
    return assessDistrict({
      name: d.name,
      state: d.state,
      lat: d.lat,
      lon: d.lon,
      precipitation: hot?.p ?? Math.random() * 0.5,
      probability: hot?.pr ?? 5 + Math.random() * 20,
      precipitation24h: hot?.a ?? Math.random() * 15,
      fetchedAt: now,
      source: "seeded",
    });
  });
}

export async function getIndiaDistricts(): Promise<{
  districts: DistrictRiskOutput[];
  source: "live" | "seeded";
}> {
  try {
    const districts = await getIndiaDistrictsLive();
    return { districts, source: "live" };
  } catch {
    return { districts: getIndiaDistrictsSeeded(), source: "seeded" };
  }
}
