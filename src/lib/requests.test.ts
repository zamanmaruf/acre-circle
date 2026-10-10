import { describe, expect, it } from "vitest";
import { candidatesFor, runAllocation } from "./engine/allocate";
import { fitFor } from "./fit";
import { acceptRequest, createRequest, declineRequest, isOpen, markViewed, RequestTransitionError } from "./requests";
import { SEED_GROWERS, SEED_PROPERTIES } from "./seed";
import type { Grower, PlotRequest } from "./types";

const T0 = "2026-10-10T12:00:00.000Z";
const T1 = "2026-10-10T13:00:00.000Z";
const growerF = (): Grower => structuredClone(SEED_GROWERS.find((g) => g.id === "grower-f")!);
const harbour = () => structuredClone(SEED_PROPERTIES.find((p) => p.id === "harbour-valley")!);
const input = { propertyId: "harbour-valley", growerId: "grower-f", requestedAcres: 0.25, message: "  We grow cut flowers.  " };

function sent(): PlotRequest {
  return createRequest([], input, { id: "req-1", now: T0 }).request;
}

describe("plot requests — creation", () => {
  it("creates a sent request with trimmed message and the supplied id and timestamp", () => {
    const out = createRequest([], input, { id: "req-1", now: T0 });
    expect(out.created).toBe(true);
    expect(out.request).toEqual({
      id: "req-1",
      propertyId: "harbour-valley",
      growerId: "grower-f",
      requestedAcres: 0.25,
      message: "We grow cut flowers.",
      status: "sent",
      createdAt: T0,
      updatedAt: T0,
    });
    expect(out.requests).toHaveLength(1);
  });

  it("is idempotent: a second request for the same grower and property returns the open one", () => {
    const first = createRequest([], input, { id: "req-1", now: T0 });
    const again = createRequest(first.requests, { ...input, requestedAcres: 0.5 }, { id: "req-2", now: T1 });
    expect(again.created).toBe(false);
    expect(again.request.id).toBe("req-1");
    expect(again.requests).toBe(first.requests);
  });

  it("treats an accepted request as a duplicate too, but allows a new one after a decline", () => {
    const accepted = acceptRequest(sent(), growerF(), T1).request;
    expect(createRequest([accepted], input, { id: "req-2", now: T1 }).created).toBe(false);
    const declined = declineRequest(sent(), "Season already committed", T1);
    const retry = createRequest([declined], input, { id: "req-2", now: T1 });
    expect(retry.created).toBe(true);
    expect(retry.requests).toHaveLength(2);
  });

  it("rejects a non-positive area", () => {
    expect(() => createRequest([], { ...input, requestedAcres: 0 }, { id: "x", now: T0 })).toThrow(RequestTransitionError);
    expect(() => createRequest([], { ...input, requestedAcres: Number.NaN }, { id: "x", now: T0 })).toThrow(RequestTransitionError);
  });
});

describe("plot requests — transitions", () => {
  it("markViewed only moves sent → viewed and leaves other states untouched", () => {
    const viewed = markViewed(sent(), T1);
    expect(viewed.status).toBe("viewed");
    expect(viewed.updatedAt).toBe(T1);
    expect(markViewed(viewed, "2026-10-11T00:00:00.000Z")).toBe(viewed);
    const accepted = acceptRequest(viewed, growerF(), T1).request;
    expect(markViewed(accepted, T1)).toBe(accepted);
  });

  it("accepting adds the property to the grower's applications exactly once", () => {
    const g = growerF();
    expect(g.interestedPropertyIds).not.toContain("harbour-valley");
    const out = acceptRequest(sent(), g, T1);
    expect(out.request.status).toBe("accepted");
    expect(out.grower.interestedPropertyIds).toEqual(["harbour-valley"]);
    expect(g.interestedPropertyIds).toEqual([]);
    const already = { ...g, interestedPropertyIds: ["harbour-valley"] };
    expect(acceptRequest(sent(), already, T1).grower.interestedPropertyIds).toEqual(["harbour-valley"]);
  });

  it("an accepted grower becomes an optimizer candidate and is placed (no hardcoded result)", () => {
    const property = harbour();
    const others = structuredClone(SEED_GROWERS).filter((g) => g.id !== "grower-f");
    const before = runAllocation(property, candidatesFor(property, [...others, growerF()]));
    expect(before.stats.candidatesEvaluated).toBe(5);
    const { grower } = acceptRequest(sent(), growerF(), T1);
    const after = runAllocation(property, candidatesFor(property, [...others, grower]));
    expect(after.stats.candidatesEvaluated).toBe(6);
    expect(after.plots.some((p) => p.growerId === "grower-f")).toBe(true);
    expect(after.totals.allocatedAcres).toBeLessThanOrEqual(property.cultivableAcres + 1e-9);
  });

  it("decline requires a non-blank reason and stores it trimmed", () => {
    expect(() => declineRequest(sent(), "   ", T1)).toThrow(RequestTransitionError);
    const d = declineRequest(sent(), "  Season already committed ", T1);
    expect(d.status).toBe("declined");
    expect(d.declineReason).toBe("Season already committed");
  });

  it("closed requests cannot be accepted or declined again", () => {
    const declined = declineRequest(sent(), "No", T1);
    expect(isOpen(declined)).toBe(false);
    expect(() => acceptRequest(declined, growerF(), T1)).toThrow(/already declined/);
    const accepted = acceptRequest(sent(), growerF(), T1).request;
    expect(() => declineRequest(accepted, "Changed my mind", T1)).toThrow(/already accepted/);
  });

  it("refuses to accept on behalf of a different grower", () => {
    const other = structuredClone(SEED_GROWERS.find((g) => g.id === "grower-a")!);
    expect(() => acceptRequest(sent(), other, T1)).toThrow(/does not match/);
  });
});

describe("fit badge uses the same engine as the optimizer", () => {
  it("Grower F fits Harbour Valley but not distant listings", () => {
    const f = growerF();
    expect(fitFor(harbour(), f).level).toBe("good");
    const margaree = SEED_PROPERTIES.find((p) => p.id === "margaree-riverside")!;
    const fit = fitFor(margaree, f);
    expect(fit.level).toBe("no");
    expect(fit.evaluation?.checks.find((c) => c.id === "travel")?.status).toBe("fail");
  });
});
