/**
 * Roster domain logic.
 *
 * Pure functions, no React, no storage — so the rules that matter can be tested
 * directly (D-007). Everything here is about who is dancing and what shape the
 * event will take, not about how any of it looks.
 */

export type Role = 'leader' | 'follower' | 'switch';

export type Dancer = {
  id: string;
  name: string;
  role: Role;
};

export const ROLE_LABELS: Record<Role, string> = {
  leader: 'Leader',
  follower: 'Follower',
  switch: 'Switch',
};

/** Long names have nowhere to go on a wheel segment. */
export const MAX_NAME_LENGTH = 28;

/** Collapse whitespace so " Sarah   M " and "Sarah M" are the same person. */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/** Case-insensitive identity, used for the uniqueness check. */
export function nameKey(raw: string): string {
  return normalizeName(raw).toLowerCase();
}

export type NameCheck = { ok: true; name: string } | { ok: false; reason: string };

/**
 * Names must be unique and must carry a last name or initial.
 *
 * Two dancers called Sarah wreck a draw: the room cannot tell who was picked and
 * the log becomes ambiguous. Rejecting at entry solves it during setup instead of
 * mid-event, when it is expensive.
 */
export function checkName(raw: string, existing: readonly Dancer[]): NameCheck {
  const name = normalizeName(raw);

  if (name.length === 0) {
    return { ok: false, reason: 'Enter a name.' };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      reason: `Too long to fit on the wheel — keep it under ${MAX_NAME_LENGTH} characters.`,
    };
  }

  if (name.split(' ').length < 2) {
    return {
      ok: false,
      reason: 'Add a last name or initial. A first name alone cannot be told apart on the wheel.',
    };
  }

  const clash = existing.find((d) => nameKey(d.name) === nameKey(name));
  if (clash) {
    // Echo the name as it already sits on the roster, not as it was typed — the
    // operator needs to recognise the existing entry, not their own keystrokes.
    return {
      ok: false,
      reason: `${clash.name} is already on the roster. Add a number to tell them apart — "${clash.name} 2".`,
    };
  }

  return { ok: true, name };
}

export type PoolProjection = {
  leaders: number;
  followers: number;
  switches: number;
  /** Pool sizes once switches have been distributed to even things out. */
  balancedLeaders: number;
  balancedFollowers: number;
  /** The shorter pool recycles, so the larger pool decides how many couples dance. */
  couples: number;
};

export type Pools = {
  leaders: Dancer[];
  followers: Dancer[];
};

/**
 * Split the roster into the two pools that will actually dance.
 *
 * Switches fill whichever pool is short at that moment, taken in roster order,
 * so the two end up as even as they can be. Deterministic on purpose: the same
 * roster always produces the same pools.
 *
 * **This is the single source of truth for switch assignment.** The roster screen
 * calls it to project the shape of the event; the session calls it for real at
 * session start. One function, so a projection can never disagree with what
 * actually happens.
 */
export function buildPools(dancers: readonly Dancer[]): Pools {
  const leaders = dancers.filter((d) => d.role === 'leader');
  const followers = dancers.filter((d) => d.role === 'follower');

  for (const dancer of dancers) {
    if (dancer.role !== 'switch') continue;
    if (leaders.length <= followers.length) leaders.push(dancer);
    else followers.push(dancer);
  }

  return { leaders, followers };
}

/** Projection of the event's shape, for guidance while the roster is built. */
export function projectPools(dancers: readonly Dancer[]): PoolProjection {
  const leaders = dancers.filter((d) => d.role === 'leader').length;
  const followers = dancers.filter((d) => d.role === 'follower').length;
  const switches = dancers.filter((d) => d.role === 'switch').length;

  const pools = buildPools(dancers);
  const l = pools.leaders.length;
  const f = pools.followers.length;

  // A pool with nobody in it cannot pair with anything.
  const couples = l === 0 || f === 0 ? 0 : Math.max(l, f);

  return {
    leaders,
    followers,
    switches,
    balancedLeaders: l,
    balancedFollowers: f,
    couples,
  };
}

export type SizeLevel = 'empty' | 'unpairable' | 'small' | 'good' | 'long' | 'over';

export type SizeAdvice = {
  level: SizeLevel;
  headline: string;
  detail: string;
};

/**
 * Event-size guidance. The app says this rather than silently enforcing it —
 * a new organiser should learn the format's shape from the app, not from one
 * long first night.
 */
export function adviseOnSize(projection: PoolProjection): SizeAdvice {
  const { couples, balancedLeaders, balancedFollowers } = projection;

  if (balancedLeaders + balancedFollowers === 0) {
    return {
      level: 'empty',
      headline: 'No dancers yet',
      detail: 'Add dancers and mark each one Leader, Follower or Switch.',
    };
  }

  if (couples === 0) {
    const missing = balancedLeaders === 0 ? 'leaders' : 'followers';
    return {
      level: 'unpairable',
      headline: `No ${missing} yet`,
      detail: `Every couple needs one of each. Add ${missing}, or set someone to Switch.`,
    };
  }

  if (couples < 3) {
    return {
      level: 'small',
      headline: `${couples} ${couples === 1 ? 'couple' : 'couples'} — small event`,
      detail: 'Three couples is the usual minimum for a session. You can still run it.',
    };
  }

  if (couples <= 5) {
    return {
      level: 'good',
      headline: `${couples} couples — good size`,
      detail: 'Five couples is the sweet spot for spotlight dancing.',
    };
  }

  if (couples <= 10) {
    return {
      level: 'long',
      headline: `${couples} couples — getting long`,
      detail:
        'Everyone watches one couple at a time, so the night grows with each pair. Five is the sweet spot.',
    };
  }

  return {
    level: 'over',
    headline: `${couples} couples — over the maximum`,
    detail:
      'Ten couples is the cap. Past that, the dancers who went first are bored long before the last pair.',
  };
}

export function makeDancer(name: string, role: Role): Dancer {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    role,
  };
}
