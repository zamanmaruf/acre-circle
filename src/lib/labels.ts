import type {
  Activity,
  Experience,
  Facility,
  IrrigationStatus,
  Practice,
  Region,
  Season,
  WaterNeed,
  WaterStatus,
} from "./types";

export const ACTIVITY_LABELS: Record<Activity, string> = {
  "mixed-vegetables": "Mixed vegetables",
  "garlic-alliums": "Garlic & alliums",
  "culinary-herbs": "Culinary herbs",
  "community-garden": "Community garden",
  "market-garden": "Market garden",
  "cut-flowers": "Cut flowers",
  berries: "Berries",
  livestock: "Livestock",
  "permanent-structures": "Permanent structures",
};

export const FACILITY_LABELS: Record<Facility, string> = {
  "tool-storage": "Tool storage",
  "wash-station": "Wash station",
  parking: "Parking",
  "cold-storage": "Cold storage",
  "compost-area": "Compost area",
};

export const WATER_LABELS: Record<WaterStatus, string> = {
  verified: "Verified on site",
  "owner-reported": "Reported by owner (unverified)",
  unknown: "Unknown",
  none: "Not available",
};

export const IRRIGATION_LABELS: Record<IrrigationStatus, string> = {
  verified: "Capacity verified",
  unverified: "Capacity not verified",
  none: "No irrigation",
};

export const WATER_NEED_LABELS: Record<WaterNeed, string> = {
  none: "Self-supplied / rain-fed",
  basic: "Basic water access",
  irrigation: "Verified irrigation capacity",
};

export const SEASON_LABELS: Record<Season, string> = {
  "growing-season": "Growing season (Apr–Nov)",
  "year-round": "Year-round (incl. overwintering)",
};

export const PRACTICE_LABELS: Record<Practice, string> = {
  "certified-organic": "Certified organic",
  "organic-practices": "Organic practices (uncertified)",
  conventional: "Conventional",
};

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  experienced: "Experienced",
};

export const REGIONS: Region[] = [
  "Halifax Regional Municipality",
  "Annapolis Valley",
  "Truro & Colchester",
  "South Shore",
  "Antigonish & Eastern NS",
  "Cape Breton",
];

export const ALL_ACTIVITIES = Object.keys(ACTIVITY_LABELS) as Activity[];
export const ALL_FACILITIES = Object.keys(FACILITY_LABELS) as Facility[];

export function formatAcres(acres: number): string {
  return `${acres.toFixed(2)} ac`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
