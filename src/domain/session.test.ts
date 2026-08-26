import { describe, expect, it } from 'vitest';
import type { Dancer, Role } from './roster';
import { WCS_STARTER_DECK } from './prompts';
import {
  createSession,
  drawEntries,
  isForegoneConclusion,
  promptEntries,
  promptsExhausted,
  resumeSession,
  sessionReducer,
  wheelEntries,
  willRecycle,
  type SessionAction,
  type SessionState,
} from './session';

const make = (n: number, role: Role, prefix: string): Dancer[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, name: `${prefix} ${i}`, role }));

const roster = (leaders: number, followers: number, switches = 0): Dancer[] => [
  ...make(leaders, 'leader', 'L'),
  ...make(followers, 'follower', 'F'),
  ...make(switches, 'switch', 'S'),
];

const apply = (state: SessionState, ...actions: SessionAction[]): SessionState =>
  actions.reduce(sessionReducer, state);

/** Draw one couple, always taking the first name on the wheel. */
function drawCouple(state: SessionState, pick: (max: number) => number = () => 0): SessionState {
  let s = state;
  for (let half = 0; half < 2; half++) {
    const entries = wheelEntries(s);
    s = apply(s, { type: 'spin', index: pick(entries.length), rotation: s.rotation + 1800 });
    s = apply(s, { type: 'settled' });
  }
  return apply(s, { type: 'nextCouple' });
}

/** Run a whole session to completion. */
function runSession(state: SessionState, pick?: (max: number) => number): SessionState {
  let s = state;
  let guard = 0;
  while (s.phase !== 'complete' && guard++ < 500) {
    s = drawCouple(s, pick);
  }
  return s;
}

describe('createSession', () => {
  it('counts couples from the larger pool, because the shorter one recycles', () => {
    expect(createSession(roster(5, 3), 'leaders').couplesTotal).toBe(5);
    expect(createSession(roster(2, 7), 'leaders').couplesTotal).toBe(7);
  });

  it('is already complete when a pool is empty, since nothing can pair', () => {
    expect(createSession(roster(4, 0), 'leaders').phase).toBe('complete');
  });

  it('starts on whichever pool the spin order names', () => {
    expect(createSession(roster(3, 3), 'followers').currentPool).toBe('followers');
  });

  it('assigns switches through buildPools', () => {
    const s = createSession(roster(3, 3, 2), 'leaders');
    expect(s.originals.leaders).toHaveLength(4);
    expect(s.originals.followers).toHaveLength(4);
  });
});

describe('drawing a couple', () => {
  it('alternates pools and produces one couple', () => {
    let s = createSession(roster(3, 3), 'leaders');
    expect(s.currentPool).toBe('leaders');

    s = apply(s, { type: 'spin', index: 0, rotation: 1800 });
    expect(s.phase).toBe('spinning');

    s = apply(s, { type: 'settled' });
    expect(s.phase).toBe('drawn');
    expect(s.currentPool).toBe('followers');
    expect(s.drawn.leaders?.id).toBe('L0');

    s = apply(s, { type: 'spin', index: 0, rotation: 3600 }, { type: 'settled' });
    expect(s.phase).toBe('couple');
    expect(s.drawn.followers?.id).toBe('F0');

    s = apply(s, { type: 'nextCouple' });
    expect(s.log).toHaveLength(1);
    expect(s.log[0]).toEqual({
      leader: expect.objectContaining({ id: 'L0' }),
      follower: expect.objectContaining({ id: 'F0' }),
      prompt: null,
    });
    expect(s.phase).toBe('ready');
  });

  it('keeps the winner on the wheel until the couple is committed', () => {
    let s = createSession(roster(3, 3), 'leaders');
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    // The name must not vanish from under the pointer the moment it lands.
    expect(s.remaining.leaders.map((d) => d.id)).toContain('L0');
    expect(wheelEntries(s).map((d) => d.id)).toContain('L0');
  });

  it('takes both dancers off the wheel once the couple is committed', () => {
    let s = createSession(roster(3, 3), 'leaders');
    s = drawCouple(s);
    expect(s.remaining.leaders.map((d) => d.id)).not.toContain('L0');
    expect(s.remaining.followers.map((d) => d.id)).not.toContain('F0');
  });

  it('keeps the wheel on the pool that just landed, not the pool coming next', () => {
    let s = createSession(roster(3, 3), 'leaders');
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    expect(s.currentPool).toBe('followers');
    // The wheel still shows the leaders it landed in, until the next spin starts.
    expect(s.wheelPool).toBe('leaders');
    s = apply(s, { type: 'spin', index: 0, rotation: 3600 });
    expect(s.wheelPool).toBe('followers');
  });

  it('ignores a spin while one is already turning', () => {
    let s = createSession(roster(3, 3), 'leaders');
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 });
    const mid = s;
    s = apply(s, { type: 'spin', index: 2, rotation: 9999 });
    expect(s).toEqual(mid);
  });
});

