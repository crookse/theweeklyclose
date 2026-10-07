"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button.tsx";

/**
 * Modal confirmation built on the native <dialog>, which provides the focus
 * trap, Escape to cancel and the backdrop. Clicking the backdrop also cancels.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      // Escape: keep the dialog's open state owned by React
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      // The dialog element itself is only the target outside the inner panel
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      className="m-auto w-[calc(100%-32px)] max-w-sm rounded-xl bg-[var(--tr-panel)] p-0 text-[var(--tr-text)] shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <h2 id="confirm-dialog-title" className="text-base font-bold">
            {title}
          </h2>
          <p className="text-sm font-semibold leading-relaxed text-[var(--tr-label)]">
            {message}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* First focusable, so it gets initial focus over the destructive action */}
          <Button variant="muted" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
