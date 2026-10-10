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

export function approxDistanceKm(a: Region, b: Region): number {
  if (a === b) return SAME_REGION_KM;
  return KM[`${a}|${b}`] ?? KM[`${b}|${a}`] ?? 500;
}
