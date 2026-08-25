import { useEffect, useState } from 'react';
import { RosterScreen } from './screens/RosterScreen';
import { TitleScreen } from './screens/TitleScreen';
import type { Dancer } from './domain/roster';
import { loadRoster, saveRoster } from './storage';
import './styles/app.css';

type Screen = 'title' | 'roster';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [dancers, setDancers] = useState<Dancer[]>(() => loadRoster());

  // Persist on every change rather than on a timer. The data is tiny and the
  // event is slow, so there is no reason to risk losing an edit.
  useEffect(() => {
    saveRoster(dancers);
  }, [dancers]);

  if (screen === 'roster') {
    return (
      <RosterScreen
        dancers={dancers}
        onChange={setDancers}
        onBack={() => setScreen('title')}
      />
    );
  }

  return <TitleScreen rosterCount={dancers.length} onStartSession={() => setScreen('roster')} />;
}
