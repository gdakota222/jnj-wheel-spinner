import { useEffect, useState } from 'react';
import { HoldButton } from './HoldButton';
import type { Couple } from '../domain/session';

type Props = {
  couple: Couple;
  /** Leaves the reveal without crowning — the pick is not committed yet. */
  onBack: () => void;
  onDone: () => void;
};

/** Enough pieces to read as a burst, few enough to stay smooth on a tablet. */
const CONFETTI = Array.from({ length: 36 }, (_, i) => i);

/** Long enough for a room to join in, short enough not to sag. */
const COUNT_FROM = 3;
const COUNT_MS = 700;

/**
 * The end of the night: a curtain, a countdown, and the names.
 *
 * ## Why the curtain comes *after* the choice
 *
 * The original design dropped the curtain first and decided the winner behind
 * it. That is right for the audience vote in v1.3, where there is genuinely
 * something to hide. It is theatre with nothing behind it here: in this mode the
 * operator picks, the picking panel sits on top of the curtain, and the tablet
 * is mirrored to a TV — so the room watches the choice being made through the
 * very thing meant to conceal it. "VOTING IN SESSION" would also be a plain lie.
 *
 * So the choice happens first and the curtain is a **drumroll**, not a screen.
 * It says the one thing that is true — a winner exists — and it lasts exactly as
 * long as the operator holds it there. That answers the other open question too:
 * a curtain nobody is casting is not dead time, because its length is the
 * operator's to choose. Hold immediately and it is instant.
 */
export function WinnerReveal({ couple, onBack, onDone }: Props) {
  const [stage, setStage] = useState<'closed' | 'counting' | 'open'>('closed');
  const [count, setCount] = useState(COUNT_FROM);

  useEffect(() => {
    if (stage !== 'counting') return;
    const tick = window.setInterval(() => {
      setCount((n) => {
        if (n <= 1) {
          window.clearInterval(tick);
          setStage('open');
          return 1;
        }
        return n - 1;
      });
    }, COUNT_MS);
    return () => window.clearInterval(tick);
  }, [stage]);

  const open = stage === 'open';

  return (
    <section className="reveal">
      <div className="reveal__stage">
        {/* Behind the curtain the whole time, so parting reveals something that
            was already there rather than something that arrives. */}
        <div className="reveal__winner" aria-hidden={!open}>
          {open && (
            <div className="reveal__burst" aria-hidden="true">
              {CONFETTI.map((i) => {
                const angle = (i / CONFETTI.length) * 360 + (i % 3) * 6;
                const distance = 46 + ((i * 31) % 44);
                const delay = ((i * 47) % 260) / 1000;
                return (
                  <span
                    key={i}
                    className="reveal__confetti"
                    style={
                      {
                        '--angle': `${angle}deg`,
                        '--distance': `${distance}%`,
                        '--delay': `${delay}s`,
                        '--piece': `var(--seg-${(i % 8) + 1})`,
                      } as React.CSSProperties
                    }
                  />
                );
              })}
            </div>
          )}
          <p className="reveal__label">Winning couple</p>
          <p className="reveal__names">
            <span className="reveal__name">{couple.leader.name}</span>
            <span className="reveal__amp">&amp;</span>
            <span className="reveal__name">{couple.follower.name}</span>
          </p>
          {couple.prompt && (
            <p className="reveal__prompt">
              danced <em>{couple.prompt.name}</em>
            </p>
          )}
        </div>

        <div className="curtain" data-open={open}>
          <div className="curtain__valance" aria-hidden="true" />
          <div className="curtain__panel curtain__panel--left" aria-hidden="true" />
          <div className="curtain__panel curtain__panel--right" aria-hidden="true" />

          {!open && (
            <div className="curtain__front">
              {stage === 'counting' ? (
                <p className="curtain__count" aria-hidden="true">
                  {count}
                </p>
              ) : (
                <>
                  <p className="curtain__title">And the winner is…</p>
                  <HoldButton label="Hold to reveal" onHold={() => setStage('counting')} />
                  {/* The pick is not committed until the curtain parts, so there
                      is a way back out right up to the last moment. */}
                  <button className="curtain__back" type="button" onClick={onBack}>
                    Not yet — go back
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Announced only once the curtain is open, so a screen reader does not
          give away the name the room is still waiting for. */}
      <p className="visually-hidden" role="status">
        {open ? `The winning couple is ${couple.leader.name} and ${couple.follower.name}.` : ''}
      </p>

      {open && (
        <div className="reveal__actions">
          <button className="actions__primary" type="button" onClick={onDone}>
            Done
          </button>
        </div>
      )}
    </section>
  );
}
