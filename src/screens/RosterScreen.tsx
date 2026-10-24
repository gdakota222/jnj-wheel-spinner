import { useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { HoldButton } from '../components/HoldButton';
import type { StartChoice } from '../App';
import {
  DIVISIONS,
  DIVISION_LABELS,
  countCouples,
  dancersMissingDivision,
  divisionSides,
  unpairableGroups,
  type Division,
  type DivisionSettings,
  type Side,
} from '../domain/divisions';
import { useLongPress } from '../hooks/useLongPress';
import type { SpinOrder } from '../domain/session';
import {
  ROLE_LABELS,
  adviseOnSize,
  buildPools,
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
  onBack: () => void;
  onStartSession: (choice: StartChoice) => void;
  divisionSettings: DivisionSettings;
  onDivisionSettingsChange: (next: DivisionSettings) => void;
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

/** The wheel, or the Quick list for practice (D-056). Asked each session, never stored. */
type Mode = 'wheel' | 'list';

const SIDE_LABEL: Record<Side, string> = { leaders: 'Lead', followers: 'Follow' };

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
  divisionSettings,
  onDivisionSettingsChange,
  promptsInPlay,
  deckName,
  deckTotal,
  mixedBundles,
  onEditBundles,
}: Props) {
  const [step, setStep] = useState<StepId>('dancers');
  const [mode, setMode] = useState<Mode | null>(null);
  const [orderChoice, setOrderChoice] = useState<OrderChoice>('leaders');
  const [draftDivisions, setDraftDivisions] = useState<Partial<Record<Side, Division>>>({});
  const [promptsEnabled, setPromptsEnabled] = useState<boolean | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftRole, setDraftRole] = useState<Role>('leader');
  const [error, setError] = useState<string | null>(null);
  const [birthdayCandidate, setBirthdayCandidate] = useState<Dancer | null>(null);
  /** The dancer whose name is being corrected, if any. One at a time. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Divisions as they will actually apply to this session. The wheel does not
   * match by division yet (planned for 0.16.0), so for a wheel night they are
   * off here too — the screen must never promise matching that will not happen.
   */
  const applied = useMemo(
    () => (mode === 'wheel' ? { ...divisionSettings, enabled: false } : divisionSettings),
    [mode, divisionSettings],
  );

  /** The event's shape — counted within divisions when matching by division applies. */
  const projection = useMemo(() => {
    const p = projectPools(dancers);
    if (!applied.enabled || p.couples === 0) return p;
    return { ...p, couples: countCouples(buildPools(dancers), applied) };
  }, [dancers, applied]);
  const advice = useMemo(
    () => adviseOnSize(projection, { practice: mode === 'list' }),
    [projection, mode],
  );
  const divisionsOn = divisionSettings.enabled;
  const setDivisions = (patch: Partial<DivisionSettings>) =>
    onDivisionSettingsChange({ ...divisionSettings, ...patch });
  /** Who goes without a partner under Strict — warned about before the start (D-060). */
  const unpairable = useMemo(
    () => unpairableGroups(buildPools(dancers), applied),
    [dancers, applied],
  );
  /** Matched as Novice only because nothing was set — said, never silent (D-061). */
  const missingDivision = useMemo(
    () => (applied.enabled ? dancersMissingDivision(dancers) : []),
    [dancers, applied],
  );

  /** What is still missing, in the words the operator will be shown. */
  const dancersReady = projection.couples > 0;
  const runningReady = mode === 'list' || (mode === 'wheel' && promptsEnabled !== null);
  const blocker = !dancersReady
    ? 'Needs at least one leader and one follower'
    : mode === null
      ? 'Choose the wheel or the Quick list'
      : !runningReady
        ? 'Choose whether to use challenges'
        : null;

  function start() {
    if (mode === 'list') {
      onStartSession({ mode: 'list' });
      return;
    }
    onStartSession({
      mode: 'wheel',
      order:
        orderChoice === 'random' ? (Math.random() < 0.5 ? 'leaders' : 'followers') : orderChoice,
      promptsEnabled: promptsEnabled === true,
    });
  }

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
    const made = makeDancer(result.name, draftRole);
    if (divisionsOn) {
      const sides = divisionSides(made);
      if (sides.includes('leaders') && draftDivisions.leaders) made.leadDivision = draftDivisions.leaders;
      if (sides.includes('followers') && draftDivisions.followers)
        made.followDivision = draftDivisions.followers;
    }
    onChange([...dancers, made]);
    setDraftName('');
    setError(null);
    inputRef.current?.focus();
  }

  function setRole(id: string, role: Role) {
    onChange(dancers.map((d) => (d.id === id ? { ...d, role } : d)));
  }

  function setDivision(id: string, side: Side, division: Division | undefined) {
    const field = side === 'leaders' ? 'leadDivision' : 'followDivision';
    onChange(dancers.map((d) => (d.id === id ? { ...d, [field]: division } : d)));
  }

  function remove(id: string) {
    onChange(dancers.filter((d) => d.id !== id));
  }

  function startRename(dancer: Dancer) {
    setEditingId(dancer.id);
    setRenameDraft(dancer.name);
    setRenameError(null);
  }

  function cancelRename() {
    setEditingId(null);
    setRenameError(null);
  }

  /**
   * Correct a typo before the night starts.
   *
   * The first thing a stranger hit in the handoff rehearsal: a misspelled name
   * could be fixed mid-session but not here, where it was typed. Same control and
   * same checks as renaming mid-session, so there is one way to learn — minus
   * the confirmation, because nothing is live yet and setup edits are free.
   */
  function saveRename(dancer: Dancer) {
    // Checked against everyone *except* this dancer, so keeping the same name is
    // never reported as clashing with itself.
    const others = dancers.filter((d) => d.id !== dancer.id);
    const result = checkName(renameDraft, others);
    if (!result.ok) {
      setRenameError(result.reason);
      return;
    }
    if (result.name !== dancer.name) {
      onChange(dancers.map((d) => (d.id === dancer.id ? { ...d, name: result.name } : d)));
    }
    cancelRename();
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
          {/* Optional, and off unless turned on — divisions serve the groups
              preparing for competition, not every night (D-058). */}
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={divisionsOn}
              onChange={(e) => setDivisions({ enabled: e.target.checked })}
            />
            <span className="toggle-row__text">
              <span className="toggle-row__label">Match by division</span>
              <span className="toggle-row__note">
                {divisionsOn
                  ? 'Couples are paired within Newcomer, Novice, Intermediate and up.'
                  : 'Optional — for competition practice.'}
              </span>
            </span>
          </label>

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

            {divisionsOn && (
              <div className="division-pickers">
                {divisionSides({ id: '', name: '', role: draftRole }).map((side) => (
                  <DivisionPicker
                    key={side}
                    id={`draft-division-${side}`}
                    label={`${SIDE_LABEL[side]} division`}
                    value={draftDivisions[side]}
                    onChange={(v) => setDraftDivisions((cur) => ({ ...cur, [side]: v }))}
                  />
                ))}
              </div>
            )}

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
                {dancers.map((dancer) =>
                  editingId === dancer.id ? (
                    <li key={dancer.id} className="dancer dancer--editing">
                      <div className="edit-row__form">
                        <label className="add__label" htmlFor={`setup-rename-${dancer.id}`}>
                          New name for {dancer.name}
                        </label>
                        <input
                          id={`setup-rename-${dancer.id}`}
                          className="add__input"
                          value={renameDraft}
                          autoFocus
                          autoComplete="off"
                          autoCapitalize="words"
                          onChange={(e) => {
                            setRenameDraft(e.target.value);
                            if (renameError) setRenameError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(dancer);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          aria-invalid={renameError ? true : undefined}
                        />
                        {renameError && (
                          <p className="add__error" role="alert">
                            {renameError}
                          </p>
                        )}
                        <div className="edit-row__buttons">
                          <button className="dialog__cancel" type="button" onClick={cancelRename}>
                            Cancel
                          </button>
                          <button
                            className="dialog__confirm"
                            type="button"
                            onClick={() => saveRename(dancer)}
                            disabled={normalizeName(renameDraft).length === 0}
                          >
                            Save name
                          </button>
                        </div>
                      </div>
                    </li>
                  ) : (
                  <li key={dancer.id} className="dancer" data-birthday={dancer.isBirthday === true}>
                    <DancerName dancer={dancer} onHold={() => setBirthdayCandidate(dancer)} />
                    {divisionsOn && (
                      <div className="division-pickers division-pickers--row">
                        {divisionSides(dancer).map((side) => (
                          <DivisionPicker
                            key={side}
                            id={`division-${dancer.id}-${side}`}
                            label={`${SIDE_LABEL[side]}`}
                            srLabel={`${SIDE_LABEL[side]} division for ${dancer.name}`}
                            value={side === 'leaders' ? dancer.leadDivision : dancer.followDivision}
                            onChange={(v) => setDivision(dancer.id, side, v)}
                          />
                        ))}
                      </div>
                    )}
                    <div className="dancer__controls">
                      <button
                        className="dancer__remove"
                        type="button"
                        onClick={() => startRename(dancer)}
                      >
                        Rename
                        <span className="visually-hidden"> {dancer.name}</span>
                      </button>
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
                  ),
                )}
              </ul>
            )}
          </section>
        </div>
      )}

      {step === 'running' && (
        <div className="panel panel__scroll">
          <section className="card">
            <h2 className="card__title">The wheel, or a quick list?</h2>
            <p className="card__body">
              The wheel draws each couple in front of the room. The Quick list pairs everyone at
              once, for practice — no spinning, just the list.
            </p>
            <fieldset className="roles roles--stacked">
              <legend className="visually-hidden">How the night runs</legend>
              <button
                type="button"
                className="roles__option"
                aria-pressed={mode === 'wheel'}
                onClick={() => setMode('wheel')}
              >
                The wheel — spin for every couple
              </button>
              <button
                type="button"
                className="roles__option"
                aria-pressed={mode === 'list'}
                onClick={() => setMode('list')}
              >
                Quick list — every pairing at once
              </button>
            </fieldset>
          </section>

          {divisionsOn && mode === 'wheel' && (
            <p className="summary__note summary__note--warn">
              The wheel doesn’t match by division yet — it draws from everyone. Divisions work in
              the Quick list today, and are coming to the wheel next.
            </p>
          )}

          {divisionsOn && mode === 'list' && (
            <section className="card">
              <h2 className="card__title">Divisions</h2>
              <p className="card__body">
                Couples are paired within their division. When a division has nobody on one side:
              </p>
              <fieldset className="roles roles--stacked">
                <legend className="visually-hidden">Strict or merge</legend>
                <button
                  type="button"
                  className="roles__option"
                  aria-pressed={divisionSettings.mode === 'strict'}
                  onClick={() => setDivisions({ mode: 'strict' })}
                >
                  Strict — they go without a partner
                </button>
                <button
                  type="button"
                  className="roles__option"
                  aria-pressed={divisionSettings.mode === 'merge'}
                  onClick={() => setDivisions({ mode: 'merge' })}
                >
                  Merge — they dance one division down
                </button>
              </fieldset>
              {mode === 'list' && (
                <>
                  <p className="card__body">Which division goes first?</p>
                  <fieldset className="roles roles--stacked">
                    <legend className="visually-hidden">Division order</legend>
                    {(
                      [
                        ['ascending', 'Lowest first — Newcomer up'],
                        ['descending', 'Highest first — Champions down'],
                        ['mixed', 'Mixed — all divisions shuffled together'],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className="roles__option"
                        aria-pressed={divisionSettings.order === value}
                        onClick={() => setDivisions({ order: value })}
                      >
                        {label}
                      </button>
                    ))}
                  </fieldset>
                </>
              )}
            </section>
          )}

          {mode === 'wheel' && (
          <>
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
          </>
          )}
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
                term="Runs as"
                detail={
                  mode === null
                    ? 'Not answered yet'
                    : mode === 'wheel'
                      ? 'The wheel'
                      : 'Quick list — every pairing at once'
                }
                ok={mode !== null}
                onFix={() => setStep('running')}
              />
              {divisionsOn && (
                <SummaryRow
                  term="Divisions"
                  detail={
                    mode === 'wheel'
                      ? 'Not used by the wheel yet — it draws from everyone'
                      : `${divisionSettings.mode === 'strict' ? 'Strict' : 'Merge'} · ${
                          divisionSettings.order === 'ascending'
                            ? 'lowest first'
                            : divisionSettings.order === 'descending'
                              ? 'highest first'
                              : 'mixed'
                        }`
                  }
                  ok
                  onFix={() => setStep('running')}
                />
              )}
              {mode === 'wheel' && (
              <>
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
              </>
              )}
            </dl>
          </section>

          {unpairable.length > 0 && dancersReady && (
            <section className="warning-card" role="alert">
              <h2 className="warning-card__title">Some dancers have no partner in their division</h2>
              <ul className="warning-card__list">
                {unpairable.map((u) => (
                  <li key={u.label}>
                    <strong>{u.dancers.map((d) => d.name).join(', ')}</strong> —{' '}
                    {u.label} {u.side === 'leaders' ? 'leading' : 'following'}, with no{' '}
                    {u.label} {u.side === 'leaders' ? 'followers' : 'leaders'}.
                  </li>
                ))}
              </ul>
              <p className="warning-card__body">
                With Strict on they will not be matched. Let them know — or switch to Merge, or pair
                them by hand once the night starts.
              </p>
              <button
                className="warning-card__fix"
                type="button"
                onClick={() => setDivisions({ mode: 'merge' })}
              >
                Switch to Merge
              </button>
            </section>
          )}

          {missingDivision.length > 0 && (
            <p className="summary__note summary__note--warn">
              No division set for {missingDivision.map((d) => d.name).join(', ')} — matched as
              Novice.{' '}
              <button className="link-button" type="button" onClick={() => setStep('dancers')}>
                Set divisions
              </button>
            </p>
          )}

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
        ) : blocker === null && unpairable.length > 0 ? (
          // Held, not tapped, so the warning above cannot be skipped unread (D-060).
          <HoldButton label="Hold to start anyway" onHold={start} />
        ) : (
          <button
            className="next__button"
            type="button"
            onClick={start}
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

type DivisionPickerProps = {
  id: string;
  label: string;
  /** A fuller name for screen readers, when the visible label is short. */
  srLabel?: string;
  value: Division | undefined;
  onChange: (next: Division | undefined) => void;
};

/** One role's division. "Not set" is a real choice and is matched as Novice (D-061). */
function DivisionPicker({ id, label, srLabel, value, onChange }: DivisionPickerProps) {
  return (
    <label className="division-picker" htmlFor={id}>
      <span className="division-picker__label" aria-hidden={srLabel ? true : undefined}>
        {label}
      </span>
      {srLabel && <span className="visually-hidden">{srLabel}</span>}
      <select
        id={id}
        value={value ?? ''}
        data-unset={value === undefined}
        onChange={(e) => onChange(e.target.value === '' ? undefined : (e.target.value as Division))}
      >
        <option value="">Not set (Novice)</option>
        {DIVISIONS.map((d) => (
          <option key={d} value={d}>
            {DIVISION_LABELS[d]}
          </option>
        ))}
      </select>
    </label>
  );
}
