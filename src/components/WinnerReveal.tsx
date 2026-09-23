import { useEffect, useState } from 'react';
import { HoldButton } from './HoldButton';
import type { Couple } from '../domain/session';

type Props = {
  couple: Couple;
  /** Leaves the reveal without crowning — the pick is not committed yet. */
  onBack: () => void;
  onDone: () => void;
};

/**
 * The celebration, in three layers: bursts from three points, a rain of confetti
 * across the whole screen, and the names popping in over a gold glow.
 *
 * Asked for by both people in the handoff rehearsal, independently: the single
 * burst was noticed, and more was wanted. This is the moment the whole night
 * builds to. Everything here is transform and opacity only, so it stays smooth
 * on a tablet, and it all sits *behind* the names so they stay readable.
 *
 * Deterministic rather than random — spread by multiplying the index by primes —
 * so every reveal looks equally good and a re-render cannot reshuffle it.
 */
const PER_BURST = 28;
const BURSTS = [
  { x: '50%', y: '46%', delay: 0 },
  { x: '20%', y: '30%', delay: 0.45 },
  { x: '80%', y: '30%', delay: 0.9 },
];
const RAIN = Array.from({ length: 44 }, (_, i) => i);

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
        {open && (
          <div className="reveal__party" aria-hidden="true">
            {BURSTS.map((burst, b) =>
              Array.from({ length: PER_BURST }, (_, i) => {
                const angle = (i / PER_BURST) * 360 + b * 11 + (i % 3) * 6;
                const distance = 34 + ((i * 31 + b * 17) % 40);
                return (
                  <span
                    key={`b${b}-${i}`}
                    className="reveal__confetti"
                    style={
                      {
                        left: burst.x,
                        top: burst.y,
                        '--angle': `${angle}deg`,
                        '--distance': `${distance}vmin`,
                        '--delay': `${burst.delay + ((i * 47) % 200) / 1000}s`,
                        '--piece': `var(--seg-${((i + b * 3) % 8) + 1})`,
                      } as React.CSSProperties
                    }
                  />
                );
              }),
            )}
            {RAIN.map((i) => (
              <span
                key={`r${i}`}
                className={i % 4 === 0 ? 'reveal__rain reveal__rain--round' : 'reveal__rain'}
                style={
                  {
                    left: `${(i * 37) % 100}%`,
                    '--delay': `${0.6 + ((i * 83) % 2600) / 1000}s`,
                    '--fall': `${2.6 + ((i * 29) % 13) / 10}s`,
                    '--sway': `${((i * 53) % 9) - 4}vw`,
                    '--piece': `var(--seg-${(i % 8) + 1})`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        {/* Behind the curtain the whole time, so parting reveals something that
            was already there rather than something that arrives. */}
        <div className="reveal__winner" aria-hidden={!open} data-open={open}>
          <span className="reveal__glow" aria-hidden="true" />
          <p className="reveal__label">
            <span className="reveal__crown" aria-hidden="true">
              👑
            </span>{' '}
            Winning couple
          </p>
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