describe('re-spinning', () => {
  it('leaves the discarded dancer eligible', () => {
    let s = createSession(roster(4, 4), 'leaders');
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });

    s = apply(s, { type: 'respin', index: 1, rotation: 3600 });
    expect(s.remaining.leaders.map((d) => d.id)).toContain('L0');
    expect(s.drawn.leaders).toBeUndefined();
    expect(s.phase).toBe('spinning');
  });

  it('re-spins the second half of a pair, not the first', () => {
    let s = createSession(roster(4, 4), 'leaders');
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    s = apply(s, { type: 'spin', index: 0, rotation: 3600 }, { type: 'settled' });
    expect(s.phase).toBe('couple');

    s = apply(s, { type: 'respin', index: 1, rotation: 5400 });
    // The leader stands; the follower went back.
    expect(s.drawn.leaders?.id).toBe('L0');
    expect(s.drawn.followers).toBeUndefined();
    expect(s.currentPool).toBe('followers');
  });

  it('does nothing once the couple has been committed', () => {
    let s = createSession(roster(4, 4), 'leaders');
    s = drawCouple(s);
    const committed = s;
    s = apply(s, { type: 'respin', index: 0, rotation: 9999 });
    expect(s).toEqual(committed);
  });

  it('never loses a dancer, however often it is used', () => {
    let s = createSession(roster(4, 4), 'leaders');
    for (let i = 0; i < 10; i++) {
      s = apply(s, { type: 'spin', index: 0, rotation: s.rotation + 1800 }, { type: 'settled' });
      s = apply(s, { type: 'respin', index: 0, rotation: s.rotation + 1800 });
      s = apply(s, { type: 'settled' });
      s = apply(s, { type: 'respin', index: 0, rotation: s.rotation + 1800 });
    }
    s = apply(s, { type: 'settled' });
    const all = [...s.remaining.leaders, ...(s.drawn.leaders ? [s.drawn.leaders] : [])];
    expect(new Set(all.map((d) => d.id)).size).toBe(4);
  });
});

describe('recycling the short pool', () => {
  it('does not recycle while both pools still have dancers', () => {
    const s = createSession(roster(4, 4), 'leaders');
    expect(willRecycle(s)).toBe(false);
  });

  it('refills the short pool once it runs dry, so nobody sits out', () => {
    let s = createSession(roster(4, 2), 'leaders');
    s = drawCouple(s);
    s = drawCouple(s);
    // Followers are exhausted; the next follower spin must recycle them.
    expect(s.remaining.followers).toHaveLength(0);
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    expect(s.currentPool).toBe('followers');
    expect(willRecycle(s)).toBe(true);
    expect(wheelEntries(s)).toHaveLength(2);
  });

  it('never recycles the larger pool', () => {
    const s = runSession(createSession(roster(6, 2), 'leaders'));
    expect(s.recycled.leaders).toBe(false);
    expect(s.recycled.followers).toBe(true);
  });

  it('recycles neither pool when they are even', () => {
    const s = runSession(createSession(roster(5, 5), 'leaders'));
    expect(s.recycled.leaders).toBe(false);
    expect(s.recycled.followers).toBe(false);
  });
});

describe('finishing a session', () => {
  it('produces exactly one couple per dancer in the larger pool', () => {
    for (const [l, f] of [
      [3, 3],
      [5, 2],
      [2, 6],
      [8, 1],
      [10, 10],
    ]) {
      const s = runSession(createSession(roster(l, f), 'leaders'));
      expect(s.phase).toBe('complete');
      expect(s.log).toHaveLength(Math.max(l, f));
    }
  });

  it('gives every dancer in the larger pool exactly one dance', () => {
    const s = runSession(createSession(roster(6, 2), 'leaders'));
    const leaderIds = s.log.map((c) => c.leader.id);
    expect(new Set(leaderIds).size).toBe(6);
  });

  it('leaves nobody in the larger pool sitting out', () => {
    const s = runSession(createSession(roster(2, 7), 'followers'));
    const followerIds = new Set(s.log.map((c) => c.follower.id));
    expect(followerIds.size).toBe(7);
  });
});

