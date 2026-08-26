import { useRef } from 'react';

const HOLD_MS = 550;
/** A finger that drifts this far was scrolling, not pressing. */
const MOVE_TOLERANCE_PX = 10;

/**
 * Press and hold. Used for marking a birthday dancer, which is deliberately
 * hidden — a control nobody stumbles into by tapping around.
 *
 * Cancels on movement so scrolling a long roster never fires it, and suppresses
 * the context menu and text selection that Android otherwise raises on a hold.
 * The action it triggers is always confirmed, so an accidental hold costs a tap.
 */
export function useLongPress(onLongPress: () => void) {
  const timer = useRef<number | undefined>(undefined);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const start = (x: number, y: number) => {
    origin.current = { x, y };
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(onLongPress, HOLD_MS);
  };

  const cancel = () => {
    window.clearTimeout(timer.current);
    origin.current = null;
  };

  const moved = (x: number, y: number) => {
    if (!origin.current) return;
    const { x: ox, y: oy } = origin.current;
    if (Math.hypot(x - ox, y - oy) > MOVE_TOLERANCE_PX) cancel();
  };

  return {
    onTouchStart: (e: React.TouchEvent) => start(e.touches[0].clientX, e.touches[0].clientY),
    onTouchMove: (e: React.TouchEvent) => moved(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onMouseDown: (e: React.MouseEvent) => start(e.clientX, e.clientY),
    onMouseMove: (e: React.MouseEvent) => moved(e.clientX, e.clientY),
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}
