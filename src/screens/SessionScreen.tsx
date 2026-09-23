import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AllSkate } from '../components/AllSkate';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EndgameSheet } from '../components/EndgameSheet';
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
  /** Owned by App, because the back guard there has to know about it. */
  locked: boolean;
  onLockChange: (locked: boolean) => void;
  /** Back presses swallowed while locked; rising means "say why nothing happened". */
  blockedPresses: number;
  /** Hands App the screen's answer to a back press; null on the way out. */
  onRegisterBack: (handler: (() => boolean) | null) => void;
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
  locked,
  onLockChange,
  blockedPresses,
  onRegisterBack,
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
  const [showHint, setShowHint] = useState(() => !hasSeenWheelHint());
  /**
   * Where the end-of-night flow has got to.
   *
   * Screen-local rather than session state: which panel is showing is not a fact
   * about the night, and a crash should put the operator back on the completed
   * session with its crown intact, not halfway through a curtain.
   */
  const [ending, setEnding] = useState<'log' | 'picking' | 'reveal' | 'finale'>('log');
  const [pick, setPick] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useWakeLock(session.phase !== 'complete');

  /**
   * The back gesture, mid-session: it goes back through whatever is on screen,
   * most recent first, and never out of the app.
   *
   * Asked for after the handoff rehearsal, as a quick way to reach Undo. It
   * **opens** the Undo prompt — the one that says exactly what it would reverse —
   * and never undoes anything by itself. A brushed screen edge rewinding the
   * night without a word would be a far worse bug than the one this replaces.
   *
   * Refreshed after every render so it always reads current state; registered
   * with App once.
   */
  const handleBack = useRef<() => boolean>(() => false);
  useLayoutEffect(() => {
    handleBack.current = () => {
      // 1. A question on screen: back means "no".
      if (confirmUndo) return setConfirmUndo(false), true;
      if (confirmRespin) return setConfirmRespin(false), true;
      if (confirmRedraw) return setConfirmRedraw(false), true;
      if (confirmLeave) return setConfirmLeave(false), true;

      // 2. A sheet on screen: back closes it.
      if (toolsOpen) return setToolsOpen(false), true;
      if (dancersOpen) return setDancersOpen(false), true;
      if (logOpen) return setLogOpen(false), true;
      if (sheetOpen) return setSheetOpen(false), true;

      // 3. The end of the night.
      if (session.phase === 'complete') {
        // The curtain is a performance in front of a room; a swipe must not
        // break it. Its own buttons are the way out.
        if (ending === 'reveal') return true;
        // The picker commits nothing, and the AllSkate saves as it lands, so
        // stepping back from either loses nothing.
        if (ending === 'picking' || ending === 'finale') return setEnding('log'), true;
        // On the finished session itself: show the ways out, rather than taking
        // one. "Back to the roster" clears the night's record.
        return setSheetOpen(true), true;
      }

      // 4. Mid-spin there is nothing sensible to go back to, and leaving is the
      //    worst possible outcome.
      if (session.phase === 'spinning' || session.phase === 'prompt-spinning') return true;

      // 5. Something to undo: ask, naming it.
      if (canUndo) return setConfirmUndo(true), true;

      // 6. Nothing to undo: the same as the ← button.
      if (session.log.length > 0) return setConfirmLeave(true), true;
      onLeave();
      return true;
    };
  });

  useEffect(() => {
    onRegisterBack(() => handleBack.current());
    return () => onRegisterBack(null);
  }, [onRegisterBack]);

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

    if (ending === 'finale') {
      return (
        <AllSkate
          deck={session.promptDeck}
          unused={session.promptsRemaining}
          chosen={session.allSkate}
          onChoose={(prompt) => {
            if (session.allSkate?.id !== prompt.id) {
              dispatch({ type: 'allSkate', promptId: prompt.id });
            }
          }}
          onBack={() => setEnding('log')}
          onDone={() => setEnding('log')}
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

    /**
     * The end of the night, split by kind rather than piled up.
     *
     * A finished session holds two different sorts of thing: ways to **end** the
     * night, and ways to **leave** it. Rendering them as four identical buttons
     * with a paragraph under each is what made this screen feel cluttered.
     *
     * So the two endings are cards, and they stay on screen. Putting them behind
     * the sheet as well was built and compared, and it makes a tidier screen that
     * teaches a first-time operator nothing: a log and one button do not say the
     * night has an ending worth reaching for. Leaving goes in the sheet, where
     * "Start a fresh session" — which wipes the log — is a step removed and
     * carries its warning with it rather than shouting it from the screen behind.
     */
    const endgameActions = [
      {
        label: 'Start a fresh session',
        note: 'Clears this list and starts everyone over. Nothing here is saved.',
        onSelect: onStartFresh,
      },
      {
        label: 'Back to the roster',
        note: 'Leaves this session where it is and goes back to the dancers.',
        onSelect: onLeave,
      },
    ];

    const crownCard = (
      <button
        className="endgame__card endgame__card--crown"
        type="button"
        onClick={() => {
          setPick(session.winner);
          setEnding(crowned ? 'reveal' : 'picking');
        }}
      >
        {/* Once decided, the card leads with the result. The record above also
            marks it, but on a big night that row can be scrolled out of sight —
            and these cards never scroll. */}
        {crowned ? (
          <>
            <span className="endgame__label">Winners</span>
            <span className="endgame__title endgame__title--result">
              {crowned.leader.name} &amp; {crowned.follower.name}
            </span>
            <span className="endgame__sub">Tap to show the reveal again</span>
          </>
        ) : (
          <>
            <span className="endgame__title">Crown a Winner</span>
            <span className="endgame__sub">Pick the couple, then reveal it</span>
          </>
        )}
      </button>
    );

    const skateCard = (
      <button
        className="endgame__card endgame__card--skate"
        type="button"
        onClick={() => setEnding('finale')}
      >
        {/* No explanation here on purpose: the room already knows the word, and
            the options screen explains it to anyone who does not. */}
        {session.allSkate ? (
          <>
            <span className="endgame__label">AllSkate</span>
            <span className="endgame__title endgame__title--result">{session.allSkate.name}</span>
            <span className="endgame__sub">Tap to show it again</span>
          </>
        ) : (
          <>
            <span className="endgame__title">AllSkate</span>
            <span className="endgame__sub">One last challenge</span>
          </>
        )}
      </button>
    );

    /**
     * The record of the night: who danced with whom, who won, and what everybody
     * danced last.
     *
     * The crown and the AllSkate used to live only on the cards, worded as things
     * to press ("show it again"), so the results of the night never read as
     * results. They belong here, in the list, in the order they happened — which
     * is also the shape v1.6 will save as event history.
     */
    const record = (
      <ol className="log log--full panel__scroll">
        {session.log.map((couple, i) => {
          const won = session.winner === i;
          return (
            <li
              key={`${couple.leader.id}-${couple.follower.id}-${i}`}
              className="log__row"
              data-winner={won}
            >
              <span className="log__number">{i + 1}</span>
              <span className="log__names">
                <span className="log__name">{couple.leader.name}</span>
                <span className="log__role">Leader</span>
              </span>
              <span className="log__names">
                <span className="log__name">{couple.follower.name}</span>
                <span className="log__role">Follower</span>
              </span>
              {(couple.prompt || won) && (
                <span className="log__foot">
                  {couple.prompt && <span className="log__prompt">{couple.prompt.name}</span>}
                  {/* A word as well as a crown, so the result is never carried by
                      an emoji or a colour alone. */}
                  {won && (
                    <span className="log__winner">
                      <span aria-hidden="true">👑 </span>Winners
                    </span>
                  )}
                </span>
              )}
            </li>
          );
        })}
        {session.allSkate && (
          <li className="log__row log__row--skate">
            <span className="log__number" aria-hidden="true">
              ★
            </span>
            <span className="log__names">
              <span className="log__name">AllSkate</span>
              <span className="log__role">Everybody</span>
            </span>
            <span className="log__foot">
              <span className="log__prompt log__prompt--skate">{session.allSkate.name}</span>
            </span>
          </li>
        )}
      </ol>
    );

    const head = (
      <header className="screen-head">
        <h1 className="screen-title">Session complete</h1>
        <p className="subtitle">
          Everyone has danced. {session.log.length}{' '}
          {session.log.length === 1 ? 'couple' : 'couples'} took the floor.
        </p>
      </header>
    );

    // Nothing on this screen scrolls except the record itself, the same rule
    // setup and the session already live by. A big night makes a long list, so
    // the list scrolls inside its own space; the endings and the way out stay
    // exactly where they are.
    return (
      <div className="shell shell--setup shell--complete">
        {head}

        {record}

        {/* Said once, above both, rather than as a paragraph under each — and
            only while it is still an invitation. Once either has happened the
            record above says so, and "optional" would be talking to nobody. */}
        {!crowned && !session.allSkate && (
          <p className="endgame__hint">
            Optional, both of them — a night can end on either, on both, or on neither.
          </p>
        )}

        <div className="endgame">
          {session.log.length > 0 && crownCard}
          {session.promptDeck.length > 0 && skateCard}
        </div>

        <button className="endgame__more" type="button" onClick={() => setSheetOpen(true)}>
          Session options
        </button>

        {sheetOpen && (
          <EndgameSheet onClose={() => setSheetOpen(false)} actions={endgameActions} />
        )}
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
          <button className="toolbar__button" type="button" onClick={() => onLockChange(true)}>
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

      {locked && <LockScreen onUnlock={() => onLockChange(false)} nudge={blockedPresses} />}

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
