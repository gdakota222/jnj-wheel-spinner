import { useEffect, useState } from 'react';
import { PromptBankScreen } from './screens/PromptBankScreen';
import { RosterScreen } from './screens/RosterScreen';
import { SessionScreen } from './screens/SessionScreen';
import { TitleScreen } from './screens/TitleScreen';
import type { Dancer } from './domain/roster';
import {
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
import './styles/app.css';

type Screen = 'title' | 'roster' | 'session' | 'bank';

/** A session restored from storage, normalised so an interrupted spin cannot hang. */
const restored = (() => {
  const saved = loadSession();
  if (!saved || saved.phase === 'complete') return null;
  return resumeSession(saved);
})();

export default function App() {
  // Whoever opens the app lands back where it was left — the same mechanism that
  // covers a crash, a locked tablet, and handing the device to someone else.
  const [screen, setScreen] = useState<Screen>(restored ? 'session' : 'title');
  const [dancers, setDancers] = useState<Dancer[]>(() => loadRoster());
  const [session, setSession] = useState<SessionState | null>(restored);
  const [excludedPrompts, setExcludedPrompts] = useState<string[]>(() => loadExcludedPrompts());
  const [storageBroken, setStorageBroken] = useState(() => !isStorageWritable());
  const [wasResumed, setWasResumed] = useState(restored !== null);

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

  const dispatch = (action: SessionAction) =>
    setSession((current) => (current ? sessionReducer(current, action) : current));

  function startSession(order: SpinOrder, promptsEnabled: boolean) {
    setWasResumed(false);
    setSession(createSession(dancers, order, promptsEnabled, deckInPlay));
    setScreen('session');
  }

  function endSession() {
    setWasResumed(false);
    setSession(null);
    clearSession();
    setScreen('roster');
  }

  /**
   * v1.0 keeps one list: editing dancers during a session edits the same roster
   * the session drew from, and the session is told to re-derive its pools. The
   * two become separate things in v1.1 — see D-023.
   */
  function editDancers(next: Dancer[]) {
    setDancers(next);
    dispatch({ type: 'syncDancers', dancers: next });
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
        wasResumed={wasResumed}
        onDismissResumed={() => setWasResumed(false)}
        onEditDancers={editDancers}
        onLeave={endSession}
        onStartFresh={() => {
          setWasResumed(false);
          setSession(createSession(dancers, session.spinOrder, session.promptsEnabled, deckInPlay));
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
    </>
  );
}
