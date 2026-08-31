import { useEffect, useMemo, useRef } from 'react';
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
  /** What this wheel is a wheel of, for assistive tech. */
  label?: string;
  /** Tapping the wheel itself starts a spin. Omit to make the wheel inert. */
  onSpin?: () => void;
  /** True when a spin cannot be started right now. */
  disabled?: boolean;
};

/** How long a spin takes. Long enough to build suspense, short enough to keep an
 *  event moving. Reduced-motion users get an instant result via the global rule. */
const SPIN_SECONDS = 4.2;

export function Wheel({
  names,
  rotation,
  spinning,
  onSettled,
  label = 'names',
  onSpin,
  disabled = false,
}: Props) {
  const count = names.length;
  const settled = useRef(false);

  /**
   * Safety net: settle on a timer as well as on `transitionend`.
   *
   * The spin normally ends when the CSS transition reports back. That event does
   * not always arrive — the app is backgrounded mid-spin, the OS drops the
   * animation, or the viewer has reduced motion and the transition is over in a
   * hundredth of a second. Any of those would leave the wheel turning forever,
   * which is the worst thing this app can do in front of a room. So the spin also
   * ends on a timer, and whichever fires first wins.
   */
  useEffect(() => {
    if (!spinning) {
      settled.current = false;
      return;
    }
    const timer = window.setTimeout(
      () => {
        if (!settled.current) {
          settled.current = true;
          onSettled();
        }
      },
      SPIN_SECONDS * 1000 + 600,
    );
    return () => window.clearTimeout(timer);
  }, [spinning, rotation, onSettled]);

  function handleTransitionEnd() {
    if (settled.current) return;
    settled.current = true;
    onSettled();
  }

  /**
   * The wheel is the control.
   *
   * At the first real event almost everybody tapped the wheel rather than the
   * button — dancers included, since the operator hands the device over so the
   * drawn follower spins for her own leader. Tapping mid-spin skips to the
   * result: the winner was chosen before the animation began, so this shortens
   * the wait without touching what was drawn.
   */
  function handleTap() {
    if (disabled || !onSpin) return;
    if (spinning) {
      handleTransitionEnd();
      return;
    }
    onSpin();
  }

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
      <button
        type="button"
        className="wheel__tap"
        onClick={handleTap}
        disabled={disabled || !onSpin}
        aria-label={spinning ? 'Skip to the result' : `Spin the wheel of ${count} ${label}`}
      >
      <svg
        className="wheel__svg"
        viewBox="-50 -50 100 100"
        role="img"
        aria-label={`Wheel of ${count} ${label}`}
      >
        <g
          className="wheel__rotor"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? `transform ${SPIN_SECONDS}s cubic-bezier(0.16, 0.84, 0.22, 1)`
              : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
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

        {/* The pointer stays put while the wheel turns beneath it, and points
            down at the name it has landed on. */}
        <path className="wheel__pointer" d="M -6 -50 L 6 -50 L 0 -38 Z" />
      </svg>
      </button>
      {onSpin && !disabled && (
        <p className="wheel__hint">{spinning ? 'Tap to skip' : 'Tap the wheel to spin'}</p>
      )}
    </div>
  );
}
