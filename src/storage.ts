/**
 * Device-local storage.
 *
 * Versioned keys from the start, so a later schema change can migrate rather than
 * silently corrupt a roster the night before an event. Reads are defensive: a
 * damaged value returns the fallback instead of taking the app down.
 */
import type { Dancer, Role } from './domain/roster';

const ROSTER_KEY = 'jnj:v1:roster';
const EXCLUDED_PROMPTS_KEY = 'jnj:v1:excluded-prompts';

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
