import { useState } from 'react';
import { resetTips } from '../storage';

type Props = {
  onBack: () => void;
};

type Item = {
  name: string;
  what: string;
};

/**
 * Every feature, in one line each, grouped the way a night runs.
 *
 * Asked for after the handoff rehearsal: a newcomer liked the app but wished it
 * said more about how it worked, and never found the double-tap that skips a
 * spin because nothing told them it was there. This is the page they can always
 * come back to. Terse on purpose — the About page was called wordy by the same
 * kind of reader, and a reference page is scanned, not read.
 *
 * **Deliberately absent: the easter eggs.** Sloth mode is not listed here and
 * must never be, nor any easter egg added later. The birthday jam *is* listed —
 * it is a feature an operator needs to know exists in order to use at all, and
 * the owner chose to show it.
 */
const TABS: { id: string; label: string; items: Item[] }[] = [
  {
    id: 'setup',
    label: 'Setting up',
    items: [
      {
        name: 'Roles',
        what: 'Leader, Follower or Switch. Switches are shared out to keep both sides even.',
      },
      { name: 'Rename', what: 'Fix a typo with Rename beside any name.' },
      {
        name: 'Birthday dancer 🎉',
        what: 'Press and hold a name. When they are drawn, everything stops for a birthday jam.',
      },
      {
        name: 'Wheel or Quick list',
        what: 'Chosen each time you start. Same roster either way — see Practice.',
      },
      {
        name: 'Who goes first',
        what: 'Leaders, followers, or let the app decide. Locked in for the night.',
      },
      {
        name: 'Challenges',
        what: 'Draw one for each couple, or switch them off. The Prompt Bank chooses which bundle.',
      },
    ],
  },
  {
    id: 'running',
    label: 'Running',
    items: [
      { name: 'Spin', what: 'Tap the wheel, or the button under it.' },
      {
        name: 'Hurry it up',
        what: 'Tap a spinning wheel to speed it to the answer. Double-tap to skip straight there.',
      },
      {
        name: 'Next couple',
        what: 'Press and hold — a pocket cannot do it by accident.',
      },
      {
        name: 'Undo',
        what: 'Steps back one action at a time, and tells you what first. The back gesture opens it too.',
      },
      {
        name: 'Tools',
        what: 'Re-spin a dancer, redraw a challenge, add a late arrival, see who has danced.',
      },
      { name: 'Lock', what: 'Freezes the screen before it goes in a pocket. Hold to unlock.' },
      {
        name: 'No repeat couples',
        what: 'If one side is short, those dancers go round again — always with someone new.',
      },
    ],
  },
  {
    id: 'practice',
    label: 'Practice',
    items: [
      {
        name: 'Quick list',
        what: 'Every pairing at once, numbered. No wheel — for practice nights.',
      },
      {
        name: 'Ticking off',
        what: 'Tap a couple once they’ve danced. Danced couples are locked in place.',
      },
      {
        name: 'Send up as many as you like',
        what: 'One couple at a time or the whole floor — the list just keeps the order.',
      },
      {
        name: 'Reshuffle',
        what: 'New pairings for everyone still to dance. Nobody who has danced moves.',
      },
      {
        name: 'Late arrival',
        what: 'Takes someone’s second dance on their side if there is one, or joins at the end.',
      },
      {
        name: 'Change',
        what: 'Pair anyone with anyone by hand. It warns if someone would drop off the list.',
      },
      {
        name: 'Someone left',
        what: 'Takes them off tonight’s list and rearranges who is still to dance. The roster keeps them.',
      },
      {
        name: 'No size limit',
        what: 'The 10-couple cap is for wheel nights. A practice list can be as long as you need.',
      },
      {
        name: 'Match by division',
        what: 'Optional, on the How it runs step. Newcomer to Champions, one division for leading and one for following.',
      },
      {
        name: 'Divisions on the wheel',
        what: 'The first spin draws from everyone; the second shows only partners in the same division, and says which.',
      },
      {
        name: 'Strict or Merge',
        what: 'Strict keeps every division to itself. Merge lets a division with nobody on one side dance one division down.',
      },
      {
        name: 'No division set',
        what: 'Matched as Novice — the start screen says who.',
      },
      {
        name: 'Division order',
        what: 'Lowest first unless you choose highest first or mixed.',
      },
    ],
  },
  {
    id: 'end',
    label: 'The end',
    items: [
      {
        name: 'Crown a Winner',
        what: 'Pick the couple, bring down the curtain, hold to reveal.',
      },
      {
        name: 'AllSkate',
        what: 'One last challenge for everybody. Spin for it or pick it — the reveal looks the same.',
      },
      {
        name: 'The record',
        what: 'Everyone who danced, with the winners and the AllSkate marked.',
      },
      { name: 'Both optional', what: 'A night can end on either, on both, or on neither.' },
    ],
  },
  {
    id: 'app',
    label: 'The app',
    items: [
      { name: 'Works offline', what: 'No signal needed once it is installed.' },
      { name: 'Stays awake', what: 'The screen will not sleep during a session or a practice.' },
      { name: 'Stays on this device', what: 'No account, no server. Nothing about your night leaves.' },
      {
        name: 'The back gesture',
        what: 'In a session it steps back through the app. Elsewhere it warns once before closing.',
      },
    ],
  },
];

export function HowItWorksScreen({ onBack }: Props) {
  const [tab, setTab] = useState(TABS[0].id);
  const [tipsReset, setTipsReset] = useState(false);
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="shell shell--setup">
      <header className="setup-head">
        <button className="back" type="button" onClick={onBack}>
          ← Title screen
        </button>
        <h1 className="screen-title">How it works</h1>
      </header>

      <div className="steps" role="tablist" aria-label="Topics">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`how-tab-${t.id}`}
            aria-selected={t.id === tab}
            aria-controls="how-panel"
            className="steps__tab steps__tab--plain"
            onClick={() => setTab(t.id)}
          >
            <span className="steps__label">{t.label}</span>
          </button>
        ))}
      </div>

      <section
        id="how-panel"
        role="tabpanel"
        aria-labelledby={`how-tab-${current.id}`}
        className="panel panel__scroll"
      >
        <dl className="how">
          {current.items.map((item) => (
            <div key={item.name} className="how__item">
              <dt className="how__name">{item.name}</dt>
              <dd className="how__what">{item.what}</dd>
            </div>
          ))}
        </dl>

        {current.id === 'app' && (
          <div className="how__tips">
            <button
              className="edit-dancers"
              type="button"
              onClick={() => {
                resetTips();
                setTipsReset(true);
              }}
              disabled={tipsReset}
            >
              {tipsReset ? 'Tips will show again' : 'Show the tips again'}
            </button>
            {/* Tips are remembered per device, and the device is the thing that
                gets handed over. */}
            <p className="how__note">
              Handing this device to someone new? Tips show once per device, so bring them back
              first.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
