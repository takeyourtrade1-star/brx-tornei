'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown } from 'lucide-react';
import { FORMATS, MODES } from '@/lib/data/catalog';
import type { Selection } from '@/lib/validations/selection';
import { cn } from '@/lib/utils';

interface SelectionDropdownProps {
  selection: Selection;
  formatName: string;
  modeName: string;
  className?: string;
}

const TRIGGER_CLASS =
  'flex w-full items-center justify-between gap-2 rounded-full bg-white/12 px-3 py-2 font-sans text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/25 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:px-4 sm:text-sm';

/**
 * Dropdown formato + modalità per l'header — navigazione via Link a /tornei
 * preservando l'altro parametro (server-side searchParams).
 */
export function SelectionDropdown({
  selection,
  formatName,
  modeName,
  className,
}: SelectionDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    if (isMobile) document.body.style.overflow = 'hidden';

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      if (isMobile) document.body.style.overflow = '';
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative min-w-0', className)}>
      <button
        type="button"
        className={TRIGGER_CLASS}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <span className="truncate text-primary">{formatName}</span>
          <span className="shrink-0 text-white/40" aria-hidden>
            ·
          </span>
          <span className="truncate">{modeName}</span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-white/70 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Chiudi menu"
            className="fixed inset-0 z-[80] bg-black/55 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div
            id={listboxId}
            role="listbox"
            aria-label="Formato e modalità torneo"
            className={cn(
              'brx-dropdown-panel z-[90] overflow-hidden rounded-2xl border border-white/20 animate-auth-enter',
              'fixed inset-x-3 bottom-4 top-auto max-h-[min(72vh,28rem)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-[calc(100%+0.5rem)] sm:w-80'
            )}
          >
            <div className="border-b border-white/10 px-4 py-3 sm:hidden">
              <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
                Formato e modalità
              </p>
              <p className="mt-0.5 text-xs text-white/55">Scegli per filtrare i tornei</p>
            </div>

            <div className="max-h-[min(60vh,22rem)] overflow-y-auto p-2 scrollbar-none sm:max-h-[min(70vh,24rem)]">
              <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                Formato
              </p>
              <ul className="flex flex-col gap-0.5">
                {FORMATS.map((format) => {
                  const isActive = format.id === selection.format;
                  return (
                    <li key={format.id}>
                      <Link
                        href={`/tornei?format=${format.id}&mode=${selection.mode}`}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                          isActive
                            ? 'bg-primary/25 text-primary ring-1 ring-primary/50'
                            : 'text-white hover:bg-white/10'
                        )}
                      >
                        <span>{format.name}</span>
                        {isActive && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="my-2 border-t border-white/10" aria-hidden />

              <p className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
                Modalità
              </p>
              <ul className="flex flex-col gap-0.5 pb-2">
                {MODES.map((mode) => {
                  const isActive = mode.id === selection.mode;
                  if (!mode.available) {
                    return (
                      <li key={mode.id}>
                        <span
                          role="option"
                          aria-disabled="true"
                          aria-selected={false}
                          className="flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/40"
                        >
                          <span>{mode.name}</span>
                          {mode.badge && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/55">
                              {mode.badge}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={mode.id}>
                      <Link
                        href={`/tornei?format=${selection.format}&mode=${mode.id}`}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                          isActive
                            ? 'bg-primary/25 text-primary ring-1 ring-primary/50'
                            : 'text-white hover:bg-white/10'
                        )}
                      >
                        <span>{mode.name}</span>
                        {isActive && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
