'use client';

import { Monitor, Smartphone } from 'lucide-react';
import type { WebcamSource } from '@/types/webcam';
import { cn } from '@/lib/utils';

interface WebcamSourcePickerProps {
  value: WebcamSource;
  onChange: (source: WebcamSource) => void;
  disabled?: boolean;
}

export function WebcamSourcePicker({ value, onChange, disabled }: WebcamSourcePickerProps) {
  return (
    <div
      className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1"
      role="radiogroup"
      aria-label="Sorgente webcam"
    >
      {(
        [
          { id: 'pc' as const, label: 'Webcam PC', icon: Monitor },
          { id: 'phone' as const, label: 'Telefono', icon: Smartphone },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          disabled={disabled}
          onClick={() => onChange(id)}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition',
            value === id
              ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
              : 'text-white/65 hover:bg-white/5 hover:text-white',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
