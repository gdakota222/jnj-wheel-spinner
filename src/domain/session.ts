/**
 * The session: one pass through the roster, one couple at a time.
 *
 * Modelled as a reducer so the whole session is a single serialisable value.
 * That is what makes crash recovery and tablet handoff (0.6.0) the same three
 * lines rather than three features — see D-005.
 *
 * No React, no storage, no randomness. The caller picks the winning index and
 * the target rotation and hands them in, so every transition here is
 * deterministic and testable.
 */
import { buildPools, type Dancer } from './roster';

export type PoolName = 'leaders' | 'followers';

/** Which pool is drawn first. Chosen once, locked for the whole session. */
export type SpinOrder = PoolName;

export type Couple = {
  leader: Dancer;
  follower: Dancer;
};

export type SessionPhase =
  /** Waiting for the operator to spin for `currentPool`. */
  | 'ready'
  /** The wheel is turning. */
  | 'spinning'
  /** The first of the pair has landed; the second pool is next. */
  | 'drawn'
  /** Both landed. The couple is on screen and dancing. */
  | 'couple'
  /** Everyone has danced. */
  | 'complete';

export type SessionState = {
  spinOrder: SpinOrder;
  /** Everyone who started in each pool. Recycling refills from these. */
  originals: Record<PoolName, Dancer[]>;
  /** Who is still undrawn in each pool. */
  remaining: Record<PoolName, Dancer[]>;
  /** Whether a pool has been refilled at least once, so the UI can say so. */
  recycled: Record<PoolName, boolean>;
  phase: SessionPhase;
  /** The pool the draw is working on. */
  currentPool: PoolName;
  /**
   * The pool the wheel is showing. Lags `currentPool` deliberately: after a name
   * lands, the wheel keeps showing the pool it landed in, with the winner still
   * on it, until the next spin starts. Otherwise the wheel would swap to the
   * other pool the instant a name landed.
   */
  wheelPool: PoolName;
  /** Index the in-flight spin will land on, resolved when it settles. */
  pendingIndex: number | null;
  drawn: Partial<Record<PoolName, Dancer>>;
  rotation: number;
  log: Couple[];
  /** How many couples this session will produce in total. */
  couplesTotal: number;
};

export type SessionAction =
  | { type: 'spin'; index: number; rotation: number }
  | { type: 'settled' }
  | { type: 'respin'; index: number; rotation: number }
  | { type: 'nextCouple' }
  | { type: 'syncDancers'; dancers: Dancer[] };

export const OTHER_POOL: Record<PoolName, PoolName> = {
  leaders: 'followers',
  followers: 'leaders',
};

export const POOL_LABEL: Record<PoolName, string> = {
  leaders: 'Leaders',
  followers: 'Followers',
};

/** Singular form, for talking about one dancer rather than the pool. */
export const POOL_NOUN: Record<PoolName, string> = {
  leaders: 'leader',
  followers: 'follower',
};

export function createSession(dancers: readonly Dancer[], spinOrder: SpinOrder): SessionState {
  const pools = buildPools(dancers);
  const originals = { leaders: pools.leaders, followers: pools.followers };
  const couplesTotal =
    originals.leaders.length === 0 || originals.followers.length === 0
      ? 0
      : Math.max(originals.leaders.length, originals.followers.length);

  return {
    spinOrder,
    originals,
    remaining: { leaders: [...originals.leaders], followers: [...originals.followers] },
    recycled: { leaders: false, followers: false },
    phase: couplesTotal === 0 ? 'complete' : 'ready',
    currentPool: spinOrder,
    wheelPool: spinOrder,
    pendingIndex: null,
    drawn: {},
    rotation: 0,
    log: [],
    couplesTotal,
  };
}

/**
 * The pool being spun, refilled first if it has run dry.
 *
 * The larger pool holds exactly `couplesTotal` dancers, so it drains once and
 * never refills. Only the shorter pool ever comes back round — which is why a
 * couple can never repeat: a repeat needs *both* halves to come around again.
 */
function poolEntries(
  state: SessionState,
  pool: PoolName,
): { entries: Dancer[]; recycledNow: boolean } {
  const entries = state.remaining[pool];
  if (entries.length > 0) return { entries, recycledNow: false };
  return { entries: [...state.originals[pool]], recycledNow: true };
}

/** What the wheel should be showing right now. */
export function wheelEntries(state: SessionState): Dancer[] {
  return poolEntries(state, state.wheelPool).entries;
}

/** True when the next spin will bring already-danced dancers back onto the wheel. */
export function willRecycle(state: SessionState): boolean {
  return poolEntries(state, state.currentPool).recycledNow;
}

/**
 * A pool down to its last name still gets a spin (D-017) — but the app should be
 * in on the joke rather than pretending there is suspense.
 */