describe('the no-repeat guarantee', () => {
  /**
   * The reason the app tracks no pairing history: a repeat needs *both* halves to
   * come around again, and the larger pool drains exactly once. This asserts that
   * property holds across many randomised sessions of every shape.
   */
  it('never forms the same couple twice, whatever the pools and however the wheel lands', () => {
    let seed = 12345;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (const [l, f] of [
      [3, 3],
      [5, 2],
      [2, 6],
      [7, 3],
      [10, 4],
      [1, 5],
      [9, 9],
    ]) {
      for (const order of ['leaders', 'followers'] as const) {
        const s = runSession(createSession(roster(l, f), order), (max) =>
          Math.floor(random() * max),
        );
        const seen = new Set<string>();
        for (const couple of s.log) {
          const key = `${couple.leader.id}+${couple.follower.id}`;
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
      }
    }
  });
});

describe('editing the roster mid-session', () => {
  it('drops a removed dancer from the pool', () => {
    let s = createSession(roster(4, 4), 'leaders');
    const kept = roster(4, 4).filter((d) => d.id !== 'L2');
    s = apply(s, { type: 'syncDancers', dancers: kept });
    expect(s.remaining.leaders.map((d) => d.id)).not.toContain('L2');
    expect(s.couplesTotal).toBe(4);
  });

  it('adds a new dancer as undrawn', () => {
    let s = createSession(roster(3, 3), 'leaders');
    s = drawCouple(s);
    const grown = [...roster(3, 3), { id: 'L9', name: 'Late Arrival', role: 'leader' as Role }];
    s = apply(s, { type: 'syncDancers', dancers: grown });
    expect(s.remaining.leaders.map((d) => d.id)).toContain('L9');
    // L0 already danced, so the edit must not put them back on the wheel.
    expect(s.remaining.leaders.map((d) => d.id)).not.toContain('L0');
  });

  it('carries a rename through into the log', () => {
    let s = createSession(roster(3, 3), 'leaders');
    s = drawCouple(s);
    const renamed = roster(3, 3).map((d) => (d.id === 'L0' ? { ...d, name: 'Renamed One' } : d));
    s = apply(s, { type: 'syncDancers', dancers: renamed });
    expect(s.log[0].leader.name).toBe('Renamed One');
  });

  it('clears a drawn dancer who has just been removed', () => {
    let s = createSession(roster(4, 4), 'leaders');
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    expect(s.drawn.leaders?.id).toBe('L0');

    s = apply(s, { type: 'syncDancers', dancers: roster(4, 4).filter((d) => d.id !== 'L0') });
    expect(s.drawn.leaders).toBeUndefined();
    expect(s.currentPool).toBe('leaders');
    expect(s.phase).toBe('ready');
  });

  it('completes the session if the roster shrinks below what has already danced', () => {
    let s = createSession(roster(3, 3), 'leaders');
    s = drawCouple(s);
    s = drawCouple(s);
    // Cut back to a roster that only supports the two dances already done.
    const shrunk = roster(3, 3).filter((d) => ['L0', 'L1', 'F0', 'F1'].includes(d.id));
    s = apply(s, { type: 'syncDancers', dancers: shrunk });
    expect(s.phase).toBe('complete');
  });
});

describe('a pool down to its last name', () => {
  it('is flagged so the app can be in on the joke (D-017)', () => {
    let s = createSession(roster(3, 1), 'followers');
    expect(isForegoneConclusion(s)).toBe(true);

    const evens = createSession(roster(3, 3), 'leaders');
    expect(isForegoneConclusion(evens)).toBe(false);
  });

  it('still draws that dancer rather than skipping the spin', () => {
    let s = createSession(roster(2, 1), 'followers');
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    expect(s.drawn.followers?.id).toBe('F0');
  });
});

describe('prompts', () => {
  const deck = WCS_STARTER_DECK.prompts.slice(0, 3);

  /** Draw a couple and its prompt. */
  function drawWithPrompt(state: SessionState, promptIndex = 0): SessionState {
    let s = state;
    for (let half = 0; half < 2; half++) {
      s = apply(s, { type: 'spin', index: 0, rotation: s.rotation + 1800 }, { type: 'settled' });
    }
    expect(s.phase).toBe('pair');
    s = apply(s, { type: 'spinPrompt', index: promptIndex, rotation: s.rotation + 1800 });
    expect(s.phase).toBe('prompt-spinning');
    return apply(s, { type: 'settled' });
  }

  it('stays out of the way entirely when switched off', () => {
    let s = createSession(roster(3, 3), 'leaders', false);
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    s = apply(s, { type: 'spin', index: 0, rotation: 3600 }, { type: 'settled' });
    // Straight to dancing; no prompt step at all.
    expect(s.phase).toBe('couple');
    s = apply(s, { type: 'nextCouple' });
    expect(s.log[0].prompt).toBeNull();
  });

  it('holds the pair until their prompt is drawn', () => {
    let s = createSession(roster(3, 3), 'leaders', true, deck);
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    s = apply(s, { type: 'spin', index: 0, rotation: 3600 }, { type: 'settled' });
    expect(s.phase).toBe('pair');
    expect(s.currentPrompt).toBeNull();
  });

  it('records what the couple danced', () => {
    let s = createSession(roster(3, 3), 'leaders', true, deck);
    s = drawWithPrompt(s, 1);
    expect(s.currentPrompt?.id).toBe(deck[1].id);
    s = apply(s, { type: 'nextCouple' });
    expect(s.log[0].prompt?.id).toBe(deck[1].id);
    expect(s.currentPrompt).toBeNull();
  });

  it('never repeats a prompt while the deck still has unused ones', () => {
    let s = createSession(roster(3, 3), 'leaders', true, deck);
    const drawn: string[] = [];
    for (let i = 0; i < 3; i++) {
      s = drawWithPrompt(s, 0);
      drawn.push(s.currentPrompt!.id);
      s = apply(s, { type: 'nextCouple' });
    }
    expect(new Set(drawn).size).toBe(3);
  });

  it('shrinks the wheel as prompts are used up', () => {
    let s = createSession(roster(3, 3), 'leaders', true, deck);
    expect(promptEntries(s)).toHaveLength(3);
    s = drawWithPrompt(s, 0);
    s = apply(s, { type: 'nextCouple' });
    expect(promptEntries(s)).toHaveLength(2);
  });

  it('announces exhaustion before starting the deck over, never silently', () => {
    // Two prompts, three couples: the third must run the deck dry.
    let s = createSession(roster(3, 3), 'leaders', true, deck.slice(0, 2));
    expect(promptsExhausted(s)).toBe(false);

    s = apply(drawWithPrompt(s, 0), { type: 'nextCouple' });
    s = apply(drawWithPrompt(s, 0), { type: 'nextCouple' });

    // Deck is spent. The app must be able to say so before it recycles.
    expect(promptsExhausted(s)).toBe(true);
    expect(s.promptsRecycled).toBe(false);

    s = drawWithPrompt(s, 0);
    expect(s.promptsRecycled).toBe(true);
    expect(s.currentPrompt).not.toBeNull();
  });

  it('keeps the drawn prompt on the wheel until the couple is committed', () => {
    let s = createSession(roster(3, 3), 'leaders', true, deck);
    s = drawWithPrompt(s, 0);
    const drawnPrompt = s.currentPrompt!;
    // Still on the wheel, under the pointer, while they dance.
    expect(promptEntries(s).map((p) => p.id)).toContain(drawnPrompt.id);

    s = apply(s, { type: 'nextCouple' });
    // Spent only once the couple is in the log.
    expect(promptEntries(s).map((p) => p.id)).not.toContain(drawnPrompt.id);
  });

  it('re-spinning a prompt clears the current one and draws again', () => {
    let s = createSession(roster(3, 3), 'leaders', true, deck);
    s = drawWithPrompt(s, 0);
    s = apply(s, { type: 'respinPrompt', index: 1, rotation: s.rotation + 1800 });
    expect(s.currentPrompt).toBeNull();
    s = apply(s, { type: 'settled' });
    expect(s.currentPrompt?.id).toBe(deck[1].id);
  });

  it('is reported as exhausted only when prompts are actually on', () => {
    const off = createSession(roster(3, 3), 'leaders', false, []);
    expect(promptsExhausted(off)).toBe(false);
  });
});

describe('the pool being drawn versus the pool being shown', () => {
  /**
   * Regression: the screen sized its spin against the names on the wheel rather
   * than the pool being drawn. With four leaders showing and two followers to
   * draw from, it could pick index 3 of a two-person pool — the reducer found
   * nobody there and the wheel span forever.
   */
  it('reports the drawn pool separately from the displayed one', () => {
    let s = createSession(roster(4, 2), 'leaders');
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });

    // The wheel still shows the four leaders it landed in...
    expect(wheelEntries(s)).toHaveLength(4);
    // ...but the next draw comes from the two followers.
    expect(drawEntries(s)).toHaveLength(2);
    expect(s.currentPool).toBe('followers');
  });

  it('lands rather than stalling if an index arrives outside the pool', () => {
    let s = createSession(roster(4, 2), 'leaders');
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    // An index valid for the displayed pool but not for the drawn one.
    s = apply(s, { type: 'spin', index: 3, rotation: 3600 }, { type: 'settled' });
    expect(s.phase).not.toBe('spinning');
    expect(s.drawn.followers).toBeDefined();
  });
});

