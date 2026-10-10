import { z } from "zod";

const acres = (label: string) =>
  z.number({ message: `${label} is required.` }).finite().min(0, `${label} cannot be negative.`).max(1000, `${label} looks too large for a micro-lease.`);

export const PropertyFormSchema = z
  .object({
    name: z.string().trim().min(2, "Property name is required.").max(80),
    location: z.string().trim().min(2, "Approximate location is required.").max(120),
    totalAcres: acres("Total area").refine((v) => v > 0, "Total area must be greater than 0."),
    cultivableAcres: acres("Cultivable area"),
    reservedAcres: acres("Reserved area"),
    minPlotAcres: acres("Minimum plot").refine((v) => v > 0, "Minimum plot must be greater than 0."),
    maxPlotAcres: acres("Maximum plot").refine((v) => v > 0, "Maximum plot must be greater than 0."),
    maxGrowers: z.number().int("Must be a whole number.").min(1, "At least 1 grower.").max(20),
    rentPerAcreMonthly: z.number().finite().min(0, "Rent cannot be negative.").max(10000),
    allowedActivities: z.array(z.string()).min(1, "Select at least one permitted activity."),
  })
  .superRefine((v, ctx) => {
    if (Math.round(v.cultivableAcres * 100) + Math.round(v.reservedAcres * 100) > Math.round(v.totalAcres * 100)) {
      ctx.addIssue({ code: "custom", path: ["cultivableAcres"], message: "Cultivable + reserved area cannot exceed total area." });
    }
    if (v.minPlotAcres > v.maxPlotAcres) {
      ctx.addIssue({ code: "custom", path: ["maxPlotAcres"], message: "Maximum plot must be at least the minimum plot." });
    }
    if (v.minPlotAcres > v.cultivableAcres && v.cultivableAcres > 0) {
      ctx.addIssue({ code: "custom", path: ["minPlotAcres"], message: "Minimum plot is larger than the cultivable area." });
    }
  });

export const GrowerFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required.").max(80),
    cropType: z.string().trim().min(2, "Describe the crop or project.").max(80),
    maxTravelKm: z.number().finite().min(0, "Cannot be negative.").max(1000),
    budgetMonthly: z.number().finite().min(0, "Budget cannot be negative.").max(100000),
    minAcres: z.number().finite().refine((v) => v > 0, "Minimum must be greater than 0.").pipe(z.number().max(100)),
    desiredAcres: z.number().finite().refine((v) => v > 0, "Desired area must be greater than 0.").pipe(z.number().max(100)),
    activities: z.array(z.string()).min(1, "Select at least one intended activity."),
  })
  .superRefine((v, ctx) => {
    if (v.minAcres > v.desiredAcres) {
      ctx.addIssue({ code: "custom", path: ["minAcres"], message: "Minimum cannot exceed desired area." });
    }
  });

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
