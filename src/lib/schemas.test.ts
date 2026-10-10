import { describe, expect, it } from "vitest";
import { REGION_CENTROIDS } from "./engine/regions";
import { CoordinatesSchema, requestFormSchema } from "./schemas";
import { SEED_PROPERTIES } from "./seed";

describe("coordinates", () => {
  it("accepts every seed property pin and every region centroid", () => {
    for (const p of SEED_PROPERTIES) expect(CoordinatesSchema.safeParse(p.coordinates).success, p.id).toBe(true);
    for (const [region, c] of Object.entries(REGION_CENTROIDS)) expect(CoordinatesSchema.safeParse(c).success, region).toBe(true);
  });

  it("rejects pins outside Nova Scotia with a readable message", () => {
    for (const c of [
      { lat: 45.42, lng: -75.69 }, // Ottawa
      { lat: 46.24, lng: -63.13 + 10 }, // Atlantic Ocean, east of bounds
      { lat: 40, lng: -64 },
    ]) {
      const r = CoordinatesSchema.safeParse(c);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0].message).toBe("Pin must be in Nova Scotia.");
    }
  });

  it("rejects non-finite values", () => {
    expect(CoordinatesSchema.safeParse({ lat: Number.NaN, lng: -64 }).success).toBe(false);
    expect(CoordinatesSchema.safeParse({ lat: 45, lng: Number.POSITIVE_INFINITY }).success).toBe(false);
  });
});

describe("plot request form", () => {
  const schema = requestFormSchema({ minPlotAcres: 0.25, maxPlotAcres: 0.75 });

  it("accepts an area within the owner's plot range and a short note", () => {
    expect(schema.safeParse({ requestedAcres: 0.5, message: "We grow garlic and greens." }).success).toBe(true);
  });

  it("rejects areas outside the owner's plot range", () => {
    const small = schema.safeParse({ requestedAcres: 0.1, message: "We grow garlic and greens." });
    expect(small.success).toBe(false);
    if (!small.success) expect(small.error.issues[0].message).toMatch(/smallest plot is 0\.25 ac/);
    expect(schema.safeParse({ requestedAcres: 1, message: "We grow garlic and greens." }).success).toBe(false);
  });

  it("requires a note of at least 10 characters after trimming", () => {
    expect(schema.safeParse({ requestedAcres: 0.5, message: "   hi      " }).success).toBe(false);
  });
});
