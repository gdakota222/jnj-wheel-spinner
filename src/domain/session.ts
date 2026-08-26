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
import { WCS_STARTER_DECK, type Prompt } from './prompts';

export type PoolName = 'leaders' | 'followers';

/** Which pool is drawn first. Chosen once, locked for the whole session. */
export type SpinOrder = PoolName;

export type Couple = {
  leader: Dancer;
  follower: Dancer;
  /** What they danced, when prompts are on. */
  prompt: Prompt | null;
};

export type SessionPhase =
  /** Waiting for the operator to spin for `currentPool`. */
  | 'ready'
  /** The wheel is turning. */
  | 'spinning'
  /** The first of the pair has landed; the second pool is next. */
  | 'drawn'
  /** Both dancers are drawn, but their prompt has not been spun yet. */
  | 'pair'
  /** The prompt wheel is turning. */
  | 'prompt-spinning'
  /** The couple is on screen and dancing. */
  | 'couple'
  /** A birthday dancer was just drawn; everything stops for the jam. */
  | 'jamboree'
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

  /** Chosen during setup, never defaulted — see D-015. */
  promptsEnabled: boolean;
  /** The whole deck this session draws from. */
  promptDeck: Prompt[];
  /** Prompts not yet used tonight. Refilled only once exhausted, and never silently. */
  promptsRemaining: Prompt[];
  /** The prompt this couple is dancing. */
  currentPrompt: Prompt | null;
  /** True once the deck has been exhausted and started over. */
  promptsRecycled: boolean;

  /**
   * Everyone being jammed right now. Empty when no jam is running.
   *
   * All the birthday dancers at once, not just the one who was drawn: the jam
   * fires at whichever of them the wheel reaches first and covers the lot.
   */
  jamboreeDancers: Dancer[];
  /**
   * Where the session goes once the jam is over.
   *
   * The jamboree interrupts *after* a draw has resolved, so the phase the draw
   * was heading for is parked here and restored by `jamOver`. That is what makes
   * it work identically whichever spin drew the birthday dancer.
   */
  phaseAfterJamboree: SessionPhase | null;
  /** Birthday dancers already jammed tonight — nobody gets two. */
  jammed: string[];
};

export type SessionAction =
  | { type: 'spin'; index: number; rotation: number }
  | { type: 'settled' }
  | { type: 'respin'; index: number; rotation: number }
  | { type: 'spinPrompt'; index: number; rotation: number }
  | { type: 'respinPrompt'; index: number; rotation: number }
  | { type: 'jamOver' }
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

export function createSession(
  dancers: readonly Dancer[],
  spinOrder: SpinOrder,
  promptsEnabled = false,
  deck: readonly Prompt[] = WCS_STARTER_DECK.prompts,
): SessionState {
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
    promptsEnabled,
    promptDeck: [...deck],
    promptsRemaining: [...deck],
    currentPrompt: null,
    promptsRecycled: false,
    jamboreeDancers: [],
    phaseAfterJamboree: null,
    jammed: [],
  };
}

