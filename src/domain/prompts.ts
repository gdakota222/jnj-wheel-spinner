/**
 * Prompts: a named challenge plus a short description of how it works.
 *
 * The name is the headline — punchy enough to read off a spinning wheel segment
 * and shout across a room. The description is what the couple actually does, and
 * has to be graspable at a glance from the floor, because that is who reads it.
 *
 * ## How these are written
 *
 * Rewritten after the first real event, where the originals played as too strict
 * and the operator softened one out loud mid-dance. Three rules came out of it:
 *
 * 1. **Invite, do not demand.** "As many as you can" and "as little as you can"
 *    beat "every" and "must". A prompt is a direction to explore, not a test to
 *    pass, and dancers of mixed levels all have to be able to take part.
 * 2. **Add a limit only where the prompt is exploitable.** If a lazy reading
 *    satisfies the prompt with no effort — standing still to dance "small",
 *    never connecting to dance "one-handed" — then and only then does it get a
 *    guard rail. Everything else is left open.
 * 3. **Short names.** They are read off a wheel segment, and at a full pool
 *    roughly twelve characters survive before the label truncates.
 *
 * See docs/prompts.md for every deck, current and archived.
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
  /** Shown in the Prompt Bank so two decks can be told apart. */
  note?: string;
  prompts: Prompt[];
};

/**
 * The current West Coast Swing deck.
 *
 * Ids match the originals so anything set aside in the Prompt Bank stays set
 * aside across the rewrite.
 */
export const WESTIE_STARTER_PACK: Deck = {
  id: 'westie-starter-pack',
  name: 'Westie Starter Pack',
  style: 'West Coast Swing',
  note: 'Rewritten after the first event — invitations rather than rules.',
  prompts: [
    {
      id: 'levels',
      name: 'Level Up',
      description: 'Work in as many level changes as you can. The more drastic, the better.',
    },
    {
      id: 'anchors',
      name: 'Anchor Hunt',
      description:
        'See how many different anchors you can find. Variety is the point — nobody is counting.',
    },
    {
      id: 'slow-motion',
      name: 'Slow Motion',
      description:
        'Stretch as much as you can and take your time getting anywhere. Keep moving — stopping is not slow, it is stopped.',
    },
    {
      id: 'breaks',
      name: 'Hit It',
      description: 'Catch as many breaks in the music as you can, together. Silence counts too.',
    },
    {
      id: 'whips',
      name: 'Whip It',
      description: 'Build as much of the dance around whips as you can manage.',
    },
    {
      id: 'hands-off',
      name: 'Hands Off',
      description:
        'See how often you can break the connection and find your way back without reaching. Coming back is the hard half.',
    },
    {
      id: 'copycat',
      name: 'Swap Roles',
      description:
        'Trade who is leading as often as you like, and make the handovers as smooth as you can.',
    },
    {
      id: 'curves',
      name: 'Curve It',
      description: 'Travel with as few straight lines as you can. Curve whatever will curve.',
    },
    {
      id: 'faces',
      name: 'Big Faces',
      description:
        'Give the back row as much expression as you can. Dance it with your eyebrows if you like.',
    },
    {
      id: 'footwork',
      name: 'Fancy Feet',
      description: 'Put in as much footwork as you can survive. Syncopate whatever you fancy.',
    },
    {
      id: 'one-handed',
      name: 'One Hand',
      description:
        'Pick a hand and see how long you can keep to it. Stay connected — dropping the connection is not one-handed, it is no-handed.',
    },
    {
      id: 'freeze',
      name: 'Freeze Frame',
      description:
        'Freeze at the top of as many phrases as you can, holding a beat longer than feels comfortable. Dance the rest of the phrase.',
    },
    {
      id: 'lyrics',
      name: 'Sing It',
      description:
        'Dance the words as much as the beat. If the singer says it, show it — sillier is better.',
    },
    {
      id: 'rolling-count',
      name: 'Roll It',
      description:
        'Live in the and-counts as much as you can, landing squarely on a number as little as you can.',
    },
    {
      id: 'small-slot',
      name: 'Small World',
      description:
        'Use as little of the floor as you can. Keep dancing though — standing still is small, but it is not a dance.',
    },
    {
      id: 'late',
      name: 'Arrive Late',
      description: 'Delay as many arrivals as you can. Get there late, on purpose, and together.',
    },
    {
      id: 'shine',
      name: 'Shine Time',
      description:
        'Take as many solo moments as you like, and react as much as you can when it is not your turn.',
    },
    {
      id: 'heavy-light',
      name: 'Push & Float',
      description:
        'Move between grounded and floating as much as you can. Let the room see the difference.',
    },
    {
      id: 'mirror',
      name: 'Mirror',
      description: "Echo each other's shapes as often as you can. Close enough is close enough.",
    },
    {
      id: 'silent-movie',
      name: 'Silent Movie',
      description:
        'Tell as much of the story as you can with your body alone. No words, no mouthing along.',
    },
  ],
};

