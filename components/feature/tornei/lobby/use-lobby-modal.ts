'use client';

import { type RefObject, useEffect, useRef } from 'react';

const FOCUSABLE = [
  'button:not([disabled]):not([tabindex="-1"])',
  'a[href]:not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let previousOverflow: string | null = null;
let modalOrigin: HTMLElement | null = null;
const previousInert = new Map<HTMLElement, boolean>();

function visibleFocusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.getClientRects().length > 0,
  );
}

function syncPageInteractivity() {
  const roots = Array.from(
    document.querySelectorAll<HTMLElement>('[data-lobby-modal-root="true"]'),
  );

  if (roots.length > 0) {
    if (previousOverflow === null) previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    Array.from(document.body.children).forEach((child) => {
      if (!(child instanceof HTMLElement)) return;
      const containsModal = roots.some((root) => child === root || child.contains(root));
      if (containsModal) {
        child.inert = false;
        return;
      }
      if (!previousInert.has(child)) previousInert.set(child, child.inert);
      child.inert = true;
    });
    return;
  }

  previousInert.forEach((wasInert, element) => {
    element.inert = wasInert;
  });
  previousInert.clear();
  if (previousOverflow !== null) document.body.style.overflow = previousOverflow;
  previousOverflow = null;
}

/** Focus trap, ripristino focus e isolamento pagina per i modali della lobby. */
export function useLobbyModal(
  open: boolean,
  dialogRef: RefObject<HTMLElement>,
  onClose: () => void,
  closeDisabled = false,
) {
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  }, [onClose, closeDisabled]);

  useEffect(() => {
    if (!open) return;
    if (!modalOrigin && document.activeElement instanceof HTMLElement) {
      modalOrigin = document.activeElement;
    }

    queueMicrotask(syncPageInteractivity);
    const focusFrame = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const preferred = dialog.querySelector<HTMLElement>('[data-modal-initial-focus="true"]');
      (preferred ?? visibleFocusables(dialog)[0] ?? dialog).focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!closeDisabledRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = visibleFocusables(dialog);
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!dialog.contains(document.activeElement) || document.activeElement === dialog) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown);
      queueMicrotask(() => {
        syncPageInteractivity();
        const anotherModal = document.querySelector('[data-lobby-modal-root="true"]');
        if (!anotherModal) {
          const focusTarget = modalOrigin?.isConnected
            ? modalOrigin
            : document.querySelector<HTMLElement>('[data-lobby-focus-fallback="true"]');
          focusTarget?.focus();
          modalOrigin = null;
        }
      });
    };
  }, [open, dialogRef]);
}
