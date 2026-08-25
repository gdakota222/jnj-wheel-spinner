import { describe, expect, it } from 'vitest';
import {
  adviseOnSize,
  checkName,
  makeDancer,
  normalizeName,
  projectPools,
  type Dancer,
  type Role,
} from './roster';

const roster = (spec: Array<[string, Role]>): Dancer[] =>
  spec.map(([name, role]) => ({ id: name, name, role }));

const pools = (leaders: number, followers: number, switches: number): Dancer[] => [
  ...Array.from({ length: leaders }, (_, i) => ({ id: `l${i}`, name: `L ${i}`, role: 'leader' as Role })),
  ...Array.from({ length: followers }, (_, i) => ({ id: `f${i}`, name: `F ${i}`, role: 'follower' as Role })),
  ...Array.from({ length: switches }, (_, i) => ({ id: `s${i}`, name: `S ${i}`, role: 'switch' as Role })),
];

describe('normalizeName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeName('  Sarah   M  ')).toBe('Sarah M');
  });
});

describe('checkName', () => {
  it('rejects an empty name', () => {
    expect(checkName('   ', [])).toMatchObject({ ok: false });
  });

  it('rejects a first name with no last name or initial', () => {
    const result = checkName('Sarah', []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/last name or initial/i);
  });

  it('accepts a first name plus an initial', () => {
    expect(checkName('Sarah M', [])).toEqual({ ok: true, name: 'Sarah M' });
  });

  it('rejects a duplicate regardless of case or spacing', () => {
    const existing = roster([['Sarah M', 'follower']]);
    expect(checkName('  sarah   m ', existing)).toMatchObject({ ok: false });
  });

  it('names the clash as it appears on the roster, not as it was typed', () => {
    const existing = roster([['Sarah M', 'follower']]);
    const result = checkName('sarah m', existing);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('Sarah M');
      expect(result.reason).not.toContain('sarah m');
    }
  });

  it('allows a number to separate two dancers with the same name and initial', () => {
    const existing = roster([['Sarah M', 'follower']]);
    expect(checkName('Sarah M 2', existing)).toEqual({ ok: true, name: 'Sarah M 2' });
  });

  it('rejects a name too long to render on a wheel segment', () => {
    expect(checkName('Bartholomew Fitzwilliam Montgomery III', [])).toMatchObject({ ok: false });
  });
});

describe('projectPools — switch balancing', () => {
  it('leaves pools alone when there are no switches', () => {
    const p = projectPools(pools(4, 3, 0));
    expect([p.balancedLeaders, p.balancedFollowers]).toEqual([4, 3]);
  });

  it('sends switches to the short pool first', () => {
    const p = projectPools(pools(5, 2, 1));
    expect([p.balancedLeaders, p.balancedFollowers]).toEqual([5, 3]);
  });

  it('evens the pools out as far as it can', () => {
    const p = projectPools(pools(5, 1, 4));
    expect([p.balancedLeaders, p.balancedFollowers]).toEqual([5, 5]);
  });

  it('splits an all-switch roster down the middle', () => {
    const p = projectPools(pools(0, 0, 8));
    expect([p.balancedLeaders, p.balancedFollowers]).toEqual([4, 4]);
  });

  it('never loses or invents a dancer', () => {
    for (const [l, f, s] of [[3, 3, 0], [5, 2, 1], [0, 0, 7], [1, 9, 3], [10, 0, 5]]) {
      const p = projectPools(pools(l, f, s));
      expect(p.balancedLeaders + p.balancedFollowers).toBe(l + f + s);
    }
  });

  it('is deterministic — the same roster always projects the same event', () => {
    const r = pools(4, 1, 3);
    expect(projectPools(r)).toEqual(projectPools(r));
  });
});

describe('projectPools — couple count', () => {
  it('counts couples from the larger pool, because the shorter one recycles', () => {
    expect(projectPools(pools(6, 2, 0)).couples).toBe(6);
  });

  it('reports no couples when a pool is empty', () => {
    expect(projectPools(pools(4, 0, 0)).couples).toBe(0);
  });

  it('reports no couples for an empty roster', () => {
    expect(projectPools([]).couples).toBe(0);
  });
});

describe('adviseOnSize', () => {
  const advise = (l: number, f: number, s = 0) => adviseOnSize(projectPools(pools(l, f, s)));

  it('prompts for dancers when the roster is empty', () => {
    expect(advise(0, 0).level).toBe('empty');
  });

  it('flags a roster that cannot pair at all', () => {
    expect(advise(4, 0).level).toBe('unpairable');
  });

  it('calls fewer than three couples small, without blocking it', () => {
    expect(advise(2, 2).level).toBe('small');
  });

  it('calls three to five couples a good size', () => {
    expect(advise(3, 3).level).toBe('good');
    expect(advise(5, 5).level).toBe('good');
  });

  it('warns as the event grows past the sweet spot', () => {
    expect(advise(6, 6).level).toBe('long');
    expect(advise(10, 10).level).toBe('long');
  });

  it('warns past the ten-couple ceiling', () => {
    expect(advise(11, 11).level).toBe('over');
  });
});

describe('makeDancer', () => {
  it('gives every dancer a distinct id', () => {
    const ids = new Set(Array.from({ length: 200 }, () => makeDancer('Sarah M', 'follower').id));
    expect(ids.size).toBe(200);
  });
});
