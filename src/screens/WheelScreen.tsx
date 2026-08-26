import { useMemo, useState } from 'react';
import { RosterOptions } from '../components/RosterOptions';
import { Wheel } from '../components/Wheel';
import { buildPools, type Dancer } from '../domain/roster';
import { pickIndex, planSpin } from '../domain/spin';

type Props = {
  dancers: Dancer[];
  onChange: (next: Dancer[]) => void;
  onBack: () => void;
};

type Pool = 'leaders' | 'followers';
type Phase = 'ready' | 'spinning' | 'landed';

const POOL_LABEL: Record<Pool, string> = {
  leaders: 'Leaders',
  followers: 'Followers',
};

export function WheelScreen({ dancers, onChange, onBack }: Props) {
  const pools = useMemo(() => buildPools(dancers), [dancers]);

  const [pool, setPool] = useState<Pool>('leaders');
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [landedIndex, setLandedIndex] = useState<number | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const entries = pools[pool];
  const names = entries.map((d) => d.name);
  const landed = landedIndex === null ? null : entries[landedIndex];

  function spin() {
    if (names.length === 0 || phase === 'spinning') return;
    const index = pickIndex(names.length);
    const plan = planSpin(index, names.length, rotation);
    setLandedIndex(index);
    setPhase('spinning');
    setRotation(plan.rotation);
  }

  function editDancers(next: Dancer[]) {
    onChange(next);
    // The pools have changed underneath the draw, so any landed result is stale.
    setPhase('ready');
    setLandedIndex(null);
  }

  function choosePool(next: Pool) {
    if (phase === 'spinning') return;
    setPool(next);
    setPhase('ready');
    setLandedIndex(null);
  }

  return (
    <div className="shell">
      <header className="screen-head">
        <button className="back" type="button" onClick={onBack} disabled={phase === 'spinning'}>
          ← Roster
        </button>
        <h1 className="screen-title">Wheel preview</h1>
        <p className="subtitle">
          The wheel on its own. Pairing couples, prompts and the session loop arrive in 0.4.0.
        </p>
      </header>

      <fieldset className="roles">
        <legend className="visually-hidden">Which pool to spin</legend>
        {(['leaders', 'followers'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className="roles__option"
            aria-pressed={pool === option}
            disabled={phase === 'spinning'}
            onClick={() => choosePool(option)}
          >
            {POOL_LABEL[option]} ({pools[option].length})
          </button>
        ))}
      </fieldset>

      <button
        className="edit-dancers"
        type="button"
        onClick={() => setOptionsOpen(true)}
        disabled={phase === 'spinning'}
      >
        Edit dancers
      </button>

      {/* The pool being spun is stated, always. It is the one thing a second
          operator picking up the tablet cannot infer from anything else. */}
      <p className="pool-label" aria-live="polite">
        Now spinning: <strong>{POOL_LABEL[pool]}</strong>
      </p>

      {names.length === 0 ? (
        <section className="card">
          <h2 className="card__title">No {POOL_LABEL[pool].toLowerCase()} yet</h2>
          <p className="card__body">
            Go back to the roster and add some, or set a dancer to Switch so they can fill this
            pool.
          </p>
        </section>
      ) : (
        <>
          <Wheel
            names={names}
            rotation={rotation}
            spinning={phase === 'spinning'}
            onSettled={() => setPhase('landed')}
          />

          <div className="result" aria-live="polite">
            {phase === 'landed' && landed ? (
              <>
                <p className="result__label">Landed on</p>
                <p className="result__name">{landed.name}</p>
              </>
            ) : (
              <p className="result__idle">
                {phase === 'spinning' ? 'Spinning…' : 'Press spin to draw a name.'}
              </p>
            )}
          </div>

          <div className="actions">
            <button
              className="actions__primary"
              type="button"
              onClick={spin}
              disabled={phase === 'spinning'}
            >
              {phase === 'landed' ? 'Re-spin' : 'Spin'}
            </button>
            {phase === 'landed' && landed && (
              <p className="actions__note">
                Re-spinning puts {landed.name} back in the pool and draws again.
              </p>
            )}
          </div>
        </>
      )}

      {optionsOpen && (
        <RosterOptions
          dancers={dancers}
          onChange={editDancers}
          onClose={() => setOptionsOpen(false)}
        />
      )}
    </div>
  );
}
