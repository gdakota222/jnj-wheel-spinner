/**
 * Quick list: the whole night's pairings at once, for practice (D-056).
 *
 * Same pairing rules as the wheel — switches fill the short side, the larger
 * side sets the number of couples, the shorter side cycles back through — with
 * none of the show. The list is the product: the organizer reads it, sends
 * couples up as they like, and taps each one off as they dance.
 *
 * Pure functions with injectable randomness, like the rest of the domain.
 */
import {
  DEFAULT_DIVISION_SETTINGS,
  divisionGroups,
  groupOf,
  type DivisionGroup,
  type DivisionSettings,
  type Side,
} from './divisions';
import { buildPools, type Dancer, type Pools } from './roster';

export type PracticeCouple = {
  id: string;
  /** Null only for a dancer whose division has nobody to partner them (Strict). */
  leader: Dancer | null;
  follower: Dancer | null;
  /** Danced. A danced couple is locked — nothing rewrites it (D-057). */
  done: boolean;
  /** The division group this couple was matched within; `all` with divisions off. */
  groupKey: string;
  groupLabel: string;
  /** Set by hand, so the screen can say the rules were set aside on purpose. */
  manual?: boolean;
};

export type PracticeState = {
  kind: 'practice';
  /** Carried for event history (v1.6), which will save practice nights under it — D-063. */
  label: 'Practice';
  pools: Pools;
  divisions: DivisionSettings;
  couples: PracticeCouple[];
  /** Counter for couple ids, so an id never comes back after an undo-and-redo. */
  nextId: number;
};

