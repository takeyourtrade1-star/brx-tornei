'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StyledSelectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface StyledSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: StyledSelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  /** id del trigger (accessibilità / label esterna) */
  id?: string;
  className?: string;
  triggerClassName?: string;
  ariaLabelledBy?: string;
  /** Aspetto del trigger: pill allineata ai filtri tornei. */
  variant?: 'default' | 'pill';
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
  id: idProp,
  className,
  triggerClassName,
  ariaLabelledBy,
  variant = 'default',
}: StyledSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const autoId = useId();
  const triggerId = idProp ?? `${autoId}-trigger`;
  const menuId = `${autoId}-menu`;

  const current = options.find((o) => o.value === value);

  const computePos = (): MenuPos | null => {
    const btn = triggerRef.current;
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    const margin = 6;
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const desiredMax = 280;
    const openUp = spaceBelow < Math.min(desiredMax, 160) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(desiredMax, openUp ? spaceAbove : spaceBelow));
    const top = openUp ? rect.top - maxHeight - margin : rect.bottom + margin;
    return { top, left: rect.left, width: Math.max(rect.width, 160), maxHeight };
  };

  useLayoutEffect(() => {
    if (open) setPos(computePos());
    else setPos(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
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
  }, [open, menuId]);

  const menu =
    open && pos ? (
      <ul
        id={menuId}
        role="listbox"
        aria-labelledby={triggerId}
        className="fixed z-[9999] m-0 list-none overflow-y-auto rounded-xl border border-white/15 bg-slate-950/95 p-1.5 text-white shadow-2xl backdrop-blur-md scrollbar-none"
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
                'relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                'outline-none focus-visible:bg-white/10',
                selected
                  ? 'bg-primary/15 font-bold text-primary'
                  : 'font-medium text-white/85 hover:bg-white/10',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{opt.label}</span>
                {opt.hint && (
                  <span className="mt-0.5 block truncate text-[11px] font-normal text-white/45">
                    {opt.hint}
                  </span>
                )}
              </span>
              {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div
      ref={wrapRef}
      className={cn(variant === 'pill' ? 'relative inline-flex' : 'relative min-w-[9rem]', className)}
    >
      <button
        type="button"
        ref={triggerRef}
        id={triggerId}
        aria-labelledby={ariaLabelledBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center justify-between gap-1.5 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          variant === 'default' && [
            'w-full rounded-lg border border-stroke-grey',
            'bg-input-bg px-3 py-1.5 text-left text-sm font-bold text-header-bg',
            'transition-[filter,box-shadow] hover:brightness-105',
            open && 'ring-2 ring-primary/40',
          ],
          variant === 'pill' && [
            'w-auto rounded-full border-0 ring-1',
            'font-bold uppercase tracking-wide',
            open && 'ring-primary/40',
          ],
          disabled && 'cursor-not-allowed opacity-50',
          triggerClassName,
        )}
      >
        <span className="min-w-0 truncate">
          {current ? (
            current.label
          ) : (
            <span className={variant === 'pill' ? 'opacity-70' : 'text-header-bg/50'}>{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'shrink-0 transition-transform duration-200',
            variant === 'default' ? 'h-4 w-4 text-header-bg/60' : 'h-3 w-3 opacity-70',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {menu && typeof document !== 'undefined' ? createPortal(menu, document.body) : menu}
    </div>
  );
}
