import { useMemo, useState } from 'react';
import { BUILT_IN_DECKS, allPrompts, findDeck, promptsInPlay, type Prompt } from '../domain/prompts';

type Props = {
  excludedIds: string[];
  onChange: (next: string[]) => void;
  /** The bundle sessions currently draw from. */
  activeDeckId: string;
  onChooseDeck: (id: string) => void;
  onBack: () => void;
};

/** "All prompts" is a view across every bundle, not a bundle itself. */
const ALL = 'all';

export function PromptBankScreen({
  excludedIds,
  onChange,
  activeDeckId,
  onChooseDeck,
  onBack,
}: Props) {
  const [viewing, setViewing] = useState<string>(activeDeckId);

  const visible: Prompt[] = useMemo(() => {
    if (viewing === ALL) return allPrompts();
    return BUILT_IN_DECKS.find((d) => d.id === viewing)?.prompts ?? [];
  }, [viewing]);

  const deck = viewing === ALL ? null : findDeck(viewing);
  const inPlay = promptsInPlay(visible, excludedIds);
  const excluded = new Set(excludedIds);
  const isActive = viewing === activeDeckId;

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
        {BUILT_IN_DECKS.map((d) => (
          <button
            key={d.id}
            type="button"
            className="roles__option"
            aria-pressed={viewing === d.id}
            onClick={() => setViewing(d.id)}
          >
            {d.name} ({d.prompts.length}){d.id === activeDeckId ? ' · in use' : ''}
          </button>
        ))}
        <button
          type="button"
          className="roles__option"
          aria-pressed={viewing === ALL}
          onClick={() => setViewing(ALL)}
        >
          All prompts ({allPrompts().length})
        </button>
      </fieldset>

      {deck && (
        <section className="card">
          <h2 className="card__title">{deck.name}</h2>
          {deck.note && <p className="card__body">{deck.note}</p>}
          {isActive ? (
            <p className="deck-state deck-state--active">Sessions draw from this bundle.</p>
          ) : (
            <>
              {/* Choosing a bundle is what makes the archived wording testable:
                  run a night on each and ask the dancers which they preferred. */}
              <button className="add__submit" type="button" onClick={() => onChooseDeck(deck.id)}>
                Use this bundle for sessions
              </button>
            </>
          )}
        </section>
      )}

      <section className="advice" data-level={inPlay.length === 0 ? 'unpairable' : 'good'}>
        <h2 className="advice__headline">
          {inPlay.length} of {visible.length} in play
        </h2>
        <p className="advice__detail">
          {inPlay.length === 0
            ? 'Everything here is set aside, so there is nothing left to draw. Put some back before running a session with challenges.'
            : isActive || viewing === ALL
              ? 'These are the challenges your next session will draw from.'
              : 'Set-asides are remembered per prompt, whether or not this bundle is the one in use.'}
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
        Writing your own prompts and building your own bundles arrives in v1.1.
      </p>
    </div>
  );
}
