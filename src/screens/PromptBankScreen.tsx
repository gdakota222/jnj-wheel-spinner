import { useMemo, useState } from 'react';
import {
  ALL_DECKS_ID,
  BUILT_IN_DECKS,
  allPrompts,
  findDeck,
  promptsInPlay,
  type Prompt,
} from '../domain/prompts';

type Props = {
  excludedIds: string[];
  onChange: (next: string[]) => void;
  /** The bundle sessions currently draw from. */
  activeDeckId: string;
  onChooseDeck: (id: string) => void;
  onBack: () => void;
  backLabel: string;
};

export function PromptBankScreen({
  excludedIds,
  onChange,
  activeDeckId,
  onChooseDeck,
  onBack,
  backLabel,
}: Props) {
  const [viewing, setViewing] = useState<string>(activeDeckId);
  const [justUsedAll, setJustUsedAll] = useState(false);

  const visible: Prompt[] = useMemo(() => {
    if (viewing === ALL_DECKS_ID) return allPrompts();
    return BUILT_IN_DECKS.find((d) => d.id === viewing)?.prompts ?? [];
  }, [viewing]);

  const deck = findDeck(viewing);
  const viewingAll = viewing === ALL_DECKS_ID;
  const inPlay = promptsInPlay(visible, excludedIds);
  const excluded = new Set(excludedIds);
  const isActive = viewing === activeDeckId;
  const activeName = findDeck(activeDeckId).name;

  function toggle(id: string) {
    setJustUsedAll(false);
    onChange(excluded.has(id) ? excludedIds.filter((x) => x !== id) : [...excludedIds, id]);
  }

  function setAll(include: boolean) {
    const ids = visible.map((p) => p.id);
    setJustUsedAll(include);
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
          ← {backLabel}
        </button>
        <h1 className="screen-title">Prompt bank</h1>
        <p className="subtitle">
          Every challenge the app can draw. Set any of them aside and they stay off the wheel until
          you put them back.
        </p>
      </header>

      {/* Which bundle is in use, stated before anything else — it is the one fact
          that decides what a session actually draws from. */}
      <p className="in-use-banner">
        Sessions draw from <strong>{activeName}</strong>
      </p>

      <fieldset className="roles roles--stacked">
        <legend className="add__label">Bundle</legend>
        {BUILT_IN_DECKS.map((d) => (
          <button
            key={d.id}
            type="button"
            className="roles__option bundle-option"
            aria-pressed={viewing === d.id}
            onClick={() => {
              setViewing(d.id);
              setJustUsedAll(false);
            }}
          >
            <span>
              {d.name} ({d.prompts.length})
            </span>
            {d.id === activeDeckId && <span className="bundle-option__badge">In use</span>}
          </button>
        ))}
        <button
          type="button"
          className="roles__option bundle-option"
          aria-pressed={viewingAll}
          onClick={() => {
            setViewing(ALL_DECKS_ID);
            setJustUsedAll(false);
          }}
        >
          <span>View all Prompts ({allPrompts().length})</span>
          {activeDeckId === ALL_DECKS_ID && <span className="bundle-option__badge">In use</span>}
        </button>
      </fieldset>

      <section className="card">
        <h2 className="card__title">{deck.name}</h2>
        {deck.note && !viewingAll && <p className="card__body">{deck.note}</p>}
        {viewingAll && (
          <p className="card__body">
            Every challenge from every bundle, in one list. Use it to see and manage them all at
            once.
          </p>
        )}

        {isActive ? (
          <p className="deck-state deck-state--active">
            ✓ Sessions draw from this{viewingAll ? ' — every bundle at once' : ''}.
          </p>
        ) : (
          <>
            <button className="add__submit" type="button" onClick={() => onChooseDeck(viewing)}>
              {viewingAll ? 'Draw from every bundle' : 'Use this bundle for sessions'}
            </button>
            {viewingAll && (
              <p className="deck-caution">
                Heads up: this mixes the rewritten wording with the archived original, so you would
                not be able to tell which version the dancers were reacting to. Fine once the
                comparison is done.
              </p>
            )}
          </>
        )}
      </section>

      <section className="advice" data-level={inPlay.length === 0 ? 'unpairable' : 'good'}>
        <h2 className="advice__headline">
          {inPlay.length} of {visible.length} in play
        </h2>
        <p className="advice__detail">
          {inPlay.length === 0
            ? 'Everything here is set aside, so there is nothing left to draw. Put some back before running a session with challenges.'
            : justUsedAll
              ? viewingAll
                ? `Every one of the ${visible.length} challenges across all bundles is now in play.`
                : `All ${visible.length} challenges in this bundle are now in play.`
              : isActive
                ? 'These are the challenges your next session will draw from.'
                : 'Set-asides are remembered per prompt, whether or not this bundle is in use.'}
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
