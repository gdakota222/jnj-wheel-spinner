import type { Dancer } from '../domain/roster';
import type { SessionState } from '../domain/session';

type Props = {
  session: SessionState;
  respinTarget: Dancer | undefined;
  onRespin: () => void;
  onRedrawChallenge: () => void;
  onOpenLog: () => void;
  onOpenDancers: () => void;
  onClose: () => void;
};

/**
 * Everything a session needs occasionally, one tap away.
 *
 * The session screen must never scroll — at the first real event the Lock
 * control sat below the fold and had to be hunted for. Only Undo and Lock earn a
 * permanent place beside the wheel; the rest live here.
 */
export function SessionTools({
  session,
  respinTarget,
  onRespin,
  onRedrawChallenge,
  onOpenLog,
  onOpenDancers,
  onClose,
}: Props) {
  const canRedrawChallenge = session.phase === 'couple' && session.currentPrompt !== null;

  return (
    <div className="scrim" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tools-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <h2 className="sheet__title" id="tools-title">
            Session tools
          </h2>
          <button className="sheet__close" type="button" onClick={onClose}>
            Done
          </button>
        </header>

        <nav className="tools">
          {respinTarget && (
            <button className="tools__item" type="button" onClick={onRespin}>
              <span className="tools__label">Re-spin {respinTarget.name}</span>
              <span className="tools__note">
                Puts them back in the pool and draws again. Asks first.
              </span>
            </button>
          )}

          {canRedrawChallenge && (
            <button className="tools__item" type="button" onClick={onRedrawChallenge}>
              <span className="tools__label">Draw a different challenge</span>
              <span className="tools__note">
                Swaps this couple's challenge for another. Asks first.
              </span>
            </button>
          )}

          <button className="tools__item" type="button" onClick={onOpenDancers}>
            <span className="tools__label">Edit dancers</span>
            <span className="tools__note">Add a late arrival, rename, change role, or remove.</span>
          </button>

          <button className="tools__item" type="button" onClick={onOpenLog}>
            <span className="tools__label">View log</span>
            <span className="tools__note">
              {session.log.length} of {session.couplesTotal}{' '}
              {session.couplesTotal === 1 ? 'couple' : 'couples'} danced so far.
            </span>
          </button>
        </nav>
      </section>
    </div>
  );
}
