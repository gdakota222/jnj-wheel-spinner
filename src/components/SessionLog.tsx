import type { Couple } from '../domain/session';

type Props = {
  log: Couple[];
  couplesTotal: number;
  onClose: () => void;
};

/**
 * Who has danced so far.
 *
 * A slide-up panel rather than its own screen (D-016): a separate screen is one
 * more place a handoff can land, and the operator checking the log should not
 * lose sight of where they were.
 */
export function SessionLog({ log, couplesTotal, onClose }: Props) {
  return (
    <div className="scrim" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <h2 className="sheet__title" id="log-title">
            Danced so far
          </h2>
          <button className="sheet__close" type="button" onClick={onClose}>
            Done
          </button>
        </header>

        <p className="sheet__hint">
          {log.length} of {couplesTotal} {couplesTotal === 1 ? 'couple' : 'couples'} this session.
        </p>

        {log.length === 0 ? (
          <p className="list__empty">Nobody has danced yet. Couples appear here as they go.</p>
        ) : (
          <ol className="log">
            {log.map((couple, i) => (
              <li key={`${couple.leader.id}-${couple.follower.id}-${i}`} className="log__row">
                <span className="log__number">{i + 1}</span>
                <span className="log__names">
                  <span className="log__name">{couple.leader.name}</span>
                  <span className="log__role">Leader</span>
                </span>
                <span className="log__names">
                  <span className="log__name">{couple.follower.name}</span>
                  <span className="log__role">Follower</span>
                </span>
                {couple.prompt && <span className="log__prompt">{couple.prompt.name}</span>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