type Random = () => number;

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** How many times each dancer appears in a set of couples. */
function countDances(couples: readonly PracticeCouple[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of couples) {
    for (const d of [c.leader, c.follower]) {
      if (d) counts.set(d.id, (counts.get(d.id) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Pick whoever has danced least, at random among equals.
 *
 * This is the whole cycling rule: once everyone on the short side has danced,
 * the next pick comes from all of them again, and nobody goes a third time
 * before everyone has gone twice.
 */
function leastDanced(
  candidates: readonly Dancer[],
  counts: Map<string, number>,
  random: Random,
  /** Someone who just danced, passed over when anyone else is as due — nobody goes twice in a row. */
  avoid?: Dancer,
) {
  const fewest = Math.min(...candidates.map((d) => counts.get(d.id) ?? 0));
  const due = candidates.filter((d) => (counts.get(d.id) ?? 0) === fewest);
  const rested = due.filter((d) => d.id !== avoid?.id);
  const pool = rested.length > 0 ? rested : due;
  return pool[Math.floor(random() * pool.length)];
}

/**
 * Plan the still-to-dance couples for one group.
 *
 * Everyone in the group who has not danced yet gets one slot; the side with
 * fewer of them is topped up with whoever has danced least. Repeats land at the
 * end, the way the wheel recycles only once a pool runs dry.
 */
function planGroup(
  group: DivisionGroup,
  counts: Map<string, number>,
  random: Random,
): Array<[Dancer, Dancer]> {
  if (group.leaders.length === 0 || group.followers.length === 0) return [];
  const fresh = (side: Side) => shuffle(group[side].filter((d) => !counts.get(d.id)), random);
  const leaders = fresh('leaders');
  const followers = fresh('followers');
  const n = Math.max(leaders.length, followers.length);

  const planned = new Map(counts);
  for (const d of [...leaders, ...followers]) planned.set(d.id, (planned.get(d.id) ?? 0) + 1);
  const topUp = (list: Dancer[], all: Dancer[]) => {
    while (list.length < n) {
      const pick = leastDanced(all, planned, random, list[list.length - 1]);
      planned.set(pick.id, (planned.get(pick.id) ?? 0) + 1);
      list.push(pick);
    }
  };
  topUp(leaders, group.leaders);
  topUp(followers, group.followers);

  return leaders.map((l, i) => [l, followers[i]]);
}

function orderGroups(groups: DivisionGroup[], settings: DivisionSettings): DivisionGroup[] {
  return settings.enabled && settings.order === 'descending' ? [...groups].reverse() : groups;
}

/**
 * Lay out every couple still to dance, leaving danced couples exactly as they are.
 *
 * Used both to build the list and to reshuffle it: a fresh list is a reshuffle
 * with nothing danced yet.
 */
function replan(state: PracticeState, random: Random): PracticeState {
  const done = state.couples.filter((c) => c.done);
  const counts = countDances(done);
  const groups = orderGroups(divisionGroups(state.pools, state.divisions), state.divisions);
  let nextId = state.nextId;
  const id = () => `c${nextId++}`;

  let paired: PracticeCouple[] = [];
  const unpaired: PracticeCouple[] = [];
  for (const group of groups) {
    for (const [leader, follower] of planGroup(group, counts, random)) {
      paired.push({
        id: id(),
        leader,
        follower,
        done: false,
        groupKey: group.key,
        groupLabel: group.label,
      });
    }
    // A one-sided group in Strict: listed, so nobody is silently left out (D-060).
    const lonely: Side | null =
      group.leaders.length > 0 && group.followers.length === 0
        ? 'leaders'
        : group.followers.length > 0 && group.leaders.length === 0
          ? 'followers'
          : null;
    if (lonely) {
      for (const d of group[lonely].filter((x) => !counts.get(x.id))) {
        unpaired.push({
          id: id(),
          leader: lonely === 'leaders' ? d : null,
          follower: lonely === 'followers' ? d : null,
          done: false,
          groupKey: group.key,
          groupLabel: group.label,
        });
      }
    }
  }

  if (state.divisions.enabled && state.divisions.order === 'mixed') paired = shuffle(paired, random);

  return { ...state, couples: [...done, ...paired, ...unpaired], nextId };
}

export function createPractice(
  dancers: readonly Dancer[],
  divisions: DivisionSettings = DEFAULT_DIVISION_SETTINGS,
  random: Random = Math.random,
): PracticeState {
  const empty: PracticeState = {
    kind: 'practice',
    label: 'Practice',
    pools: buildPools(dancers),
    divisions,
    couples: [],
    nextId: 1,
  };
  return replan(empty, random);
}

/** True when a couple has both halves and can actually be danced. */
export function isComplete(c: PracticeCouple): c is PracticeCouple & { leader: Dancer; follower: Dancer } {
  return c.leader !== null && c.follower !== null;
}

/**
 * Which time this is for each half of each couple: 1 for a first dance, 2 for
 * a second, and so on. Worked out from list order rather than stored, so it can
 * never disagree with the list.
 */
export function danceNumbers(
  couples: readonly PracticeCouple[],
): Map<string, { leader: number; follower: number }> {
  const seen = new Map<string, number>();
  const out = new Map<string, { leader: number; follower: number }>();
  const next = (d: Dancer | null) => {
    if (!d) return 0;
    const n = (seen.get(d.id) ?? 0) + 1;
    seen.set(d.id, n);
    return n;
  };
  for (const c of couples) out.set(c.id, { leader: next(c.leader), follower: next(c.follower) });
  return out;
}

export type PracticeAction =
  | { type: 'toggleDone'; id: string }
  | { type: 'reshuffle'; random?: Random }
  | { type: 'setCouple'; id: string; leaderId: string; followerId: string }
  | { type: 'addDancer'; dancer: Dancer; random?: Random }
  | { type: 'removeDancer'; id: string; random?: Random };

/**
 * Every change to the list. Returns the same object when an action is refused,
 * so App can tell nothing happened and not record an undo step for it.
 */
export function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case 'toggleDone': {
      const couple = state.couples.find((c) => c.id === action.id);
      if (!couple || !isComplete(couple)) return state;
      return {
        ...state,
        couples: state.couples.map((c) => (c.id === action.id ? { ...c, done: !c.done } : c)),
      };
    }

    case 'reshuffle':
      if (state.couples.every((c) => c.done)) return state;
      return replan(state, action.random ?? Math.random);

    case 'setCouple': {
      // Any leader with any follower, across divisions or any other rule — the
      // organizer knows something the app does not (D-057). The one thing that
      // can never happen is a dancer partnered with themselves.
      if (action.leaderId === action.followerId) return state;
      const couple = state.couples.find((c) => c.id === action.id);
      const everyone = [...state.pools.leaders, ...state.pools.followers];
      const leader = everyone.find((d) => d.id === action.leaderId);
      const follower = everyone.find((d) => d.id === action.followerId);
      if (!couple || couple.done || !leader || !follower) return state;
      if (couple.leader?.id === leader.id && couple.follower?.id === follower.id) return state;
      return {
        ...state,
        couples: state.couples.map((c) =>
          c.id === action.id ? { ...c, leader, follower, manual: true } : c,
        ),
      };
    }

    case 'addDancer':
      return addLateDancer(state, action.dancer, action.random ?? Math.random);

    case 'removeDancer': {
      // Someone left early. They come off tonight's list — not the saved roster,
      // where they are still a regular — and everything still to dance is
      // rearranged without them. Danced couples, theirs included, stay as the
      // record of what happened.
      const inPools = [...state.pools.leaders, ...state.pools.followers].some(
        (d) => d.id === action.id,
      );
      if (!inPools) return state;
      const without = (list: Dancer[]) => list.filter((d) => d.id !== action.id);
      return replan(
        {
          ...state,
          pools: { leaders: without(state.pools.leaders), followers: without(state.pools.followers) },
        },
        action.random ?? Math.random,
      );
    }
  }
}

/**
 * A late arrival joins without disturbing anyone who has a slot (D-057).
 *
 * In order of preference: partner someone who had nobody; take the first
 * still-to-dance repeat on their side, in their group; or join as a new couple
 * at the end with whoever on the other side has danced least.
 */
function addLateDancer(state: PracticeState, dancer: Dancer, random: Random): PracticeState {
  const everyone = [...state.pools.leaders, ...state.pools.followers];
  if (everyone.some((d) => d.id === dancer.id)) return state;

  const numbers = danceNumbers(state.couples);
  const repeatSlot = (side: Side, groupKey: string) =>
    state.couples.find((c) => {
      const n = numbers.get(c.id);
      if (c.done || !isComplete(c) || c.groupKey !== groupKey || !n) return false;
      return side === 'leaders' ? n.leader > 1 : n.follower > 1;
    });
  const waiting = (side: Side, groupKey: string) =>
    state.couples.find(
      (c) =>
        !c.done &&
        c.groupKey === groupKey &&
        (side === 'leaders' ? c.leader === null && c.follower : c.follower === null && c.leader),
    );

  // A switch joins whichever side gives them a place soonest, as at setup.
  const sides: Side[] =
    dancer.role === 'leader'
      ? ['leaders']
      : dancer.role === 'follower'
        ? ['followers']
        : state.pools.leaders.length <= state.pools.followers.length
          ? ['leaders', 'followers']
          : ['followers', 'leaders'];

  const withDancer = (side: Side): Pools => ({ ...state.pools, [side]: [...state.pools[side], dancer] });
  const place = (side: Side, couple: PracticeCouple): PracticeState => ({
    ...state,
    pools: withDancer(side),
    couples: state.couples.map((c) =>
      c.id === couple.id ? { ...c, [side === 'leaders' ? 'leader' : 'follower']: dancer } : c,
    ),
  });

  for (const side of sides) {
    const group = groupOf(divisionGroups(withDancer(side), state.divisions), dancer, side);
    if (!group) continue;
    const slot = waiting(side, group.key) ?? repeatSlot(side, group.key);
    if (slot) return place(side, slot);
  }

  // Nowhere to slot in: a new couple at the end of their group's run.
  const side = sides[0];
  const pools = withDancer(side);
  const group = groupOf(divisionGroups(pools, state.divisions), dancer, side);
  if (!group) return state;
  const other: Side = side === 'leaders' ? 'followers' : 'leaders';
  const partner =
    group[other].length > 0 ? leastDanced(group[other], countDances(state.couples), random) : null;
  const couple: PracticeCouple = {
    id: `c${state.nextId}`,
    leader: side === 'leaders' ? dancer : partner,
    follower: side === 'followers' ? dancer : partner,
    done: false,
    groupKey: group.key,
    groupLabel: group.label,
  };

  // After the last couple of the same group, so a division's run stays together.
  let at = state.couples.length;
  for (let i = state.couples.length - 1; i >= 0; i--) {
    if (state.couples[i].groupKey === group.key && isComplete(state.couples[i])) {
      at = i + 1;
      break;
    }
  }
  if (!partner) at = state.couples.length;
  const couples = [...state.couples.slice(0, at), couple, ...state.couples.slice(at)];
  return { ...state, pools, couples, nextId: state.nextId + 1 };
}

/** Couples danced and couples there are, for the header. Lonely entries are not couples. */
export function progress(state: PracticeState): { done: number; total: number } {
  const real = state.couples.filter(isComplete);
  return { done: real.filter((c) => c.done).length, total: real.length };
}
