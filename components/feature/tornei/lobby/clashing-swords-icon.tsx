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
      <rect x="-4" y="-7.6" width="8" height="1.7" rx="0.85" className="fill-primary" />
      <rect x="-0.95" y="-5.9" width="1.9" height="5.1" rx="0.95" className="fill-current opacity-55" />
      <circle r="1.3" className="fill-primary" />
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
        <circle r="2.2" className="fill-white/20" />
        <path
          d="M0-4.9.9-.9 4.9 0 .9.9 0 4.9-.9.9-4.9 0-.9-.9z"
          className="fill-primary"
        />
        <circle cx="3.9" cy="-3.3" r="0.5" className="fill-primary" />
        <circle cx="-3.9" cy="-3.3" r="0.5" className="fill-primary" />
        <circle cx="3.1" cy="3.7" r="0.45" className="fill-primary" />
        <circle cx="-3.1" cy="3.7" r="0.45" className="fill-primary" />
      </g>
    </svg>
  );
}
