import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Card di selezione dell'hub (formato + modalità). Server components puri: sono Link.
 * Stile Ebartex: gradienti card1..4, glass, glow arancio al passaggio.
 */

interface ModeCardProps {
  title: string;
  description?: string;
  href: string;
  available?: boolean;
  badge?: string;
  index?: number;
  bgImage?: string;
  accent?: string;
}

export function ModeCard({
  title,
  description,
  href,
  available = true,
  badge,
  index = 0,
  bgImage,
  accent = '#FF7300',
}: ModeCardProps) {
  const inner = (
    <div
      className={cn(
        'relative overflow-hidden flex h-48 sm:h-52 flex-col justify-between rounded-2xl border border-white/15 p-5 group',
        !bgImage && 'brx-glass'
      )}
    >
      {bgImage && (
        <div className={cn("absolute inset-0 z-0 transition-opacity duration-300", !available ? "opacity-35" : "opacity-100")}>
          <Image
            src={bgImage}
            alt={title}
            fill
            sizes="(max-w-768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between h-full w-full">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-sans text-2xl font-bold uppercase tracking-wide text-white">{title}</h3>
          {badge && (
            <Badge
              variant={available ? 'success' : 'warning'}
              className={cn(
                "shrink-0 font-sans font-bold",
                available
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500 text-black border-transparent font-extrabold shadow-lg shadow-amber-500/20"
              )}
            >
              {badge}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-auto">
          {description && (
            <p className={cn("text-sm font-medium drop-shadow", available ? "text-white/90" : "text-white/50")}>
              {description}
            </p>
          )}
          <span
            className={cn(
              'inline-flex w-fit items-center rounded-full px-4 py-1.5 text-sm font-bold transition-colors',
              available ? 'bg-primary text-primary-foreground group-hover:bg-primary/95' : 'bg-white/10 text-white/40'
            )}
          >
            {available ? 'Entra →' : 'In arrivo'}
          </span>
        </div>
      </div>
    </div>
  );

  const wrapper = cn(
    'block rounded-2xl opacity-0 animate-slide-up transition-all duration-300',
    available ? 'mode-card-glow hover:scale-[1.02]' : 'cursor-not-allowed',
    'group-hover/grid:opacity-45',
    available && 'hover:!opacity-100'
  );
  const style = {
    animationDelay: `${index * 80}ms`,
    '--mode-accent': accent,
  } as React.CSSProperties;

  if (!available) {
    return (
      <div aria-disabled="true" className={wrapper} style={style}>
        {inner}
      </div>
    );
  }
  return (
    <Link href={href} className={wrapper} style={style}>
      {inner}
    </Link>
  );
}
