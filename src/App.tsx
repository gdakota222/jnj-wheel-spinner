import { useEffect, useState } from 'react';
import { PromptBankScreen } from './screens/PromptBankScreen';
import { RosterScreen } from './screens/RosterScreen';
import { SessionScreen } from './screens/SessionScreen';
import { TitleScreen } from './screens/TitleScreen';
import type { Dancer } from './domain/roster';
import {
  POOL_NOUN,
  createSession,
  resumeSession,
  sessionReducer,
  type SessionAction,
  type SessionState,
  type SpinOrder,
} from './domain/session';
import { WCS_STARTER_DECK, promptsInPlay } from './domain/prompts';
import {
  clearSession,
  isStorageWritable,
  loadExcludedPrompts,
  loadRoster,
  loadSession,
  saveExcludedPrompts,
  saveRoster,
  saveSession,
} from './storage';
import { useExitGuard } from './hooks/useExitGuard';
import './styles/app.css';

type Screen = 'title' | 'roster' | 'session' | 'bank';

/**
 * One step back: everything a single action could have changed.
 *
 * The roster is captured alongside the session because the two move together —
 * removing a dancer mid-session edits both, and an undo that restored only half
 * of that would be worse than none. This is exactly the case that cost a dancer
 * her place at the first real event.
 */
type Snapshot = {
  session: SessionState;
  dancers: Dancer[];
  /** Plain English for what undoing this would reverse. */
  label: string;
};

/**
 * How many steps back the app can go.
 *
 * Deep enough to walk out of a real mistake — the event needed three — and
 * bounded so a long session cannot grow without limit. Held in memory only: a
 * crash restores the session itself but not its history, which is a deliberate
 * trade rather than an oversight (see D-037).
 */
const UNDO_LIMIT = 25;

/** A session restored from storage, normalised so an interrupted spin cannot hang. */
const restored = (() => {
  const saved = loadSession();
  if (!saved || saved.phase === 'complete') return null;
  return resumeSession(saved);
})();

