import { useEffect } from 'react';

/**
 * Keep the screen awake while a session is running.
 *
 * The dance hold sits untouched for two or three minutes at a time. Without this
 * the tablet dims and locks mid-dance, and the operator has to unlock it before
 * they can draw the next couple — the app holding up the night, which is exactly
 * what success is defined against.
 *
 * Supported on Android Chrome (the primary device) and Safari from iOS 16.4.
 * Unsupported or refused is not an error: the screen simply behaves as it always
 * did, so nothing here is allowed to throw.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        // Denied, or the document was not visible. Nothing to do.
      }
    };

    // The lock is dropped whenever the tab is hidden — a notification, a switch
    // to the music app — so it has to be taken again on the way back.
    const onVisibilityChange = () => {
      if (!released && document.visibilityState === 'visible') void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}
