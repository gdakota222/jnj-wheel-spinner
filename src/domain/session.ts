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
import { WESTIE_STARTER_PACK, type Prompt } from './prompts';
import {
  DEFAULT_DIVISION_SETTINGS,
  countCouples,
  divisionGroups,
  groupOf,
  type DivisionGroup,
  type DivisionSettings,
} from './divisions';

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
  /** Index the in-flight dancer spin will land on, resolved when it settles. */
  pendingIndex: number | null;
  /**
   * The challenge the in-flight prompt spin will land on.
   *
   * An id rather than a position: the list the screen aimed at and the list the
   * reducer resolves against have to be the same one, and an index silently
   * stops meaning the same thing the moment either list changes. That mistake
   * cost a hung wheel once already (D-028).
   */
  pendingPromptId: string | null;
  drawn: Partial<Record<PoolName, Dancer>>;
  rotation: number;
  /**
   * Where the wheel sat before the current spin.
   *
   * The wheel component is unmounted while a couple dances, so a spin started
   * from that screen — redrawing a challenge — would remount the wheel already
   * sitting at its target and animate nothing at all. Carrying the starting
   * angle in state lets it animate from the right place however it got there.
   */
  previousRotation: number;
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
   * A challenge held off the wheel for this couple.
   *
   * Set when a challenge is redrawn: the one being replaced comes off the wheel
   * entirely rather than staying on it unwinnable, so the spin visibly offers
   * something new. Cleared when the couple is committed, which puts it back in
   * circulation for everybody else.
   */
  promptExcludedId: string | null;

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
  /**
   * The crowned couple, as a position in `log`.
   *
   * An index rather than a copy of the couple: the log is the record of who
   * actually danced, and a winner that could disagree with it is a winner the
   * app made up. Null until the operator crowns one, and null is a real answer —
   * a night can end without a winner and often should.
   *
   * How the operator arrived at the choice is entirely off-app: their judgment,
   * a panel, the volume of the room. The app records and reveals it.
   */
  winner: number | null;
  /**
   * The challenge everybody danced at the end, if the operator called one.
   *
   * Kept apart from `log`, which is a record of couples — the all-skate has no
   * couple and no judging. Null is the normal case: some nights end better on
   * the crown, so the finale is offered and never automatic.
   */
  allSkate: Prompt | null;

  /**
   * Matching by division (D-058, D-062). The first spin draws from everyone who
   * is still owed a dance; the second shows only partners in the same division
   * group. Off whenever the organizer has not turned it on.
   */
  divisions: DivisionSettings;
};

export type SessionAction =
  | { type: 'spin'; index: number; rotation: number }
  | { type: 'settled' }
  | { type: 'respin'; index: number; rotation: number }
  | { type: 'spinPrompt'; promptId: string; rotation: number }
  | { type: 'respinPrompt'; promptId: string; rotation: number }
  | { type: 'jamOver' }
  | { type: 'nextCouple' }
  | { type: 'syncDancers'; dancers: Dancer[] }
  | { type: 'crownWinner'; index: number }
  | { type: 'uncrown' }
  | { type: 'allSkate'; promptId: string };

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
  deck: readonly Prompt[] = WESTIE_STARTER_PACK.prompts,
  divisions: DivisionSettings = DEFAULT_DIVISION_SETTINGS,
): SessionState {
  const pools = buildPools(dancers);
  const originals = { leaders: pools.leaders, followers: pools.followers };
  const couplesTotal = totalCouples(originals, divisions);

  return {
    spinOrder,
    originals,
    remaining: { leaders: [...originals.leaders], followers: [...originals.followers] },
    recycled: { leaders: false, followers: false },
    phase: couplesTotal === 0 ? 'complete' : 'ready',
    currentPool: spinOrder,
    wheelPool: spinOrder,
    pendingIndex: null,
    pendingPromptId: null,
    drawn: {},
    rotation: 0,
    previousRotation: 0,
    log: [],
    couplesTotal,
    promptsEnabled,
    promptDeck: [...deck],
    promptsRemaining: [...deck],
    currentPrompt: null,
    promptsRecycled: false,
    promptExcludedId: null,
    winner: null,
    allSkate: null,
    jamboreeDancers: [],
    phaseAfterJamboree: null,
    jammed: [],
    divisions,
  };
}

/**
 * How many couples the night will dance. Without divisions, the larger pool
 * decides; with them, each division group dances as many as its larger side,
 * and a group with nobody on one side (Strict) dances none.
 */
