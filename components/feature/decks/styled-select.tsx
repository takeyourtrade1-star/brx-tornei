'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface StyledSelectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  color?: string;
}

interface StyledSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: StyledSelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
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
        className="fixed z-[9999] m-0 list-none overflow-y-auto rounded-xl border border-white/20 bg-[#1a1f3a] p-1.5 shadow-2xl"
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
                'relative flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-white/85 outline-none transition-colors',
                'hover:bg-[#FF7300]/20 hover:text-white focus:bg-[#FF7300]/20 focus:text-white',
                selected && 'bg-[#FF7300]/25 text-white'
              )}
            >
              {selected && (
                <span
                  className="absolute left-0 top-1/4 h-1/2 w-0.5 rounded-r bg-[#FF7300]"
                  aria-hidden
                />
              )}
              {opt.color && (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
                  style={{ background: opt.color }}
                  aria-hidden
                />
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-bold">{opt.label}</span>
                {opt.hint && (
                  <span className="truncate text-[10.5px] font-medium text-white/50">{opt.hint}</span>
                )}
              </span>
              {selected && (
                <span className="shrink-0 text-xs font-black text-[#FF7300]" aria-hidden>
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
          'flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold text-white transition-colors',
          'border-white/15 bg-white/5 shadow-inner',
          'hover:border-[#FF7300]/55 hover:bg-white/[0.07]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'border-[#FF7300] ring-2 ring-[#FF7300]/25'
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {current ? (
            <>
              {current.color && (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
                  style={{ background: current.color }}
                  aria-hidden
                />
              )}
              <span className="truncate">{current.label}</span>
            </>
          ) : (
            <span className="truncate italic text-white/45">{placeholder}</span>
          )}
        </span>
        <span
          className={cn(
            'shrink-0 text-[11px] text-[#FF7300] transition-transform',
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
