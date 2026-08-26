import { useEffect, useRef, useState } from 'react';

/** How long the second press has to arrive before the warning lapses. */
const ARM_WINDOW_MS = 3000;

/**
 * Stop a stray back gesture from closing the app.
 *
 * On an installed Android app the back gesture leaves immediately, and the edge
 * of a tablet is easy to brush mid-event. The session survives it — persistence
 * sees to that — but the operator still has to find the icon and relaunch while
 * a room waits, which is exactly the kind of interruption the app exists to avoid.
 *
 * So the first back press is absorbed and answered with a warning; a second press
 * within a few seconds goes through. Deliberately uniform across every screen:
 * "back always warns once" is a rule someone can learn in one go, where "back
 * sometimes navigates and sometimes exits" is one they have to think about.
 *
 * ## How it works, and why it re-arms
 *
 * The guard is one spare history entry kept ahead of the app. Back pops it, which
 * is what we hear; unless the warning is already showing we push it straight back,
 * so nothing has actually moved.
 *
 * Leaving deliberately **consumes** that entry. Android then keeps the app's web
 * contents alive, so reopening it resumes the same page rather than reloading —
 * mount effects do not run again, no guard entry gets pushed, and the next back
 * press finds nothing to pop and closes the app instantly with no warning at all.
 * That is exactly what happened on a real device after the first release of this
 * hook. So the guard is re-armed every time the page becomes visible, not only
 * when the component mounts.
 */
export function useExitGuard(): { warning: boolean } {
  const [warning, setWarning] = useState(false);
  const armed = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const hasGuard = () => Boolean(history.state && history.state.jnjExitGuard);

    const ensureGuard = () => {
      if (!hasGuard()) history.pushState({ jnjExitGuard: true }, '');
    };

    const disarm = () => {
      armed.current = false;
      setWarning(false);
      window.clearTimeout(timer.current);
    };

    const onPopState = () => {
      if (armed.current) {
        // Second press inside the window: let it leave. The guard entry has
        // already been popped, so the browser carries on out of the app.
        disarm();
        return;
      }

      armed.current = true;
      setWarning(true);
      ensureGuard();

      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        armed.current = false;
        setWarning(false);
      }, ARM_WINDOW_MS);
    };

    /**
     * Coming back into view after leaving: put the guard back, and forget any
     * half-armed state so the first press is a fresh warning rather than an
     * instant exit.
     */
    const onResume = () => {
      if (document.visibilityState !== 'visible') return;
      disarm();
      ensureGuard();
    };

    ensureGuard();
    window.addEventListener('popstate', onPopState);
    document.addEventListener('visibilitychange', onResume);
    // Fires when a page is restored from the back/forward cache, which a mount
    // effect would miss entirely.
    window.addEventListener('pageshow', onResume);

    return () => {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('pageshow', onResume);
      window.clearTimeout(timer.current);
    };
  }, []);

  return { warning };
}