/**
 * The original deck, kept for comparison.
 *
 * Written before the first real event and archived rather than deleted, so the
 * two can be run side by side and dancers asked which they prefer. Ids are
 * prefixed so both decks can appear together without one hiding the other.
 */
export const WESTIE_STARTER_PACK_V1: Deck = {
  id: 'westie-starter-pack-v1',
  name: 'Westie Pack (original)',
  style: 'West Coast Swing',
  note: 'The first wording, kept for comparison. Stricter — more rules, fewer invitations.',
  prompts: [
    {
      id: 'v1-levels',
      name: 'A Whole New Level',
      description:
        'Add as many level changes to your dance as you can. The more drastic the level change, the better.',
    },
    {
      id: 'v1-anchors',
      name: 'Anchor Detective',
      description:
        'Every anchor has to look different from the last one. Repeat an anchor and you owe the room a bow.',
    },
    {
      id: 'v1-slow-motion',
      name: 'Slow Motion',
      description:
        'Stretch everything. Take twice as long as feels natural to get anywhere, and arrive together anyway.',
    },
    {
      id: 'v1-breaks',
      name: 'Hit the Breaks',
      description: 'Find every break in the music and hit it together. Silence is a move — use it.',
    },
    {
      id: 'v1-whips',
      name: 'Whip It Good',
      description:
        'Build the whole dance around whips. Every pattern must arrive at one or leave from one.',
    },
    {
      id: 'v1-hands-off',
      name: 'Hands Off',
      description:
        'Break the connection at least three times and find your way back without reaching for each other.',
    },
    {
      id: 'v1-copycat',
      name: 'Swap the Reins',
      description:
        'Trade who is leading at least twice, and make the handover invisible to anyone watching.',
    },
    {
      id: 'v1-curves',
      name: 'The Long Way Round',
      description:
        'No pattern may travel in a straight line down the slot. Curve absolutely everything.',
    },
    {
      id: 'v1-faces',
      name: 'Say It With Your Face',
      description:
        'Every phrase gets an expression the back row can read. Dance it with your eyebrows.',
    },
    {
      id: 'v1-footwork',
      name: 'Footwork Flurry',
      description:
        'Trade the simplest footwork you know for the busiest you can survive. Syncopate everything.',
    },
    {
      id: 'v1-one-handed',
      name: 'One Handed',
      description:
        'Pick a hand at the start of the song. That is the only hand you connect with for the whole dance.',
    },
    {
      id: 'v1-freeze',
      name: 'Stop and Stare',
      description:
        'Freeze completely at the top of every phrase, and hold it one beat longer than is comfortable.',
    },
    {
      id: 'v1-lyrics',
      name: 'Play the Lyrics',
      description:
        'Dance the words, not the beat. If the singer says it, show it — the sillier the better.',
    },
    {
      id: 'v1-rolling-count',
      name: 'Rolling Count Riot',
      description:
        'Live in the and-counts. Try never to land squarely on a number for the whole song.',
    },
    {
      id: 'v1-small-slot',
      name: 'Small World',
      description:
        'The whole dance happens in a slot half its normal length. Nobody may step outside it.',
    },
    {
      id: 'v1-late',
      name: 'Take the Scenic Route',
      description:
        'Delay every arrival. Get everywhere late, on purpose, and get there at the same moment.',
    },
    {
      id: 'v1-shine',
      name: 'Shine Time',
      description:
        'Each of you takes at least one solo moment while the other stops and openly reacts to it.',
    },
    {
      id: 'v1-heavy-light',
      name: 'Heavy and Light',
      description:
        'Alternate every eight counts between grounded, weighted movement and light, floating movement.',
    },
    {
      id: 'v1-mirror',
      name: 'Mirror Match',
      description:
        'Whatever one of you does, the other answers with the same shape before the phrase ends.',
    },
    {
      id: 'v1-silent-movie',
      name: 'Silent Movie',
      description:
        'Tell the entire story with your body. No smiling with your mouth — everything else is fair game.',
    },
  ],
};

/** The deck a session uses unless another is chosen. */
export const DEFAULT_DECK_ID = WESTIE_STARTER_PACK.id;

export const BUILT_IN_DECKS: Deck[] = [WESTIE_STARTER_PACK, WESTIE_STARTER_PACK_V1];

export function findDeck(id: string): Deck {
  return BUILT_IN_DECKS.find((d) => d.id === id) ?? WESTIE_STARTER_PACK;
}

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
