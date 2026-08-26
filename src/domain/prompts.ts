/**
 * Prompts: a named challenge plus a short description of how it works.
 *
 * The name is the headline — punchy enough to read off a spinning wheel segment
 * and shout across a room. The description is what the couple actually does, and
 * has to be graspable at a glance from the floor, because that is who reads it.
 */

export type Prompt = {
  id: string;
  name: string;
  description: string;
};

export type Deck = {
  id: string;
  name: string;
  /** Which dance style the deck is written for. */
  style: string;
  prompts: Prompt[];
};

/**
 * The built-in West Coast Swing deck.
 *
 * Read-only in v1.0 — editing arrives in v1.1. Since the owner is also the
 * developer, changing these before an event means editing this file.
 *
 * Written to be doable at a social by dancers of mixed levels: every prompt is a
 * constraint on *how* to dance rather than a demand for a specific move, so
 * nobody is stuck because they have not learned a pattern yet.
 */
export const WCS_STARTER_DECK: Deck = {
  id: 'westie-starter-pack',
  name: 'Westie Starter Pack',
  style: 'West Coast Swing',
  prompts: [
    {
      id: 'levels',
      name: 'A Whole New Level',
      description:
        'Add as many level changes to your dance as you can. The more drastic the level change, the better.',
    },
    {
      id: 'anchors',
      name: 'Anchor Detective',
      description:
        'Every anchor has to look different from the last one. Repeat an anchor and you owe the room a bow.',
    },
    {
      id: 'slow-motion',
      name: 'Slow Motion',
      description:
        'Stretch everything. Take twice as long as feels natural to get anywhere, and arrive together anyway.',
    },
    {
      id: 'breaks',
      name: 'Hit the Breaks',
      description:
        'Find every break in the music and hit it together. Silence is a move — use it.',
    },
    {
      id: 'whips',
      name: 'Whip It Good',
      description:
        'Build the whole dance around whips. Every pattern must arrive at one or leave from one.',
    },
    {
      id: 'hands-off',
      name: 'Hands Off',
      description:
        'Break the connection at least three times and find your way back without reaching for each other.',
    },
    {
      id: 'copycat',
      name: 'Swap the Reins',
      description:
        'Trade who is leading at least twice, and make the handover invisible to anyone watching.',
    },
    {
      id: 'curves',
      name: 'The Long Way Round',
      description:
        'No pattern may travel in a straight line down the slot. Curve absolutely everything.',
    },
    {
      id: 'faces',
      name: 'Say It With Your Face',
      description:
        'Every phrase gets an expression the back row can read. Dance it with your eyebrows.',
    },
    {
      id: 'footwork',
      name: 'Footwork Flurry',
      description:
        'Trade the simplest footwork you know for the busiest you can survive. Syncopate everything.',
    },
    {
      id: 'one-handed',
      name: 'One Handed',
      description:
        'Pick a hand at the start of the song. That is the only hand you connect with for the whole dance.',
    },
    {
      id: 'freeze',
      name: 'Stop and Stare',
      description:
        'Freeze completely at the top of every phrase, and hold it one beat longer than is comfortable.',
    },
    {
      id: 'lyrics',
      name: 'Play the Lyrics',
      description:
        'Dance the words, not the beat. If the singer says it, show it — the sillier the better.',
    },
    {
      id: 'rolling-count',
      name: 'Rolling Count Riot',
      description:
        'Live in the and-counts. Try never to land squarely on a number for the whole song.',
    },
    {
      id: 'small-slot',
      name: 'Small World',
      description:
        'The whole dance happens in a slot half its normal length. Nobody may step outside it.',
    },
    {
      id: 'late',
      name: 'Take the Scenic Route',
      description:
        'Delay every arrival. Get everywhere late, on purpose, and get there at the same moment.',
    },
    {
      id: 'shine',
      name: 'Shine Time',
      description:
        'Each of you takes at least one solo moment while the other stops and openly reacts to it.',
    },
    {
      id: 'heavy-light',
      name: 'Heavy and Light',
      description:
        'Alternate every eight counts between grounded, weighted movement and light, floating movement.',
    },
    {
      id: 'mirror',
      name: 'Mirror Match',
      description:
        'Whatever one of you does, the other answers with the same shape before the phrase ends.',
    },
    {
      id: 'silent-movie',
      name: 'Silent Movie',
      description:
        'Tell the entire story with your body. No smiling with your mouth — everything else is fair game.',
    },
  ],
};

export const BUILT_IN_DECKS: Deck[] = [WCS_STARTER_DECK];

/** Every prompt the app knows about, across all bundles. */
export function allPrompts(decks: readonly Deck[] = BUILT_IN_DECKS): Prompt[] {
  const seen = new Map<string, Prompt>();
  for (const deck of decks) {
    for (const prompt of deck.prompts) {
      if (!seen.has(prompt.id)) seen.set(prompt.id, prompt);
    }
  }
  return [...seen.values()];
}

/**
 * The prompts a session will actually draw from: everything in the chosen
 * bundle, minus anything the operator has set aside in the Prompt Bank.
 */
export function promptsInPlay(
  prompts: readonly Prompt[],
  excludedIds: readonly string[],
): Prompt[] {
  const excluded = new Set(excludedIds);
  return prompts.filter((prompt) => !excluded.has(prompt.id));
}
