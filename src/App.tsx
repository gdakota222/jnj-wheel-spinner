import { useEffect, useState } from 'react';
import { PromptBankScreen } from './screens/PromptBankScreen';
import { RosterScreen } from './screens/RosterScreen';
import { SessionScreen } from './screens/SessionScreen';
import { TitleScreen } from './screens/TitleScreen';
import type { Dancer } from './domain/roster';
import {
  createSession,
  sessionReducer,
  type SessionAction,
  type SessionState,
  type SpinOrder,
} from './domain/session';
import { WCS_STARTER_DECK, promptsInPlay } from './domain/prompts';
import {
  loadExcludedPrompts,
  loadRoster,
  saveExcludedPrompts,
  saveRoster,
} from './storage';
import './styles/app.css';

type Screen = 'title' | 'roster' | 'session' | 'bank';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [dancers, setDancers] = useState<Dancer[]>(() => loadRoster());
  const [session, setSession] = useState<SessionState | null>(null);
  const [excludedPrompts, setExcludedPrompts] = useState<string[]>(() => loadExcludedPrompts());

  // Persist on every change rather than on a timer. The data is tiny and the
  // event is slow, so there is no reason to risk losing an edit.
  useEffect(() => {
    saveRoster(dancers);
  }, [dancers]);

  useEffect(() => {
    saveExcludedPrompts(excludedPrompts);
  }, [excludedPrompts]);

  /** What a session would draw from right now, after set-asides. */
  const deckInPlay = promptsInPlay(WCS_STARTER_DECK.prompts, excludedPrompts);

  const dispatch = (action: SessionAction) =>
    setSession((current) => (current ? sessionReducer(current, action) : current));

  function startSession(order: SpinOrder, promptsEnabled: boolean) {
    setSession(createSession(dancers, order, promptsEnabled, deckInPlay));
    setScreen('session');
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

  if (screen === 'session' && session) {
    return (
      <SessionScreen
        session={session}
        dispatch={dispatch}
        dancers={dancers}
        onEditDancers={editDancers}
        onLeave={() => {
          setSession(null);
          setScreen('roster');
        }}
        onStartFresh={() =>
          setSession(
            createSession(dancers, session.spinOrder, session.promptsEnabled, deckInPlay),
          )
        }
      />
    );
  }

  if (screen === 'bank') {
    return (
      <PromptBankScreen
        excludedIds={excludedPrompts}
        onChange={setExcludedPrompts}
        onBack={() => setScreen('title')}
      />
    );
  }

  if (screen === 'roster') {
    return (
      <RosterScreen
        dancers={dancers}
        onChange={setDancers}
        onBack={() => setScreen('title')}
        onStartSession={startSession}
        promptsInPlay={deckInPlay.length}
      />
    );
  }

  return (
    <TitleScreen
      rosterCount={dancers.length}
      promptsInPlay={deckInPlay.length}
      promptsTotal={WCS_STARTER_DECK.prompts.length}
      onStartSession={() => setScreen('roster')}
      onOpenBank={() => setScreen('bank')}
    />
  );
}
