import { useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  DIVISIONS,
  DIVISION_LABELS,
  divisionSides,
  type Division,
  type Side,
} from '../domain/divisions';
import {
  danceNumbers,
  isComplete,
  progress,
  type PracticeAction,
  type PracticeCouple,
  type PracticeState,
} from '../domain/practice';
import { ROLE_LABELS, checkName, makeDancer, type Dancer, type Role } from '../domain/roster';
import { useWakeLock } from '../hooks/useWakeLock';
import { hasSeenTip, markTipSeen } from '../storage';

type Props = {
  practice: PracticeState;
  dispatch: (action: PracticeAction) => void;
  /** The saved roster, for the name check on a late arrival. */
  dancers: Dancer[];
  canUndo: boolean;
  undoLabel: string | null;
  onUndo: () => void;
  wasResumed: boolean;
  onDismissResumed: () => void;
  onLeave: () => void;
};

const ROLES: readonly Role[] = ['leader', 'follower', 'switch'];
const SIDE_LABEL: Record<Side, string> = { leaders: 'Lead', followers: 'Follow' };

const ordinal = (n: number) => (n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);

/**
 * The Quick list: every pairing on one screen, for practice (D-056).
 *
 * No spectacle, deliberately. The organizer reads the list, sends up however
 * many couples they like, and taps each one off as it dances. Only the list
 * scrolls; the header and the two actions stay put.
 */
