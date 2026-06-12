'use client';

import { cn } from '@/lib/utils';

interface WizardOptionCardProps {
  title: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
}

export function WizardOptionCard({
  title,
  description,
  selected = false,
  disabled = false,
  badge,
  onClick,
}: WizardOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marquee focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        selected
          ? 'border-marquee bg-marquee/10 ring-1 ring-marquee/40'
          : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/[0.08]',
        disabled && 'cursor-not-allowed opacity-50 hover:border-white/15 hover:bg-white/5'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-sans text-base font-bold uppercase tracking-wide text-white">
          {title}
        </span>
        {badge && (
          <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-500/30">
            {badge}
          </span>
        )}
      </div>
      {description && <p className="text-sm text-white/65">{description}</p>}
    </button>
  );
}
