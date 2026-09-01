import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { HoldButton } from '../components/HoldButton';
import { Jamboree } from '../components/Jamboree';
import { LockScreen } from '../components/LockScreen';
import { RosterOptions } from '../components/RosterOptions';
import { SessionLog } from '../components/SessionLog';
import { SessionTools } from '../components/SessionTools';
import { Wheel } from '../components/Wheel';
import { WinnerReveal } from '../components/WinnerReveal';
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
import { hasSeenWheelHint, markWheelHintSeen } from '../storage';

type Props = {
  session: SessionState;
  dispatch: (action: SessionAction) => void;
  dancers: Dancer[];
  canUndo: boolean;
  /** What the next undo would reverse, for the confirmation. */
  undoLabel: string | null;
  onUndo: () => void;
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
  canUndo,
  undoLabel,
  onUndo,
  wasResumed,
  onDismissResumed,
  onEditDancers,
  onLeave,
  onStartFresh,
}: Props) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [dancersOpen, setDancersOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRespin, setConfirmRespin] = useState(false);
  const [confirmRedraw, setConfirmRedraw] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showHint, setShowHint] = useState(() => !hasSeenWheelHint());
  /**
   * Where the end-of-night flow has got to.
   *
   * Screen-local rather than session state: which panel is showing is not a fact
   * about the night, and a crash should put the operator back on the completed
   * session with its crown intact, not halfway through a curtain.
   */
  const [ending, setEnding] = useState<'log' | 'picking' | 'reveal'>('log');
  const [pick, setPick] = useState<number | null>(null);

  useWakeLock(session.phase !== 'complete');

  /** The hint is a one-time reminder, not permanent furniture beside the wheel. */
  useEffect(() => {
    if (!showHint) return;
    markWheelHintSeen();
    const timer = window.setTimeout(() => setShowHint(false), 6000);
    return () => window.clearTimeout(timer);
  }, [showHint]);

  const { phase } = session;
  const dancing = phase === 'couple';
  const onPromptWheel = phase === 'pair' || phase === 'prompt-spinning';
  const spinning = phase === 'spinning' || phase === 'prompt-spinning';

  const shownEntries = wheelEntries(session);
  const drawPool = drawEntries(session);
  const prompts = promptEntries(session);
  const wheelNames = onPromptWheel ? prompts.map((p) => p.name) : shownEntries.map((d) => d.name);

  const recyclingNow = willRecycle(session) && !onPromptWheel;
  const deckSpent = promptsExhausted(session) && onPromptWheel;
  const foregone = isForegoneConclusion(session) && !onPromptWheel && !dancing;

  const coupleNumber = Math.min(session.log.length + 1, session.couplesTotal);
  const isLastCouple = session.log.length + 1 >= session.couplesTotal;

  /** Who a re-spin would discard right now. */
  const respinTarget =
    phase === 'drawn'
      ? session.drawn[OTHER_POOL[session.currentPool]]
      : session.drawn[session.currentPool];

  function spinDancer(type: 'spin' | 'respin') {
    if (drawPool.length === 0) return;
    const index = pickIndex(drawPool.length);
    const plan = planSpin(index, drawPool.length, session.rotation);
    dispatch({ type, index, rotation: plan.rotation });
  }

  function spinPrompt(type: 'spinPrompt' | 'respinPrompt') {
    // A redraw takes the current challenge off the wheel, so the pool aimed at
    // here is the same one the wheel will show once the spin starts.
    const pool =
      type === 'respinPrompt' && session.currentPrompt
        ? prompts.filter((p) => p.id !== session.currentPrompt!.id)
        : prompts;
    if (pool.length === 0) return;

    const chosen = pool[pickIndex(pool.length)];
    const plan = planSpin(pool.indexOf(chosen), pool.length, session.rotation);
    dispatch({ type, promptId: chosen.id, rotation: plan.rotation });
  }

  // ---------------------------------------------------------------- jamboree
  if (phase === 'jamboree' && session.jamboreeDancers.length > 0) {
    return (
      <div className="shell shell--session">
        <header className="screen-head">
          <h1 className="screen-title">
            Couple {coupleNumber} of {session.couplesTotal}
          </h1>
        </header>
        <Jamboree
          dancers={session.jamboreeDancers}
          onJamOver={() => dispatch({ type: 'jamOver' })}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------- complete
  if (phase === 'complete') {
    const crowned = session.winner === null ? null : (session.log[session.winner] ?? null);

    // The curtain. Runs over the whole screen, and the pick is not committed
    // until it parts — backing out here leaves the night uncrowned.
    if (ending === 'reveal' && pick !== null && session.log[pick]) {
      return (
        <WinnerReveal
          couple={session.log[pick]}
          onBack={() => setEnding('picking')}
          onDone={() => {
            // Replaying a reveal for the same couple changes nothing, and
            // dispatching anyway would leave an Undo that appears to do nothing
            // when pressed.
            if (session.winner !== pick) dispatch({ type: 'crownWinner', index: pick });
            setEnding('log');
          }}
        />
      );
    }

    if (ending === 'picking') {
      return (
        <div className="shell shell--setup">
          <header className="setup-head">
            <button className="back" type="button" onClick={() => setEnding('log')}>
              ← Session
            </button>
            <h1 className="screen-title">Crown a winner</h1>
          </header>

          <p className="pick__hint">
            How you decided is yours — your call, a panel, the noise of the room. The app just
            holds the result until you are ready to show it.
          </p>

          <ol className="log log--full panel__scroll">
            {session.log.map((couple, i) => (
              <li key={`${couple.leader.id}-${couple.follower.id}-${i}`}>
                <button
                  type="button"
                  className="pick__row"
                  aria-pressed={pick === i}
                  onClick={() => setPick(i)}
                >
                  <span className="log__number">{i + 1}</span>
                  <span className="pick__names">
                    {couple.leader.name} &amp; {couple.follower.name}
                  </span>
                  {couple.prompt && <span className="log__prompt">{couple.prompt.name}</span>}
                </button>
              </li>
            ))}
          </ol>

          <div className="next next--pinned">
            <button
              className="next__button"
              type="button"
              disabled={pick === null}
              onClick={() => setEnding('reveal')}
            >
              <span className="menu__label">Bring down the curtain</span>
              <span className="menu__note">
                {pick === null
                  ? 'Choose the couple first'
                  : `${session.log[pick].leader.name} & ${session.log[pick].follower.name} — you reveal when you are ready`}
              </span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="shell">
        <header className="screen-head">
          <h1 className="screen-title">Session complete</h1>
          <p className="subtitle">
            Everyone has danced. {session.log.length}{' '}
            {session.log.length === 1 ? 'couple' : 'couples'} took the floor.
          </p>
        </header>

        {crowned && (
          <section className="crowned">
            <p className="crowned__label">Winning couple</p>
            <p className="crowned__names">
              {crowned.leader.name} &amp; {crowned.follower.name}
            </p>
            <div className="crowned__actions">
              <button
                className="crowned__button"
                type="button"
                onClick={() => {
                  setPick(session.winner);
                  setEnding('reveal');
                }}
              >
                Show the reveal again
              </button>
              <button
                className="crowned__button"
                type="button"
                onClick={() => {
                  setPick(session.winner);
                  setEnding('picking');
                }}
              >
                Choose someone else
              </button>
            </div>
          </section>
        )}

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
          {/* Offered, never automatic. Some nights end better with no winner at
              all, and the app should not imply one is owed. */}
          {!crowned && session.log.length > 0 && (
            <>
              <button
                className="actions__primary"
                type="button"
                onClick={() => {
                  setPick(null);
                  setEnding('picking');
                }}
              >
                Crown a winner
              </button>
              <p className="actions__note">
                Optional. A night can finish without one, and this list is the whole record either
                way.
              </p>
            </>
          )}

          <button
            className={crowned || session.log.length === 0 ? 'actions__primary' : 'edit-dancers'}
            type="button"
            onClick={onStartFresh}
          >
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

  // ------------------------------------------------------------- the session
  return (
    <div className="shell shell--session">
      <header className="toolbar">
        <button
          className="toolbar__back"
          type="button"
          disabled={spinning}
          onClick={() => (session.log.length > 0 ? setConfirmLeave(true) : onLeave())}
        >
          ←<span className="visually-hidden"> Back to the roster</span>
        </button>

        <h1 className="toolbar__title">
          Couple {coupleNumber} of {session.couplesTotal}
        </h1>

        {/* Undo and Lock are the only two that earn a permanent place: one is the
            recovery control, the other is needed the instant the device goes into
            a pocket. Everything else lives in Tools. */}
        <button
          className="toolbar__button"
          type="button"
          onClick={() => setConfirmUndo(true)}
          disabled={!canUndo || spinning}
        >
          Undo
        </button>
        {/* No lock while dancing: the only action there is a hold, so there is
            nothing a pocket can do, and a lock overlay that looked almost
            identical to the dance hold was impossible to tell apart. */}
        {!dancing && (
          <button className="toolbar__button" type="button" onClick={() => setLocked(true)}>
            Lock
          </button>
        )}
        <button
          className="toolbar__button"
          type="button"
          onClick={() => setToolsOpen(true)}
          disabled={spinning}
        >
          Tools
        </button>
      </header>

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

      {dancing ? (
        /* The wheel has done its job and nobody is looking at it. The room — and
           the TV this is cast to — needs the names and the challenge. */
        <section className="stage stage--dancing" aria-live="polite">
          <p className="stage__label">Dancing now</p>
          <p className="stage__couple">
            <span className="stage__name">{session.drawn.leaders?.name}</span>
            <span className="stage__amp">and</span>
            <span className="stage__name">{session.drawn.followers?.name}</span>
          </p>
          {session.currentPrompt && (
            <div className="stage__challenge">
              <p className="challenge__name">{session.currentPrompt.name}</p>
              <p className="challenge__description">{session.currentPrompt.description}</p>
            </div>
          )}
        </section>
      ) : (
        <>
          <p className="pool-label" aria-live="polite">
            {onPromptWheel ? (
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

          {recyclingNow && (
            <p className="note note--info">
              All {POOL_LABEL[session.currentPool].toLowerCase()} have danced — they are back on the
              wheel so nobody sits out.
            </p>
          )}
          {deckSpent && (
            <p className="note note--wink">
              All {session.promptDeck.length} challenges used. The deck starts over.
            </p>
          )}
          {foregone && !recyclingNow && (
            <p className="note note--wink">
              Only {drawPool[0]?.name} left. Spin it anyway — they have earned the moment.
            </p>
          )}

          <div className="stage stage--wheel">
            <Wheel
              names={wheelNames}
              rotation={session.rotation}
              fromRotation={session.previousRotation}
              spinning={spinning}
              onSettled={() => dispatch({ type: 'settled' })}
              label={onPromptWheel ? 'challenges' : POOL_NOUN[session.currentPool] + 's'}
              onSpin={onPromptWheel ? () => spinPrompt('spinPrompt') : () => spinDancer('spin')}
            />
          </div>

          <div className="result" aria-live="polite">
            {phase === 'pair' ? (
              <>
                <p className="result__label">Drawn</p>
                <p className="result__pair">
                  {session.drawn.leaders?.name} <span>and</span> {session.drawn.followers?.name}
                </p>
              </>
            ) : phase === 'drawn' ? (
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
                {spinning ? 'Spinning…' : `Tap the wheel to draw a ${POOL_NOUN[session.currentPool]}`}
              </p>
            )}
          </div>
        </>
      )}

      <div className="actions actions--pinned">
        {dancing ? (
          <HoldButton
            label={isLastCouple ? 'Hold to see results' : 'Hold for next couple'}
            onHold={() => dispatch({ type: 'nextCouple' })}
          />
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
      </div>

      {showHint && !dancing && (
        <p className="hint-toast" role="status">
          Tap the wheel itself to spin. Tap again to hurry it along.
        </p>
      )}

      {locked && <LockScreen onUnlock={() => setLocked(false)} />}

      {toolsOpen && (
        <SessionTools
          session={session}
          respinTarget={respinTarget}
          onRespin={() => {
            setToolsOpen(false);
            setConfirmRespin(true);
          }}
          onRedrawChallenge={() => {
            setToolsOpen(false);
            setConfirmRedraw(true);
          }}
          onOpenLog={() => {
            setToolsOpen(false);
            setLogOpen(true);
          }}
          onOpenDancers={() => {
            setToolsOpen(false);
            setDancersOpen(true);
          }}
          onClose={() => setToolsOpen(false)}
        />
      )}

      {dancersOpen && (
        <RosterOptions
          dancers={dancers}
          onChange={onEditDancers}
          onClose={() => setDancersOpen(false)}
        />
      )}

      {logOpen && (
        <SessionLog
          log={session.log}
          couplesTotal={session.couplesTotal}
          onClose={() => setLogOpen(false)}
        />
      )}

      {/* Pressing Undo asks first, and says exactly what it would reverse. */}
      {confirmUndo && (
        <ConfirmDialog
          title="Undo this?"
          body={
            undoLabel
              ? undoLabel.toLowerCase().includes('re-spin')
                ? `${undoLabel} You can re-spin again any time from Tools.`
                : undoLabel
              : 'Steps the session back one action.'
          }
          confirmLabel="Undo it"
          onConfirm={() => {
            setConfirmUndo(false);
            onUndo();
          }}
          onCancel={() => setConfirmUndo(false)}
        />
      )}

      {confirmRespin && respinTarget && (
        <ConfirmDialog
          title={`Re-spin ${respinTarget.name}?`}
          body={`${respinTarget.name} goes back into the pool and the wheel draws again. They stay eligible.`}
          confirmLabel="Re-spin"
          destructive
          onConfirm={() => {
            setConfirmRespin(false);
            spinDancer('respin');
          }}
          onCancel={() => setConfirmRespin(false)}
        />
      )}

      {confirmRedraw && session.currentPrompt && (
        <ConfirmDialog
          title="Draw a different challenge?"
          body={`"${session.currentPrompt.name}" is replaced by another challenge for this couple.`}
          confirmLabel="Draw another"
          destructive
          onConfirm={() => {
            setConfirmRedraw(false);
            spinPrompt('respinPrompt');
          }}
          onCancel={() => setConfirmRedraw(false)}
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
