// Writes the organizer share guide: a Word version for Google Drive and a
// plain-text version for a text message, from the one source below.
//
//   npm run share
//
// Both files land in docs/share/ and are stamped with the app version, so a copy
// floating around on Drive says which app it describes. Re-run this whenever
// setup, the night's flow or the end of the night changes — the How it works
// screen (src/screens/HowItWorksScreen.tsx) is the reference for wording.
import fs from 'node:fs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, LevelFormat, AlignmentType } from 'docx';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const URL_APP = 'https://gdakota222.github.io/jnj-wheel-spinner/';
const out = new URL('../docs/share/', import.meta.url);
fs.mkdirSync(out, { recursive: true });

const content = [
  ['h1', 'JnJ Wheel Spinner'],
  ['p', 'A spinning wheel for Jack & Jill partner draws. Spin for a leader, spin for a follower, then spin a challenge for the couple to dance. For practice nights there is also a Quick list: every pairing at once, no wheel. No accounts, no ads, and it works with no internet once it is installed.'],
  ['p', 'The app lives at: ' + URL_APP],
  ['small', `Written for version ${pkg.version}. The version is shown on the title screen.`],

  ['h2', 'Part 1: Get it on your device'],
  ['p', 'Do this once, at home, on wifi. After that it works without a signal.'],
  ['h3', 'Android (Chrome)'],
  ['n', 'Open Chrome and go to ' + URL_APP],
  ['n', 'Tap the three dots in the top-right corner.'],
  ['n', 'Tap "Install app" (some phones say "Add to Home screen").'],
  ['n', 'Tap Install to confirm. The app icon appears on your home screen.'],
  ['n', 'Open it from the icon, not from Chrome, and let it load fully while you are still online.'],
  ['h3', 'iPhone or iPad (Safari)'],
  ['n', 'Open Safari (it needs to be Safari for this) and go to ' + URL_APP],
  ['n', 'Tap the Share button, the square with an arrow pointing up. On iPhone it is at the bottom of the screen; on iPad it is at the top.'],
  ['n', 'Scroll down and tap "Add to Home Screen". If you cannot see it, scroll further or tap "More".'],
  ['n', 'Tap Add. The app icon appears on your home screen.'],
  ['n', 'Open it from the icon and let it load fully while you are still online.'],
  ['h3', 'Good to know'],
  ['b', 'Open the app once online before the event, so it is saved on the device.'],
  ['b', 'Everything you enter (your dancers, your night) stays on that one device. Nothing is sent anywhere, and it will not appear on your other devices.'],
  ['b', 'Updates arrive by themselves when you open the app with a connection, sometimes on the second launch. Nothing changes mid-event if you are offline.'],

  ['h2', 'Part 2: Set up a night'],
  ['p', 'Tap Start a Session. Setting up has three steps, and you can tap between them at any time.'],
  ['n', 'How it runs. Choose the Wheel (the show, one couple at a time with the room watching) or the Quick list (practice nights). Turn on Match by division if you want couples kept within a level. On the wheel, choose who is drawn first (leaders, followers, or let the app decide) and whether each couple gets a challenge.'],
  ['n', 'Dancers. Add everyone and mark each as Leader, Follower or Switch. Switches are shared out to keep both sides even. Names need a last name or initial ("Sarah M"). Use Rename beside a name to fix a typo. With divisions on, pick each dancer\'s division here.'],
  ['n', 'Start. Check the summary, then begin. On the wheel, roughly 3 to 10 couples works best and 5 is the sweet spot. A Quick list has no size limit.'],

  ['h2', 'Part 3: Run it on the wheel'],
  ['b', 'Tap the wheel to spin. Tap a spinning wheel to hurry it up; double-tap to skip straight to the answer.'],
  ['b', "Spin once for the first dancer, once for the second, and (if challenges are on) once for the couple's challenge."],
  ['b', 'While the couple dances, the screen holds on their names and challenge. Press and hold "Next couple" when they are done. It is a hold on purpose, so a pocket cannot trigger it.'],
  ['b', 'Undo steps back one action at a time and tells you what it will undo first. The back gesture opens it too.'],
  ['b', 'Tools lets you re-spin a dancer, redraw a challenge, add a late arrival, or see who has danced.'],
  ['b', 'Lock freezes the screen before it goes in a pocket. Hold to unlock.'],
  ['b', 'Nobody sits out and no couple repeats: if one side runs short, those dancers go round again with someone new.'],
  ['b', 'Handing the device to someone else is fine. It always carries on exactly where it was left, even after a dead battery.'],
  ['h3', 'Ending the night'],
  ['p', 'When everyone has danced, you can Crown a Winner (pick the couple, bring down the curtain, hold to reveal), run an AllSkate (one last challenge for the whole floor), do both, or neither. The finished night shows everyone who danced.'],

  ['h2', 'Part 4: Run a practice on the Quick list'],
  ['b', 'Every pairing appears at once, numbered. Send up one couple at a time or the whole floor; the list just keeps the order.'],
  ['b', 'Tap a couple once they have danced. Danced couples are locked in place.'],
  ['b', 'Reshuffle gives new pairings to everyone still to dance. Nobody who has danced moves.'],
  ['b', 'Late arrival adds someone. Someone left takes a dancer off tonight\'s list (your saved dancers keep them). Change pairs anyone with anyone by hand.'],
  ['b', 'Nobody dances twice in a row when someone else could go.'],
  ['h3', 'Divisions (optional)'],
  ['b', 'Newcomer to Champions, one division for leading and one for following. Anyone left unset is matched as Novice, and the start screen says who.'],
  ['b', 'Strict keeps every division to itself. Merge lets a division with nobody on one side dance one division down.'],
  ['b', 'Divisions work on the wheel too: the first spin draws from everyone, the second shows only partners in the same division.'],

  ['h2', 'More help, and a trick'],
  ['b', 'On the title screen, "How it works" lists every feature in one line each. "Prompt Bank" lets you see, set aside, or switch between sets of challenges.'],
  ['b', 'The app shows short one-time hints. To see them again before handing it to someone new, go to How it works, then The app, then "Show the tips again".'],
  ['b', "Press and hold a dancer's name while setting up to mark a birthday. When they are drawn, the night stops for a birthday jam."],
  ['h2', 'If something goes wrong'],
  ['b', 'App will not open, or looks old: connect to wifi, close the app fully, and open it again (possibly twice).'],
  ['b', 'Not working offline: it was probably not opened once online after installing. Connect and open it again.'],
  ['b', 'iPhone: if there is no "Add to Home Screen", you are probably not in Safari.'],
  ['p', 'Questions or ideas? Tell Dakota. Feedback shapes what gets built next.'],
];

