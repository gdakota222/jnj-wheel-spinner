import { useRegisterSW } from 'virtual:pwa-register/react';
import { WheelMark } from './components/WheelMark';
import './styles/app.css';

const VERSION = __APP_VERSION__;

/** Title screen destinations, per PRD § v1.0. Only one is live in v1.0, and
 *  none are live yet in this scaffold — so each says plainly when it arrives.
 *  A screen that explains its own state is principle #1, applied early. */
const DESTINATIONS = [
  { label: 'Start a Session', arrives: '0.2.0' },
  { label: 'Create Decks', arrives: 'v1.1' },
  { label: 'Saved Rosters', arrives: 'v1.1' },
  { label: 'Options', arrives: 'v1.1' },
] as const;

export default function App() {
  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();
  const [isOfflineReady] = offlineReady;
  const [needsRefresh] = needRefresh;

  return (
    <div className="shell">
      <header className="shell__head">
        {/* The app title gets a stable home here — it is also where the seven
            taps that unlock sloth mode will land in v1.5. */}
        <h1 className="title">
          JnJ <span className="title__accent">Wheel Spinner</span>
        </h1>
        <p className="subtitle">Pair dancers. Draw prompts. Watch the room react.</p>
      </header>

      <div className="mark">
        <WheelMark size={220} />
      </div>

      <section className="card" aria-labelledby="build-state">
        <h2 className="card__title" id="build-state">
          Scaffold build
        </h2>
        <p className="card__body">
          This is version <strong>{VERSION}</strong> — the delivery pipeline only. It proves the
          app builds, installs to a home screen and runs with the wifi off. No features are
          wired up yet.
        </p>
        <p className="status" data-ready={isOfflineReady}>
          <span className="status__dot" aria-hidden="true" />
          {isOfflineReady ? 'Ready to run offline' : 'Caching for offline use…'}
        </p>
      </section>

      <nav className="menu" aria-label="Main menu">
        {DESTINATIONS.map(({ label, arrives }) => (
          <button key={label} className="menu__item" type="button" disabled>
            <span className="menu__label">{label}</span>
            <span className="menu__note">Arrives in {arrives}</span>
          </button>
        ))}
      </nav>

      {needsRefresh && (
        <div className="update" role="status">
          <p className="update__text">A newer version is ready.</p>
          <button
            className="update__button"
            type="button"
            onClick={() => updateServiceWorker(true)}
          >
            Reload now
          </button>
        </div>
      )}

      <footer className="shell__foot">
        <p>Works offline · No account needed</p>
      </footer>
    </div>
  );
}
