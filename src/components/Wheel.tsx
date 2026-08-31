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

/** How long a spin takes when it runs its full course. */
const SPIN_SECONDS = 4.2;
/** How long is left once the operator asks the wheel to hurry up. */
const HURRY_SECONDS = 0.9;
/** Two taps closer together than this mean "skip it entirely". */
const DOUBLE_TAP_MS = 320;

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
  const rotor = useRef<SVGGElement>(null);
  const lastTapAt = useRef(0);
  const hurried = useRef(false);

  /**
   * Safety net: settle on a timer as well as on `transitionend`.
   *
   * That event does not always arrive — the app is backgrounded mid-spin, the OS
   * drops the animation, or the viewer has reduced motion and the transition is
   * over in a hundredth of a second. Any of those would leave the wheel turning
   * forever, which is the worst thing this app can do in front of a room.
   */
  useEffect(() => {
    if (!spinning) {
      settled.current = false;
      hurried.current = false;
      return;
    }
    const timer = window.setTimeout(() => finish(), SPIN_SECONDS * 1000 + 600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, rotation]);

  function finish() {
    if (settled.current) return;
    settled.current = true;
    onSettled();
  }

  /**
   * Race the wheel to the result it was always going to reach.
   *
   * Freezes the rotor where it currently is, then re-animates to the same target
   * over a much shorter time. The landing is unchanged — the winner was chosen
   * before the spin began — so this costs nothing but the waiting, and keeps the
   * showmanship a straight skip would throw away.
   */
  function hurryUp() {
    const node = rotor.current;
    if (!node || hurried.current) return;
    hurried.current = true;

    const current = getComputedStyle(node).transform;
    node.style.transition = 'none';
    node.style.transform = current;
    void node.getBoundingClientRect(); // force the freeze to take effect
    node.style.transition = `transform ${HURRY_SECONDS}s cubic-bezier(0.25, 0.9, 0.3, 1)`;
    node.style.transform = `rotate(${rotation}deg)`;
  }

  /**
   * The wheel is the control. At the first real event almost everybody tapped it
   * before reaching for the labelled button — dancers included, since the
   * operator hands the device over so the drawn follower spins for her own leader.
   */
  function handleTap() {
    if (disabled || !onSpin) return;

    if (!spinning) {
      onSpin();
      return;
    }

    const now = Date.now();
    const isDoubleTap = now - lastTapAt.current < DOUBLE_TAP_MS;
    lastTapAt.current = now;

    if (isDoubleTap) finish();
    else hurryUp();
  }

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
        aria-label={spinning ? 'Hurry the wheel, or double tap to skip' : `Spin the wheel of ${count} ${label}`}
      >
        <svg
          className="wheel__svg"
          viewBox="-50 -50 100 100"
          role="img"
          aria-label={`Wheel of ${count} ${label}`}
        >
          <g
            ref={rotor}
            className="wheel__rotor"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? `transform ${SPIN_SECONDS}s cubic-bezier(0.16, 0.84, 0.22, 1)`
                : 'none',
            }}
            onTransitionEnd={finish}
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
    </div>
  );
}