function totalCouples(originals: Record<PoolName, Dancer[]>, divisions: DivisionSettings): number {
  if (divisions.enabled) return countCouples(originals, divisions);
  return originals.leaders.length === 0 || originals.followers.length === 0
    ? 0
    : Math.max(originals.leaders.length, originals.followers.length);
}

const divisionsOn = (state: SessionState) => state.divisions?.enabled === true;

function groupsFor(state: SessionState): DivisionGroup[] {
  return divisionGroups(state.originals, state.divisions ?? DEFAULT_DIVISION_SETTINGS);
}

/** Couples a division group still has to dance tonight. */
function owedBy(state: SessionState, group: DivisionGroup): number {
  if (group.leaders.length === 0 || group.followers.length === 0) return 0;
  const leaders = new Set(group.leaders.map((d) => d.id));
  const followers = new Set(group.followers.map((d) => d.id));
  const danced = state.log.filter(
    (c) => leaders.has(c.leader.id) && followers.has(c.follower.id),
  ).length;
  return Math.max(group.leaders.length, group.followers.length) - danced;
}

/**
 * The division group a draw from `pool` must come from, when its partner has
 * already been drawn. Null for the first draw of a couple, and always null with
 * divisions off.
 */
export function partnerGroup(state: SessionState, pool: PoolName): DivisionGroup | null {
  if (!divisionsOn(state)) return null;
  const other = OTHER_POOL[pool];
  const partner = state.drawn[other];
  if (!partner) return null;
  return groupOf(groupsFor(state), partner, other) ?? null;
}

/**
 * The division a draw from `pool` is limited to, for the screen to say so —
 * "Followers — Intermediate". Drawing within a division is honest only while it
 * is said out loud (D-062).
 */
export function drawLimitLabel(state: SessionState, pool: PoolName): string | null {
  return partnerGroup(state, pool)?.label ?? null;
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
  const withoutExcluded = (list: Prompt[]) =>
    state.promptExcludedId ? list.filter((p) => p.id !== state.promptExcludedId) : list;

  if (state.promptsRemaining.length > 0) {
    const entries = withoutExcluded(state.promptsRemaining);
    if (entries.length > 0) return { entries, recycledNow: false };
  }
  // Exhausted, or the only one left is the one being replaced.
  const recycled = withoutExcluded([...state.promptDeck]);
  return { entries: recycled.length > 0 ? recycled : [...state.promptDeck], recycledNow: true };
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
  if (divisionsOn(state)) return divisionPoolEntries(state, pool);
  const entries = state.remaining[pool];
  if (entries.length > 0) return { entries, recycledNow: false };
  return { entries: [...state.originals[pool]], recycledNow: true };
}

/**
 * The same question with divisions on, answered group by group.
 *
 * The second draw comes only from the drawn partner's group. The first draw
 * comes from every group still owed a couple — which keeps a one-sided group
 * in Strict off the wheel entirely, as its dancers were warned at setup. Within
 * a group the short side recycles exactly as the whole floor does without
 * divisions: nobody twice before everyone in their group once.
 *
 * Listed in roster order, so the screen and the reducer always agree on which
 * index is which name.
 */
function divisionPoolEntries(
  state: SessionState,
  pool: PoolName,
): { entries: Dancer[]; recycledNow: boolean } {
  const undrawn = new Set(state.remaining[pool].map((d) => d.id));
  const limit = partnerGroup(state, pool);
  const groups = limit ? [limit] : groupsFor(state).filter((g) => owedBy(state, g) > 0);

  let recycledNow = false;
  const ids = new Set<string>();
  for (const group of groups) {
    const fresh = group[pool].filter((d) => undrawn.has(d.id));
    if (fresh.length === 0) recycledNow = true;
    for (const d of fresh.length > 0 ? fresh : group[pool]) ids.add(d.id);
  }
  return { entries: state.originals[pool].filter((d) => ids.has(d.id)), recycledNow };
}

/** The pool a re-spin would draw from: the one holding the most recent draw. */
export function respinPool(state: SessionState): PoolName {
  return state.phase === 'drawn' ? OTHER_POOL[state.currentPool] : state.currentPool;
}

/**
 * What a re-spin will draw from, with the discarded dancer still eligible.
 *
 * Its own question because it is a different pool from `drawEntries` whenever
 * the first name of a pair is re-spun — sizing that spin against the other pool
 * aimed the wheel at the wrong segment (found 0.16.0).
 */
export function respinEntries(state: SessionState): Dancer[] {
  const pool = respinPool(state);
  const drawn = { ...state.drawn };
  delete drawn[pool];
  return poolEntries({ ...state, drawn }, pool).entries;
}

