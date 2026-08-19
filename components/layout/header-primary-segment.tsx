import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderPrimarySegmentProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  scrolled?: boolean;
}

export function HeaderPrimarySegment({
  href,
  label,
  icon: Icon,
  active,
  scrolled,
}: HeaderPrimarySegmentProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex min-h-[38px] min-w-0 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-center transition-all duration-200 sm:min-w-[8.75rem]',
        active
          ? 'border border-white/30 bg-gradient-to-r from-[#FF7300] to-[#e0564d] text-white shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.5),0_4px_16px_-2px_rgba(255,115,0,0.6)] font-black'
          : scrolled
            ? 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-950 font-bold'
            : 'text-white/75 hover:bg-white/10 hover:text-white font-bold',
      )}
    >
      <span
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors',
          active
            ? 'bg-white/25 text-white'
            : scrolled
              ? 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300 group-hover:text-slate-900'
              : 'bg-white/10 text-white/80 group-hover:bg-white/20 group-hover:text-white',
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
      <span className="min-w-0 truncate text-xs uppercase tracking-wide">{label}</span>
    </Link>
  );
}
