import { cn } from '@/lib/utils';

/**
 * Lama singola disegnata con l'elsa nell'origine e la punta verso l'alto
 * (lunghezza ~19.6 unità): così il gruppo che la contiene può ruotare
 * attorno al pomo, come farebbe un braccio.
 */
function Blade() {
  return (
    <g>
      {/* Lama: due fili dritti e la punta a triangolo */}
      <path d="M-1.75-7.6v-8.7L0-19.6l1.75 3.3v8.7z" className="fill-current" />
      {/* Sguscio centrale: dà spessore alla lama senza aggiungere colori */}
      <path
        d="M0-16.2v7.4"
        className="stroke-header-bg/35"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
      {/* Guardia, impugnatura e pomo: arancio Ebartex */}
      <rect x="-4.4" y="-7.7" width="8.8" height="1.9" rx="0.95" className="fill-primary" />
      <rect x="-1.05" y="-5.9" width="2.1" height="5.2" rx="1.05" className="fill-current opacity-60" />
      <circle r="1.45" className="fill-primary" />
    </g>
  );
}

/**
 * Due spade incrociate che si scontrano in loop: caricano, colpiscono al
 * centro con una scintilla e rinculano. Tutto in CSS (keyframes in
 * `globals.css`), quindi resta un Server Component; con
 * `prefers-reduced-motion` le lame restano ferme in posa incrociata.
 */
export function ClashingSwordsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('h-5 w-5 overflow-visible', className)}
    >
      <g className="swords-blade-left">
        <Blade />
      </g>
      <g className="swords-blade-right">
        <Blade />
      </g>

      {/* Scintilla: compare solo nel frame d'impatto, dove i fili si toccano */}
      <g className="swords-clash-spark">
        <circle r="2.8" className="fill-white/25" />
        <path
          d="M0-4.8 1.2-1.2 4.8 0 1.2 1.2 0 4.8-1.2 1.2-4.8 0-1.2-1.2z"
          className="fill-primary"
        />
        <circle cx="3.7" cy="-3.1" r="0.55" className="fill-primary" />
        <circle cx="-3.7" cy="-3.1" r="0.55" className="fill-primary" />
        <circle cx="2.9" cy="3.5" r="0.5" className="fill-primary" />
        <circle cx="-2.9" cy="3.5" r="0.5" className="fill-primary" />
      </g>
    </svg>
  );
}