export function isForegoneConclusion(state: SessionState): boolean {
  return poolEntries(state, state.currentPool).entries.length === 1;
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'spin': {
      if (state.phase !== 'ready' && state.phase !== 'drawn') return state;
      const { entries, recycledNow } = poolEntries(state, state.currentPool);
      if (entries.length === 0) return state;
      return {
        ...state,
        remaining: recycledNow
          ? { ...state.remaining, [state.currentPool]: entries }
          : state.remaining,
        recycled: recycledNow
          ? { ...state.recycled, [state.currentPool]: true }
          : state.recycled,
        wheelPool: state.currentPool,
        phase: 'spinning',
        pendingIndex: action.index,
        rotation: action.rotation,
      };
    }

    case 'settled': {
      if (state.phase !== 'spinning' || state.pendingIndex === null) return state;
      const pool = state.currentPool;
      const dancer = state.remaining[pool][state.pendingIndex];
      if (!dancer) return state;

      // The winner stays on the wheel until the couple is committed, so the name
      // does not vanish from under the pointer the moment it lands.
      const drawn = { ...state.drawn, [pool]: dancer };
      const bothDrawn = drawn.leaders !== undefined && drawn.followers !== undefined;
      return {
        ...state,
        drawn,
        pendingIndex: null,
        phase: bothDrawn ? 'couple' : 'drawn',
        currentPool: bothDrawn ? pool : OTHER_POOL[pool],
      };
    }

    /**
     * Discard the name just drawn and spin that pool again.
     *
     * The discarded dancer goes straight back and stays eligible. This stays
     * available right up until `nextCouple` commits the pairing — the couple is
     * only finished once it is in the log.
     */
    case 'respin': {
      if (state.phase !== 'drawn' && state.phase !== 'couple') return state;
      // The most recent draw is the one from the pool spun last.
      const pool = state.phase === 'couple' ? state.currentPool : OTHER_POOL[state.currentPool];
      if (!state.drawn[pool]) return state;

      // The discarded dancer never left the pool, so they are still eligible —
      // exactly what "returns to the pool immediately" asks for.
      const drawn = { ...state.drawn };
      delete drawn[pool];

      return {
        ...state,
        drawn,
        currentPool: pool,
        wheelPool: pool,
        phase: 'spinning',
        pendingIndex: action.index,
        rotation: action.rotation,
      };
    }

    case 'nextCouple': {
      if (state.phase !== 'couple') return state;
      const leader = state.drawn.leaders;
      const follower = state.drawn.followers;
      if (!leader || !follower) return state;

      const log = [...state.log, { leader, follower }];
      const complete = log.length >= state.couplesTotal;
      // Committing the pairing is what takes both dancers off the wheel.
      const remaining = {
        leaders: state.remaining.leaders.filter((d) => d.id !== leader.id),
        followers: state.remaining.followers.filter((d) => d.id !== follower.id),
      };
      return {
        ...state,
        remaining,
        log,
        drawn: {},
        pendingIndex: null,
        phase: complete ? 'complete' : 'ready',
        currentPool: state.spinOrder,
        wheelPool: state.spinOrder,
      };
    }

    /**
     * The roster was edited mid-session.
     *
     * Removed dancers leave the pools; added ones join as undrawn; renames follow
     * through everywhere, including into the log, since a dance that happened
     * still happened — it just happened to a differently-spelled person.
     */
    case 'syncDancers': {
      const byId = new Map(action.dancers.map((d) => [d.id, d]));
      const pools = buildPools(action.dancers);
      const originals = { leaders: pools.leaders, followers: pools.followers };

      const previouslyKnown = new Set(
        [...state.originals.leaders, ...state.originals.followers].map((d) => d.id),
      );

      const remaining = {} as Record<PoolName, Dancer[]>;
      for (const pool of ['leaders', 'followers'] as const) {
        const stillUndrawn = new Set(state.remaining[pool].map((d) => d.id));
        remaining[pool] = originals[pool].filter(
          (d) => stillUndrawn.has(d.id) || !previouslyKnown.has(d.id),
        );
      }

      // A dancer who has been removed can no longer be half of the current draw.
      const drawn: Partial<Record<PoolName, Dancer>> = {};
      for (const pool of ['leaders', 'followers'] as const) {
        const current = state.drawn[pool];
        if (current && byId.has(current.id)) drawn[pool] = byId.get(current.id)!;
      }

      const log = state.log
        .map((couple) => ({
          leader: byId.get(couple.leader.id) ?? couple.leader,
          follower: byId.get(couple.follower.id) ?? couple.follower,
        }))
        .filter(Boolean);

      const couplesTotal =
        originals.leaders.length === 0 || originals.followers.length === 0
          ? log.length
          : Math.max(originals.leaders.length, originals.followers.length, log.length);

      const bothDrawn = drawn.leaders !== undefined && drawn.followers !== undefined;
      let phase: SessionPhase;
      if (log.length >= couplesTotal) phase = 'complete';
      else if (bothDrawn) phase = 'couple';
      else if (state.phase === 'spinning') phase = 'ready';
      else phase = drawn.leaders || drawn.followers ? 'drawn' : 'ready';

      // Whichever half is still missing is the pool to spin next.
      let currentPool: PoolName;
      if (bothDrawn) currentPool = state.currentPool;
      else if (drawn.leaders) currentPool = 'followers';
      else if (drawn.followers) currentPool = 'leaders';
      else currentPool = state.spinOrder;

      return {
        ...state,
        originals,
        remaining,
        drawn,
        log,
        couplesTotal,
        phase,
        currentPool,
        wheelPool: currentPool,
        pendingIndex: null,
      };
    }

    default:
      return state;
  }
}
