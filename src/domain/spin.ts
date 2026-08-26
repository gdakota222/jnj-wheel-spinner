/**
 * Spin mathematics.
 *
 * The wheel is honest: an index is chosen at random *first*, and the animation
 * is then aimed at it. Nothing is steered, filtered, or nudged — see
 * intent.md § Enduring constraints.
 */

/** Normalise any angle into [0, 360). */
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** Which segment currently sits under the pointer at 12 o'clock. */
export function segmentUnderPointer(rotation: number, count: number): number {
  if (count <= 0) return -1;
  const segment = 360 / count;
  return Math.floor(normalizeAngle(-rotation) / segment) % count;
}

/** Pick the winner. Injectable randomness so the result can be tested. */
export function pickIndex(count: number, random: () => number = Math.random): number {
  if (count <= 0) return -1;
  return Math.min(count - 1, Math.floor(random() * count));
}

export type SpinPlan = {
  index: number;
  /** Absolute rotation to animate to, always greater than the current one. */
  rotation: number;
};

/**
 * Work out where to stop so `index` ends up under the pointer.
 *
 * Always turns forward by at least `turns` full revolutions, so a spin always
 * looks like a spin even when the result is close to where the wheel already sat.
 * The landing point is jittered within the winning segment so the wheel doesn't
 * stop dead-centre every time — cosmetic only; it can never change the winner.
 */
export function planSpin(
  index: number,
  count: number,
  currentRotation: number,
  options: { turns?: number; random?: () => number } = {},
): SpinPlan {
  const { turns = 5, random = Math.random } = options;
  const segment = 360 / count;
  const centre = (index + 0.5) * segment;

  // Keep the jitter well inside the segment so rounding can never tip it over
  // into a neighbour.
  const jitter = (random() - 0.5) * segment * 0.7;

  const aligned = -centre - jitter;
  const delta = normalizeAngle(aligned - currentRotation);
  return { index, rotation: currentRotation + turns * 360 + delta };
}
