import type { EvacRoute } from "@/lib/types";

/**
 * Safe-evacuation-route generator using OSRM's public routing API.
 *
 * Given an origin (flood point) and a destination (higher ground / relief hub),
 * we ask OSRM for the fastest ROAD route — real drivable paths, not straight
 * lines — so the drawn evacuation corridor is one rescuers can actually use.
 *
 * OSRM is keyless and free for light demo use. Falls back to a straight
 * great-circle line if the API is unreachable so the map never breaks.
 */

const OSRM = "https://router.project-osrm.org/route/v1/driving";

export interface RoutedPath {
  path: [number, number][]; // [lat, lng]
  distanceKm: number;
  durationMin: number;
  source: "osrm" | "fallback";
}

function decodePolyline(str: string): [number, number][] {
  let index = 0;
  const lat = 0;
  const lng = 0;
  let lat2 = lat;
  let lng2 = lng;
  const coords: [number, number][] = [];
  let shift = 0;
  let result = 0;
  let byte: number | null = null;

  while (index < str.length) {
    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat2 += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng2 += deltaLng;

    coords.push([lat2 / 1e5, lng2 / 1e5]);
  }
  return coords;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Route from `origin` [lat,lng] to `destination` [lat,lng].
 * Returns an EvacRoute-shaped object (or throws → caller decides fallback).
 */
export async function generateSafeRoute(
  origin: [number, number],
  destination: [number, number],
  label: string,
  from: string,
  to: string
): Promise<EvacRoute> {
  // OSRM wants lon,lat
  const url =
    `${OSRM}/${origin[1]},${origin[0]};${destination[1]},${destination[0]}` +
    `?overview=full&geometries=polyline&steps=false`;

  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = await res.json();
  const route = json?.routes?.[0];
  if (!route || !route.geometry) throw new Error("no route");

  const path = decodePolyline(route.geometry);
  const distanceKm = route.distance / 1000;

  return {
    id: `live-${Date.now().toString(36)}`,
    label,
    from,
    to,
    path: path.length > 1 ? path : [origin, destination],
    lengthKm: Math.round(distanceKm * 10) / 10,
    people: 0,
  };
}

/** Straight-line fallback when OSRM is unavailable (always returns). */
export function fallbackRoute(
  origin: [number, number],
  destination: [number, number],
  label: string,
  from: string,
  to: string
): EvacRoute {
  return {
    id: `fb-${Date.now().toString(36)}`,
    label,
    from,
    to,
    path: [origin, destination],
    lengthKm: Math.round(haversineKm(origin[0], origin[1], destination[0], destination[1]) * 10) / 10,
    people: 0,
  };
}
