import { useState } from 'react';
import { useLongPress } from '../hooks/useLongPress';

type Props = {
  onUnlock: () => void;
};

/**
 * Freeze the app so a pocket cannot touch it.
 *
 * At the first real event the operator put the phone away between couples and a
 * pocket press re-spun a follower, costing her place in the night. The
 * confirmation on Re-spin catches a mis-tap while the app is being used; this
 * catches everything while it is not.
 *
 * Unlocking is a press and hold rather than a tap, because a tap is exactly what
 * a pocket produces. It says so on screen — a stranger who picks up a locked
 * tablet has to be able to work out what to do, which is principle 1 applying at
 * the least convenient moment.
 *
 * **Not available while a couple is dancing.** That screen advances on a hold
 * rather than a press, so a pocket cannot do anything there anyway — and a lock
 * overlay that looked almost exactly like the dance hold was impossible to tell
 * apart, on a screen being cast to a TV.
 */
export function LockScreen({ onUnlock }: Props) {
  const [holding, setHolding] = useState(false);
  const hold = useLongPress(onUnlock);

  return (
    <div className="lock" role="dialog" aria-modal="true" aria-label="Screen locked">
      <div className="lock__inner">
        <p className="lock__icon" aria-hidden="true">
          🔒
        </p>
        <h2 className="lock__title">Screen locked</h2>
        <p className="lock__body">Nothing can be spun or changed until you unlock it.</p>

        <button
          className={holding ? 'lock__button lock__button--holding' : 'lock__button'}
          type="button"
          {...hold}
          onTouchStart={(e) => {
            setHolding(true);
            hold.onTouchStart(e);
          }}
          onMouseDown={(e) => {
            setHolding(true);
            hold.onMouseDown(e);
          }}
          onTouchEnd={() => {
            setHolding(false);
            hold.onTouchEnd();
          }}
          onTouchCancel={() => {
            setHolding(false);
            hold.onTouchCancel();
          }}
          onMouseUp={() => {
            setHolding(false);
            hold.onMouseUp();
          }}
          onMouseLeave={() => {
            setHolding(false);
            hold.onMouseLeave();
          }}
        >
          Press and hold to unlock
        </button>
      </div>
    </div>
  );
}
