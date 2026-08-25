/**
 * Device-local storage.
 *
 * Versioned keys from the start, so a later schema change can migrate rather than
 * silently corrupt a roster the night before an event. Reads are defensive: a
 * damaged value returns the fallback instead of taking the app down.
 */
import type { Dancer, Role } from './domain/roster';

const ROSTER_KEY = 'jnj:v1:roster';

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
