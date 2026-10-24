import { describe, expect, it } from 'vitest';
import type { Division, DivisionSettings } from './divisions';
import type { Dancer, Role } from './roster';
import {
  createSession,
  drawEntries,
  drawLimitLabel,
  respinEntries,
  sessionReducer,
  wheelEntries,
  type SessionAction,
  type SessionState,
} from './session';

const apply = (state: SessionState, ...actions: SessionAction[]): SessionState =>
  actions.reduce(sessionReducer, state);

function d(name: string, role: Role, lead?: Division, follow?: Division): Dancer {
  return { id: name, name, role, leadDivision: lead, followDivision: follow };
}

const ON = (over: Partial<DivisionSettings> = {}): DivisionSettings => ({
  enabled: true,
  mode: 'strict',
  order: 'ascending',
  ...over,
});

/** Deterministic randomness, so a failing run can be replayed. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Run a whole wheel night, picking against `drawEntries` exactly as the screen
 * does, and assert at every landing that the name the reducer resolved is the
 * name the wheel was aimed at.
 */
function runNight(state: SessionState, random: () => number): SessionState {
  let s = state;
  let guard = 0;
  while (s.phase !== 'complete' && guard++ < 200) {
    for (let half = 0; half < 2; half++) {
      const entries = drawEntries(s);
      expect(entries.length).toBeGreaterThan(0);
      const index = Math.floor(random() * entries.length);
      const aimedAt = entries[index];
      s = apply(s, { type: 'spin', index, rotation: s.rotation + 1800 });
      // What the wheel shows mid-spin is what it was aimed at.
      expect(wheelEntries(s)[index]).toEqual(aimedAt);
      s = apply(s, { type: 'settled' });
      expect(s.drawn[s.wheelPool]).toEqual(aimedAt);
    }
    s = apply(s, { type: 'nextCouple' });
  }
  expect(s.phase).toBe('complete');
  return s;
}

const level = (_s: SessionState, dancer: Dancer, side: 'leaders' | 'followers') =>
  side === 'leaders' ? dancer.leadDivision : dancer.followDivision;

describe('the wheel with divisions', () => {
  const roster = [
    d('NL1', 'leader', 'novice'),
    d('NL2', 'leader', 'novice'),
    d('NL3', 'leader', 'novice'),
    d('NF1', 'follower', undefined, 'novice'),
    d('AL1', 'leader', 'advanced'),
    d('AF1', 'follower', undefined, 'advanced'),
    d('AF2', 'follower', undefined, 'advanced'),
  ];

  it('only ever pairs within a division, over many nights', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const order of ['leaders', 'followers'] as const) {
        const s = runNight(createSession(roster, order, false, [], ON()), seeded(seed));
        for (const c of s.log) {
          expect(level(s, c.leader, 'leaders')).toBe(level(s, c.follower, 'followers'));
        }
      }
    }
  });

  it('dances each group as many couples as its larger side', () => {
    const s = createSession(roster, 'leaders', false, [], ON());
    // Novice: 3 leaders, 1 follower → 3. Advanced: 1 leader, 2 followers → 2.
    expect(s.couplesTotal).toBe(5);
    const done = runNight(s, seeded(3));
    expect(done.log).toHaveLength(5);
    // Everyone in each group danced; the short sides went round again.
    const names = done.log.flatMap((c) => [c.leader.name, c.follower.name]);
    for (const dancer of roster) expect(names).toContain(dancer.name);
    expect(names.filter((n) => n === 'NF1')).toHaveLength(3);
    expect(names.filter((n) => n === 'AL1')).toHaveLength(2);
  });

  it('labels the second wheel with the division it is limited to', () => {
    let s = createSession(roster, 'leaders', false, [], ON());
    expect(drawLimitLabel(s, 'leaders')).toBeNull();
    const al = drawEntries(s).findIndex((x) => x.name === 'AL1');
    s = apply(s, { type: 'spin', index: al, rotation: 1800 }, { type: 'settled' });
    expect(s.currentPool).toBe('followers');
    expect(drawLimitLabel(s, 'followers')).toBe('Advanced');
    expect(drawEntries(s).map((x) => x.name)).toEqual(['AF1', 'AF2']);
  });

  it('keeps a dancer with no partner in their division off the wheel in Strict', () => {
    const lonely = [...roster, d('Champ', 'leader', 'champions')];
    const s = createSession(lonely, 'leaders', false, [], ON());
    expect(s.couplesTotal).toBe(5);
    expect(drawEntries(s).map((x) => x.name)).not.toContain('Champ');
    const done = runNight(s, seeded(9));
    expect(done.log.some((c) => c.leader.name === 'Champ')).toBe(false);
  });

  it('dances them one division down in Merge', () => {
    const lonely = [...roster, d('Champ', 'leader', 'champions')];
    const s = createSession(lonely, 'leaders', false, [], ON({ mode: 'merge' }));
    // Advanced + Champions: 2 leaders, 2 followers → 2. Novice → 3.
    expect(s.couplesTotal).toBe(5);
    const done = runNight(s, seeded(4));
    expect(done.log.some((c) => c.leader.name === 'Champ')).toBe(true);
  });

  it('changes nothing about a night with divisions off', () => {
    const off = createSession(roster, 'leaders', false, [], { ...ON(), enabled: false });
    expect(off.couplesTotal).toBe(4);
    const done = runNight(off, seeded(2));
    expect(done.log).toHaveLength(4);
  });
});

describe('re-spinning the first name of a pair', () => {
  it('is aimed at the pool being re-spun, not the one waiting next', () => {
    const dancers = [
      d('L1', 'leader'),
      d('L2', 'leader'),
      d('L3', 'leader'),
      d('L4', 'leader'),
      d('F1', 'follower'),
    ];
    let s = createSession(dancers, 'leaders', false, []);
    s = apply(s, { type: 'spin', index: 0, rotation: 1800 }, { type: 'settled' });
    expect(s.phase).toBe('drawn');
    // Next up is the one follower — but a re-spin redraws the leader.
    expect(drawEntries(s)).toHaveLength(1);
    const entries = respinEntries(s);
    expect(entries.map((x) => x.name)).toEqual(['L1', 'L2', 'L3', 'L4']);
    s = apply(s, { type: 'respin', index: 3, rotation: 3600 }, { type: 'settled' });
    expect(s.drawn.leaders?.name).toBe('L4');
  });

  it('stays inside the division when the second name is re-spun', () => {
    const dancers = [
      d('NL', 'leader', 'novice'),
      d('NF1', 'follower', undefined, 'novice'),
      d('NF2', 'follower', undefined, 'novice'),
      d('AF', 'follower', undefined, 'advanced'),
      d('AL', 'leader', 'advanced'),
    ];
    let s = createSession(dancers, 'leaders', false, [], ON());
    const nl = drawEntries(s).findIndex((x) => x.name === 'NL');
    s = apply(s, { type: 'spin', index: nl, rotation: 1800 }, { type: 'settled' });
    s = apply(s, { type: 'spin', index: 0, rotation: 3600 }, { type: 'settled' });
    expect(respinEntries(s).map((x) => x.name)).toEqual(['NF1', 'NF2']);
  });
});
