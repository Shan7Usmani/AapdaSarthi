export interface RainfallPoint {
  name: string;
  state: string;
  lat: number;
  lon: number;
  precipitation: number; // mm/hr
  probability: number; // % chance of precip
  source: "live" | "seeded";
  fetchedAt: string;
}

export type RainfallBand = "low" | "moderate" | "high";

// rain rate thresholds (mm/hr) → band
export function rainfallBand(p: number): RainfallBand {
  if (p >= 2.5) return "high";
  if (p >= 0.1) return "moderate";
  return "low";
}

export const BAND_META: Record<
  RainfallBand,
  { color: string; fill: string; label: string; risk: string }
> = {
  low: { color: "#22c55e", fill: "rgba(34,197,94,0.25)", label: "Low / Dry", risk: "SAFE" },
  moderate: { color: "#f59e0b", fill: "rgba(245,158,11,0.35)", label: "Moderate rain", risk: "WATCH" },
  high: { color: "#ef4444", fill: "rgba(239,68,68,0.4)", label: "Heavy rain", risk: "ALERT" },
};

export const CITIES: { name: string; state: string; lat: number; lon: number }[] = [
  { name: "Delhi", state: "Delhi", lat: 28.61, lon: 77.21 },
  { name: "Mumbai", state: "Maharashtra", lat: 19.07, lon: 72.88 },
  { name: "Kolkata", state: "West Bengal", lat: 22.57, lon: 88.36 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.08, lon: 80.27 },
  { name: "Bengaluru", state: "Karnataka", lat: 12.97, lon: 77.59 },
  { name: "Hyderabad", state: "Telangana", lat: 17.39, lon: 78.49 },
  { name: "Guwahati", state: "Assam", lat: 26.14, lon: 91.74 },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.85, lon: 80.95 },
  { name: "Patna", state: "Bihar", lat: 25.59, lon: 85.14 },
  { name: "Bhubaneswar", state: "Odisha", lat: 20.3, lon: 85.82 },
  { name: "Ranchi", state: "Jharkhand", lat: 23.34, lon: 85.31 },
  { name: "Bhopal", state: "Madhya Pradesh", lat: 23.26, lon: 77.41 },
  { name: "Nagpur", state: "Maharashtra", lat: 21.15, lon: 79.09 },
  { name: "Jaipur", state: "Rajasthan", lat: 26.91, lon: 75.79 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.02, lon: 72.57 },
  { name: "Pune", state: "Maharashtra", lat: 18.52, lon: 73.86 },
  { name: "Surat", state: "Gujarat", lat: 21.17, lon: 72.83 },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.72, lon: 75.86 },
  { name: "Varanasi", state: "Uttar Pradesh", lat: 25.32, lon: 82.99 },
  { name: "Silchar", state: "Assam", lat: 24.83, lon: 92.78 },
  { name: "Dibrugarh", state: "Assam", lat: 27.48, lon: 95.02 },
  { name: "Itanagar", state: "Arunachal Pradesh", lat: 27.08, lon: 93.61 },
  { name: "Imphal", state: "Manipur", lat: 24.82, lon: 93.94 },
  { name: "Agartala", state: "Tripura", lat: 23.84, lon: 91.28 },
  { name: "Panaji", state: "Goa", lat: 15.49, lon: 73.83 },
  { name: "Kochi", state: "Kerala", lat: 9.93, lon: 76.27 },
  { name: "Thiruvananthapuram", state: "Kerala", lat: 8.52, lon: 76.94 },
  { name: "Raipur", state: "Chhattisgarh", lat: 21.25, lon: 81.63 },
  { name: "Chandigarh", state: "Chandigarh", lat: 30.73, lon: 76.78 },
  { name: "Srinagar", state: "Jammu & Kashmir", lat: 34.08, lon: 74.8 },
];

// deterministic pseudo-rainfall so the map never looks empty when offline
const SEED = [
  0.0, 8.2, 4.6, 1.2, 0.3, 0.0, 11.4, 3.1, 2.9, 1.8, 0.6, 0.1, 0.2, 0.0, 0.0, 0.4, 0.1, 0.0, 2.2,
  9.8, 12.6, 7.1, 6.3, 5.4, 3.6, 4.9, 2.7, 1.1, 0.0, 0.0,
];

export function seededRainfall(): RainfallPoint[] {
  const now = new Date().toISOString();
  return CITIES.map((c, i) => ({
    ...c,
    precipitation: SEED[i % SEED.length],
    probability: Math.min(95, Math.round(SEED[i % SEED.length] * 9 + 5)),
    source: "seeded",
    fetchedAt: now,
  }));
}

async function fetchOpenMeteo(): Promise<RainfallPoint[]> {
  const lats = CITIES.map((c) => c.lat).join(",");
  const lons = CITIES.map((c) => c.lon).join(",");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
    `&current=precipitation,precipitation_probability&timezone=Asia%2FKolkata&forecast_days=1`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = (await res.json()) as Array<{
    latitude: number;
    longitude: number;
    current?: {
      time: string;
      precipitation?: number;
      precipitation_probability?: number;
    };
  }>;
  const rows = Array.isArray(json) ? json : [];
  return CITIES.map((c, i) => ({
    ...c,
    precipitation: Number(rows[i]?.current?.precipitation ?? 0),
    probability: Number(rows[i]?.current?.precipitation_probability ?? 0),
    source: "live" as const,
    fetchedAt: rows[i]?.current?.time ?? new Date().toISOString(),
  }));
}

export async function getRainfall(): Promise<{
  points: RainfallPoint[];
  source: "live" | "seeded";
}> {
  try {
    const live = await fetchOpenMeteo();
    return { points: live, source: "live" };
  } catch {
    return { points: seededRainfall(), source: "seeded" };
  }
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
