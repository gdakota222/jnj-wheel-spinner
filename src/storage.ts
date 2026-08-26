/**
 * Device-local storage.
 *
 * Versioned keys from the start, so a later schema change can migrate rather than
 * silently corrupt a roster the night before an event. Reads are defensive: a
 * damaged value returns the fallback instead of taking the app down.
 */
import type { Dancer, Role } from './domain/roster';
import type { SessionState } from './domain/session';

const ROSTER_KEY = 'jnj:v1:roster';
const EXCLUDED_PROMPTS_KEY = 'jnj:v1:excluded-prompts';
const SESSION_KEY = 'jnj:v1:session';
const PROBE_KEY = 'jnj:v1:probe';

/**
 * The shape of a stored session.
 *
 * Bumped whenever SessionState changes in a way that would break a session saved
 * by an older build. A mismatch discards the saved session rather than restoring
 * something the current code cannot read — losing an in-flight session is bad,
 * but crashing on launch in front of a room is worse.
 */
const SESSION_SCHEMA = 1;

const ROLES: readonly Role[] = ['leader', 'follower', 'switch'];

function isDancer(value: unknown): value is Dancer {
  if (typeof value !== 'object' || value === null) return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    typeof d.role === 'string' &&
    ROLES.includes(d.role as Role)
  );
}

export function loadRoster(): Dancer[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDancer);
  } catch {
    return [];
  }
}

export function saveRoster(dancers: readonly Dancer[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(dancers));
  } catch {
    // Storage full or blocked (private browsing). The session still works in
    // memory; losing persistence is better than losing the app mid-event.
  }
}

/**
 * Prompts the operator has set aside in the Prompt Bank.
 *
 * Stored as ids rather than whole prompts, so a prompt that is later edited or
 * renamed stays excluded, and an id that no longer exists is simply ignored.
 */
export function loadExcludedPrompts(): string[] {
  try {
    const raw = localStorage.getItem(EXCLUDED_PROMPTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function saveExcludedPrompts(ids: readonly string[]): void {
  try {
    localStorage.setItem(EXCLUDED_PROMPTS_KEY, JSON.stringify(ids));
  } catch {
    // See loadRoster: losing persistence is better than losing the app.
  }
}

/**
 * Can this device actually store anything?
 *
 * Private browsing and a full quota both fail silently on write, which would let
 * the app promise a saved roster it has not saved. Probing once at startup lets
 * the app *say so* rather than find out at the worst moment.
 */
export function isStorageWritable(): boolean {
  try {
    localStorage.setItem(PROBE_KEY, '1');
    localStorage.removeItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Loose shape check. Enough to reject anything the current code cannot use. */
function looksLikeSession(value: unknown): value is SessionState {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  const pools = (v: unknown) =>
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as Record<string, unknown>).leaders) &&
    Array.isArray((v as Record<string, unknown>).followers);
  return (
    typeof s.phase === 'string' &&
    typeof s.spinOrder === 'string' &&
    typeof s.currentPool === 'string' &&
    typeof s.wheelPool === 'string' &&
    typeof s.couplesTotal === 'number' &&
    typeof s.rotation === 'number' &&
    typeof s.promptsEnabled === 'boolean' &&
    Array.isArray(s.log) &&
    Array.isArray(s.promptDeck) &&
    Array.isArray(s.promptsRemaining) &&
    pools(s.originals) &&
    pools(s.remaining)
  );
}

export function loadSession(): SessionState | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const wrapper = parsed as Record<string, unknown>;
    if (wrapper.schema !== SESSION_SCHEMA) return null;
    if (!looksLikeSession(wrapper.state)) return null;
    return wrapper.state;
  } catch {
    return null;
  }
}

/** Returns false when the write failed, so the caller can tell the operator. */
export function saveSession(state: SessionState): boolean {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ schema: SESSION_SCHEMA, state }));
    return true;
  } catch {
    return false;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing useful to do; a stale session is rejected on load anyway.
  }
}