/** "A", "A and B", "A, B and C" — read aloud to a room, so it has to scan. */
export function formatNames(names: readonly string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** Everyone in this session marked as a birthday dancer, in pool order. */
export function birthdayDancers(state: SessionState): Dancer[] {
  return [...state.originals.leaders, ...state.originals.followers].filter(
    (d) => d.isBirthday === true,
  );
}

/**
 * The jam's own prompt. Written here so it reads the same everywhere it appears.
 *
 * Names every birthday dancer, however many there are: the room jams them all
 * together in one go rather than stopping the session once per person.
 */
export function jamboreePrompt(dancers: readonly Dancer[]): Prompt {
  const names = formatNames(dancers.map((d) => d.name));
  return {
    id: `jamboree-${dancers.map((d) => d.id).join('-')}`,
    name: 'Jamboree',
    description: `Happy Birthday ${names}! All contestants and/or viewers must birthday jam ${names}, but they get to choose the song!`,
  };
}

/**
 * The prompts the wheel should show, refilled first if the deck has run dry.
 *
 * Exhaustion is surfaced rather than hidden (see `promptsExhausted`): the
 * operator is told the deck has been used up before it starts over, so they can
 * add prompts or switch decks instead if they would rather.
 */
function promptEntriesFor(state: SessionState): { entries: Prompt[]; recycledNow: boolean } {
  if (state.promptsRemaining.length > 0) {
    return { entries: state.promptsRemaining, recycledNow: false };
  }
  return { entries: [...state.promptDeck], recycledNow: true };
}

/** What the prompt wheel should be showing. */
export function promptEntries(state: SessionState): Prompt[] {
  return promptEntriesFor(state).entries;
}

/** True when the next prompt spin will start the deck over. */
export function promptsExhausted(state: SessionState): boolean {
  return state.promptsEnabled && promptEntriesFor(state).recycledNow;
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

/**
 * What the wheel is *showing*.
 *
 * Deliberately not the same as what is being *drawn*: between a landing and the
 * next spin, the wheel still shows the pool it landed in. Use `drawEntries` for
 * anything that has to agree with the reducer.
 */
export function wheelEntries(state: SessionState): Dancer[] {
  return poolEntries(state, state.wheelPool).entries;
}

/**
 * The pool the next spin will actually draw from.
 *
 * Any caller picking a winning index **must** size it against this, not against
 * `wheelEntries` — the two differ whenever a name has just landed, and an index
 * chosen against the wrong one lands outside the pool.
 */
export function drawEntries(state: SessionState): Dancer[] {
  return poolEntries(state, state.currentPool).entries;
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

/**
 * Normalise a session restored from storage.
 *
 * A session can be interrupted mid-spin — the tablet locks, the battery dies,
 * the tab is dropped for memory. The winner was already chosen at that point,
 * but **nobody in the room saw it land**, and a restored wheel sitting at its
 * target rotation would never fire the transition that settles it: the app would
 * come back showing a wheel that is stuck forever.
 *
 * So an interrupted spin is rolled back rather than resolved. Nothing was
 * witnessed, so nothing happened, and the operator simply spins again. That is
 * both the honest outcome and the one that cannot hang.
 */
export function resumeSession(state: SessionState): SessionState {
  if (state.phase === 'spinning') {
    const halfDrawn = state.drawn.leaders !== undefined || state.drawn.followers !== undefined;
    return { ...state, phase: halfDrawn ? 'drawn' : 'ready', pendingIndex: null };
  }
  if (state.phase === 'prompt-spinning') {
    return { ...state, phase: 'pair', pendingIndex: null, currentPrompt: null };
  }
  // A jamboree is not a spin — it is a moment in the room, and it survives intact.
  return state;
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
      if (state.pendingIndex === null) return state;

      if (state.phase === 'prompt-spinning') {
        const prompt = promptEntriesFor(state).entries[state.pendingIndex];
        if (!prompt) return state;
        // The prompt stays on the wheel until the couple is committed, exactly
        // like a dancer — otherwise it vanishes from under the pointer the moment
        // it lands, at the moment the room is looking at it.
        return {
          ...state,
          currentPrompt: prompt,
          pendingIndex: null,
          phase: 'couple',
        };
      }

      if (state.phase !== 'spinning') return state;
      const pool = state.currentPool;
      const candidates = state.remaining[pool];
      if (candidates.length === 0) return state;
      // Clamp rather than stall. An index outside the pool is a caller bug, but
      // the failure mode here would be the wheel spinning forever in front of a
      // room, which is far worse than quietly landing on the last name.
      const dancer = candidates[Math.min(state.pendingIndex, candidates.length - 1)];

      // The winner stays on the wheel until the couple is committed, so the name
      // does not vanish from under the pointer the moment it lands.
      const drawn = { ...state.drawn, [pool]: dancer };
      const bothDrawn = drawn.leaders !== undefined && drawn.followers !== undefined;
      // With prompts on, the pair still needs its challenge before they dance.
      const nextPhase: SessionPhase = bothDrawn
        ? state.promptsEnabled
          ? 'pair'
          : 'couple'
        : 'drawn';

      // A birthday dancer stops everything. The phase the draw was heading for is
      // parked and restored by `jamOver`, so this works the same whether they were
      // the first name drawn or the second, and whichever role they dance.
      //
      // The jam covers *every* birthday dancer, not only the one the wheel
      // reached. One interruption, everybody jammed together — quicker than
      // stopping the night once per person, and better as a moment.
      const owedAJam = dancer.isBirthday === true && !state.jammed.includes(dancer.id);
      const celebrating = owedAJam
        ? birthdayDancers({ ...state, drawn }).filter((d) => !state.jammed.includes(d.id))
        : [];

      return {
        ...state,
        drawn,
        pendingIndex: null,
        phase: owedAJam ? 'jamboree' : nextPhase,
        jamboreeDancers: celebrating,
        phaseAfterJamboree: owedAJam ? nextPhase : null,
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
      if (state.phase !== 'drawn' && state.phase !== 'pair' && state.phase !== 'couple') {
        return state;
      }
      // The most recent draw is the one from the pool spun last.
      const pool = state.phase === 'drawn' ? OTHER_POOL[state.currentPool] : state.currentPool;
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

    /**
     * Draw this couple's prompt. Same shape as a dancer spin: the caller picks
     * the index, so the draw stays honest and testable.
     */
    case 'spinPrompt':
    case 'respinPrompt': {
      const allowed =
        action.type === 'spinPrompt'
          ? state.phase === 'pair'
          : state.phase === 'couple' || state.phase === 'pair';
      if (!allowed || !state.promptsEnabled) return state;

      const { entries, recycledNow } = promptEntriesFor(state);
      if (entries.length === 0) return state;

      return {
        ...state,
        promptsRemaining: recycledNow ? entries : state.promptsRemaining,
        promptsRecycled: recycledNow ? true : state.promptsRecycled,
        // A re-spun prompt goes back in the deck; it was never danced.
        currentPrompt: null,
        phase: 'prompt-spinning',
        pendingIndex: action.index,
        rotation: action.rotation,
      };
    }

    /** The jam is done; carry on as if it had never interrupted. */
    case 'jamOver': {
      if (state.phase !== 'jamboree' || state.jamboreeDancers.length === 0) return state;
      return {
        ...state,
        phase: state.phaseAfterJamboree ?? 'drawn',
        // Everyone jammed together is everyone marked done together, so a second
        // birthday dancer being drawn later does not stop the night again.
        jammed: [...state.jammed, ...state.jamboreeDancers.map((d) => d.id)],
        jamboreeDancers: [],
        phaseAfterJamboree: null,
      };
    }

    case 'nextCouple': {
      if (state.phase !== 'couple') return state;
      const leader = state.drawn.leaders;
      const follower = state.drawn.followers;
      if (!leader || !follower) return state;

      const log = [...state.log, { leader, follower, prompt: state.currentPrompt }];
      const complete = log.length >= state.couplesTotal;
      // Committing the pairing is what takes both dancers, and their prompt,
      // out of play for the rest of the session.
      const remaining = {
        leaders: state.remaining.leaders.filter((d) => d.id !== leader.id),
        followers: state.remaining.followers.filter((d) => d.id !== follower.id),
      };
      const promptsRemaining = state.currentPrompt
        ? state.promptsRemaining.filter((p) => p.id !== state.currentPrompt!.id)
        : state.promptsRemaining;
      return {
        ...state,
        remaining,
        promptsRemaining,
        log,
        drawn: {},
        currentPrompt: null,
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
          prompt: couple.prompt,
        }))
        .filter(Boolean);

      const couplesTotal =
        originals.leaders.length === 0 || originals.followers.length === 0
          ? log.length
          : Math.max(originals.leaders.length, originals.followers.length, log.length);

      const bothDrawn = drawn.leaders !== undefined && drawn.followers !== undefined;
      let phase: SessionPhase;
      // Removing the birthday dancer mid-jam ends the jam rather than stranding it.
      const stillCelebrating = state.jamboreeDancers.filter((d) => byId.has(d.id));
      if (state.phase === 'jamboree' && stillCelebrating.length > 0) {
        phase = 'jamboree';
      } else if (log.length >= couplesTotal) phase = 'complete';
      else if (bothDrawn) phase = state.currentPrompt ? 'couple' : state.promptsEnabled ? 'pair' : 'couple';
      else if (state.phase === 'spinning' || state.phase === 'prompt-spinning') phase = 'ready';
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
        jamboreeDancers: phase === 'jamboree' ? stillCelebrating : [],
        phaseAfterJamboree: phase === 'jamboree' ? state.phaseAfterJamboree : null,
      };
    }

    default:
      return state;
  }
}
