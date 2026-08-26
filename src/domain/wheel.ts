/**
 * Wheel layout.
 *
 * Geometry lives in a 100x100 viewBox centred on the origin, so every value here
 * is in those units rather than pixels — the wheel scales to whatever space the
 * screen gives it.
 */

export const WHEEL_RADIUS = 46;
/** Labels run along the radius, from just outside the hub to just inside the rim. */
export const LABEL_INNER = 15;
export const LABEL_OUTER = 44;
export const LABEL_LENGTH = LABEL_OUTER - LABEL_INNER;

/** Rough width of a character as a fraction of font size, for this font stack. */
const CHAR_WIDTH_RATIO = 0.55;

/**
 * Legibility floor. Below this a name is technically present but unreadable at
 * arm's length, let alone across a room — so names are truncated to hold this
 * size rather than shrunk past it. The reveal always shows the full name.
 */
const MIN_FONT = 4.2;
const MAX_FONT = 7.5;

/** How many segment colours exist before the palette repeats. */
export const PALETTE_SIZE = 8;

/**
 * Colour for a segment, as a CSS variable reference so themes and colour-blind
 * palettes are a variable swap rather than a redraw (D-004).
 *
 * When the count is not a multiple of the palette, the last segment would
 * otherwise share a colour with the first — visually joining two neighbours into
 * one wedge. Shifting the final segment avoids that.
 */
export function segmentColorVar(index: number, count: number): string {
  let slot = index % PALETTE_SIZE;
  if (count > 1 && index === count - 1 && slot === 0) {
    slot = PALETTE_SIZE - (count % 2 === 0 ? 2 : 1);
  }
  return `var(--seg-${slot + 1})`;
}

/**
 * Font size for a single label.
 *
 * Sized per name rather than per wheel: one long name should not shrink everyone
 * else's. Bounded above by what the segment's arc can hold, and below by the
 * legibility floor — a name that cannot fit at the floor is truncated instead.
 */
export function labelFontSize(count: number, nameLength: number): number {
  const midRadius = (LABEL_INNER + LABEL_OUTER) / 2;
  const arc = (2 * Math.PI * midRadius) / Math.max(count, 1);
  const fromArc = arc * 0.62;
  const fromLength = LABEL_LENGTH / (Math.max(nameLength, 1) * CHAR_WIDTH_RATIO);
  return Math.max(MIN_FONT, Math.min(MAX_FONT, Math.min(fromArc, fromLength)));
}

/** How many characters fit along the radius at a given font size. */
export function maxLabelChars(fontSize: number): number {
  return Math.max(3, Math.floor(LABEL_LENGTH / (fontSize * CHAR_WIDTH_RATIO)));
}

/** Truncate only when a name genuinely cannot fit. The reveal shows it in full. */
export function fitLabel(name: string, maxChars: number): string {
  if (name.length <= maxChars) return name;
  return `${name.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

/** SVG path for one pie segment, starting at 12 o'clock and sweeping clockwise. */
export function segmentPath(index: number, count: number, radius = WHEEL_RADIUS): string {
  if (count === 1) {
    // A full circle cannot be drawn as a single arc — use two half sweeps.
    return `M 0 ${-radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 ${-radius} Z`;
  }
  const step = (Math.PI * 2) / count;
  const a0 = index * step - Math.PI / 2;
  const a1 = a0 + step;
  const large = step > Math.PI ? 1 : 0;
  const x0 = (Math.cos(a0) * radius).toFixed(3);
  const y0 = (Math.sin(a0) * radius).toFixed(3);
  const x1 = (Math.cos(a1) * radius).toFixed(3);
  const y1 = (Math.sin(a1) * radius).toFixed(3);
  return `M 0 0 L ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1} Z`;
}

/** Rotation that points a segment's label outward along its own centre line. */
export function labelRotation(index: number, count: number): number {
  return (index + 0.5) * (360 / count) - 90;
}

/**
 * Whether a label needs flipping to read the right way up.
 *
 * Text runs outward along its segment's centre line, so any segment whose line
 * points into the left half of the screen would render upside down. Which half a
 * segment occupies depends on where the wheel currently sits, so this takes the
 * rotation into account rather than being fixed per segment.
 *
 * Because a spin sets the final rotation immediately and lets CSS animate towards
 * it, labels orient themselves for the *resting* position from the moment the
 * spin starts. They are unreadable mid-spin either way, and upright when it counts.
 */
export function shouldFlipLabel(index: number, count: number, rotation: number): boolean {
  const screenAngle = ((((labelRotation(index, count) + rotation) % 360) + 360) % 360);
  return screenAngle > 90 && screenAngle < 270;
}