export function PracticeScreen({
  practice,
  dispatch,
  dancers,
  canUndo,
  undoLabel,
  onUndo,
  wasResumed,
  onDismissResumed,
  onLeave,
}: Props) {
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [editing, setEditing] = useState<PracticeCouple | null>(null);
  const [adding, setAdding] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [tip, setTip] = useState(() => !hasSeenTip('practice-list'));
  /** The last late arrival, so the screen can say where they landed. */
  const [arrivalId, setArrivalId] = useState<string | null>(null);
  const notice = arrivalId ? describeArrival(arrivalId, practice.couples) : null;

  useWakeLock(true);

  const { done, total } = progress(practice);
  const numbers = useMemo(() => danceNumbers(practice.couples), [practice.couples]);
  const divisionsOn = practice.divisions.enabled;
  const nextUp = practice.couples.find((c) => !c.done && isComplete(c));
  const allDanced = total > 0 && done === total;
  const canReshuffle = practice.couples.some((c) => !c.done);

  /**
   * Each row's couple number and whether a division heading goes above it.
   * Numbered by couple, not by row: a dancer waiting for a partner is not a couple.
   */
  const rows = useMemo(() => {
    let number = 0;
    return practice.couples.map((c, i) => ({
      number: isComplete(c) ? ++number : null,
      heading:
        divisionsOn && (i === 0 || practice.couples[i - 1].groupKey !== c.groupKey)
          ? c.groupLabel
          : null,
    }));
  }, [practice.couples, divisionsOn]);

  function dismissTip() {
    markTipSeen('practice-list');
    setTip(false);
  }

  return (
    <div className="shell shell--session shell--practice">
      <header className="toolbar">
        <button
          className="toolbar__back"
          type="button"
          onClick={() => (done > 0 && !allDanced ? setConfirmLeave(true) : onLeave())}
        >
          ←<span className="visually-hidden"> End the practice and go back to the roster</span>
        </button>
        <h1 className="toolbar__title">
          Practice list · {allDanced ? `all ${total} danced` : `${done} of ${total} danced`}
        </h1>
        <button
          className="toolbar__button"
          type="button"
          onClick={() => setConfirmUndo(true)}
          disabled={!canUndo}
        >
          Undo
        </button>
      </header>

      {wasResumed && (
        <div className="resumed">
          <p className="resumed__text">
            Picked up where you left off — {done} {done === 1 ? 'couple has' : 'couples have'}{' '}
            danced.
          </p>
          <button className="resumed__dismiss" type="button" onClick={onDismissResumed}>
            Got it
          </button>
        </div>
      )}

      {tip && (
        <div className="resumed">
          <p className="resumed__text">
            Tap a couple once they’ve danced — it ticks off and stays put. Send up as many at a
            time as you like. <strong>Change</strong> pairs anyone by hand.
          </p>
          <button className="resumed__dismiss" type="button" onClick={dismissTip}>
            Got it
          </button>
        </div>
      )}

      {notice && (
        <p className="practice__notice" role="status">
          {notice}
        </p>
      )}

      <ol className="practice__list" aria-label="Couples, in order">
        {practice.couples.map((c, i) => {
          const { number: coupleNumber, heading } = rows[i];
          const header = heading ? (
            <li key={`h-${c.id}`} className="practice__group" aria-hidden="true">
              {heading}
            </li>
          ) : null;

          if (!isComplete(c)) {
            const who = c.leader ?? c.follower;
            const side = c.leader ? 'leading' : 'following';
            return [
              header,
              <li key={c.id} className="practice__row practice__row--lonely">
                <div className="practice__main">
                  <span className="practice__number" aria-hidden="true">
                    –
                  </span>
                  <span className="practice__names">
                    <span className="practice__name">{who?.name}</span>
                    <span className="practice__role">
                      No partner in {c.groupLabel} ({side})
                    </span>
                  </span>
                </div>
                <button
                  className="practice__change"
                  type="button"
                  onClick={() => setEditing(c)}
                >
                  Pair by hand
                </button>
              </li>,
            ];
          }


          const n = numbers.get(c.id)!;
          const isNext = c === nextUp;
          return [
            header,
            <li
              key={c.id}
              className="practice__row"
              data-done={c.done}
              data-next={isNext}
            >
              <button
                className="practice__main"
                type="button"
                aria-pressed={c.done}
                onClick={() => dispatch({ type: 'toggleDone', id: c.id })}
              >
                <span className="practice__number" aria-hidden="true">
                  {c.done ? '✓' : coupleNumber}
                </span>
                <span className="practice__names">
                  <span className="practice__name">
                    {c.leader.name}
                    {n.leader > 1 && <span className="practice__again">{ordinal(n.leader)}</span>}
                  </span>
                  <span className="practice__role">Leads</span>
                </span>
                <span className="practice__names">
                  <span className="practice__name">
                    {c.follower.name}
                    {n.follower > 1 && (
                      <span className="practice__again">{ordinal(n.follower)}</span>
                    )}
                  </span>
                  <span className="practice__role">Follows</span>
                </span>
                <span className="practice__state">
                  {c.done ? 'Danced' : isNext ? 'Next up' : c.manual ? 'Set by hand' : ''}
                </span>
                <span className="visually-hidden">
                  {' '}
                  Couple {coupleNumber}.{' '}
                  {c.done ? 'Danced. Tap to mark not danced.' : 'Tap to mark danced.'}
                </span>
              </button>
              {c.done ? (
                // Holds the column, so names line up with the rows that still have Change.
                <span className="practice__change practice__change--spacer" aria-hidden="true">
                  Change
                </span>
              ) : (
                <button className="practice__change" type="button" onClick={() => setEditing(c)}>
                  Change
                  <span className="visually-hidden">
                    {' '}
                    couple {coupleNumber}, {c.leader.name} and {c.follower.name}
                  </span>
                </button>
              )}
            </li>,
          ];
        })}
      </ol>

      <div className="practice__actions">
        {allDanced ? (
          <button className="next__button" type="button" onClick={onLeave}>
            <span className="menu__label">End the practice</span>
            <span className="menu__note">Everyone has danced. Back to the roster.</span>
          </button>
        ) : (
          <>
            <button
              className="practice__action"
              type="button"
              onClick={() => {
                setArrivalId(null);
                dispatch({ type: 'reshuffle' });
              }}
              disabled={!canReshuffle}
            >
              Reshuffle
              <span className="practice__action-note">
                {done > 0 ? 'Still to dance' : 'The whole list'}
              </span>
            </button>
            <button className="practice__action" type="button" onClick={() => setAdding(true)}>
              Add dancer
              <span className="practice__action-note">Late arrival</span>
            </button>
            <button className="practice__action" type="button" onClick={() => setLeaving(true)}>
              Someone left
              <span className="practice__action-note">Leaving early</span>
            </button>
          </>
        )}
      </div>

      {leaving && (
        <LeftEarlySheet
          practice={practice}
          onRemove={(id) => {
            setArrivalId(null);
            dispatch({ type: 'removeDancer', id });
            setLeaving(false);
          }}
          onClose={() => setLeaving(false)}
        />
      )}

      {editing && (
        <EditCoupleSheet
          couple={editing}
          practice={practice}
          onSave={(leaderId, followerId) => {
            dispatch({ type: 'setCouple', id: editing.id, leaderId, followerId });
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {adding && (
        <AddDancerSheet
          dancers={dancers}
          divisionsOn={divisionsOn}
          onAdd={(dancer) => {
            dispatch({ type: 'addDancer', dancer });
            setAdding(false);
            setArrivalId(dancer.id);
          }}
          onClose={() => setAdding(false)}
        />
      )}

      {confirmUndo && (
        <ConfirmDialog
          title="Undo?"
          body={undoLabel ?? undefined}
          confirmLabel="Undo"
          onConfirm={() => {
            setConfirmUndo(false);
            setArrivalId(null);
            onUndo();
          }}
          onCancel={() => setConfirmUndo(false)}
        />
      )}

      {confirmLeave && (
        <ConfirmDialog
          title="End the practice?"
          body={`${done} of ${total} couples have danced. The list will be cleared; the roster stays.`}
          confirmLabel="End practice"
          destructive
          onConfirm={onLeave}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
    </div>
  );
}

/**
 * Where a late arrival landed, read off the list itself so it can never
 * disagree with what is on screen.
 */
function describeArrival(id: string, couples: readonly PracticeCouple[]): string | null {
  let number = 0;
  for (const c of couples) {
    if (isComplete(c)) number += 1;
    const isLeader = c.leader?.id === id;
    if (!isLeader && c.follower?.id !== id) continue;
    const me = isLeader ? c.leader! : c.follower!;
    const partner = isLeader ? c.follower : c.leader;
    return partner
      ? `${me.name} is couple ${number}, with ${partner.name}.`
      : `${me.name} is on the list, waiting for a partner in their division.`;
  }
  return null;
}

type EditProps = {
  couple: PracticeCouple;
  practice: PracticeState;
  onSave: (leaderId: string, followerId: string) => void;
  onClose: () => void;
};

/**
 * Pair anyone with anyone (D-057). Rules — divisions included — are the app's
 * best guess, and the organizer always outranks it. A dancer can never be their
 * own partner, so a switch chosen on one side is not offered on the other.
 */
function EditCoupleSheet({ couple, practice, onSave, onClose }: EditProps) {
  const everyone = [...practice.pools.leaders, ...practice.pools.followers];
  const canLead = everyone.filter((d) => d.role !== 'follower');
  const canFollow = everyone.filter((d) => d.role !== 'leader');
  const [leaderId, setLeaderId] = useState(couple.leader?.id ?? '');
  const [followerId, setFollowerId] = useState(couple.follower?.id ?? '');
  const same = leaderId !== '' && leaderId === followerId;
  /**
   * Anyone this edit would take off the list entirely. Allowed — the organizer
   * outranks the app — but said out loud, because a dancer quietly losing their
   * only dance is exactly the kind of thing nobody notices until the end.
   */
  const dropped = [couple.leader, couple.follower].filter(
    (d): d is Dancer =>
      d !== null && d.id !== leaderId && d.id !== followerId && (countOf(d.id) ?? 0) <= 1,
  );
  function countOf(id: string) {
    return counts.get(id);
  }
  // How often each dancer is on the list. A handful of rows; no need to memoise.
  const counts = new Map<string, number>();
  for (const c of practice.couples) {
    for (const d of [c.leader, c.follower]) if (d) counts.set(d.id, (counts.get(d.id) ?? 0) + 1);
  }
  const label = (d: Dancer) => {
    const k = counts.get(d.id) ?? 0;
    return `${d.name}${k === 0 ? ' — not on the list yet' : k > 1 ? ` — on the list ${k} times` : ''}`;
  };

  return (
    <div className="scrim" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-couple-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <h2 className="sheet__title" id="edit-couple-title">
            Change this couple
          </h2>
          <button className="dialog__cancel" type="button" onClick={onClose}>
            Cancel
          </button>
        </header>
        <p className="sheet__hint">
          Pair anyone you like — divisions and the usual order don’t apply to a pair you set by
          hand.
        </p>

        <div className="pair-pickers">
          <label className="add__label" htmlFor="pick-leader">
            Leader
          </label>
          <select
            id="pick-leader"
            className="add__input"
            value={leaderId}
            onChange={(e) => setLeaderId(e.target.value)}
          >
            {leaderId === '' && <option value="">Choose a leader</option>}
            {canLead.map((d) => (
              <option key={d.id} value={d.id}>
                {label(d)}
              </option>
            ))}
          </select>

          <label className="add__label" htmlFor="pick-follower">
            Follower
          </label>
          <select
            id="pick-follower"
            className="add__input"
            value={followerId}
            onChange={(e) => setFollowerId(e.target.value)}
          >
            {followerId === '' && <option value="">Choose a follower</option>}
            {canFollow.map((d) => (
              <option key={d.id} value={d.id}>
                {label(d)}
              </option>
            ))}
          </select>
        </div>

        {same && (
          <p className="add__error" role="alert">
            A dancer can’t partner themselves — choose someone else for one side.
          </p>
        )}

        {!same && dropped.length > 0 && (
          <p className="summary__note summary__note--warn" role="status">
            {dropped.map((d) => d.name).join(' and ')} won’t be on the list any more. Pair them
            elsewhere with Change — or Reshuffle later, which brings back anyone who hasn’t danced.
          </p>
        )}

        <button
          className="add__submit"
          type="button"
          disabled={leaderId === '' || followerId === '' || same}
          onClick={() => onSave(leaderId, followerId)}
        >
          Save this couple
        </button>
      </section>
    </div>
  );
}

type AddProps = {
  dancers: Dancer[];
  divisionsOn: boolean;
  onAdd: (dancer: Dancer) => void;
  onClose: () => void;
};

type LeftProps = {
  practice: PracticeState;
  onRemove: (id: string) => void;
  onClose: () => void;
};

/**
 * Someone went home. They come off tonight's list and everything still to dance
 * is rearranged without them; the saved roster keeps them. The alternative —
 * fixing it couple by couple with Change — is still there for an organizer who
 * would rather.
 */
function LeftEarlySheet({ practice, onRemove, onClose }: LeftProps) {
  const [id, setId] = useState('');
  const doneIds = new Set(
    practice.couples
      .filter((c) => c.done)
      .flatMap((c) => [c.leader?.id, c.follower?.id])
      .filter(Boolean),
  );
  // Only people with something still to come are worth listing.
  const waiting = [...practice.pools.leaders, ...practice.pools.followers].filter((d) =>
    practice.couples.some((c) => !c.done && (c.leader?.id === d.id || c.follower?.id === d.id)),
  );
  const chosen = waiting.find((d) => d.id === id);

  return (
    <div className="scrim" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="left-early-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <h2 className="sheet__title" id="left-early-title">
            Someone left
          </h2>
          <button className="dialog__cancel" type="button" onClick={onClose}>
            Cancel
          </button>
        </header>
        <p className="sheet__hint">
          They come off tonight’s list and everyone still to dance is rearranged without them.
          Couples who have danced stay as they are, and the roster keeps them for next time.
        </p>

        <div className="pair-pickers">
          <label className="add__label" htmlFor="left-who">
            Who left?
          </label>
          <select
            id="left-who"
            className="add__input"
            value={id}
            onChange={(e) => setId(e.target.value)}
          >
            <option value="">Choose a dancer</option>
            {waiting.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {doneIds.has(d.id) ? ' — has danced' : ' — not danced yet'}
              </option>
            ))}
          </select>
        </div>

        <button
          className="add__submit"
          type="button"
          disabled={!chosen}
          onClick={() => chosen && onRemove(chosen.id)}
        >
          {chosen ? `Take ${chosen.name} off and rearrange` : 'Take them off and rearrange'}
        </button>
      </section>
    </div>
  );
}

/** A late arrival. Same checks as setup, so the name can never clash on the list. */
function AddDancerSheet({ dancers, divisionsOn, onAdd, onClose }: AddProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('follower');
  const [divisions, setDivisions] = useState<Partial<Record<Side, Division>>>({});
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sides = divisionSides({ id: '', name: '', role });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = checkName(name, dancers);
    if (!result.ok) {
      setError(result.reason);
      inputRef.current?.focus();
      return;
    }
    const dancer = makeDancer(result.name, role);
    if (divisionsOn) {
      if (sides.includes('leaders') && divisions.leaders) dancer.leadDivision = divisions.leaders;
      if (sides.includes('followers') && divisions.followers)
        dancer.followDivision = divisions.followers;
    }
    onAdd(dancer);
  }

  return (
    <div className="scrim" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-late-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <h2 className="sheet__title" id="add-late-title">
            Add a dancer
          </h2>
          <button className="dialog__cancel" type="button" onClick={onClose}>
            Cancel
          </button>
        </header>
        <p className="sheet__hint">
          They take the place of someone’s second dance on their side if there is one, or join as
          a new couple at the end. Nobody already on the list moves.
        </p>

        <form className="add" onSubmit={submit} noValidate>
          <label className="add__label" htmlFor="late-name">
            Dancer name
          </label>
          <input
            id="late-name"
            ref={inputRef}
            className="add__input"
            value={name}
            placeholder="Sarah M"
            autoFocus
            autoComplete="off"
            autoCapitalize="words"
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
          />
          <fieldset className="roles">
            <legend className="add__label">Role</legend>
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                className="roles__option"
                aria-pressed={role === r}
                onClick={() => setRole(r)}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </fieldset>
          {divisionsOn && (
            <div className="division-pickers">
              {sides.map((side) => (
                <label key={side} className="division-picker" htmlFor={`late-division-${side}`}>
                  <span className="division-picker__label">{SIDE_LABEL[side]} division</span>
                  <select
                    id={`late-division-${side}`}
                    value={divisions[side] ?? ''}
                    data-unset={divisions[side] === undefined}
                    onChange={(e) =>
                      setDivisions((cur) => ({
                        ...cur,
                        [side]: e.target.value === '' ? undefined : (e.target.value as Division),
                      }))
                    }
                  >
                    <option value="">Not set (Novice)</option>
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>
                        {DIVISION_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
          {error && (
            <p className="add__error" role="alert">
              {error}
            </p>
          )}
          <button className="add__submit" type="submit">
            Add to the list
          </button>
        </form>
      </section>
    </div>
  );
}
