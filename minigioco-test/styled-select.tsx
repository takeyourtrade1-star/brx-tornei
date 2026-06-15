'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  openUp: boolean;
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
    const maxHeight = Math.max(
      120,
      Math.min(desiredMax, openUp ? spaceAbove : spaceBelow)
    );
    return {
      top: openUp ? rect.top - maxHeight - margin : rect.bottom + margin,
      left: rect.left,
      width: rect.width,
      openUp,
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
        className="irg-select-menu irg-select-menu-portal"
        style={{
          position: 'fixed',
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
              className={`irg-select-option ${selected ? 'irg-select-option-active' : ''}`}
            >
              {opt.color && <i className="irg-select-swatch" style={{ background: opt.color }} aria-hidden />}
              <span className="irg-select-option-text">
                <span className="irg-select-option-label">{opt.label}</span>
                {opt.hint && <span className="irg-select-option-hint">{opt.hint}</span>}
              </span>
              {selected && <span className="irg-select-check" aria-hidden>✓</span>}
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div
      ref={wrapRef}
      className={`irg-select ${open ? 'irg-select-open' : ''}`}
      data-disabled={disabled || undefined}
    >
      <button
        type="button"
        ref={triggerRef}
        id={`${id}-btn`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="irg-select-trigger"
      >
        <span className="irg-select-value">
          {current ? (
            <>
              {current.color && (
                <i
                  className="irg-select-swatch"
                  style={{ background: current.color }}
                  aria-hidden
                />
              )}
              <span className="irg-select-label">{current.label}</span>
            </>
          ) : (
            <span className="irg-select-placeholder">{placeholder}</span>
          )}
        </span>
        <span className={`irg-select-arrow ${open ? 'irg-select-arrow-up' : ''}`} aria-hidden>▾</span>
      </button>

      {menu && typeof document !== 'undefined' ? createPortal(menu, document.body) : menu}
    </div>
  );
}
