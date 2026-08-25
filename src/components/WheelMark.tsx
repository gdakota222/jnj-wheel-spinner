/**
 * A static wheel, drawn as SVG from the theme's segment variables.
 *
 * This is not the real wheel (that arrives in 0.3.0). It exists in the scaffold
 * to prove the approach D-004 commits to: segments coloured by CSS custom
 * property, so a theme or colour-blind palette is a variable swap rather than a
 * redraw. If this renders correctly, the real wheel will too.
 */

const SEGMENTS = 8;

function segmentPath(index: number, radius: number): string {
  const step = (Math.PI * 2) / SEGMENTS;
  // start at 12 o'clock and sweep clockwise
  const a0 = index * step - Math.PI / 2;
  const a1 = a0 + step;
  const x0 = Math.cos(a0) * radius;
  const y0 = Math.sin(a0) * radius;
  const x1 = Math.cos(a1) * radius;
  const y1 = Math.sin(a1) * radius;
  return `M 0 0 L ${x0.toFixed(3)} ${y0.toFixed(3)} A ${radius} ${radius} 0 0 1 ${x1.toFixed(3)} ${y1.toFixed(3)} Z`;
}

type Props = {
  size?: number;
};

export function WheelMark({ size = 200 }: Props) {
  const r = 44;
  return (
    <svg
      className="wheel-mark"
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      role="img"
      aria-label="Colourful spinning wheel"
    >
      <g>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <path key={i} d={segmentPath(i, r)} fill={`var(--seg-${i + 1})`} />
        ))}
        <circle r={r * 0.17} fill="var(--pointer)" />
      </g>
      <path d="M 0 -49 L 5 -40 L -5 -40 Z" fill="var(--pointer)" />
    </svg>
  );
}
