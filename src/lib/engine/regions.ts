import type { Region } from "../types";

/**
 * Approximate road distances (km) between Nova Scotia regions, used only as a
 * coarse travel filter. These are rounded estimates, not routed distances.
 */
const KM: Record<string, number> = {
  "Halifax Regional Municipality|Annapolis Valley": 100,
  "Halifax Regional Municipality|Truro & Colchester": 95,
  "Halifax Regional Municipality|South Shore": 100,
  "Halifax Regional Municipality|Antigonish & Eastern NS": 210,
  "Halifax Regional Municipality|Cape Breton": 320,
  "Annapolis Valley|Truro & Colchester": 150,
  "Annapolis Valley|South Shore": 120,
  "Annapolis Valley|Antigonish & Eastern NS": 260,
  "Annapolis Valley|Cape Breton": 400,
  "Truro & Colchester|South Shore": 190,
  "Truro & Colchester|Antigonish & Eastern NS": 120,
  "Truro & Colchester|Cape Breton": 250,
  "South Shore|Antigonish & Eastern NS": 300,
  "South Shore|Cape Breton": 420,
  "Antigonish & Eastern NS|Cape Breton": 130,
};

export const SAME_REGION_KM = 15;

/**
 * Approximate region centres for map display only (travel radius circles,
 * default pins). The allocation engine never reads these.
 */
export const REGION_CENTROIDS: Record<Region, { lat: number; lng: number }> = {
  "Halifax Regional Municipality": { lat: 44.6488, lng: -63.5752 },
  "Annapolis Valley": { lat: 45.0773, lng: -64.4959 },
  "Truro & Colchester": { lat: 45.365, lng: -63.28 },
  "South Shore": { lat: 44.378, lng: -64.52 },
  "Antigonish & Eastern NS": { lat: 45.623, lng: -61.992 },
  "Cape Breton": { lat: 46.1368, lng: -60.1942 },
};

/** Generous bounding box around mainland Nova Scotia and Cape Breton. */
export const NS_BOUNDS = { minLat: 43.3, maxLat: 47.1, minLng: -66.6, maxLng: -59.6 } as const;

export function approxDistanceKm(a: Region, b: Region): number {
  if (a === b) return SAME_REGION_KM;
  return KM[`${a}|${b}`] ?? KM[`${b}|${a}`] ?? 500;
}
