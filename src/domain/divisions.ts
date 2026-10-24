/**
 * Competition divisions, for organizers who want couples matched by level.
 *
 * Optional and off unless turned on (D-058). The ladder is the WSDC's, and a
 * dancer carries one division per role, because the WSDC tracks them per role
 * and plenty of dancers compete higher in one than the other.
 *
 * Pure functions, no React, no storage — same as the rest of the domain.
 */
import type { Pools } from './roster';
import type { Dancer } from './roster';

export const DIVISIONS = [
  'newcomer',
  'novice',
  'intermediate',
  'advanced',
  'allstar',
  'champions',
] as const;

export type Division = (typeof DIVISIONS)[number];

/** Spelled as the WSDC spells them. */
export const DIVISION_LABELS: Record<Division, string> = {
  newcomer: 'Newcomer',
  novice: 'Novice',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  allstar: 'All-Star',
  champions: 'Champions',
};

/** Where a dancer with no division set is matched — D-061. */
export const UNSET_DIVISION: Division = 'novice';

export type DivisionMode = 'strict' | 'merge';
export type DivisionOrder = 'ascending' | 'descending' | 'mixed';

export type DivisionSettings = {
  enabled: boolean;
  /** Strict: a division only dances within itself. Merge: an empty side borrows one level down. */
  mode: DivisionMode;
  /** Which division dances first in Quick list. Ascending unless chosen otherwise (D-062). */
  order: DivisionOrder;
};

export const DEFAULT_DIVISION_SETTINGS: DivisionSettings = {
  enabled: false,
  mode: 'strict',
  order: 'ascending',
};

export type Side = 'leaders' | 'followers';

/** The division a dancer is matched at on one side of the floor. */
export function divisionOn(dancer: Dancer, side: Side): Division {
  const set = side === 'leaders' ? dancer.leadDivision : dancer.followDivision;
  return set ?? UNSET_DIVISION;
}

/** Which division fields a dancer's role gives them. A switch has both. */
export function divisionSides(dancer: Dancer): Side[] {
  if (dancer.role === 'leader') return ['leaders'];
  if (dancer.role === 'follower') return ['followers'];
  return ['leaders', 'followers'];
}

/** Dancers matched as Novice only because nothing was set — said aloud, never silent. */
export function dancersMissingDivision(dancers: readonly Dancer[]): Dancer[] {
  return dancers.filter((d) =>
    divisionSides(d).some((side) =>
      side === 'leaders' ? d.leadDivision === undefined : d.followDivision === undefined,
    ),
  );
}

/**
 * A set of divisions that dance together.
 *
 * Usually one division. Under Merge, a division with nobody on one side is
 * folded into its neighbour, and the group then covers both.
 */
export type DivisionGroup = {
  /** Stable identity, e.g. `advanced+allstar`. */
  key: string;
  /** For the screen, e.g. `Advanced + All-Star`. */
  label: string;
  divisions: Division[];
  leaders: Dancer[];
  followers: Dancer[];
};

/** The key every dancer shares when divisions are off. */
export const ALL_GROUP_KEY = 'all';

function makeGroup(divisions: Division[], leaders: Dancer[], followers: Dancer[]): DivisionGroup {
  const sorted = [...divisions].sort((a, b) => DIVISIONS.indexOf(a) - DIVISIONS.indexOf(b));
  return {
    key: sorted.join('+'),
    label: sorted.map((d) => DIVISION_LABELS[d]).join(' + '),
    divisions: sorted,
    leaders,
    followers,
  };
}

const oneSided = (g: DivisionGroup) => (g.leaders.length === 0) !== (g.followers.length === 0);

/**
 * Split the floor into the groups that pair within themselves, lowest first.
 *
 * With divisions off there is one group holding everybody. In Strict, one group
 * per division, and a group with nobody on one side simply cannot pair — see
 * `unpairableGroups`. In Merge, such a group folds into the next division down
 * that has anybody in it; the lowest folds up instead, having nothing below
 * (D-059). Merge never borrows just to avoid repeats.
 */
export function divisionGroups(pools: Pools, settings: DivisionSettings): DivisionGroup[] {
  if (!settings.enabled) {
    return [
      {
        key: ALL_GROUP_KEY,
        label: 'Everyone',
        divisions: [],
        leaders: [...pools.leaders],
        followers: [...pools.followers],
      },
    ];
  }

  let groups = DIVISIONS.map((division) =>
    makeGroup(
      [division],
      pools.leaders.filter((d) => divisionOn(d, 'leaders') === division),
      pools.followers.filter((d) => divisionOn(d, 'followers') === division),
    ),
  ).filter((g) => g.leaders.length + g.followers.length > 0);

  if (settings.mode === 'merge') {
    // Each fold removes a group, so this always finishes.
    for (;;) {
      if (groups.length < 2) break;
      const i = groups.findIndex(oneSided);
      if (i === -1) break;
      const j = i > 0 ? i - 1 : i + 1;
      const [lo, hi] = i < j ? [i, j] : [j, i];
      const merged = makeGroup(
        [...groups[lo].divisions, ...groups[hi].divisions],
        [...groups[lo].leaders, ...groups[hi].leaders],
        [...groups[lo].followers, ...groups[hi].followers],
      );
      groups = [...groups.slice(0, lo), merged, ...groups.slice(hi + 1)];
    }
  }

  return groups;
}

/** The group a dancer pairs within, on a given side. */
export function groupOf(
  groups: readonly DivisionGroup[],
  dancer: Dancer,
  side: Side,
): DivisionGroup | undefined {
  return groups.find((g) => g[side].some((d) => d.id === dancer.id));
}

/**
 * How many couples will dance once divisions are applied.
 *
 * Each group dances as many couples as its larger side, the same rule as the
 * whole floor. A one-sided group dances none, which is why this can be lower
 * than the count without divisions.
 */
export function countCouples(pools: Pools, settings: DivisionSettings): number {
  return divisionGroups(pools, settings).reduce(
    (sum, g) =>
      g.leaders.length === 0 || g.followers.length === 0
        ? sum
        : sum + Math.max(g.leaders.length, g.followers.length),
    0,
  );
}

export type UnpairableGroup = {
  label: string;
  /** The side that has people on it. */
  side: Side;
  dancers: Dancer[];
};

/**
 * Who will go without a partner, said before the night starts (D-060).
 *
 * Only Strict produces these: Merge folds every one-sided group away unless the
 * whole floor is one-sided, which setup already refuses.
 */
export function unpairableGroups(pools: Pools, settings: DivisionSettings): UnpairableGroup[] {
  if (!settings.enabled) return [];
  return divisionGroups(pools, settings)
    .filter(oneSided)
    .map((g) => {
      const side: Side = g.leaders.length > 0 ? 'leaders' : 'followers';
      return { label: g.label, side, dancers: g[side] };
    });
}
