export type WaterStatus = "verified" | "owner-reported" | "unknown" | "none";
export type IrrigationStatus = "verified" | "unverified" | "none";
export type WaterNeed = "none" | "basic" | "irrigation";
export type Season = "growing-season" | "year-round";
export type Practice = "certified-organic" | "organic-practices" | "conventional";
export type Experience = "beginner" | "intermediate" | "experienced";
export type ListingStatus = "ready" | "in-review" | "draft";

export type Activity =
  | "mixed-vegetables"
  | "garlic-alliums"
  | "culinary-herbs"
  | "community-garden"
  | "market-garden"
  | "cut-flowers"
  | "berries"
  | "livestock"
  | "permanent-structures";

export type Facility =
  | "tool-storage"
  | "wash-station"
  | "parking"
  | "cold-storage"
  | "compost-area";

export type Region =
  | "Halifax Regional Municipality"
  | "Annapolis Valley"
  | "Truro & Colchester"
  | "South Shore"
  | "Antigonish & Eastern NS"
  | "Cape Breton";

export interface Property {
  id: string;
  name: string;
  ownerName: string;
  location: string;
  region: Region;
  description: string;
  totalAcres: number;
  cultivableAcres: number;
  reservedAcres: number;
  water: WaterStatus;
  irrigation: IrrigationStatus;
  vehicleAccess: boolean;
  soilInfo: string;
  soilTested: boolean;
  allowedActivities: Activity[];
  minPlotAcres: number;
  maxPlotAcres: number;
  maxGrowers: number;
  rentPerAcreMonthly: number;
  sharedFacilities: Facility[];
  seasonalAvailability: Season;
  restrictions: string;
  listingStatus: ListingStatus;
  image: string;
  synthetic: true;
}

export interface Grower {
  id: string;
  label: string;
  name: string;
  kind: "individual" | "group" | "nonprofit";
  cropType: string;
  activities: Activity[];
  region: Region;
  maxTravelKm: number;
  budgetMonthly: number;
  minAcres: number;
  desiredAcres: number;
  waterNeed: WaterNeed;
  needsVehicleAccess: boolean;
  season: Season;
  experience: Experience;
  equipmentNeeds: Facility[];
  practice: Practice;
  interestedPropertyIds: string[];
  notes: string;
  synthetic: true;
}

export type CheckStatus = "pass" | "warn" | "pending" | "fail";

export interface ConstraintCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export type CandidateStatus = "placed" | "not-placed" | "deferred" | "rejected";

export interface CandidateEvaluation {
  growerId: string;
  status: CandidateStatus;
  checks: ConstraintCheck[];
  /** Feasible plot size range in acres, present when the grower passed hard checks. */
  bounds?: { lower: number; upper: number };
  allocatedAcres?: number;
  monthlyRent?: number;
  plotId?: string;
  summary: string;
}

export interface PlotAllocation {
  plotId: string;
  growerId: string;
  acres: number;
  monthlyRent: number;
  fulfillment: number;
}

export interface PlanScore {
  placements: number;
  allocatedAcres: number;
  openIssues: number;
  minFulfillment: number;
}

export interface CandidatePlan {
  growerIds: string[];
  score: PlanScore;
}

export interface AllocationResult {
  engineVersion: string;
  propertyId: string;
  inputFingerprint: string;
  valid: boolean;
  validationErrors: string[];
  plots: PlotAllocation[];
  evaluations: CandidateEvaluation[];
  score: PlanScore;
  alternatives: CandidatePlan[];
  totals: {
    totalAcres: number;
    cultivableAcres: number;
    reservedAcres: number;
    otherAcres: number;
    allocatedAcres: number;
    unallocatedAcres: number;
  };
  stats: {
    candidatesEvaluated: number;
    eligible: number;
    deferred: number;
    rejected: number;
    combinationsExplored: number;
    feasibleCombinations: number;
    constraintChecks: number;
  };
  openIssues: string[];
  assumptions: string[];
}

export type AgreementSectionId =
  | "parties"
  | "premises"
  | "use"
  | "term"
  | "rent"
  | "access"
  | "water"
  | "equipment"
  | "maintenance"
  | "insurance"
  | "termination"
  | "questions";

export interface AgreementDraft {
  key: string;
  propertyId: string;
  growerId: string;
  status: "draft" | "in-review";
  fields: Record<AgreementSectionId, string>;
  flagged: AgreementSectionId[];
  updatedAt: string;
}
