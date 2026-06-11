import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Card di selezione dell'hub (formato + modalità). Server components puri: sono Link.
 * Stile Ebartex: gradienti card1..4, glass, glow arancio al passaggio.
 */

interface FormatCardProps {
  name: string;
  href: string;
  gradient: string;
  selected?: boolean;
  /** Indice per l'animazione a cascata. */
  index?: number;
}

export function FormatCard({ name, href, gradient, selected = false, index = 0 }: FormatCardProps) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'brx-glow-hover block rounded-2xl opacity-0 animate-slide-up',
        selected && 'ring-2 ring-primary shadow-[0_0_30px_-4px_rgba(255,115,0,0.6)]'
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className={cn(
          'flex h-28 items-center justify-center rounded-2xl border border-white/20 px-4 shadow-lg',
          gradient
        )}
      >
        <span className="font-display text-xl uppercase tracking-wide text-white drop-shadow sm:text-2xl">
          {name}
        </span>
      </div>
    </Link>
  );
}

interface ModeCardProps {
  title: string;
  description?: string;
  href: string;
  available?: boolean;
  badge?: string;
  index?: number;
}

export function ModeCard({
  title,
  description,
  href,
  available = true,
  badge,
  index = 0,
}: ModeCardProps) {
  const inner = (
    <div
      className={cn(
        'brx-glass flex h-44 flex-col justify-between rounded-2xl border border-white/20 p-5',
        !available && 'opacity-55'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-2xl uppercase tracking-wide text-white">{title}</h3>
        {badge && (
          <Badge variant={available ? 'success' : 'warning'} className="shrink-0">
            {badge}
          </Badge>
        )}
      </div>
      {description && <p className="text-sm text-white/75">{description}</p>}
      <span
        className={cn(
          'inline-flex w-fit items-center rounded-full px-4 py-1.5 text-sm font-bold',
          available ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/50'
        )}
      >
        {available ? 'Entra →' : 'In arrivo'}
      </span>
    </div>
  );

  const wrapper = cn('block rounded-2xl opacity-0 animate-slide-up', available && 'brx-glow-hover');
  const delay = { animationDelay: `${index * 80}ms` };

  if (!available) {
    return (
      <div aria-disabled="true" className={wrapper} style={delay}>
        {inner}
      </div>
    );
  }
  return (
    <Link href={href} className={wrapper} style={delay}>
      {inner}
    </Link>
  );
}
