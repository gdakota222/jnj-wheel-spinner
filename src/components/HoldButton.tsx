import { useRef, useState } from 'react';

type Props = {
  label: string;
  onHold: () => void;
  /** How long the hold must last. */
  ms?: number;
};

/** Long enough that a pocket cannot manage it, short enough to do every dance. */
const DEFAULT_HOLD_MS = 900;
/** A finger that drifts this far was scrolling, not pressing. */
const MOVE_TOLERANCE_PX = 12;

/**
 * A button that must be held, with the hold showing its own progress.
 *
 * Used for advancing past a dancing couple. That screen has no lock — the lock
 * overlay looked so much like the dance hold itself that it was impossible to
 * tell which one you were looking at, and the app is cast to a TV where a
 * near-identical overlay is just confusing. Making the only action on the screen
 * deliberate removes the need for a lock at all, which is both safer and less to
 * look at.
 */
export function HoldButton({ label, onHold, ms = DEFAULT_HOLD_MS }: Props) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const start = (x: number, y: number) => {
    origin.current = { x, y };
    setHolding(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      onHold();
    }, ms);
  };

  const cancel = () => {
    window.clearTimeout(timer.current);
    origin.current = null;
    setHolding(false);
  };

  const moved = (x: number, y: number) => {
    if (!origin.current) return;
    if (Math.hypot(x - origin.current.x, y - origin.current.y) > MOVE_TOLERANCE_PX) cancel();
  };

  return (
    <button
      className={holding ? 'hold-button hold-button--holding' : 'hold-button'}
      type="button"
      style={{ '--hold-ms': `${ms}ms` } as React.CSSProperties}
      onTouchStart={(e) => start(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => moved(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={cancel}
      onTouchCancel={cancel}
      onMouseDown={(e) => start(e.clientX, e.clientY)}
      onMouseMove={(e) => moved(e.clientX, e.clientY)}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="hold-button__fill" aria-hidden="true" />
      <span className="hold-button__label">{label}</span>
    </button>
  );
}
