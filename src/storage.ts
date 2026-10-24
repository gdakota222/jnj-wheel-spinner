/**
 * Device-local storage.
 *
 * Versioned keys from the start, so a later schema change can migrate rather than
 * silently corrupt a roster the night before an event. Reads are defensive: a
 * damaged value returns the fallback instead of taking the app down.
 */
import type { Dancer, Role } from './domain/roster';
import type { SessionState } from './domain/session';
import type { PracticeState } from './domain/practice';
import { DEFAULT_DIVISION_SETTINGS, type DivisionSettings } from './domain/divisions';

const ROSTER_KEY = 'jnj:v1:roster';
const EXCLUDED_PROMPTS_KEY = 'jnj:v1:excluded-prompts';
const SESSION_KEY = 'jnj:v1:session';
const PROBE_KEY = 'jnj:v1:probe';
const WHEEL_HINT_KEY = 'jnj:v1:seen-wheel-hint';
const ACTIVE_DECK_KEY = 'jnj:v1:active-deck';
const SEEN_ABOUT_KEY = 'jnj:v1:seen-about';

/**
 * The shape of a stored session.
 *
 * Bumped whenever SessionState changes in a way that would break a session saved
 * by an older build. v2 added the jamboree fields; v3 made the jam cover every birthday dancer at once; v4 added previousRotation; v5 made prompt draws id-based; v6 added the crowned winner; v7 added the all-skate finale. A mismatch discards the saved session rather than restoring
 * something the current code cannot read — losing an in-flight session is bad,
 * but crashing on launch in front of a room is worse.
 */
const SESSION_SCHEMA = 7;

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

/**
 * The "tap the wheel" reminder is shown once and then never again.
 *
 * It used to sit permanently beside the wheel, which pushed the wheel off centre
 * — and the wheel being dead centre matters more than a hint nobody needs twice.
 */
export function hasSeenWheelHint(): boolean {
  try {
    return localStorage.getItem(WHEEL_HINT_KEY) === '1';
  } catch {
    return true; // no storage, no nagging
  }
}

export function markWheelHintSeen(): void {
  try {
    localStorage.setItem(WHEEL_HINT_KEY, '1');
  } catch {
    // Nothing to do; the hint simply shows again next time.
  }
}

/**
 * One-time tips, by name.
 *
 * A tip teaches something the screen cannot say for itself — a gesture, mostly
 * — at the moment it becomes useful, and then gets out of the way.
 */
const TIP_PREFIX = 'jnj:v1:seen-tip:';

export type TipId = 'spin-skip' | 'practice-list';

export function hasSeenTip(id: TipId): boolean {
  try {
    return localStorage.getItem(TIP_PREFIX + id) === '1';
  } catch {
    return true; // no storage, no nagging
  }
}

export function markTipSeen(id: TipId): void {
  try {
    localStorage.setItem(TIP_PREFIX + id, '1');
  } catch {
    // Nothing to do; the tip simply shows again next time.
  }
}

/**
 * Bring every tip back.
 *
 * Tips are remembered per device, and the device is exactly what gets handed
 * over: in the handoff rehearsal a newcomer used the owner's tablet, which had
 * seen every tip weeks earlier, so they were shown none — and never learned that
 * a double-tap skips the spin. The owner resets them before handing it over.
 */
export function resetTips(): void {
  try {
    localStorage.removeItem(WHEEL_HINT_KEY);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(TIP_PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable: every tip already shows each time.
  }
}

/**
 * Whether the welcome page has already been shown.
 *
 * Read once at launch. Storage that cannot be read reports true — an operator on
 * a device that forgets everything should not be greeted afresh every time they
 * open the app in front of a room.
 */
export function hasSeenAbout(): boolean {
  try {
    return localStorage.getItem(SEEN_ABOUT_KEY) === '1';
  } catch {
    return true;
  }
}

export function markAboutSeen(): void {
  try {
    localStorage.setItem(SEEN_ABOUT_KEY, '1');
  } catch {
    // Nothing to do; hasSeenAbout already reports true when storage is broken.
  }
}

/**
 * Which prompt bundle a session draws from.
 *
 * Stored as an id so a bundle can be rewritten without the choice going stale,
 * and so the archived original can be selected for a side-by-side comparison.
 */
export function loadActiveDeckId(fallback: string): string {
  try {
    return localStorage.getItem(ACTIVE_DECK_KEY) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveActiveDeckId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_DECK_KEY, id);
  } catch {
    // The choice simply resets to the default next time.
  }
}

/**
 * The running Quick list, kept separately from a wheel session.
 *
 * Its own key and its own schema number, so a change to one mode can never
 * discard the other's night. Same rule as the session: a mismatch is dropped
 * rather than half-read.
 */
const PRACTICE_KEY = 'jnj:v1:practice';
const PRACTICE_SCHEMA = 1;

function looksLikePractice(value: unknown): value is PracticeState {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  const pools = p.pools as Record<string, unknown> | undefined;
  return (
    p.kind === 'practice' &&
    Array.isArray(p.couples) &&
    typeof p.nextId === 'number' &&
    typeof p.divisions === 'object' &&
    p.divisions !== null &&
    typeof pools === 'object' &&
    pools !== null &&
    Array.isArray(pools.leaders) &&
    Array.isArray(pools.followers)
  );
}

export function loadPractice(): PracticeState | null {
  try {
    const raw = localStorage.getItem(PRACTICE_KEY);
    if (!raw) return null;
    const wrapper = JSON.parse(raw) as Record<string, unknown> | null;
    if (!wrapper || wrapper.schema !== PRACTICE_SCHEMA) return null;
    return looksLikePractice(wrapper.state) ? wrapper.state : null;
  } catch {
    return null;
  }
}

/** Returns false when the write failed, so the caller can tell the operator. */
export function savePractice(state: PracticeState): boolean {
  try {
    localStorage.setItem(PRACTICE_KEY, JSON.stringify({ schema: PRACTICE_SCHEMA, state }));
    return true;
  } catch {
    return false;
  }
}

export function clearPractice(): void {
  try {
    localStorage.removeItem(PRACTICE_KEY);
  } catch {
    // Nothing useful to do; a stale list is rejected on load anyway.
  }
}

/**
 * Matching by division, and how.
 *
 * Kept on the device rather than asked each night: a group that competes uses
 * divisions every time, and one that does not should never see them (D-058).
 */
const DIVISION_SETTINGS_KEY = 'jnj:v1:division-settings';

export function loadDivisionSettings(): DivisionSettings {
  try {
    const raw = localStorage.getItem(DIVISION_SETTINGS_KEY);
    if (!raw) return DEFAULT_DIVISION_SETTINGS;
    const p = JSON.parse(raw) as Partial<DivisionSettings> | null;
    return {
      enabled: p?.enabled === true,
      mode: p?.mode === 'merge' ? 'merge' : 'strict',
      order: p?.order === 'descending' || p?.order === 'mixed' ? p.order : 'ascending',
    };
  } catch {
    return DEFAULT_DIVISION_SETTINGS;
  }
}

export function saveDivisionSettings(settings: DivisionSettings): void {
  try {
    localStorage.setItem(DIVISION_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // The choice simply resets next time.
  }
}
