import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { ROLE_LABELS, checkName, normalizeName, projectPools, type Dancer } from '../domain/roster';

type Props = {
  dancers: Dancer[];
  onChange: (next: Dancer[]) => void;
  onClose: () => void;
};

type Pending =
  | { kind: 'rename'; dancer: Dancer; name: string }
  | { kind: 'remove'; dancer: Dancer };

/**
 * Edit the dancers while a session is underway.
 *
 * Every change is confirmed. The list is live at this point — a mis-tap costs more
 * here than during setup, and the person holding the tablet may not be the person
 * who built it.
 */
export function RosterOptions({ dancers, onChange, onClose }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  function startEdit(dancer: Dancer) {
    setEditingId(dancer.id);
    setDraft(dancer.name);
    setError(null);
  }

  function requestRename(dancer: Dancer) {
    // Uniqueness is checked against everyone *except* this dancer, so a name kept
    // the same is never reported as clashing with itself.
    const others = dancers.filter((d) => d.id !== dancer.id);
    const result = checkName(draft, others);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    if (result.name === dancer.name) {
      setEditingId(null);
      return;
    }
    setPending({ kind: 'rename', dancer, name: result.name });
  }

  function applyPending() {
    if (!pending) return;
    if (pending.kind === 'rename') {
      onChange(dancers.map((d) => (d.id === pending.dancer.id ? { ...d, name: pending.name } : d)));
      setEditingId(null);
    } else {
      onChange(dancers.filter((d) => d.id !== pending.dancer.id));
    }
    setPending(null);
  }

  /** Say what a removal will do to the pools before it happens, not after. */
  function removalWarning(dancer: Dancer): string {
    const after = projectPools(dancers.filter((d) => d.id !== dancer.id));
    if (after.couples === 0) {
      return 'That leaves a pool empty, so no couples can be drawn until someone is added.';
    }
    if (after.balancedLeaders !== after.balancedFollowers) {
      return `That leaves ${after.balancedLeaders} leaders and ${after.balancedFollowers} followers, so the shorter pool will be recycled to keep everyone dancing.`;
    }
    return `That leaves ${after.couples} couples.`;
  }

  return (
    <div className="scrim" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="options-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <h2 className="sheet__title" id="options-title">
            Edit dancers
          </h2>
          <button className="sheet__close" type="button" onClick={onClose}>
            Done
          </button>
        </header>

        <p className="sheet__hint">
          Renaming or removing asks you to confirm first. These dancers are in play.
        </p>

        {dancers.length === 0 ? (
          <p className="list__empty">Nobody on the roster yet.</p>
        ) : (
          <ul className="sheet__list">
            {dancers.map((dancer) => (
              <li key={dancer.id} className="edit-row">
                {editingId === dancer.id ? (
                  <div className="edit-row__form">
                    <label className="visually-hidden" htmlFor={`rename-${dancer.id}`}>
                      New name for {dancer.name}
                    </label>
                    <input
                      id={`rename-${dancer.id}`}
                      className="add__input"
                      value={draft}
                      autoFocus
                      autoComplete="off"
                      onChange={(e) => {
                        setDraft(e.target.value);
                        if (error) setError(null);
                      }}
                      aria-invalid={error ? true : undefined}
                    />
                    {error && (
                      <p className="add__error" role="alert">
                        {error}
                      </p>
                    )}
                    <div className="edit-row__buttons">
                      <button
                        className="dialog__cancel"
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setError(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="dialog__confirm"
                        type="button"
                        onClick={() => requestRename(dancer)}
                        disabled={normalizeName(draft).length === 0}
                      >
                        Save name
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="edit-row__name">
                      {dancer.name}
                      <span className="edit-row__role">{ROLE_LABELS[dancer.role]}</span>
                    </span>
                    <div className="edit-row__buttons">
                      <button className="dancer__remove" type="button" onClick={() => startEdit(dancer)}>
                        Rename
                        <span className="visually-hidden"> {dancer.name}</span>
                      </button>
                      <button
                        className="dancer__remove"
                        type="button"
                        onClick={() => setPending({ kind: 'remove', dancer })}
                      >
                        Remove
                        <span className="visually-hidden"> {dancer.name}</span>
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {pending?.kind === 'rename' && (
        <ConfirmDialog
          title={`Rename to ${pending.name}?`}
          body={`"${pending.dancer.name}" becomes "${pending.name}" everywhere, including on the wheel.`}
          confirmLabel="Rename"
          onConfirm={applyPending}
          onCancel={() => setPending(null)}
        />
      )}

      {pending?.kind === 'remove' && (
        <ConfirmDialog
          title={`Remove ${pending.dancer.name}?`}
          body={removalWarning(pending.dancer)}
          confirmLabel="Remove"
          destructive
          onConfirm={applyPending}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
