import { useMemo, useRef, useState } from 'react';
import {
  ROLE_LABELS,
  adviseOnSize,
  checkName,
  makeDancer,
  projectPools,
  type Dancer,
  type Role,
} from '../domain/roster';

type Props = {
  dancers: Dancer[];
  onChange: (next: Dancer[]) => void;
  onBack: () => void;
};

const ROLES: readonly Role[] = ['leader', 'follower', 'switch'];

export function RosterScreen({ dancers, onChange, onBack }: Props) {
  const [draftName, setDraftName] = useState('');
  const [draftRole, setDraftRole] = useState<Role>('leader');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const projection = useMemo(() => projectPools(dancers), [dancers]);
  const advice = useMemo(() => adviseOnSize(projection), [projection]);

  function addDancer(event: React.FormEvent) {
    event.preventDefault();
    const result = checkName(draftName, dancers);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    onChange([...dancers, makeDancer(result.name, draftRole)]);
    setDraftName('');
    setError(null);
    inputRef.current?.focus();
  }

  function setRole(id: string, role: Role) {
    onChange(dancers.map((d) => (d.id === id ? { ...d, role } : d)));
  }

  function remove(id: string) {
    onChange(dancers.filter((d) => d.id !== id));
  }

  return (
    <div className="shell">
      <header className="screen-head">
        <button className="back" type="button" onClick={onBack}>
          ← Title screen
        </button>
        <h1 className="screen-title">Roster</h1>
        <p className="subtitle">Everyone dancing tonight, and which role they dance.</p>
      </header>

      <form className="add" onSubmit={addDancer} noValidate>
        <label className="add__label" htmlFor="dancer-name">
          Dancer name
        </label>
        <input
          id="dancer-name"
          ref={inputRef}
          className="add__input"
          type="text"
          value={draftName}
          placeholder="Sarah M"
          autoComplete="off"
          autoCapitalize="words"
          onChange={(e) => {
            setDraftName(e.target.value);
            if (error) setError(null);
          }}
          aria-describedby={error ? 'name-error' : 'name-hint'}
          aria-invalid={error ? true : undefined}
        />
        <p className="add__hint" id="name-hint">
          Include a last name or initial so no two dancers can be confused.
        </p>

        <fieldset className="roles">
          <legend className="add__label">Role</legend>
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              className="roles__option"
              aria-pressed={draftRole === role}
              onClick={() => setDraftRole(role)}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </fieldset>

        {error && (
          <p className="add__error" id="name-error" role="alert">
            {error}
          </p>
        )}

        <button className="add__submit" type="submit">
          Add dancer
        </button>
      </form>

      <section className="advice" data-level={advice.level} aria-live="polite">
        <h2 className="advice__headline">{advice.headline}</h2>
        <p className="advice__detail">{advice.detail}</p>
        <dl className="counts">
          <div className="counts__item">
            <dt>Leaders</dt>
            <dd>{projection.leaders}</dd>
          </div>
          <div className="counts__item">
            <dt>Followers</dt>
            <dd>{projection.followers}</dd>
          </div>
          <div className="counts__item">
            <dt>Switches</dt>
            <dd>{projection.switches}</dd>
          </div>
        </dl>
        {projection.switches > 0 && projection.couples > 0 && (
          <p className="advice__note">
            With switches shared out, that dances as {projection.balancedLeaders} leaders and{' '}
            {projection.balancedFollowers} followers.
          </p>
        )}
      </section>

      <section className="list" aria-labelledby="list-title">
        <h2 className="list__title" id="list-title">
          {dancers.length === 0
            ? 'No dancers yet'
            : `${dancers.length} ${dancers.length === 1 ? 'dancer' : 'dancers'}`}
        </h2>

        {dancers.length === 0 ? (
          <p className="list__empty">
            Added dancers appear here. The roster is saved on this device, so it will still be here
            next time.
          </p>
        ) : (
          <ul className="list__items">
            {dancers.map((dancer) => (
              <li key={dancer.id} className="dancer">
                <span className="dancer__name">{dancer.name}</span>
                <div className="dancer__controls">
                  <label className="dancer__role">
                    <span className="visually-hidden">Role for {dancer.name}</span>
                    <select
                      value={dancer.role}
                      onChange={(e) => setRole(dancer.id, e.target.value as Role)}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="dancer__remove"
                    type="button"
                    onClick={() => remove(dancer.id)}
                  >
                    Remove
                    <span className="visually-hidden"> {dancer.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="next">
        <button className="next__button" type="button" disabled>
          <span className="menu__label">Start spinning</span>
          <span className="menu__note">The wheel arrives in 0.3.0</span>
        </button>
      </div>
    </div>
  );
}
