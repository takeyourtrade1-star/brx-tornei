import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
  badgeHighlight?: boolean;
  icon?: LucideIcon;
}

export function SocialTabButton({
  active,
  onClick,
  label,
  badge,
  badgeHighlight,
  icon: Icon,
}: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-1.5 border-b-2 px-3 pb-3 text-xs font-black transition-all focus-visible:outline-none',
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-slate-500 hover:text-slate-900',
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span>{label}</span>
      {typeof badge === 'number' && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.2 text-[10px] font-black',
            badgeHighlight ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600',
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
