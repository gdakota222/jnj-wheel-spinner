import { useEffect, useState } from 'react';
import { RosterScreen } from './screens/RosterScreen';
import { TitleScreen } from './screens/TitleScreen';
import { WheelScreen } from './screens/WheelScreen';
import type { Dancer } from './domain/roster';
import { loadRoster, saveRoster } from './storage';
import './styles/app.css';

type Screen = 'title' | 'roster' | 'wheel';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [dancers, setDancers] = useState<Dancer[]>(() => loadRoster());

  // Persist on every change rather than on a timer. The data is tiny and the
  // event is slow, so there is no reason to risk losing an edit.
  useEffect(() => {
    saveRoster(dancers);
  }, [dancers]);

  if (screen === 'wheel') {
    return <WheelScreen dancers={dancers} onBack={() => setScreen('roster')} />;
  }

  if (screen === 'roster') {
    return (
      <RosterScreen
        dancers={dancers}
        onChange={setDancers}
        onBack={() => setScreen('title')}
        onStartSpinning={() => setScreen('wheel')}
      />
    );
  }

  return <TitleScreen rosterCount={dancers.length} onStartSession={() => setScreen('roster')} />;
}
