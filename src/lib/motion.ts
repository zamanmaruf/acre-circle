/**
 * Motion tokens. Durations and easings follow Material 3's guidance: short
 * for small state changes, medium for components entering, long for large
 * spatial moves. Everything decelerates into place.
 */
export const DURATION = {
  short: 0.15,
  medium: 0.25,
  long: 0.4,
  extraLong: 0.7,
} as const;

export const EASE = {
  standard: [0.2, 0, 0, 1],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
} as const satisfies Record<string, [number, number, number, number]>;

export const SPRING = {
  gentle: { type: "spring", stiffness: 140, damping: 22 },
  snappy: { type: "spring", stiffness: 420, damping: 34 },
  sheet: { type: "spring", stiffness: 300, damping: 34 },
} as const;
