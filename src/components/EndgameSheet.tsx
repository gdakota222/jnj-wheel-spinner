import type { ReactNode } from 'react';

export type EndgameAction = {
  label: string;
  note: string;
  onSelect: () => void;
};

type Props = {
  actions: EndgameAction[];
  onClose: () => void;
  children?: ReactNode;
};

/**
 * The end-of-night sheet: the same slide-up the session already uses for Tools.
 *
 * Deliberately not a new idea. The app has one pattern for "needed occasionally,
 * one tap away", and the things that belong here are the ones an operator would
 * regret tapping — *Start a fresh session* wipes the night's log. Being a step
 * removed is a safety property, not only tidiness, which is why the warning
 * travels with the button rather than sitting on the screen behind it.
 */
export function EndgameSheet({ actions, onClose, children }: Props) {
  return (
    <div className="scrim" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="endgame-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <h2 className="sheet__title" id="endgame-title">
            Session options
          </h2>
          <button className="sheet__close" type="button" onClick={onClose}>
            Done
          </button>
        </header>

        {children}

        <nav className="tools">
          {actions.map((action) => (
            <button
              key={action.label}
              className="tools__item"
              type="button"
              onClick={action.onSelect}
            >
              <span className="tools__label">{action.label}</span>
              <span className="tools__note">{action.note}</span>
            </button>
          ))}
        </nav>
      </section>
    </div>
  );
}
