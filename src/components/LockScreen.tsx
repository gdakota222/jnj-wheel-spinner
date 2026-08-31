import { useState } from 'react';
import { useLongPress } from '../hooks/useLongPress';
import type { Dancer } from '../domain/roster';
import type { Prompt } from '../domain/prompts';

type Props = {
  /** Who is dancing right now, if anyone. */
  couple: { leader: Dancer; follower: Dancer } | null;
  /** What they are dancing, if prompts are on. */
  prompt: Prompt | null;
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
 * **It never blanks the screen.** The app is cast to a TV, so locking during a
 * dance still shows the couple and their challenge — bigger, in fact, with the
 * controls gone. Locked-while-dancing is the best view the room ever gets.
 */
export function LockScreen({ couple, prompt, onUnlock }: Props) {
  const [holding, setHolding] = useState(false);
  const hold = useLongPress(onUnlock);

  return (
    <div className="lock" role="dialog" aria-modal="true" aria-label="Screen locked">
      <div className="lock__inner">
        {couple ? (
          <div className="lock__stage">
            <p className="stage__label">Dancing now</p>
            <p className="stage__couple">
              <span className="stage__name">{couple.leader.name}</span>
              <span className="stage__amp">and</span>
              <span className="stage__name">{couple.follower.name}</span>
            </p>
            {prompt && (
              <div className="stage__challenge">
                <p className="challenge__name">{prompt.name}</p>
                <p className="challenge__description">{prompt.description}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="lock__icon" aria-hidden="true">
              🔒
            </p>
            <h2 className="lock__title">Screen locked</h2>
            <p className="lock__body">Nothing can be spun or changed until you unlock it.</p>
          </>
        )}

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
