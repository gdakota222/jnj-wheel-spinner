import { useMemo } from 'react';
import {
  LABEL_INNER,
  WHEEL_RADIUS,
  fitLabel,
  labelFontSize,
  labelRotation,
  maxLabelChars,
  segmentColorVar,
  segmentPath,
  shouldFlipLabel,
} from '../domain/wheel';

type Props = {
  names: string[];
  rotation: number;
  spinning: boolean;
  onSettled: () => void;
};

/** How long a spin takes. Long enough to build suspense, short enough to keep an
 *  event moving. Reduced-motion users get an instant result via the global rule. */
const SPIN_SECONDS = 4.2;

export function Wheel({ names, rotation, spinning, onSettled }: Props) {
  const count = names.length;

  // Each label is sized for its own name, so one long name does not shrink the
  // whole wheel. Anything that still cannot fit at the legibility floor is
  // truncated — the reveal shows the full name regardless.
  const labels = useMemo(
    () =>
      names.map((name) => {
        const fontSize = labelFontSize(count, name.length);
        return { text: fitLabel(name, maxLabelChars(fontSize)), fontSize };
      }),
    [names, count],
  );

  return (
    <div className="wheel">
      <svg
        className="wheel__svg"
        viewBox="-50 -50 100 100"
        role="img"
        aria-label={`Wheel of ${count} ${count === 1 ? 'name' : 'names'}`}
      >
        <g
          className="wheel__rotor"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? `transform ${SPIN_SECONDS}s cubic-bezier(0.16, 0.84, 0.22, 1)`
              : 'none',
          }}
          onTransitionEnd={onSettled}
        >
          {names.map((name, i) => (
            <path
              key={`${name}-seg`}
              d={segmentPath(i, count)}
              fill={segmentColorVar(i, count)}
              stroke="var(--bg)"
              strokeWidth="0.4"
            />
          ))}

          {names.map((name, i) => {
            // Flip left-hand labels so they never read upside down.
            const flipped = shouldFlipLabel(i, count, rotation);
            const angle = labelRotation(i, count) + (flipped ? 180 : 0);
            return (
              <g key={`${name}-label`} transform={`rotate(${angle})`}>
                <text
                  className="wheel__label"
                  x={flipped ? -LABEL_INNER : LABEL_INNER}
                  y="0"
                  fontSize={labels[i].fontSize}
                  textAnchor={flipped ? 'end' : 'start'}
                  dominantBaseline="middle"
                >
                  {labels[i].text}
                </text>
              </g>
            );
          })}

          <circle r={WHEEL_RADIUS * 0.16} fill="var(--pointer)" />
        </g>

        {/* The pointer stays put while the wheel turns beneath it. */}
        <path className="wheel__pointer" d="M 0 -49 L 5.5 -39 L -5.5 -39 Z" />
      </svg>
    </div>
  );
}