export default function App() {
  const [screen, setScreen] = useState<Screen>(restored ? 'session' : 'title');
  const [excludedPrompts, setExcludedPrompts] = useState<string[]>(() => loadExcludedPrompts());
  const [storageBroken, setStorageBroken] = useState(() => !isStorageWritable());
  const [wasResumed, setWasResumed] = useState(restored !== null);

  /**
   * Session, roster and undo history move as one value.
   *
   * Keeping them together is what makes undo correct: every change records what
   * both looked like beforehand, in the same update, with no chance of the two
   * drifting apart.
   */
  const [state, setState] = useState<{
    session: SessionState | null;
    dancers: Dancer[];
    past: Snapshot[];
  }>(() => ({ session: restored, dancers: loadRoster(), past: [] }));

  const { session, dancers, past } = state;

  // A stray back gesture should not close the app out from under an event.
  const { warning: exitWarning } = useExitGuard();

  // Persist on every change rather than on a timer. The data is tiny and the
  // event is slow, so there is no reason to risk losing an edit.
  useEffect(() => {
    saveRoster(dancers);
  }, [dancers]);

  useEffect(() => {
    saveExcludedPrompts(excludedPrompts);
  }, [excludedPrompts]);

  useEffect(() => {
    if (!session) {
      clearSession();
      return;
    }
    // A failed write is surfaced, not swallowed: the app must never imply the
    // night is safe when it is not.
    if (!saveSession(session)) setStorageBroken(true);
  }, [session]);

  /** What a session would draw from right now, after set-asides. */
  const deckInPlay = promptsInPlay(WCS_STARTER_DECK.prompts, excludedPrompts);

  /**
   * Actions that do not earn their own step back.
   *
   * `settled` is the animation reporting in, not something the operator did — a
   * spin and its landing are one act, so undo removes the whole draw rather than
   * stranding the wheel mid-turn.
   */
  const CONTINUATIONS: ReadonlySet<SessionAction['type']> = new Set(['settled']);

  /**
   * Describe an action in the words the operator would use.
   *
   * Undo asks before it acts, and a confirmation that cannot say *what* it is
   * about to reverse is not really a confirmation.
   */
  function describe(action: SessionAction, before: SessionState): string {
    const drawnName = (pool: 'leaders' | 'followers') => before.drawn[pool]?.name ?? 'that dancer';
    switch (action.type) {
      case 'spin':
        return `Undoes the draw for ${POOL_NOUN[before.currentPool]}.`;
      case 'respin':
        return `Puts back the re-spin of ${drawnName(before.currentPool)}.`;
      case 'spinPrompt':
        return 'Undoes drawing this couple\u2019s challenge.';
      case 'respinPrompt':
        return 'Restores the challenge that was swapped out.';
      case 'nextCouple':
        return `Un-commits ${before.drawn.leaders?.name ?? 'the leader'} and ${
          before.drawn.followers?.name ?? 'the follower'
        }, putting them back on the floor.`;
      case 'jamOver':
        return 'Reopens the birthday jam.';
      case 'syncDancers':
        return 'Reverses the last change to the dancers.';
      default:
        return 'Steps the session back one action.';
    }
  }

  /** Push one snapshot, dropping the oldest once the limit is reached. */
  const remember = (
    prev: Snapshot[],
    session: SessionState,
    dancers: Dancer[],
    label: string,
  ): Snapshot[] => [...prev, { session, dancers, label }].slice(-UNDO_LIMIT);

  const dispatch = (action: SessionAction) =>
    setState((current) => {
      if (!current.session) return current;
      const next = sessionReducer(current.session, action);
      // An action the reducer refused changed nothing, so it is not a step back.
      if (next === current.session) return current;
      return {
        ...current,
        session: next,
        past: CONTINUATIONS.has(action.type)
          ? current.past
          : remember(
              current.past,
              current.session,
              current.dancers,
              describe(action, current.session),
            ),
      };
    });

  /**
   * v1.0 keeps one list: editing dancers during a session edits the same roster
   * the session drew from, and the session re-derives its pools. The two become
   * separate things in v1.1 — see D-023.
   */
  function editDancers(next: Dancer[]) {
    setState((current) => ({
      dancers: next,
      session: current.session
        ? sessionReducer(current.session, { type: 'syncDancers', dancers: next })
        : null,
      past: current.session
        ? remember(
            current.past,
            current.session,
            current.dancers,
            'Reverses the last change to the dancers.',
          )
        : current.past,
    }));
  }

  /** Roster changes outside a session are free — setup is not a thing to undo. */
  function setDancers(next: Dancer[]) {
    setState((current) => ({ ...current, dancers: next }));
  }

  function undo() {
    setState((current) => {
      const previous = current.past[current.past.length - 1];
      if (!previous) return current;
      return {
        // Normalised on the way back for the same reason a restored session is:
        // a snapshot taken mid-spin would return to a wheel that never lands.
        session: resumeSession(previous.session),
        dancers: previous.dancers,
        past: current.past.slice(0, -1),
      };
    });
  }

  function startSession(order: SpinOrder, promptsEnabled: boolean) {
    setWasResumed(false);
    setState((current) => ({
      ...current,
      session: createSession(current.dancers, order, promptsEnabled, deckInPlay),
      past: [],
    }));
    setScreen('session');
  }

  function endSession() {
    setWasResumed(false);
    setState((current) => ({ ...current, session: null, past: [] }));
    clearSession();
    setScreen('roster');
  }

  const banner = storageBroken ? (
    <p className="storage-warning" role="status">
      <strong>This device isn’t saving.</strong> The roster and the running session will be lost if
      the app closes. Private browsing or a full device usually causes this.
    </p>
  ) : null;

  let view;
  if (screen === 'session' && session) {
    view = (
      <SessionScreen
        session={session}
        dispatch={dispatch}
        dancers={dancers}
        canUndo={past.length > 0}
        undoLabel={past[past.length - 1]?.label ?? null}
        onUndo={undo}
        wasResumed={wasResumed}
        onDismissResumed={() => setWasResumed(false)}
        onEditDancers={editDancers}
        onLeave={endSession}
        onStartFresh={() => {
          setWasResumed(false);
          setState((current) => ({
            ...current,
            session: createSession(
              current.dancers,
              session.spinOrder,
              session.promptsEnabled,
              deckInPlay,
            ),
            past: [],
          }));
        }}
      />
    );
  } else if (screen === 'bank') {
    view = (
      <PromptBankScreen
        excludedIds={excludedPrompts}
        onChange={setExcludedPrompts}
        onBack={() => setScreen('title')}
      />
    );
  } else if (screen === 'roster') {
    view = (
      <RosterScreen
        dancers={dancers}
        onChange={setDancers}
        onBack={() => setScreen('title')}
        onStartSession={startSession}
        promptsInPlay={deckInPlay.length}
      />
    );
  } else {
    view = (
      <TitleScreen
        rosterCount={dancers.length}
        promptsInPlay={deckInPlay.length}
        promptsTotal={WCS_STARTER_DECK.prompts.length}
        onStartSession={() => setScreen('roster')}
        onOpenBank={() => setScreen('bank')}
      />
    );
  }

  return (
    <>
      {banner}
      {view}
      {exitWarning && (
        <p className="exit-warning" role="status">
          Press back again to close the app
        </p>
      )}
    </>
  );
}
