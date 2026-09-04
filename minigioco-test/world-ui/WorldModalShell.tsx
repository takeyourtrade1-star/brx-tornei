'use client';

import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import { WorldIcon } from './world-icon';

export interface WorldModalShellProps {
  readonly id: string;
  readonly title?: string;
  readonly description?: string;
  readonly closing?: boolean;
  readonly allowGameKeys?: boolean;
  readonly className?: string;
  readonly contentClassName?: string;
  readonly initialFocusRef?: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hidden &&
      element.getClientRects().length > 0 &&
      element.getAttribute('aria-hidden') !== 'true' &&
      !element.hasAttribute('inert') &&
      !element.closest('[inert]'),
  );
}

function stopKeyboard(event: KeyboardEvent<HTMLElement>): void {
  event.stopPropagation();
}

export function WorldModalShell({
  id,
  title,
  description,
  closing = false,
  allowGameKeys = false,
  className,
  contentClassName,
  initialFocusRef,
  onClose,
  children,
}: WorldModalShellProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const restoreTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusInitial = () => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      (initialFocusRef?.current || getFocusable(dialog)[0] || dialog).focus();
    };
    const frame = window.requestAnimationFrame(focusInitial);
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      event.preventDefault();
      event.stopPropagation();
      const elements = getFocusable(dialog);
      if (!elements.length) {
        dialog.focus();
        return;
      }
      const current = document.activeElement;
      const currentIndex = current instanceof HTMLElement ? elements.indexOf(current) : -1;
      const nextIndex = event.shiftKey
        ? currentIndex <= 0 ? elements.length - 1 : currentIndex - 1
        : currentIndex < 0 || currentIndex === elements.length - 1 ? 0 : currentIndex + 1;
      elements[nextIndex].focus();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (restoreTarget?.isConnected) restoreTarget.focus();
    };
  }, [initialFocusRef]);

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-header-bg/90 p-3 sm:p-5"
      data-world-modal-backdrop="true"
      data-closing={closing ? 'true' : 'false'}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={cn(
          'relative max-h-[min(92vh,52rem)] w-full max-w-2xl overflow-y-auto rounded-md border border-white/15 bg-card text-card-foreground shadow-2xl outline-none motion-safe:animate-slide-up',
          closing && 'pointer-events-none opacity-70',
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title || id}
        aria-labelledby={title ? `${id}-title` : undefined}
        aria-describedby={description ? `${id}-description` : undefined}
        data-world-modal={id}
        tabIndex={-1}
        onKeyDown={allowGameKeys ? undefined : stopKeyboard}
      >
        {(title || description) && (
          <header className="sticky top-0 z-20 bg-card border-b border-border p-4 pr-14 sm:p-5 sm:pr-16">
            {title && <h2 id={`${id}-title`} className="font-display text-base text-foreground sm:text-lg">{title}</h2>}
            {description && <p id={`${id}-description`} className="mt-1 text-sm text-muted-foreground">{description}</p>}
        <button
          type="button"
          className="absolute right-2 top-2 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-border bg-background/80 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          onClick={onClose}
          aria-label="Chiudi finestra"
        >
          <WorldIcon name="close" size={18} />
        </button>
          </header>
        )}
        <div className={cn('p-4 sm:p-5', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
