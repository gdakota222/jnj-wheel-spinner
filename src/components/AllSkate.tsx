import { useState } from 'react';
import { Wheel } from './Wheel';
import type { Prompt } from '../domain/prompts';
import { pickIndex, planSpin } from '../domain/spin';

type Props = {
  /** Everything the session holds, danced or not. */
  deck: Prompt[];
  /** What nobody has danced tonight. */
  unused: Prompt[];
  /** Already drawn, when the operator is showing it a second time. */
  chosen: Prompt | null;
  onChoose: (prompt: Prompt) => void;
  onBack: () => void;
  onDone: () => void;
};

type Stage = 'mode' | 'choosing' | 'spinning' | 'revealed';

/**
 * The all-skate: one challenge, everybody on the floor, nobody judged.
 *
 * Three ways to land on it, and **the reveal is identical whichever was used**.
 * That is the whole point of offering *Choose* at all: the operator can put their
 * thumb on the scale and the room cannot tell, so a night can end on the
 * challenge that actually suits it without the draw ever looking rigged. It is
 * the one place in the app where a prompt is selected rather than drawn, and it
 * is safe precisely because nothing is at stake — no couple, no winner.
 *
 * The spin lives here rather than in the session reducer. A finale is not a
 * phase of the night: the session is already complete, and threading a new phase
 * through it would change what "complete" means for the wake lock, for restoring
 * a session, and for every screen that asks. Only the *result* goes to the
 * session, which is the part worth keeping.
 */
export function AllSkate({ deck, unused, chosen, onChoose, onBack, onDone }: Props) {
  const [stage, setStage] = useState<Stage>(chosen ? 'revealed' : 'mode');
  const [pool, setPool] = useState<Prompt[]>([]);
  const [landed, setLanded] = useState<Prompt | null>(chosen);
  const [rotation, setRotation] = useState(0);
  const [from, setFrom] = useState(0);

  const everythingDanced = unused.length === 0;

  /** Pick first, then aim the animation at it. Never the other way round. */
  function spin(entries: Prompt[]) {
    if (entries.length === 0) return;
    const target = entries[pickIndex(entries.length)];
    const plan = planSpin(entries.indexOf(target), entries.length, rotation);
    setPool(entries);
    setLanded(target);
    setFrom(rotation);
    setRotation(plan.rotation);
    setStage('spinning');
  }

  function settle() {
    if (!landed) return;
    onChoose(landed);
    setStage('revealed');
  }

  if (stage === 'revealed' && landed) {
    return (
      <div className="shell shell--session">
        <div className="stage stage--dancing">
          <p className="finale__label">Everybody on the floor</p>
          <h1 className="finale__name">{landed.name}</h1>
          <p className="finale__description">{landed.description}</p>
        </div>
        <div className="actions">
          <button className="actions__primary" type="button" onClick={onDone}>
            Done
          </button>
          <p className="actions__note">That is the night. Nothing here is judged.</p>
          {/* Choosing by hand commits on a single tap, so there has to be a way
              back from one. The crown has the same escape for the same reason. */}
          <button
            className="edit-dancers"
            type="button"
            onClick={() => {
              setLanded(null);
              setStage('mode');
            }}
          >
            Draw a different one
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'spinning') {
    return (
      <div className="shell shell--session">
        <p className="pool-label">
          The last dance: <strong>everybody</strong>
        </p>
        <div className="stage stage--wheel">
          <Wheel
            names={pool.map((p) => p.name)}
            rotation={rotation}
            fromRotation={from}
            spinning
            onSettled={settle}
            label="challenges"
          />
        </div>
        <div className="actions">
          <p className="actions__note">Landing on the last dance…</p>
        </div>
      </div>
    );
  }

  if (stage === 'choosing') {
    return (
      <div className="shell shell--setup">
        <header className="setup-head">
          <button className="back" type="button" onClick={() => setStage('mode')}>
            ← Back
          </button>
          <h1 className="screen-title">Pick the last dance</h1>
        </header>

        <p className="pick__hint">
          Nobody sees how this was landed on. The reveal looks the same either way.
        </p>

        <ul className="list__items panel__scroll">
          {deck.map((prompt) => {
            const danced = !unused.some((p) => p.id === prompt.id);
            return (
              <li key={prompt.id}>
                <button
                  type="button"
                  className="pick__row pick__row--prompt"
                  onClick={() => {
                    setLanded(prompt);
                    onChoose(prompt);
                    setStage('revealed');
                  }}
                >
                  <span className="pick__names">{prompt.name}</span>
                  {/* Marked, not hidden. A challenge the room already loved is
                      often the better way to end. */}
                  {danced && <span className="pick__danced">danced tonight</span>}
                  <span className="pick__detail">{prompt.description}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="screen-head">
        <button className="back" type="button" onClick={onBack}>
          ← Session complete
        </button>
        <h1 className="screen-title">One last dance</h1>
        <p className="subtitle">
          Everybody on the floor for one challenge. No pairs, no spotlight, nobody judged.
        </p>
      </header>

      <nav className="menu" aria-label="How to land on the last dance">
        <button className="menu__item menu__item--primary" type="button" onClick={() => spin(deck)}>
          <span className="menu__label">Full Random</span>
          <span className="menu__note">
            {deck.length === 1
              ? 'Only one challenge in the bundle, so that is where it lands.'
              : `Spins across all ${deck.length}, including ones already danced. A favourite coming back is often the better ending.`}
          </span>
        </button>

        <button
          className="menu__item"
          type="button"
          disabled={everythingDanced}
          onClick={() => spin(unused)}
        >
          <span className="menu__label">Surprise Me</span>
          {/* Says why it cannot be pressed, rather than being greyed out in
              silence — and points at the thing that still works. */}
          <span className="menu__note">
            {everythingDanced
              ? 'Every challenge has been danced tonight. Use Full Random instead.'
              : unused.length === 1
                ? 'Spins across the one challenge nobody has danced tonight.'
                : `Spins across the ${unused.length} nobody has danced tonight.`}
          </span>
        </button>

        <button className="menu__item" type="button" onClick={() => setStage('choosing')}>
          <span className="menu__label">Choose</span>
          <span className="menu__note">
            No spin — you pick it. The reveal looks identical, so only you will know.
          </span>
        </button>
      </nav>
    </div>
  );
}