/** Put `entries` back into a pool without disturbing anyone already waiting there. */
function refill(
  remaining: Record<PoolName, Dancer[]>,
  pool: PoolName,
  entries: Dancer[],
): Record<PoolName, Dancer[]> {
  const waiting = new Set(remaining[pool].map((d) => d.id));
  return { ...remaining, [pool]: [...remaining[pool], ...entries.filter((d) => !waiting.has(d.id))] };
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
    return { ...state, phase: 'pair', pendingIndex: null, pendingPromptId: null, currentPrompt: null };
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
        // Added back rather than replaced: with divisions, one group can come
        // round again while another still has dancers waiting.
        remaining: recycledNow
          ? refill(state.remaining, state.currentPool, entries)
          : state.remaining,
        recycled: recycledNow
          ? { ...state.recycled, [state.currentPool]: true }
          : state.recycled,
        wheelPool: state.currentPool,
        phase: 'spinning',
        pendingIndex: action.index,
        previousRotation: state.rotation,
        rotation: action.rotation,
      };
    }

    case 'settled': {
      if (state.pendingIndex === null && state.pendingPromptId === null) return state;

      if (state.phase === 'prompt-spinning') {
        const pool = promptEntriesFor(state).entries;
        const prompt = pool.find((p) => p.id === state.pendingPromptId) ?? pool[0];
        if (!prompt) return state;
        // The prompt stays on the wheel until the couple is committed, exactly
        // like a dancer — otherwise it vanishes from under the pointer the moment
        // it lands, at the moment the room is looking at it.
        return {
          ...state,
          currentPrompt: prompt,
          pendingPromptId: null,
          phase: 'couple',
        };
      }

      if (state.phase !== 'spinning' || state.pendingIndex === null) return state;
      const pool = state.currentPool;
      // Resolved against exactly the list the screen aimed at. Without divisions
      // that is the undrawn pool, as it always was; with them, the same pool
      // narrowed to the right group.
      const candidates = poolEntries(state, pool).entries;
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
      const { entries, recycledNow } = poolEntries({ ...state, drawn }, pool);
      if (entries.length === 0) return state;

      return {
        ...state,
        remaining: recycledNow ? refill(state.remaining, pool, entries) : state.remaining,
        drawn,
        currentPool: pool,
        wheelPool: pool,
        phase: 'spinning',
        pendingIndex: action.index,
        previousRotation: state.rotation,
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

      // Redrawing takes the current challenge off the wheel, so the spin plainly
      // offers something else rather than passing over an unwinnable segment.
      const excludedId =
        action.type === 'respinPrompt'
          ? (state.currentPrompt?.id ?? state.promptExcludedId)
          : state.promptExcludedId;

      const { entries, recycledNow } = promptEntriesFor({ ...state, promptExcludedId: excludedId });
      if (entries.length === 0) return state;

      return {
        ...state,
        promptsRemaining: recycledNow ? [...state.promptDeck] : state.promptsRemaining,
        promptsRecycled: recycledNow ? true : state.promptsRecycled,
        promptExcludedId: excludedId,
        // A re-spun prompt goes back in the deck; it was never danced.
        currentPrompt: null,
        phase: 'prompt-spinning',
        pendingPromptId: action.promptId,
        previousRotation: state.rotation,
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
        promptExcludedId: null,
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
    /**
     * Crown a couple. Only once everyone has danced, and only a couple that
     * actually took the floor — a crown handed to someone who never danced is
     * the one result nobody in the room could argue with, and it would be wrong.
     */
    case 'crownWinner': {
      if (state.phase !== 'complete') return state;
      if (!Number.isInteger(action.index)) return state;
      if (action.index < 0 || action.index >= state.log.length) return state;
      return { ...state, winner: action.index };
    }

    case 'uncrown': {
      if (state.winner === null) return state;
      return { ...state, winner: null };
    }

    /**
     * The last dance of the night: one challenge, everybody on the floor.
     *
     * Drawn from the whole deck rather than what is left, because how it was
     * landed on is the operator's business — a favourite coming back is often
     * the better ending. Prompts being switched off for the session does not
     * stop it: nobody is being judged, and the operator opted in deliberately.
     */
    case 'allSkate': {
      if (state.phase !== 'complete') return state;
      const prompt = state.promptDeck.find((p) => p.id === action.promptId);
      if (!prompt) return state;
      return { ...state, allSkate: prompt };
    }

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

      const planned = totalCouples(originals, state.divisions ?? DEFAULT_DIVISION_SETTINGS);
      const couplesTotal = planned === 0 ? log.length : Math.max(planned, log.length);

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
