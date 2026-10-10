import type { Grower, PlotRequest } from "./types";

/**
 * Pure state transitions for plot requests. The store supplies ids and
 * timestamps so these functions stay deterministic and testable.
 *
 *   sent ──▶ viewed ──▶ accepted
 *     │         │
 *     └─────────┴────▶ declined
 */

export class RequestTransitionError extends Error {}

export interface TransitionContext {
  id: string;
  now: string;
}

const OPEN: PlotRequest["status"][] = ["sent", "viewed"];

export function isOpen(r: PlotRequest): boolean {
  return OPEN.includes(r.status);
}

/**
 * Creates a request unless the grower already has an open or accepted request
 * for the same property, in which case the existing one is returned unchanged.
 */
export function createRequest(
  existing: PlotRequest[],
  input: { propertyId: string; growerId: string; requestedAcres: number; message: string },
  ctx: TransitionContext,
): { requests: PlotRequest[]; request: PlotRequest; created: boolean } {
  const duplicate = existing.find(
    (r) => r.propertyId === input.propertyId && r.growerId === input.growerId && (isOpen(r) || r.status === "accepted"),
  );
  if (duplicate) return { requests: existing, request: duplicate, created: false };
  if (!(input.requestedAcres > 0)) throw new RequestTransitionError("Requested area must be greater than 0.");
  const request: PlotRequest = {
    id: ctx.id,
    propertyId: input.propertyId,
    growerId: input.growerId,
    requestedAcres: input.requestedAcres,
    message: input.message.trim(),
    status: "sent",
    createdAt: ctx.now,
    updatedAt: ctx.now,
  };
  return { requests: [...existing, request], request, created: true };
}

/** First time the owner opens a request. Later views change nothing. */
export function markViewed(r: PlotRequest, now: string): PlotRequest {
  return r.status === "sent" ? { ...r, status: "viewed", updatedAt: now } : r;
}

/** Accepting makes the grower an applicant, so the existing engine picks them up as a candidate. */
export function acceptRequest(r: PlotRequest, grower: Grower, now: string): { request: PlotRequest; grower: Grower } {
  if (!isOpen(r)) throw new RequestTransitionError(`Cannot accept a request that is already ${r.status}.`);
  if (grower.id !== r.growerId) throw new RequestTransitionError("Grower does not match the request.");
  const interested = grower.interestedPropertyIds.includes(r.propertyId)
    ? grower.interestedPropertyIds
    : [...grower.interestedPropertyIds, r.propertyId];
  return {
    request: { ...r, status: "accepted", updatedAt: now },
    grower: { ...grower, interestedPropertyIds: interested },
  };
}

export function declineRequest(r: PlotRequest, reason: string, now: string): PlotRequest {
  if (!isOpen(r)) throw new RequestTransitionError(`Cannot decline a request that is already ${r.status}.`);
  const trimmed = reason.trim();
  if (!trimmed) throw new RequestTransitionError("A reason is required when declining.");
  return { ...r, status: "declined", declineReason: trimmed, updatedAt: now };
}

export const REQUEST_STATUS_LABELS: Record<PlotRequest["status"], string> = {
  sent: "Sent",
  viewed: "Viewed by owner",
  accepted: "Accepted",
  declined: "Declined",
};