describe('resuming an interrupted session', () => {
  it('rolls back a spin that was still turning when the app died', () => {
    let s = createSession(roster(4, 4), 'leaders');
    s = apply(s, { type: 'spin', index: 2, rotation: 1800 });
    expect(s.phase).toBe('spinning');

    const back = resumeSession(s);
    // Nobody saw it land, so it did not happen.
    expect(back.phase).toBe('ready');
    expect(back.pendingIndex).toBeNull();
    expect(back.drawn.leaders).toBeUndefined();
  });

  it('returns to the half-drawn state when the second spin was interrupted', () => {
    let s = createSession(roster(4, 4), 'leaders');
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    s = apply(s, { type: 'spin', index: 1, rotation: 3600 });

    const back = resumeSession(s);
    expect(back.phase).toBe('drawn');
    // The leader who already landed still stands.
    expect(back.drawn.leaders?.id).toBe('L0');
    expect(back.currentPool).toBe('followers');
  });

  it('rolls an interrupted prompt spin back to the waiting pair', () => {
    const deck = WCS_STARTER_DECK.prompts.slice(0, 3);
    let s = createSession(roster(3, 3), 'leaders', true, deck);
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    s = apply(s, { type: 'spin', index: 0, rotation: 3600 }, { type: 'settled' });
    s = apply(s, { type: 'spinPrompt', index: 1, rotation: 5400 });

    const back = resumeSession(s);
    expect(back.phase).toBe('pair');
    expect(back.currentPrompt).toBeNull();
    expect(back.drawn.leaders).toBeDefined();
    expect(back.drawn.followers).toBeDefined();
  });

  it('leaves a settled session exactly as it was', () => {
    let s = createSession(roster(3, 3), 'leaders');
    s = drawCouple(s);
    expect(resumeSession(s)).toEqual(s);
  });

  it('survives a round trip through JSON, as storage does it', () => {
    // A session mid-flight with prompts on: pools part drained, a couple logged
    // with its challenge, and the next draw half done.
    let s = createSession(roster(4, 2), 'leaders', true, WCS_STARTER_DECK.prompts.slice(0, 4));
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    s = apply(s, { type: 'spin', index: 0, rotation: 3600 }, { type: 'settled' });
    s = apply(s, { type: 'spinPrompt', index: 0, rotation: 5400 }, { type: 'settled' });
    s = apply(s, { type: 'nextCouple' });
    s = apply(s, { type: 'spin', index: 1, rotation: 7200 }, { type: 'settled' });
    expect(s.phase).toBe('drawn');
    expect(s.log[0].prompt).not.toBeNull();

    const revived = JSON.parse(JSON.stringify(s)) as SessionState;
    expect(revived).toEqual(s);

    // And it carries on working from the revived value.
    const next = apply(revived, { type: 'spin', index: 0, rotation: revived.rotation + 1800 });
    expect(next.phase).toBe('spinning');
  });
});
