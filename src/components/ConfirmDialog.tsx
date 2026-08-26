import { useEffect, useRef } from 'react';

type Props = {
  title: string;
  body?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A confirmation that can always be escaped.
 *
 * "No modal traps" (intent.md § Design principles): if the tablet changes hands
 * while this is open, whoever picks it up must be able to get out. Hence an
 * explicit Cancel, Escape, and a backdrop that dismisses.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="scrim" onClick={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="dialog__title" id="dialog-title">
          {title}
        </h2>
        {body && <p className="dialog__body">{body}</p>}
        <div className="dialog__actions">
          <button className="dialog__cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            className={
              destructive ? 'dialog__confirm dialog__confirm--destructive' : 'dialog__confirm'
            }
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
