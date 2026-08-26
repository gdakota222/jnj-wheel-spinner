import { useMemo, useRef, useState } from 'react';
import type { SpinOrder } from '../domain/session';
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
  onStartSession: (order: SpinOrder, promptsEnabled: boolean) => void;
  /** How many challenges are left in play after Prompt Bank set-asides. */
  promptsInPlay: number;
};

const ROLES: readonly Role[] = ['leader', 'follower', 'switch'];

type OrderChoice = SpinOrder | 'random';

export function RosterScreen({
  dancers,
  onChange,
  onBack,
  onStartSession,
  promptsInPlay,
}: Props) {
  const [orderChoice, setOrderChoice] = useState<OrderChoice>('leaders');
  const [promptsEnabled, setPromptsEnabled] = useState<boolean | null>(null);
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

      <section className="card">
        <h2 className="card__title">Which role is drawn first?</h2>
        <p className="card__body">
          Set once and locked for the whole session, so the room learns the rhythm of the draw.
        </p>
        <fieldset className="roles roles--stacked">
          <legend className="visually-hidden">Spin order</legend>
          {(
            [
              ['leaders', 'Leaders first'],
              ['followers', 'Followers first'],
              ['random', 'Let the app decide'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="roles__option"
              aria-pressed={orderChoice === value}
              onClick={() => setOrderChoice(value)}
            >
              {label}
            </button>
          ))}
        </fieldset>
      </section>

      {/* Asked, never defaulted (D-015). A default set the wrong way is only
          discovered mid-session, when changing it is disruptive — and asking makes
          the feature visible to an organiser who has never seen the app. */}
      <section className="card">
        <h2 className="card__title">Dance challenges?</h2>
        <p className="card__body">
          Each couple can draw a challenge to dance — a named constraint like{' '}
          <em>A Whole New Level</em>. Or run it as a plain pairing wheel.
        </p>
        <p className="card__body">
          {promptsInPlay === 0
            ? 'Every challenge is set aside in the Prompt Bank, so there is nothing to draw. Put some back to use them.'
            : `${promptsInPlay} ${promptsInPlay === 1 ? 'challenge is' : 'challenges are'} in play.`}
        </p>
        <fieldset className="roles roles--stacked">
          <legend className="visually-hidden">Prompts on or off</legend>
          <button
            type="button"
            className="roles__option"
            aria-pressed={promptsEnabled === true}
            onClick={() => setPromptsEnabled(true)}
            disabled={promptsInPlay === 0}
          >
            Yes — draw a challenge for each couple
          </button>
          <button
            type="button"
            className="roles__option"
            aria-pressed={promptsEnabled === false}
            onClick={() => setPromptsEnabled(false)}
          >
            No — just pair them up
          </button>
        </fieldset>
      </section>

      <div className="next">
        <button
          className="next__button"
          type="button"
          onClick={() =>
            onStartSession(
              orderChoice === 'random'
                ? Math.random() < 0.5
                  ? 'leaders'
                  : 'followers'
                : orderChoice,
              promptsEnabled === true,
            )
          }
          disabled={projection.couples === 0 || promptsEnabled === null}
        >
          <span className="menu__label">Start the session</span>
          <span className="menu__note">
            {projection.couples === 0
              ? 'Needs at least one leader and one follower'
              : promptsEnabled === null
                ? 'Choose whether to use challenges first'
                : `${projection.couples} ${projection.couples === 1 ? 'couple' : 'couples'} will dance`}
          </span>
        </button>
      </div>
    </div>
  );
}
