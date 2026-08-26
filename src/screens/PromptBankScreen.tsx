import { useMemo, useState } from 'react';
import { BUILT_IN_DECKS, allPrompts, promptsInPlay, type Prompt } from '../domain/prompts';

type Props = {
  excludedIds: string[];
  onChange: (next: string[]) => void;
  onBack: () => void;
};

/** "All prompts" is a view across every bundle, not a bundle itself. */
const ALL = 'all';

export function PromptBankScreen({ excludedIds, onChange, onBack }: Props) {
  const [bundleId, setBundleId] = useState<string>(BUILT_IN_DECKS[0]?.id ?? ALL);

  const visible: Prompt[] = useMemo(() => {
    if (bundleId === ALL) return allPrompts();
    return BUILT_IN_DECKS.find((d) => d.id === bundleId)?.prompts ?? [];
  }, [bundleId]);

  const inPlay = promptsInPlay(visible, excludedIds);
  const excluded = new Set(excludedIds);

  function toggle(id: string) {
    onChange(excluded.has(id) ? excludedIds.filter((x) => x !== id) : [...excludedIds, id]);
  }

  function setAll(include: boolean) {
    const ids = visible.map((p) => p.id);
    onChange(
      include
        ? excludedIds.filter((id) => !ids.includes(id))
        : [...new Set([...excludedIds, ...ids])],
    );
  }

  return (
    <div className="shell">
      <header className="screen-head">
        <button className="back" type="button" onClick={onBack}>
          ← Title screen
        </button>
        <h1 className="screen-title">Prompt bank</h1>
        <p className="subtitle">
          Every challenge the app can draw. Set any of them aside and they stay off the wheel until
          you put them back.
        </p>
      </header>

      <fieldset className="roles roles--stacked">
        <legend className="add__label">Bundle</legend>
        {BUILT_IN_DECKS.map((deck) => (
          <button
            key={deck.id}
            type="button"
            className="roles__option"
            aria-pressed={bundleId === deck.id}
            onClick={() => setBundleId(deck.id)}
          >
            {deck.name} ({deck.prompts.length})
          </button>
        ))}
        <button
          type="button"
          className="roles__option"
          aria-pressed={bundleId === ALL}
          onClick={() => setBundleId(ALL)}
        >
          All prompts ({allPrompts().length})
        </button>
      </fieldset>

      <section className="advice" data-level={inPlay.length === 0 ? 'unpairable' : 'good'}>
        <h2 className="advice__headline">
          {inPlay.length} of {visible.length} in play
        </h2>
        <p className="advice__detail">
          {inPlay.length === 0
            ? 'Everything here is set aside, so there is nothing left to draw. Put some back before running a session with challenges.'
            : 'These are the challenges your next session will draw from.'}
        </p>
        <div className="bank__bulk">
          <button className="dancer__remove" type="button" onClick={() => setAll(true)}>
            Use all
          </button>
          <button className="dancer__remove" type="button" onClick={() => setAll(false)}>
            Set all aside
          </button>
        </div>
      </section>

      <ul className="bank">
        {visible.map((prompt) => {
          const isOut = excluded.has(prompt.id);
          return (
            <li key={prompt.id} className="bank__item" data-out={isOut}>
              <div className="bank__text">
                <p className="bank__name">{prompt.name}</p>
                <p className="bank__description">{prompt.description}</p>
              </div>
              {/* State is carried by the button's own words, not by colour or
                  opacity alone — principle 3. */}
              <button
                className={isOut ? 'bank__toggle' : 'bank__toggle bank__toggle--in'}
                type="button"
                onClick={() => toggle(prompt.id)}
                aria-pressed={!isOut}
              >
                {isOut ? 'Set aside' : 'In play'}
                <span className="visually-hidden"> — {prompt.name}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="bank__note">
        Building your own bundles arrives in v1.1, alongside writing your own prompts.
      </p>
    </div>
  );
}
