import { useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useLongPress } from '../hooks/useLongPress';
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
  /** The bundle a session would draw from. */
  deckName: string;
  deckTotal: number;
  /** True when every bundle is being drawn from at once. */
  mixedBundles: boolean;
  onEditBundles: () => void;
};

const ROLES: readonly Role[] = ['leader', 'follower', 'switch'];

type OrderChoice = SpinOrder | 'random';

/**
 * Setting up is three steps, not one long page.
 *
 * A colleague meeting the app cold at the first real event scrolled past the
 * roster, the counts, the spin order and the challenges question before finding
 * the button that actually starts the night. Splitting the work means the thing
 * to press next is never below the fold.
 *
 * The steps are numbered and ordered because someone who has never run this
 * needs telling what setting up involves. They are also directly tappable,
 * because someone running their fifth event should not have to walk a wizard to
 * change one answer.
 */
const STEPS = [
  { id: 'dancers', label: 'Dancers' },
  { id: 'running', label: 'How it runs' },
  { id: 'start', label: 'Start' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export function RosterScreen({
  dancers,
  onChange,
  onBack,
  onStartSession,
  promptsInPlay,
  deckName,
  deckTotal,
  mixedBundles,
  onEditBundles,
}: Props) {
  const [step, setStep] = useState<StepId>('dancers');
  const [orderChoice, setOrderChoice] = useState<OrderChoice>('leaders');
  const [promptsEnabled, setPromptsEnabled] = useState<boolean | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftRole, setDraftRole] = useState<Role>('leader');
  const [error, setError] = useState<string | null>(null);
  const [birthdayCandidate, setBirthdayCandidate] = useState<Dancer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const projection = useMemo(() => projectPools(dancers), [dancers]);
  const advice = useMemo(() => adviseOnSize(projection), [projection]);

  /** What is still missing, in the words the operator will be shown. */
  const dancersReady = projection.couples > 0;
  const runningReady = promptsEnabled !== null;
  const blocker = !dancersReady
    ? 'Needs at least one leader and one follower'
    : !runningReady
      ? 'Choose whether to use challenges'
      : null;

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const nextStep = STEPS[stepIndex + 1];

  const stepDone: Record<StepId, boolean> = {
    dancers: dancersReady,
    running: runningReady,
    start: dancersReady && runningReady,
  };

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

  function toggleBirthday(dancer: Dancer) {
    onChange(dancers.map((d) => (d.id === dancer.id ? { ...d, isBirthday: !d.isBirthday } : d)));
    setBirthdayCandidate(null);
  }

  return (
    <div className="shell shell--setup">
      <header className="setup-head">
        <button
          className="back"
          type="button"
          onClick={() => (stepIndex === 0 ? onBack() : setStep(STEPS[stepIndex - 1].id))}
        >
          {stepIndex === 0 ? '← Title screen' : `← ${STEPS[stepIndex - 1].label}`}
        </button>
        <h1 className="screen-title">Set up the session</h1>
      </header>

      {/* Where you are, what is left, and a way straight to any of it. */}
      <nav className="steps" aria-label="Setup steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className="steps__tab"
            aria-current={s.id === step ? 'step' : undefined}
            data-done={stepDone[s.id]}
            onClick={() => setStep(s.id)}
          >
            <span className="steps__number" aria-hidden="true">
              {stepDone[s.id] ? '✓' : i + 1}
            </span>
            <span className="steps__label">{s.label}</span>
            <span className="visually-hidden">
              {stepDone[s.id] ? ' — done' : ' — not finished'}
            </span>
          </button>
        ))}
      </nav>

      {step === 'dancers' && (
        <div className="panel panel__scroll">
          {/* This step scrolls as one. Pinning the form as well was tried and
              undone: on a 375px phone the form and the counts come to more than
              the height the panel has, which left the list of names six pixels
              tall. The complaint being answered here was the button below the
              fold, and the pinned step bar and primary button answer it. */}
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
                Added dancers appear here. The roster is saved on this device, so it will still be
                here next time.
              </p>
            ) : (
              <ul className="list__items">
                {dancers.map((dancer) => (
                  <li key={dancer.id} className="dancer" data-birthday={dancer.isBirthday === true}>
                    <DancerName dancer={dancer} onHold={() => setBirthdayCandidate(dancer)} />
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
        </div>
      )}

      {step === 'running' && (
        <div className="panel panel__scroll">
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
              discovered mid-session, when changing it is disruptive — and asking
              makes the feature visible to an organiser who has never seen the app. */}
          <section className="card">
            <h2 className="card__title">Dance challenges?</h2>
            <p className="card__body">
              Each couple can draw a challenge to dance — a named constraint like{' '}
              <em>A Whole New Level</em>. Or run it as a plain pairing wheel.
            </p>
            {/* What a session would actually draw from, said here rather than left
                to be discovered in the Prompt Bank. */}
            <div className="bundle-box">
              <p className="bundle-box__name">
                {deckName}
                {mixedBundles && <span className="bundle-box__mixed">mixed</span>}
              </p>
              <p className="bundle-box__count">
                {promptsInPlay === 0
                  ? 'Everything here is set aside — nothing left to draw.'
                  : promptsInPlay === deckTotal
                    ? `All ${deckTotal} challenges in play.`
                    : `${promptsInPlay} of ${deckTotal} challenges in play.`}
              </p>
              <button className="bundle-box__edit" type="button" onClick={onEditBundles}>
                Edit bundles
              </button>
            </div>
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
        </div>
      )}

      {step === 'start' && (
        <div className="panel panel__scroll">
          {/* Everything decided, in one place, before anything is committed — the
              last chance to catch an answer set two steps ago. */}
          <section className="card">
            <h2 className="card__title">Ready to run</h2>
            <dl className="summary">
              <SummaryRow
                term="Dancers"
                detail={
                  dancersReady
                    ? `${dancers.length} on the roster · ${projection.couples} ${
                        projection.couples === 1 ? 'couple' : 'couples'
                      } will dance`
                    : 'Not enough to pair yet'
                }
                ok={dancersReady}
                onFix={() => setStep('dancers')}
              />
              <SummaryRow
                term="Drawn first"
                detail={
                  orderChoice === 'random'
                    ? 'The app decides, once, at the start'
                    : orderChoice === 'leaders'
                      ? 'Leaders'
                      : 'Followers'
                }
                ok
                onFix={() => setStep('running')}
              />
              <SummaryRow
                term="Challenges"
                detail={
                  promptsEnabled === null
                    ? 'Not answered yet'
                    : promptsEnabled
                      ? `${deckName} · ${promptsInPlay} in play`
                      : 'Off — pairing only'
                }
                ok={runningReady}
                onFix={() => setStep('running')}
              />
            </dl>
          </section>

          {projection.switches > 0 && dancersReady && (
            <p className="summary__note">
              Switches are shared out automatically to keep the pools even. Nobody assigns them by
              hand.
            </p>
          )}
        </div>
      )}

      {birthdayCandidate && (
        <ConfirmDialog
          title={
            birthdayCandidate.isBirthday
              ? `Remove the birthday from ${birthdayCandidate.name}?`
              : `Is ${birthdayCandidate.name} the birthday dancer?`
          }
          body={
            birthdayCandidate.isBirthday
              ? 'They will be drawn like anyone else, with no jam.'
              : `When ${birthdayCandidate.name} is drawn, the session stops for a birthday jam — whichever spin lands on them.`
          }
          confirmLabel={birthdayCandidate.isBirthday ? 'Remove' : 'Yes, it is their birthday'}
          onConfirm={() => toggleBirthday(birthdayCandidate)}
          onCancel={() => setBirthdayCandidate(null)}
        />
      )}

      {/* Pinned, on every step. The button that moves you on is never something
          that has to be scrolled to. */}
      <div className="next next--pinned">
        {nextStep ? (
          <button className="next__button" type="button" onClick={() => setStep(nextStep.id)}>
            <span className="menu__label">Next: {nextStep.label}</span>
            <span className="menu__note">
              {step === 'dancers'
                ? dancersReady
                  ? `${projection.couples} ${projection.couples === 1 ? 'couple' : 'couples'} so far — more can be added later`
                  : 'Dancers can still be added after this'
                : 'Check it all over before the night starts'}
            </span>
          </button>
        ) : (
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
            disabled={blocker !== null}
          >
            <span className="menu__label">Start the session</span>
            <span className="menu__note">
              {blocker ??
                `${projection.couples} ${projection.couples === 1 ? 'couple' : 'couples'} will dance`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

type SummaryRowProps = {
  term: string;
  detail: string;
  ok: boolean;
  onFix: () => void;
};

/** One decided thing, with the way back to change it sitting beside it. */
function SummaryRow({ term, detail, ok, onFix }: SummaryRowProps) {
  return (
    <div className="summary__row" data-ok={ok}>
      <dt className="summary__term">{term}</dt>
      <dd className="summary__detail">{detail}</dd>
      <button className="summary__fix" type="button" onClick={onFix}>
        Change
        <span className="visually-hidden"> {term}</span>
      </button>
    </div>
  );
}

type DancerNameProps = {
  dancer: Dancer;
  onHold: () => void;
};

/**
 * The dancer's name, which doubles as the hidden way to mark a birthday dancer:
 * press and hold. Undiscoverable on purpose — nobody should stumble into it —
 * and always confirmed, so a stray hold costs one tap.
 */
function DancerName({ dancer, onHold }: DancerNameProps) {
  const hold = useLongPress(onHold);
  return (
    <span className="dancer__name" {...hold}>
      {dancer.name}
      {dancer.isBirthday && (
        <span className="dancer__birthday" title="Birthday dancer">
          🎉 birthday
        </span>
      )}
    </span>
  );
}
