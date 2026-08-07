'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface StyledSelectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  color?: string;
  /** Icona a sinistra (alternativa più pulita al quadratino colorato). */
  icon?: React.ReactNode;
}

interface StyledSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: StyledSelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  /** Classi extra per il bottone trigger (es. altezza per allinearlo ad altri campi). */
  triggerClassName?: string;
}

interface MenuPos {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function StyledSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Seleziona…',
  disabled = false,
  triggerClassName,
}: StyledSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const id = useId();

  const current = options.find((o) => o.value === value);

  const computePos = (): MenuPos | null => {
    const btn = triggerRef.current;
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    const margin = 6;
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const desiredMax = 260;
    const openUp = spaceBelow < Math.min(desiredMax, 200) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(desiredMax, openUp ? spaceAbove : spaceBelow));
    return {
      top: openUp ? rect.top - maxHeight - margin : rect.bottom + margin,
      left: rect.left,
      width: rect.width,
      maxHeight,
    };
  };

  useLayoutEffect(() => {
    if (open) {
      setPos(computePos());
    } else {
      setPos(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const menuId = `${id}-menu`;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      const menuEl = document.getElementById(menuId);
      if (
        wrapRef.current &&
        !wrapRef.current.contains(target) &&
        !(menuEl && menuEl.contains(target))
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onScroll = () => setPos(computePos());
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, id]);

  const menu =
    open && pos ? (
      <ul
        id={`${id}-menu`}
        role="listbox"
        aria-labelledby={`${id}-btn`}
        className="fixed z-[9999] m-0 list-none overflow-y-auto rounded-xl border border-slate-900/[0.08] bg-white p-1.5 text-header-bg shadow-[0_18px_44px_-14px_rgba(15,23,42,0.28)]"
        style={{
          top: pos.top,
          left: pos.left,
          width: pos.width,
          maxHeight: pos.maxHeight,
        }}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <li
              key={opt.value}
              role="option"
              aria-selected={selected}
              tabIndex={0}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(opt.value);
                  setOpen(false);
                }
              }}
              className={cn(
                'relative flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-700 outline-none transition-colors',
                'hover:bg-primary/[0.08] hover:text-header-bg focus:bg-primary/[0.08] focus:text-header-bg',
                selected && 'bg-primary/10 text-primary'
              )}
            >
              {selected && (
                <span
                  className="absolute left-0 top-1/4 h-1/2 w-0.5 rounded-r bg-primary"
                  aria-hidden
                />
              )}
              {opt.icon ? (
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500',
                    selected && 'bg-primary/10 text-primary'
                  )}
                  aria-hidden
                >
                  {opt.icon}
                </span>
              ) : opt.color ? (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm shadow-[inset_0_0_0_1px_rgba(15,23,42,0.15)]"
                  style={{ background: opt.color }}
                  aria-hidden
                />
              ) : null}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-bold">{opt.label}</span>
                {opt.hint && (
                  <span className="truncate text-[10.5px] font-medium text-slate-400">{opt.hint}</span>
                )}
              </span>
              {selected && (
                <span className="shrink-0 text-xs font-black text-primary" aria-hidden>
                  ✓
                </span>
              )}
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div ref={wrapRef} className="relative w-full">
      <button
        type="button"
        ref={triggerRef}
        id={`${id}-btn`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold text-header-bg transition-colors',
          'border-slate-900/12 bg-white shadow-sm',
          'hover:border-primary/45 hover:bg-slate-50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'border-primary ring-2 ring-primary/20',
          triggerClassName
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {current ? (
            <>
              {current.icon ? (
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"
                  aria-hidden
                >
                  {current.icon}
                </span>
              ) : current.color ? (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm shadow-[inset_0_0_0_1px_rgba(15,23,42,0.15)]"
                  style={{ background: current.color }}
                  aria-hidden
                />
              ) : null}
              <span className="truncate">{current.label}</span>
            </>
          ) : (
            <span className="truncate italic text-slate-400">{placeholder}</span>
          )}
        </span>
        <span
          className={cn(
            'shrink-0 text-[11px] text-primary transition-transform',
            open && 'rotate-180'
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {menu && typeof document !== 'undefined' ? createPortal(menu, document.body) : menu}
    </div>
  );
}
