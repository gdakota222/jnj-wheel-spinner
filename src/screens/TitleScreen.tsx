import { useRegisterSW } from 'virtual:pwa-register/react';
import { WheelMark } from '../components/WheelMark';

const VERSION = __APP_VERSION__;

type Props = {
  onStartSession: () => void;
  onOpenBank: () => void;
  onOpenHow: () => void;
  onOpenAbout: () => void;
  rosterCount: number;
  promptsInPlay: number;
  promptsTotal: number;
};

/**
 * The front door, on one screen.
 *
 * It used to scroll by about two hundred pixels on a phone — three greyed-out
 * "arrives later" buttons below the fold — and the owner asked for no scrolling
 * anywhere it is not needed. Starting a session stays the one big button; the
 * three places you visit now and then share a row; and what is coming later is
 * said in one line rather than as three dead buttons. The wheel mark takes
 * whatever height is left, so it is generous on a tablet and simply smaller on
 * a small phone, instead of pushing everything else down.
 */
export function TitleScreen({
  onStartSession,
  onOpenBank,
  onOpenHow,
  onOpenAbout,
  rosterCount,
  promptsInPlay,
  promptsTotal,
}: Props) {
  const { offlineReady } = useRegisterSW();
  const [isOfflineReady] = offlineReady;

  return (
    <div className="shell shell--title">
      <header className="shell__head">
        {/* The app title's permanent home — also where the seven taps that
            unlock sloth mode will land in v1.5. */}
        <h1 className="title">
          JnJ <span className="title__accent">Wheel Spinner</span>
        </h1>
        <p className="subtitle">Pair dancers. Draw prompts. Watch the room react.</p>
      </header>

      <div className="mark mark--fill">
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

        <div className="tiles">
          <button className="tile" type="button" onClick={onOpenBank}>
            <span className="tile__label">Prompt Bank</span>
            <span className="tile__note">
              {promptsInPlay === promptsTotal
                ? `${promptsTotal} ready`
                : `${promptsInPlay} of ${promptsTotal}`}
            </span>
          </button>
          <button className="tile" type="button" onClick={onOpenHow}>
            <span className="tile__label">How it works</span>
            <span className="tile__note">Every feature</span>
          </button>
          <button className="tile" type="button" onClick={onOpenAbout}>
            <span className="tile__label">About</span>
            <span className="tile__note">Who made it</span>
          </button>
        </div>
      </nav>

      {/* What is not here yet, said plainly — principle 1 — in one line rather
          than three buttons that cannot be pressed. */}
      <p className="coming">
        Coming: Saved Rosters and Options in v1.1 · Share Bundles in v1.4
      </p>

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
