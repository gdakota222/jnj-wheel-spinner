import { describe, expect, it } from 'vitest';
import {
  createPractice,
  danceNumbers,
  isComplete,
  practiceReducer,
  progress,
  type PracticeState,
} from './practice';
import {
  countCouples,
  dancersMissingDivision,
  divisionGroups,
  unpairableGroups,
  type Division,
  type DivisionSettings,
} from './divisions';
import { buildPools, type Dancer, type Role } from './roster';

/** Deterministic randomness, so a failing case can be replayed. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

let n = 0;
function dancer(name: string, role: Role, lead?: Division, follow?: Division): Dancer {
  return { id: `d${n++}-${name}`, name, role, leadDivision: lead, followDivision: follow };
}

const ON = (over: Partial<DivisionSettings> = {}): DivisionSettings => ({
  enabled: true,
  mode: 'strict',
  order: 'ascending',
  ...over,
});

const names = (s: PracticeState) =>
  s.couples.map((c) => `${c.leader?.name ?? '-'}/${c.follower?.name ?? '-'}`);

describe('Quick list — the whole night at once', () => {
  it('gives every dancer one dance when the sides are even', () => {
    const roster = [
      dancer('L1', 'leader'),
      dancer('L2', 'leader'),
      dancer('F1', 'follower'),
      dancer('F2', 'follower'),
    ];
    const s = createPractice(roster, undefined, seeded());
    expect(s.couples).toHaveLength(2);
    const all = s.couples.flatMap((c) => [c.leader!.name, c.follower!.name]).sort();
    expect(all).toEqual(['F1', 'F2', 'L1', 'L2']);
  });

  it('cycles the short side, nobody twice before everyone once, repeats last', () => {
    const roster = [
      ...['L1', 'L2', 'L3', 'L4', 'L5'].map((x) => dancer(x, 'leader')),
      dancer('F1', 'follower'),
      dancer('F2', 'follower'),
    ];
    const s = createPractice(roster, undefined, seeded(7));
    expect(s.couples).toHaveLength(5);
    const followers = s.couples.map((c) => c.follower!.name);
    // First two are the first time round; nobody gets a third before both have two.
    expect(new Set(followers.slice(0, 2)).size).toBe(2);
    const counts = followers.reduce<Record<string, number>>(
      (acc, f) => ({ ...acc, [f]: (acc[f] ?? 0) + 1 }),
      {},
    );
    expect(Object.values(counts).sort()).toEqual([2, 3]);
    const nums = danceNumbers(s.couples);
    expect(s.couples.slice(0, 2).every((c) => nums.get(c.id)!.follower === 1)).toBe(true);
  });

  it('never gives anyone two dances in a row when someone else could go', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const roster = [
        ...['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'].map((x) => dancer(x, 'leader')),
        ...['F1', 'F2', 'F3'].map((x) => dancer(x, 'follower')),
      ];
      const s = createPractice(roster, undefined, seeded(seed));
      const followers = s.couples.map((c) => c.follower!.id);
      for (let i = 1; i < followers.length; i++) expect(followers[i]).not.toBe(followers[i - 1]);
    }
  });

  it('shares switches out the same way the wheel does', () => {
    const roster = [
      dancer('L1', 'leader'),
      dancer('L2', 'leader'),
      dancer('S1', 'switch'),
      dancer('F1', 'follower'),
    ];
    const s = createPractice(roster, undefined, seeded());
    expect(s.pools.followers.map((d) => d.name)).toContain('S1');
    expect(s.couples).toHaveLength(2);
  });

  it('is labelled Practice for history', () => {
    const s = createPractice([dancer('L', 'leader'), dancer('F', 'follower')]);
    expect(s.label).toBe('Practice');
  });
});

describe('Quick list — a danced couple is locked', () => {
  const roster = () => [
    ...['L1', 'L2', 'L3'].map((x) => dancer(x, 'leader')),
    ...['F1', 'F2', 'F3'].map((x) => dancer(x, 'follower')),
  ];

  it('reshuffle leaves danced couples exactly as they were', () => {
    let s = createPractice(roster(), undefined, seeded(3));
    const first = s.couples[0];
    s = practiceReducer(s, { type: 'toggleDone', id: first.id });
    const after = practiceReducer(s, { type: 'reshuffle', random: seeded(99) });
    expect(after.couples[0]).toEqual({ ...first, done: true });
    // The rest still covers everyone who has not danced, once each.
    const rest = after.couples.slice(1).flatMap((c) => [c.leader!.id, c.follower!.id]);
    expect(rest).not.toContain(first.leader!.id);
    expect(rest).not.toContain(first.follower!.id);
    expect(new Set(rest).size).toBe(4);
  });

  it('refuses to reshuffle once everyone has danced', () => {
    let s = createPractice(roster(), undefined, seeded());
    for (const c of s.couples) s = practiceReducer(s, { type: 'toggleDone', id: c.id });
    expect(practiceReducer(s, { type: 'reshuffle' })).toBe(s);
    expect(progress(s)).toEqual({ done: 3, total: 3 });
  });

  it('will not edit a danced couple', () => {
    let s = createPractice(roster(), undefined, seeded());
    const c = s.couples[0];
    s = practiceReducer(s, { type: 'toggleDone', id: c.id });
    const other = s.couples[1];
    const next = practiceReducer(s, {
      type: 'setCouple',
      id: c.id,
      leaderId: other.leader!.id,
      followerId: other.follower!.id,
    });
    expect(next).toBe(s);
  });
});

describe('Quick list — the organizer overrides', () => {
  it('pairs anyone with anyone, but never a dancer with themselves', () => {
    const sam = dancer('Sam K', 'switch');
    const roster = [dancer('L1', 'leader'), sam, dancer('F1', 'follower'), dancer('F2', 'follower')];
    const s = createPractice(roster, undefined, seeded());
    const c = s.couples[0];
    expect(
      practiceReducer(s, { type: 'setCouple', id: c.id, leaderId: sam.id, followerId: sam.id }),
    ).toBe(s);
    // Whichever follower the draw did *not* give this couple, so the edit is a real change.
    const f = roster.slice(2).find((d) => d.id !== c.follower!.id)!;
    const next = practiceReducer(s, {
      type: 'setCouple',
      id: c.id,
      leaderId: sam.id,
      followerId: f.id,
    });
    expect(next.couples[0]).toMatchObject({ leader: sam, follower: f, manual: true });
  });
});

describe('Quick list — a late arrival', () => {
  it('takes the first still-to-dance repeat on their side', () => {
    const roster = [
      ...['L1', 'L2', 'L3'].map((x) => dancer(x, 'leader')),
      dancer('F1', 'follower'),
      dancer('F2', 'follower'),
    ];
    const s = createPractice(roster, undefined, seeded(5));
    const repeat = s.couples[2];
    expect(danceNumbers(s.couples).get(repeat.id)!.follower).toBe(2);
    const f3 = dancer('F3', 'follower');
    const next = practiceReducer(s, { type: 'addDancer', dancer: f3 });
    expect(next.couples).toHaveLength(3);
    expect(next.couples[2].follower).toEqual(f3);
    expect(next.couples[2].leader).toEqual(repeat.leader);
    expect(next.couples.slice(0, 2)).toEqual(s.couples.slice(0, 2));
  });

  it('joins at the end when there is no repeat to take', () => {
    const roster = [dancer('L1', 'leader'), dancer('L2', 'leader'), dancer('F1', 'follower'), dancer('F2', 'follower')];
    const s = createPractice(roster, undefined, seeded());
    const l3 = dancer('L3', 'leader');
    const next = practiceReducer(s, { type: 'addDancer', dancer: l3, random: seeded(2) });
    expect(next.couples).toHaveLength(3);
    expect(next.couples[2].leader).toEqual(l3);
    expect(next.couples[2].follower).not.toBeNull();
    expect(next.couples.slice(0, 2)).toEqual(s.couples.slice(0, 2));
  });

  it('partners someone who was waiting with nobody', () => {
    const champ = dancer('Champ L', 'leader', 'champions');
    const roster = [champ, dancer('L1', 'leader', 'novice'), dancer('F1', 'follower', undefined, 'novice')];
    const s = createPractice(roster, ON(), seeded());
    expect(names(s)).toContain('Champ L/-');
    const cf = dancer('Champ F', 'follower', undefined, 'champions');
    const next = practiceReducer(s, { type: 'addDancer', dancer: cf });
    expect(names(next)).toContain('Champ L/Champ F');
    expect(names(next)).not.toContain('Champ L/-');
  });
});

describe('Quick list — someone leaves early', () => {
  it('takes them off and rearranges only what is still to dance', () => {
    const roster = [
      ...['L1', 'L2', 'L3'].map((x) => dancer(x, 'leader')),
      ...['F1', 'F2', 'F3'].map((x) => dancer(x, 'follower')),
    ];
    let s = createPractice(roster, undefined, seeded(4));
    const first = s.couples[0];
    s = practiceReducer(s, { type: 'toggleDone', id: first.id });
    const leaving = s.couples[1].follower!;
    const next = practiceReducer(s, { type: 'removeDancer', id: leaving.id, random: seeded(8) });
    expect(next.couples[0]).toEqual(s.couples[0]);
    const rest = next.couples.slice(1).flatMap((c) => [c.leader?.id, c.follower?.id]);
    expect(rest).not.toContain(leaving.id);
    // Two leaders still to dance, one follower left who hasn't — so she goes twice.
    expect(next.couples.slice(1)).toHaveLength(2);
    expect(next.couples.every(isComplete)).toBe(true);
  });

  it('keeps a danced couple even when one of them has left', () => {
    const roster = [dancer('L1', 'leader'), dancer('L2', 'leader'), dancer('F1', 'follower'), dancer('F2', 'follower')];
    let s = createPractice(roster, undefined, seeded());
    const first = s.couples[0];
    s = practiceReducer(s, { type: 'toggleDone', id: first.id });
    const next = practiceReducer(s, { type: 'removeDancer', id: first.leader!.id });
    expect(next.couples[0]).toEqual({ ...first, done: true });
  });
});

describe('Divisions', () => {
  it('pairs only within a division in Strict, lowest division first', () => {
    const roster = [
      dancer('AL', 'leader', 'advanced'),
      dancer('NL', 'leader', 'novice'),
      dancer('AF', 'follower', undefined, 'advanced'),
      dancer('NF', 'follower', undefined, 'novice'),
    ];
    const s = createPractice(roster, ON(), seeded());
    expect(names(s)).toEqual(['NL/NF', 'AL/AF']);
  });

  it('runs highest first when Descending', () => {
    const roster = [
      dancer('AL', 'leader', 'advanced'),
      dancer('NL', 'leader', 'novice'),
      dancer('AF', 'follower', undefined, 'advanced'),
      dancer('NF', 'follower', undefined, 'novice'),
    ];
    const s = createPractice(roster, ON({ order: 'descending' }), seeded());
    expect(names(s)).toEqual(['AL/AF', 'NL/NF']);
  });

  it('uses the division for the side a switch dances on', () => {
    const sam = dancer('Sam K', 'switch', 'advanced', 'novice');
    const roster = [dancer('L1', 'leader', 'novice'), sam, dancer('AL', 'leader', 'advanced')];
    // Sam fills the empty follower side, where they are Novice.
    const s = createPractice(roster, ON(), seeded());
    expect(s.pools.followers).toContain(sam);
    const groups = divisionGroups(s.pools, ON());
    expect(groups.find((g) => g.key === 'novice')!.followers).toContain(sam);
  });

  it('matches an unset division as Novice, and says who', () => {
    const blank = dancer('Blank B', 'leader');
    const roster = [blank, dancer('NF', 'follower', undefined, 'novice')];
    const s = createPractice(roster, ON(), seeded());
    expect(names(s)).toEqual(['Blank B/NF']);
    expect(dancersMissingDivision(roster)).toEqual([blank]);
  });

  it('leaves a one-sided division unpaired in Strict, and warns about it', () => {
    const champ = dancer('Champ L', 'leader', 'champions');
    const roster = [
      champ,
      dancer('AL', 'leader', 'advanced'),
      dancer('AF', 'follower', undefined, 'advanced'),
    ];
    const warn = unpairableGroups(buildPools(roster), ON());
    expect(warn).toEqual([{ label: 'Champions', side: 'leaders', dancers: [champ] }]);
    const s = createPractice(roster, ON(), seeded());
    expect(names(s)).toEqual(['AL/AF', 'Champ L/-']);
    // The roster's count says so too, rather than promising a couple that cannot dance.
    expect(countCouples(buildPools(roster), ON())).toBe(1);
    expect(progress(s)).toEqual({ done: 0, total: 1 });
    expect(isComplete(s.couples[1])).toBe(false);
    // A couple with nobody in it cannot be ticked off.
    expect(practiceReducer(s, { type: 'toggleDone', id: s.couples[1].id })).toBe(s);
  });

  it('folds a one-sided division one level down in Merge', () => {
    const roster = [
      dancer('Star L', 'leader', 'allstar'),
      dancer('AL', 'leader', 'advanced'),
      dancer('AF', 'follower', undefined, 'advanced'),
      dancer('AF2', 'follower', undefined, 'advanced'),
    ];
    const pools = buildPools(roster);
    expect(unpairableGroups(pools, ON({ mode: 'merge' }))).toEqual([]);
    const groups = divisionGroups(pools, ON({ mode: 'merge' }));
    expect(groups.map((g) => g.label)).toEqual(['Advanced + All-Star']);
    const s = createPractice(roster, ON({ mode: 'merge' }), seeded());
    expect(s.couples).toHaveLength(2);
    expect(s.couples.every(isComplete)).toBe(true);
  });

  it('folds Newcomers up, having nothing below', () => {
    const roster = [
      dancer('New L', 'leader', 'newcomer'),
      dancer('NL', 'leader', 'novice'),
      dancer('NF', 'follower', undefined, 'novice'),
    ];
    const groups = divisionGroups(buildPools(roster), ON({ mode: 'merge' }));
    expect(groups.map((g) => g.label)).toEqual(['Newcomer + Novice']);
  });

  it('does not merge just to avoid repeats', () => {
    const roster = [
      dancer('Star L', 'leader', 'allstar'),
      ...['F1', 'F2', 'F3'].map((x) => dancer(x, 'follower', undefined, 'allstar')),
      dancer('AL', 'leader', 'advanced'),
      dancer('AF', 'follower', undefined, 'advanced'),
    ];
    const groups = divisionGroups(buildPools(roster), ON({ mode: 'merge' }));
    expect(groups.map((g) => g.key)).toEqual(['advanced', 'allstar']);
    const s = createPractice(roster, ON({ mode: 'merge' }), seeded());
    expect(s.couples.filter((c) => c.leader?.name === 'Star L')).toHaveLength(3);
  });

  it('ignores divisions entirely when the toggle is off', () => {
    const roster = [dancer('AL', 'leader', 'advanced'), dancer('NF', 'follower', undefined, 'novice')];
    const s = createPractice(roster, { ...ON(), enabled: false }, seeded());
    expect(names(s)).toEqual(['AL/NF']);
  });
});
