import { useCallback, useEffect, useRef, useState } from 'react';
import { AboutScreen } from './screens/AboutScreen';
import { HowItWorksScreen } from './screens/HowItWorksScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { PromptBankScreen } from './screens/PromptBankScreen';
import { RosterScreen } from './screens/RosterScreen';
import { SessionScreen } from './screens/SessionScreen';
import { TitleScreen } from './screens/TitleScreen';
import type { Dancer } from './domain/roster';
import type { DivisionSettings } from './domain/divisions';
import {
  createPractice,
  practiceReducer,
  type PracticeAction,
  type PracticeState,
} from './domain/practice';
import {
  POOL_NOUN,
  createSession,
  resumeSession,
  sessionReducer,
  type SessionAction,
  type SessionState,
  type SpinOrder,
} from './domain/session';
import { ALL_DECKS_ID, DEFAULT_DECK_ID, findDeck, promptsInPlay } from './domain/prompts';
import {
  clearPractice,
  clearSession,
  loadDivisionSettings,
  loadPractice,
  saveDivisionSettings,
  savePractice,
  hasSeenAbout,
  markAboutSeen,
  loadActiveDeckId,
  saveActiveDeckId,
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

type Screen = 'title' | 'roster' | 'session' | 'practice' | 'bank' | 'about' | 'how';

/** What setup hands over when the night starts: the wheel, or the Quick list (D-056). */
export type StartChoice =
  | { mode: 'wheel'; order: SpinOrder; promptsEnabled: boolean }
  | { mode: 'list' };

/**
 * One step back: everything a single action could have changed.
 *
 * The roster is captured alongside the session because the two move together —
 * removing a dancer mid-session edits both, and an undo that restored only half
 * of that would be worse than none. This is exactly the case that cost a dancer
 * her place at the first real event.
 */
type Snapshot = {
  session: SessionState | null;
  practice: PracticeState | null;
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

/**
 * Whether this launch should open on the welcome page.
 *
 * Only on a genuinely fresh install, and never over a session that survived a
 * crash: an operator whose tablet died mid-event needs their couples back, not
 * an introduction to an app they are already running.
 */
/** A Quick list survives a crash the same way. Only one of the two is ever running. */
const restoredPractice = restored ? null : loadPractice();

const openOnAbout = restored === null && restoredPractice === null && !hasSeenAbout();

export default function App() {
  const [screen, setScreen] = useState<Screen>(
    restored ? 'session' : restoredPractice ? 'practice' : openOnAbout ? 'about' : 'title',
  );
  /** True only for the launch that introduces the app, not for later visits. */
  const [aboutIsWelcome, setAboutIsWelcome] = useState(openOnAbout);
  /** Where "Back" should return to when leaving the Prompt Bank. */
  const [bankReturn, setBankReturn] = useState<Screen>('title');
  const [excludedPrompts, setExcludedPrompts] = useState<string[]>(() => loadExcludedPrompts());
  const [activeDeckId, setActiveDeckId] = useState<string>(() => loadActiveDeckId(DEFAULT_DECK_ID));
  const [storageBroken, setStorageBroken] = useState(() => !isStorageWritable());
  const [wasResumed, setWasResumed] = useState(restored !== null || restoredPractice !== null);
  const [divisionSettings, setDivisionSettings] = useState<DivisionSettings>(() =>
    loadDivisionSettings(),
  );

  /**
   * Session, roster and undo history move as one value.
   *
   * Keeping them together is what makes undo correct: every change records what
   * both looked like beforehand, in the same update, with no chance of the two
   * drifting apart.
   */
  const [state, setState] = useState<{
    session: SessionState | null;
    practice: PracticeState | null;
    dancers: Dancer[];
    past: Snapshot[];
  }>(() => ({ session: restored, practice: restoredPractice, dancers: loadRoster(), past: [] }));

  const { session, practice, dancers, past } = state;

  /**
   * Whether the session screen is locked.
   *
   * Held here rather than on the session screen because the back guard lives
   * here, and the guard has to know. Kept on the session screen, the lock was
   * invisible to the one listener that could undo it.
   */
  const [locked, setLocked] = useState(false);

  // A stray back gesture should not close the app out from under an event — and
  // while locked, it should not do anything at all.
  /**
   * What the session screen wants done with a back press, registered by the
   * screen itself because only it knows which sheet or dialog is open.
   */
  const sessionBack = useRef<(() => boolean) | null>(null);
  const registerSessionBack = useCallback((handler: (() => boolean) | null) => {
    sessionBack.current = handler;
  }, []);

  const { warning: exitWarning, blockedPresses } = useExitGuard(
    locked && screen === 'session',
    () => sessionBack.current?.() ?? false,
  );

  // Persist on every change rather than on a timer. The data is tiny and the
  // event is slow, so there is no reason to risk losing an edit.
  useEffect(() => {
    saveRoster(dancers);
  }, [dancers]);

  useEffect(() => {
    saveExcludedPrompts(excludedPrompts);
  }, [excludedPrompts]);

  useEffect(() => {
    saveActiveDeckId(activeDeckId);
  }, [activeDeckId]);

  useEffect(() => {
    saveDivisionSettings(divisionSettings);
  }, [divisionSettings]);

  useEffect(() => {
    if (!practice) {
      clearPractice();
      return;
    }
    if (!savePractice(practice)) setStorageBroken(true);
  }, [practice]);

  useEffect(() => {
    if (!session) {
      clearSession();
      return;
    }
    // A failed write is surfaced, not swallowed: the app must never imply the
    // night is safe when it is not.
    if (!saveSession(session)) setStorageBroken(true);
  }, [session]);

  /** The bundle a session would use right now, and what is left of it. */
  const activeDeck = findDeck(activeDeckId);
  const deckInPlay = promptsInPlay(activeDeck.prompts, excludedPrompts);

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
      case 'crownWinner': {
        const couple = before.log[action.index];
        return couple
          ? `Takes the crown back from ${couple.leader.name} and ${couple.follower.name}.`
          : 'Takes back the crown.';
      }
      case 'uncrown':
        return 'Puts the crown back where it was.';
      case 'allSkate':
        return 'Undoes the last dance of the night.';
      default:
        return 'Steps the session back one action.';
    }
  }

  /** Push one snapshot, dropping the oldest once the limit is reached. */
  const remember = (
    prev: Snapshot[],
    from: { session: SessionState | null; practice: PracticeState | null; dancers: Dancer[] },
    label: string,
  ): Snapshot[] =>
    [...prev, { session: from.session, practice: from.practice, dancers: from.dancers, label }].slice(
      -UNDO_LIMIT,
    );

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
          : remember(current.past, current, describe(action, current.session)),
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
      practice: current.practice,
      past: current.session
        ? remember(current.past, current, 'Reverses the last change to the dancers.')
        : current.past,
    }));
  }

  /** In the words the organizer would use, for the Undo confirmation. */
  function describePractice(action: PracticeAction, before: PracticeState): string {
    const couple = (id: string) => before.couples.find((c) => c.id === id);
    const pair = (id: string) => {
      const c = couple(id);
      return [c?.leader?.name, c?.follower?.name].filter(Boolean).join(' and ') || 'that couple';
    };
    switch (action.type) {
      case 'toggleDone':
        return couple(action.id)?.done
          ? `Marks ${pair(action.id)} as danced again.`
          : `Puts ${pair(action.id)} back as still to dance.`;
      case 'reshuffle':
        return 'Puts the list back the way it was before the reshuffle.';
      case 'setCouple':
        return `Puts back ${pair(action.id)}, as the couple was before it was changed.`;
      case 'addDancer':
        return `Takes ${action.dancer.name} back off the list and the roster.`;
      case 'removeDancer': {
        const who = [...before.pools.leaders, ...before.pools.followers].find(
          (d) => d.id === action.id,
        );
        return `Puts ${who?.name ?? 'them'} back on the list, as it was before they left.`;
      }
    }
  }

  const dispatchPractice = (action: PracticeAction) =>
    setState((current) => {
      if (!current.practice) return current;
      const next = practiceReducer(current.practice, action);
      if (next === current.practice) return current;
      return {
        ...current,
        practice: next,
        // A late arrival joins the roster too, exactly as on the wheel (D-023).
        dancers:
          action.type === 'addDancer' ? [...current.dancers, action.dancer] : current.dancers,
        past: remember(current.past, current, describePractice(action, current.practice)),
      };
    });

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
        session: previous.session ? resumeSession(previous.session) : null,
        practice: previous.practice,
        dancers: previous.dancers,
        past: current.past.slice(0, -1),
      };
    });
  }

  function startSession(choice: StartChoice) {
    setWasResumed(false);
    if (choice.mode === 'list') {
      setState((current) => ({
        ...current,
        session: null,
        practice: createPractice(current.dancers, divisionSettings),
        past: [],
      }));
      setScreen('practice');
      return;
    }
    setState((current) => ({
      ...current,
      practice: null,
      session: createSession(current.dancers, choice.order, choice.promptsEnabled, deckInPlay),
      past: [],
    }));
    setScreen('session');
  }

  function endPractice() {
    setWasResumed(false);
    setState((current) => ({ ...current, practice: null, past: [] }));
    clearPractice();
    setScreen('roster');
  }

  function endSession() {
    setLocked(false);
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
  if (screen === 'practice' && practice) {
    view = (
      <PracticeScreen
        practice={practice}
        dispatch={dispatchPractice}
        dancers={dancers}
        canUndo={past.length > 0}
        undoLabel={past[past.length - 1]?.label ?? null}
        onUndo={undo}
        wasResumed={wasResumed}
        onDismissResumed={() => setWasResumed(false)}
        onLeave={endPractice}
      />
    );
  } else if (screen === 'session' && session) {
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
        locked={locked}
        onLockChange={setLocked}
        blockedPresses={blockedPresses}
        onRegisterBack={registerSessionBack}
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
  } else if (screen === 'how') {
    view = <HowItWorksScreen onBack={() => setScreen('title')} />;
  } else if (screen === 'about') {
    view = (
      <AboutScreen
        firstRun={aboutIsWelcome}
        onDone={() => {
          markAboutSeen();
          setAboutIsWelcome(false);
          setScreen('title');
        }}
      />
    );
  } else if (screen === 'bank') {
    view = (
      <PromptBankScreen
        excludedIds={excludedPrompts}
        onChange={setExcludedPrompts}
        activeDeckId={activeDeckId}
        onChooseDeck={setActiveDeckId}
        onBack={() => setScreen(bankReturn)}
        backLabel={bankReturn === 'roster' ? 'Roster' : 'Title screen'}
      />
    );
  } else if (screen === 'roster') {
    view = (
      <RosterScreen
        dancers={dancers}
        onChange={setDancers}
        onBack={() => setScreen('title')}
        onStartSession={startSession}
        divisionSettings={divisionSettings}
        onDivisionSettingsChange={setDivisionSettings}
        promptsInPlay={deckInPlay.length}
        deckName={activeDeck.name}
        deckTotal={activeDeck.prompts.length}
        mixedBundles={activeDeckId === ALL_DECKS_ID}
        onEditBundles={() => {
          setBankReturn('roster');
          setScreen('bank');
        }}
      />
    );
  } else {
    view = (
      <TitleScreen
        rosterCount={dancers.length}
        promptsInPlay={deckInPlay.length}
        promptsTotal={activeDeck.prompts.length}
        onStartSession={() => setScreen('roster')}
        onOpenBank={() => {
          setBankReturn('title');
          setScreen('bank');
        }}
        onOpenAbout={() => setScreen('about')}
        onOpenHow={() => setScreen('how')}
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
