import { WheelMark } from '../components/WheelMark';
import { supportLinks } from '../support';

const VERSION = __APP_VERSION__;

type Props = {
  /**
   * True the very first time the app is opened after being installed.
   *
   * The page is the same either way — the promise made on first launch has to be
   * the promise still on the screen a month later, or the About button is a
   * different, thinner thing than the welcome was. Only the way out changes.
   */
  firstRun: boolean;
  onDone: () => void;
};

export function AboutScreen({ firstRun, onDone }: Props) {
  const links = supportLinks();

  return (
    <div className="shell">
      <header className="screen-head">
        {!firstRun && (
          <button className="back" type="button" onClick={onDone}>
            ← Title screen
          </button>
        )}
        <h1 className="screen-title">{firstRun ? 'Welcome' : 'About'}</h1>
        <p className="subtitle">
          {firstRun
            ? 'One screen about where this came from, then straight to it.'
            : 'Who made this, and what it does with your data.'}
        </p>
      </header>

      <div className="mark mark--small">
        <WheelMark size={120} />
      </div>

      <section className="card">
        <h2 className="card__title">Made by Dakota Gibbs</h2>
        <p className="card__body">
          I run West Coast Swing socials, and for years the Jack &amp; Jill draw meant names on
          scraps of paper in a hat — slow, easy to fumble, and nothing for the room to watch. This
          app is that hat, rebuilt so the draw is the fun part.
        </p>
      </section>

      <section className="card">
        <h2 className="card__title">Free, and it stays on your device</h2>
        <p className="card__body">
          No account, no sign-in, no ads. Your roster and your challenges are saved{' '}
          <strong>on this device only</strong> — there is no server to send them to, and nothing
          about your event ever leaves it. The app works with the wifi off, which is the point: it
          has to work in a venue where the wifi does not.
        </p>
      </section>

      <section className="card">
        <h2 className="card__title">If you want to chip in</h2>
        {links.length === 0 ? (
          <p className="card__body">
            Nothing to take yet — there is no donation set up. The app is free and will stay free
            either way. If it is earning its place at your events, that is genuinely the useful
            part.
          </p>
        ) : (
          <>
            <p className="card__body">
              The app is free and stays free. If it has earned a coffee, this is where that goes.
            </p>
            <div className="support">
              {links.map((link) => (
                <a
                  key={link.url}
                  className="support__link"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="menu__label">{link.label}</span>
                  {/* Where a tap leads, said before it is taken — the app opens
                      nothing outside itself without saying so first. */}
                  <span className="menu__note">{link.note}</span>
                </a>
              ))}
            </div>
            <p className="card__body card__body--quiet">
              These open outside the app, so they need a connection.
            </p>
          </>
        )}
      </section>

      <div className="next">
        <button className="next__button" type="button" onClick={onDone}>
          <span className="menu__label">{firstRun ? 'Start using it' : 'Back to title'}</span>
          <span className="menu__note">
            {firstRun
              ? 'This page stays on the title screen under About'
              : `Version ${VERSION}`}
          </span>
        </button>
      </div>
    </div>
  );
}
