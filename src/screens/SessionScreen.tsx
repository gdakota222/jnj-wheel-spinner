import { useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { RosterOptions } from '../components/RosterOptions';
import { SessionLog } from '../components/SessionLog';
import { Wheel } from '../components/Wheel';
import type { Dancer } from '../domain/roster';
import {
  OTHER_POOL,
  POOL_LABEL,
  POOL_NOUN,
  isForegoneConclusion,
  wheelEntries,
  willRecycle,
  type SessionAction,
  type SessionState,
} from '../domain/session';
import { pickIndex, planSpin } from '../domain/spin';
import { useWakeLock } from '../hooks/useWakeLock';

type Props = {
  session: SessionState;
  dispatch: (action: SessionAction) => void;
  dancers: Dancer[];
  onEditDancers: (next: Dancer[]) => void;
  onLeave: () => void;
  onStartFresh: () => void;
};

export function SessionScreen({
  session,
  dispatch,
  dancers,
  onEditDancers,
  onLeave,
  onStartFresh,
}: Props) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Hold the screen awake for the whole session, including the dance hold.
  useWakeLock(session.phase !== 'complete');

  const entries = wheelEntries(session);
  const recyclingNow = willRecycle(session);
  const foregone = isForegoneConclusion(session) && session.phase !== 'couple';
  const spinning = session.phase === 'spinning';
  const coupleNumber = Math.min(session.log.length + 1, session.couplesTotal);

  function spin(type: 'spin' | 'respin') {
    if (entries.length === 0) return;
    const index = pickIndex(entries.length);
    const plan = planSpin(index, entries.length, session.rotation);
    dispatch({ type, index, rotation: plan.rotation });
  }

  if (session.phase === 'complete') {
    return (
      <div className="shell">
        <header className="screen-head">
          <h1 className="screen-title">Session complete</h1>
          <p className="subtitle">
            Everyone has danced. {session.log.length}{' '}
            {session.log.length === 1 ? 'couple' : 'couples'} took the floor.
          </p>
        </header>

        <ol className="log log--full">
          {session.log.map((couple, i) => (
            <li key={`${couple.leader.id}-${couple.follower.id}-${i}`} className="log__row">
              <span className="log__number">{i + 1}</span>
              <span className="log__names">
                <span className="log__name">{couple.leader.name}</span>
                <span className="log__role">Leader</span>
              </span>
              <span className="log__names">
                <span className="log__name">{couple.follower.name}</span>
                <span className="log__role">Follower</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="actions">
          <button className="actions__primary" type="button" onClick={onStartFresh}>
            Start a fresh session
          </button>
          <p className="actions__note">
            A fresh session clears this list and starts everyone over. Nothing here is saved.
          </p>
          <button className="edit-dancers" type="button" onClick={onLeave}>
            Back to the roster
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="screen-head">
        <button
          className="back"
          type="button"
          disabled={spinning}
          onClick={() => (session.log.length > 0 ? setConfirmLeave(true) : onLeave())}
        >
          ← Roster
        </button>
        <div className="progress">
          <h1 className="screen-title">
            Couple {coupleNumber} of {session.couplesTotal}
          </h1>
          <button className="progress__log" type="button" onClick={() => setLogOpen(true)}>
            Danced: {session.log.length}
          </button>
        </div>
      </header>

      {/* What the wheel is for, stated at all times — the one fact a second
          operator picking up the tablet cannot infer from anything else.
          The wording follows the phase: while a name is still showing on the
          wheel it would be a contradiction to claim the other pool is spinning. */}
      <p className="pool-label" aria-live="polite">
        {session.phase === 'drawn' ? (
          <>
            Next: <strong>{POOL_LABEL[session.currentPool]}</strong>
          </>
        ) : session.phase === 'couple' ? (
          <>
            This couple is <strong>up</strong>
          </>
        ) : (
          <>
            Now spinning: <strong>{POOL_LABEL[session.currentPool]}</strong>
          </>
        )}
      </p>

      <button
        className="edit-dancers"
        type="button"
        onClick={() => setOptionsOpen(true)}
        disabled={spinning}
      >
        Edit dancers
      </button>

      {recyclingNow && (
        <p className="recycle-note">
          All {POOL_LABEL[session.currentPool].toLowerCase()} have danced, so they are back on the
          wheel — nobody sits out.
        </p>
      )}

      {/* D-017: the last name still gets a spin, and the app is in on the joke
          rather than pretending there is suspense. */}
      {foregone && !recyclingNow && (
        <p className="recycle-note recycle-note--wink">
          Only {entries[0]?.name} left in the {POOL_NOUN[session.currentPool]} pool. Spin it
          anyway — they have earned the moment.
        </p>
      )}

      <Wheel
        names={entries.map((d) => d.name)}
        rotation={session.rotation}
        spinning={spinning}
        onSettled={() => dispatch({ type: 'settled' })}
      />

      <div className="result" aria-live="polite">
        {session.phase === 'couple' ? (
          <>
            <p className="result__label">Dancing now</p>
            <p className="result__couple">
              <span className="result__name">{session.drawn.leaders?.name}</span>
              <span className="result__amp">and</span>
              <span className="result__name">{session.drawn.followers?.name}</span>
            </p>
          </>
        ) : session.phase === 'drawn' ? (
          <>
            <p className="result__label">
              {POOL_LABEL[OTHER_POOL[session.currentPool]].replace(/s$/, '')}
            </p>
            <p className="result__name">
              {session.drawn[OTHER_POOL[session.currentPool]]?.name}
            </p>
          </>
        ) : (
          <p className="result__idle">
            {spinning
              ? 'Spinning…'
              : `Press spin to draw a ${POOL_NOUN[session.currentPool]}.`}
          </p>
        )}
      </div>

      <div className="actions">
        {session.phase === 'couple' ? (
          <button
            className="actions__primary"
            type="button"
            onClick={() => dispatch({ type: 'nextCouple' })}
          >
            Next couple
          </button>
        ) : (
          <button
            className="actions__primary"
            type="button"
            onClick={() => spin('spin')}
            disabled={spinning || entries.length === 0}
          >
            {spinning
              ? 'Spinning…'
              : foregone
                ? 'Spin it anyway'
                : `Spin for a ${POOL_NOUN[session.currentPool]}`}
          </button>
        )}

        {/* Re-spin stays available right up until Next couple commits the pairing.
            A dancer who has stepped outside is most often noticed on the second
            draw, not the first. */}
        {(session.phase === 'drawn' || session.phase === 'couple') && (
          <button className="edit-dancers" type="button" onClick={() => spin('respin')}>
            Re-spin{' '}
            {session.phase === 'couple'
              ? session.drawn[session.currentPool]?.name
              : session.drawn[OTHER_POOL[session.currentPool]]?.name}
          </button>
        )}

        {session.phase === 'couple' && (
          <p className="actions__note">
            They dance now. Press Next couple when the floor is clear.
          </p>
        )}
      </div>

      {optionsOpen && (
        <RosterOptions
          dancers={dancers}
          onChange={onEditDancers}
          onClose={() => setOptionsOpen(false)}
        />
      )}

      {logOpen && (
        <SessionLog
          log={session.log}
          couplesTotal={session.couplesTotal}
          onClose={() => setLogOpen(false)}
        />
      )}

      {confirmLeave && (
        <ConfirmDialog
          title="Leave this session?"
          body={`${session.log.length} ${session.log.length === 1 ? 'couple has' : 'couples have'} danced. Leaving ends the session and clears the list.`}
          confirmLabel="Leave"
          destructive
          onConfirm={onLeave}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
    </div>
  );
}
