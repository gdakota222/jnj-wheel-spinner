import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import {
  ROLE_LABELS,
  checkName,
  makeDancer,
  normalizeName,
  projectPools,
  type Dancer,
  type Role,
} from '../domain/roster';

type Props = {
  dancers: Dancer[];
  onChange: (next: Dancer[]) => void;
  onClose: () => void;
};

type Pending =
  | { kind: 'rename'; dancer: Dancer; name: string }
  | { kind: 'remove'; dancer: Dancer }
  | { kind: 'add'; name: string; role: Role }
  | { kind: 'role'; dancer: Dancer; role: Role };

const ROLES: readonly Role[] = ['leader', 'follower', 'switch'];

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
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('follower');
  const [addError, setAddError] = useState<string | null>(null);
  const [roleFor, setRoleFor] = useState<string | null>(null);

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

  function requestAdd(event: React.FormEvent) {
    event.preventDefault();
    const result = checkName(newName, dancers);
    if (!result.ok) {
      setAddError(result.reason);
      return;
    }
    setPending({ kind: 'add', name: result.name, role: newRole });
  }

  /** Say what adding somebody does to the shape of the night, before it happens. */
  function additionEffect(role: Role): string {
    const before = projectPools(dancers);
    const after = projectPools([...dancers, makeDancer('Pending Dancer', role)]);
    if (after.couples > before.couples) {
      return `The session grows from ${before.couples} to ${after.couples} couples — they will get a dance.`;
    }
    if (after.couples === 0) {
      return 'There is still nobody to pair them with, so no couples can be drawn yet.';
    }
    return `The session stays at ${after.couples} couples; they join the pool that recycles, so they will still dance.`;
  }

  function applyPending() {
    if (!pending) return;
    if (pending.kind === 'add') {
      onChange([...dancers, makeDancer(pending.name, pending.role)]);
      setNewName('');
      setAddError(null);
      setPending(null);
      return;
    }
    if (pending.kind === 'role') {
      onChange(dancers.map((d) => (d.id === pending.dancer.id ? { ...d, role: pending.role } : d)));
      setRoleFor(null);
      setPending(null);
      return;
    }
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
          Adding, renaming or removing asks you to confirm first. These dancers are in play.
        </p>

        {/* Late arrivals are normal at a social, and the first real event had two.
            They join as undrawn, so they are still to dance. */}
        <form className="add add--compact" onSubmit={requestAdd} noValidate>
          <label className="add__label" htmlFor="add-mid-session">
            Add a dancer
          </label>
          <input
            id="add-mid-session"
            className="add__input"
            type="text"
            value={newName}
            placeholder="Sarah M"
            autoComplete="off"
            autoCapitalize="words"
            onChange={(e) => {
              setNewName(e.target.value);
              if (addError) setAddError(null);
            }}
            aria-invalid={addError ? true : undefined}
          />
          <fieldset className="roles">
            <legend className="visually-hidden">Role for the new dancer</legend>
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                className="roles__option"
                aria-pressed={newRole === role}
                onClick={() => setNewRole(role)}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </fieldset>
          {addError && (
            <p className="add__error" role="alert">
              {addError}
            </p>
          )}
          <button className="add__submit" type="submit" disabled={normalizeName(newName) === ''}>
            Add to the session
          </button>
        </form>

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
                        onClick={() => setRoleFor(roleFor === dancer.id ? null : dancer.id)}
                      >
                        Role
                        <span className="visually-hidden"> for {dancer.name}</span>
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

                {roleFor === dancer.id && editingId !== dancer.id && (
                  <fieldset className="roles edit-row__roles">
                    <legend className="visually-hidden">New role for {dancer.name}</legend>
                    {ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        className="roles__option"
                        aria-pressed={dancer.role === role}
                        disabled={dancer.role === role}
                        onClick={() => setPending({ kind: 'role', dancer, role })}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </fieldset>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {pending?.kind === 'add' && (
        <ConfirmDialog
          title={`Add ${pending.name}?`}
          body={`${ROLE_LABELS[pending.role]}. ${additionEffect(pending.role)}`}
          confirmLabel="Add dancer"
          onConfirm={applyPending}
          onCancel={() => setPending(null)}
        />
      )}

      {pending?.kind === 'role' && (
        <ConfirmDialog
          title={`Make ${pending.dancer.name} a ${ROLE_LABELS[pending.role].toLowerCase()}?`}
          body={`They change pools, so the night may change shape: ${
            projectPools(
              dancers.map((d) => (d.id === pending.dancer.id ? { ...d, role: pending.role } : d)),
            ).couples
          } couples after this.`}
          confirmLabel="Change role"
          onConfirm={applyPending}
          onCancel={() => setPending(null)}
        />
      )}

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