const numCfg = (ref, bullet) => ({
  reference: ref,
  levels: [{ level: 0, format: bullet ? LevelFormat.BULLET : LevelFormat.DECIMAL, text: bullet ? '•' : '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
});
let nCount = 0, prev = null;
const children = [];
const configs = [numCfg('b', true)];
for (const [t, x] of content) {
  if (t === 'n') {
    if (prev !== 'n') { nCount++; configs.push(numCfg('n' + nCount, false)); }
    children.push(new Paragraph({ numbering: { reference: 'n' + nCount, level: 0 }, spacing: { after: 80 }, children: [new TextRun(x)] }));
  } else if (t === 'b') children.push(new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 80 }, children: [new TextRun(x)] }));
  else if (t === 'h1') children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(x)] }));
  else if (t === 'h2') children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 120 }, children: [new TextRun(x)] }));
  else if (t === 'h3') children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun(x)] }));
  else if (t === 'small') children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: x, italics: true, size: 20, color: '666666' })] }));
  else children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun(x)] }));
  prev = t;
}
const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Calibri', size: 24 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', run: { size: 48, bold: true, color: '6A1B9A' } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 34, bold: true, color: '6A1B9A' }, paragraph: { outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true }, paragraph: { outlineLevel: 1 } },
    ],
  },
  numbering: { config: configs },
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, bottom: 1200, left: 1300, right: 1300 } } }, children }],
});
fs.writeFileSync(new URL('organizer-guide.docx', out), await Packer.toBuffer(doc));

const T = [
  'Hi! Here is how to get the JnJ Wheel Spinner and use it. It is a spinning wheel for Jack & Jill partner draws: spin for a leader, a follower, and a challenge for the couple. There is also a Quick list for practice nights. No accounts, no ads, works offline once installed.',
  '',
  'THE APP: ' + URL_APP,
  '',
  'GET IT (do this once, on wifi)',
  '',
  'ANDROID (Chrome)',
  '1. Open Chrome and go to the link above.',
  '2. Tap the three dots at the top right.',
  '3. Tap "Install app" (or "Add to Home screen"), then Install.',
  '4. Open it from the new icon and let it load while you are online.',
  '',
  'IPHONE / IPAD (must be Safari)',
  '1. Open the link in Safari.',
  '2. Tap the Share button (square with an up arrow).',
  '3. Scroll down, tap "Add to Home Screen", then Add.',
  '4. Open it from the new icon and let it load while you are online.',
  '',
  'After that it works with no signal. Your dancers and night are saved on that one device only.',
  '',
  'SET UP A NIGHT',
  '1. Start a Session.',
  '2. How it runs: pick the Wheel (the show) or the Quick list (every pairing at once, for practice). Turn on Match by division if you want couples kept within a level. On the wheel, pick who is drawn first and whether couples get a challenge.',
  '3. Dancers: add each one as Leader, Follower or Switch (names need a last initial, like "Sarah M").',
  '4. Start: check the summary and go. On the wheel, 5 couples is the sweet spot, 10 max. The Quick list has no limit.',
  '',
  'ON THE WHEEL',
  'Tap the wheel to spin. Tap again to hurry it, double-tap to skip. Spin for the first dancer, the second, then the challenge. While they dance, the screen holds. Press and HOLD "Next couple" when they are done. At the end: Crown a Winner and/or AllSkate, or neither.',
  '',
  'ON THE QUICK LIST',
  'Tap a couple once they have danced. Reshuffle, Late arrival, Someone left and Change fix the list as the night changes.',
  '',
  'Handy: Undo (asks first), Tools (re-spin, redraw a challenge, add a late arrival), Lock (hold to unlock). Nobody sits out and no couple repeats. You can hand the device to someone else and it carries on where it was.',
  '',
  'Stuck? "How it works" on the title screen explains every feature. If the app looks old or will not open, connect to wifi and open it twice. On iPhone, no "Add to Home Screen" usually means you are not in Safari.',
  '',
  `(Written for version ${pkg.version}, shown on the title screen.) Tell me what you think. Feedback shapes what gets built next!`,
];
fs.writeFileSync(new URL('organizer-text.txt', out), T.join('\n'));
console.log(`Share guide written for ${pkg.version}`);
