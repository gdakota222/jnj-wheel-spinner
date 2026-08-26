import { useEffect, useState } from 'react';
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
import { loadRoster, saveRoster } from './storage';
import './styles/app.css';

type Screen = 'title' | 'roster' | 'session';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [dancers, setDancers] = useState<Dancer[]>(() => loadRoster());
  const [session, setSession] = useState<SessionState | null>(null);

  // Persist on every change rather than on a timer. The data is tiny and the
  // event is slow, so there is no reason to risk losing an edit.
  useEffect(() => {
    saveRoster(dancers);
  }, [dancers]);

  const dispatch = (action: SessionAction) =>
    setSession((current) => (current ? sessionReducer(current, action) : current));

  function startSession(order: SpinOrder, promptsEnabled: boolean) {
    setSession(createSession(dancers, order, promptsEnabled));
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
          setSession(createSession(dancers, session.spinOrder, session.promptsEnabled))
        }
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
      />
    );
  }

  return <TitleScreen rosterCount={dancers.length} onStartSession={() => setScreen('roster')} />;
}
