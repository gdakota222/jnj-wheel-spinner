import { useRegisterSW } from 'virtual:pwa-register/react';
import { WheelMark } from '../components/WheelMark';

const VERSION = __APP_VERSION__;

type Props = {
  onStartSession: () => void;
  onOpenBank: () => void;
  rosterCount: number;
  promptsInPlay: number;
  promptsTotal: number;
};

/** Destinations that do not exist yet say when they arrive, rather than being
 *  greyed out with no explanation. Principle 1: the screen explains itself. */
const UPCOMING = [
  { label: 'Saved Rosters', arrives: 'v1.1' },
  { label: 'Share Bundles', arrives: 'v1.4' },
  { label: 'Options', arrives: 'v1.1' },
] as const;

export function TitleScreen({
  onStartSession,
  onOpenBank,
  rosterCount,
  promptsInPlay,
  promptsTotal,
}: Props) {
  const { offlineReady } = useRegisterSW();
  const [isOfflineReady] = offlineReady;

  return (
    <div className="shell">
      <header className="shell__head">
        {/* The app title's permanent home — also where the seven taps that
            unlock sloth mode will land in v1.5. */}
        <h1 className="title">
          JnJ <span className="title__accent">Wheel Spinner</span>
        </h1>
        <p className="subtitle">Pair dancers. Draw prompts. Watch the room react.</p>
      </header>

      <div className="mark">
        <WheelMark size={200} />
      </div>

      <nav className="menu" aria-label="Main menu">
        <button className="menu__item menu__item--primary" type="button" onClick={onStartSession}>
          <span className="menu__label">Start a Session</span>
          <span className="menu__note">
            {rosterCount === 0
              ? 'Build your roster first'
              : `${rosterCount} ${rosterCount === 1 ? 'dancer' : 'dancers'} on the roster`}
          </span>
        </button>

        <button className="menu__item" type="button" onClick={onOpenBank}>
          <span className="menu__label">Prompt Bank</span>
          <span className="menu__note">
            {promptsInPlay === promptsTotal
              ? `${promptsTotal} challenges ready`
              : `${promptsInPlay} of ${promptsTotal} challenges in play`}
          </span>
        </button>

        {UPCOMING.map(({ label, arrives }) => (
          <button key={label} className="menu__item" type="button" disabled>
            <span className="menu__label">{label}</span>
            <span className="menu__note">Arrives in {arrives}</span>
          </button>
        ))}
      </nav>

      <footer className="shell__foot">
        {/* The service worker only runs in a real build, so in dev this status
            would sit on "caching…" forever — a screen claiming something untrue.
            Show it only where it can actually resolve. */}
        {import.meta.env.PROD && (
          <p className="status" data-ready={isOfflineReady}>
            <span className="status__dot" aria-hidden="true" />
            {isOfflineReady ? 'Ready to run offline' : 'Caching for offline use…'}
          </p>
        )}
        <p>Version {VERSION} · No account needed</p>
      </footer>
    </div>
  );
}
