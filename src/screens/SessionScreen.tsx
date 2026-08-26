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
  drawEntries,
  isForegoneConclusion,
  promptEntries,
  promptsExhausted,
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
  /** True when this session came back from storage rather than being started. */
  wasResumed: boolean;
  onDismissResumed: () => void;
  onEditDancers: (next: Dancer[]) => void;
  onLeave: () => void;
  onStartFresh: () => void;
};

export function SessionScreen({
  session,
  dispatch,
  dancers,
  wasResumed,
  onDismissResumed,
  onEditDancers,
  onLeave,
  onStartFresh,
}: Props) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Hold the screen awake for the whole session, including the dance hold.
  useWakeLock(session.phase !== 'complete');

  const { phase } = session;
  // The prompt wheel stays up through the dance, with the drawn challenge still
  // under the pointer — the wheel should never show a pool nobody is looking at.
  const onPromptWheel =
    phase === 'pair' ||
    phase === 'prompt-spinning' ||
    (phase === 'couple' && session.currentPrompt !== null);
  const spinning = phase === 'spinning' || phase === 'prompt-spinning';

  // What the wheel is showing, versus what the next spin will draw from. These
  // differ between a landing and the next spin, and conflating them is how a spin
  // ends up aimed outside its own pool.
  const shownEntries = wheelEntries(session);
  const drawPool = drawEntries(session);
  const prompts = promptEntries(session);
  const wheelNames = onPromptWheel ? prompts.map((p) => p.name) : shownEntries.map((d) => d.name);

  const recyclingNow = willRecycle(session) && !onPromptWheel;
  const deckSpent = promptsExhausted(session) && onPromptWheel;
  const foregone = isForegoneConclusion(session) && !onPromptWheel && phase !== 'couple';

  const coupleNumber = Math.min(session.log.length + 1, session.couplesTotal);

  function spinDancer(type: 'spin' | 'respin') {
    if (drawPool.length === 0) return;
    const index = pickIndex(drawPool.length);
    const plan = planSpin(index, drawPool.length, session.rotation);
    dispatch({ type, index, rotation: plan.rotation });
  }

  function spinPrompt(type: 'spinPrompt' | 'respinPrompt') {
    if (prompts.length === 0) return;
    // "Draw a different challenge" has to actually differ, so the current prompt
    // is excluded — unless it is the only one left to give.
    const excluded =
      type === 'respinPrompt' && session.currentPrompt
        ? prompts.filter((p) => p.id !== session.currentPrompt!.id)
        : prompts;
    const pool = excluded.length > 0 ? excluded : prompts;
    const chosen = pool[pickIndex(pool.length)];
    const index = prompts.findIndex((p) => p.id === chosen.id);
    const plan = planSpin(index, prompts.length, session.rotation);
    dispatch({ type, index, rotation: plan.rotation });
  }

  if (phase === 'complete') {
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
              {couple.prompt && <span className="log__prompt">{couple.prompt.name}</span>}
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
            View log · {session.log.length}
          </button>
        </div>
      </header>

      {/* What the wheel is for, stated at all times — the one fact a second
          operator picking up the tablet cannot infer from anything else. The
          wording follows the phase, so it never contradicts what is on the wheel. */}
      <p className="pool-label" aria-live="polite">
        {phase === 'couple' ? (
          <>
            This couple is <strong>up</strong>
          </>
        ) : onPromptWheel ? (
          <>
            Now spinning: <strong>The challenge</strong>
          </>
        ) : phase === 'drawn' ? (
          <>
            Next: <strong>{POOL_LABEL[session.currentPool]}</strong>
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

      {/* Say plainly that this is a restored session. Whoever is holding the
          tablet may not be the person who put it down, and a session appearing
          from nowhere is exactly the kind of unexplained state principle 1 bans. */}
      {wasResumed && (
        <div className="resumed">
          <p className="resumed__text">
            Picked up where you left off — {session.log.length}{' '}
            {session.log.length === 1 ? 'couple has' : 'couples have'} danced.
          </p>
          <button className="resumed__dismiss" type="button" onClick={onDismissResumed}>
            Got it
          </button>
        </div>
      )}

      {recyclingNow && (
        <p className="recycle-note">
          All {POOL_LABEL[session.currentPool].toLowerCase()} have danced, so they are back on the
          wheel — nobody sits out.
        </p>
      )}

      {/* Deck exhaustion is surfaced before it recycles, never after. */}
      {deckSpent && (
        <p className="recycle-note recycle-note--wink">
          You have used all {session.promptDeck.length} prompts tonight. The deck starts over from
          here.
        </p>
      )}

      {/* D-017: the last name still gets a spin, and the app is in on the joke. */}
      {foregone && !recyclingNow && (
        <p className="recycle-note recycle-note--wink">
          Only {drawPool[0]?.name} left in the {POOL_NOUN[session.currentPool]} pool. Spin it
          anyway — they have earned the moment.
        </p>
      )}

      <Wheel
        names={wheelNames}
        rotation={session.rotation}
        spinning={spinning}
        onSettled={() => dispatch({ type: 'settled' })}
        label={onPromptWheel ? 'challenges' : POOL_NOUN[session.currentPool] + 's'}
      />

      <div className="result" aria-live="polite">
        {phase === 'couple' ? (
          <>
            <p className="result__label">Dancing now</p>
            <p className="result__couple">
              <span className="result__name">{session.drawn.leaders?.name}</span>
              <span className="result__amp">and</span>
              <span className="result__name">{session.drawn.followers?.name}</span>
            </p>
            {session.currentPrompt && (
              <div className="challenge">
                <p className="challenge__name">{session.currentPrompt.name}</p>
                {/* The description is for the dancers on the floor, not the
                    operator — so it stays up for the whole dance. */}
                <p className="challenge__description">{session.currentPrompt.description}</p>
              </div>
            )}
          </>
        ) : phase === 'pair' ? (
          <>
            <p className="result__label">Drawn</p>
            <p className="result__couple">
              <span className="result__name">{session.drawn.leaders?.name}</span>
              <span className="result__amp">and</span>
              <span className="result__name">{session.drawn.followers?.name}</span>
            </p>
            <p className="result__idle">Now draw their challenge.</p>
          </>
        ) : phase === 'drawn' ? (
          <>
            <p className="result__label">
              {POOL_LABEL[OTHER_POOL[session.currentPool]].replace(/s$/, '')}
            </p>
            <p className="result__name">{session.drawn[OTHER_POOL[session.currentPool]]?.name}</p>
          </>
        ) : (
          <p className="result__idle">
            {spinning ? 'Spinning…' : `Press spin to draw a ${POOL_NOUN[session.currentPool]}.`}
          </p>
        )}
      </div>

      <div className="actions">
        {phase === 'couple' ? (
          <button
            className="actions__primary"
            type="button"
            onClick={() => dispatch({ type: 'nextCouple' })}
          >
            Next couple
          </button>
        ) : phase === 'pair' ? (
          <button
            className="actions__primary"
            type="button"
            onClick={() => spinPrompt('spinPrompt')}
          >
            Spin their challenge
          </button>
        ) : (
          <button
            className="actions__primary"
            type="button"
            onClick={() => spinDancer('spin')}
            disabled={spinning || drawPool.length === 0}
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
        {(phase === 'drawn' || phase === 'pair' || phase === 'couple') && (
          <button
            className="edit-dancers"
            type="button"
            onClick={() => spinDancer('respin')}
            disabled={spinning}
          >
            Re-spin{' '}
            {phase === 'drawn'
              ? session.drawn[OTHER_POOL[session.currentPool]]?.name
              : session.drawn[session.currentPool]?.name}
          </button>
        )}

        {phase === 'couple' && session.currentPrompt && (
          <button
            className="edit-dancers"
            type="button"
            onClick={() => spinPrompt('respinPrompt')}
            disabled={spinning}
          >
            Draw a different challenge
          </button>
        )}

        {phase === 'couple' && (
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
