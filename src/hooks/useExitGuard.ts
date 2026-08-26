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
 * Works by keeping one spare history entry ahead of the app. Back pops it, which
 * is what we hear; unless the warning is already showing, we push it straight
 * back and nothing has moved.
 */
export function useExitGuard(): { warning: boolean } {
  const [warning, setWarning] = useState(false);
  const armed = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    history.pushState({ jnjExitGuard: true }, '');

    const onPopState = () => {
      if (armed.current) {
        // Second press inside the window: let it leave. The guard entry has
        // already been popped, so the browser carries on out of the app.
        armed.current = false;
        setWarning(false);
        window.clearTimeout(timer.current);
        return;
      }

      armed.current = true;
      setWarning(true);
      // Put the guard back so the app has not actually gone anywhere.
      history.pushState({ jnjExitGuard: true }, '');

      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        armed.current = false;
        setWarning(false);
      }, ARM_WINDOW_MS);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.clearTimeout(timer.current);
    };
  }, []);

  return { warning };
}
