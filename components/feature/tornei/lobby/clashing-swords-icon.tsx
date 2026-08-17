import { cn } from '@/lib/utils';

/**
 * Lama singola disegnata con l'elsa nell'origine e la punta verso l'alto
 * (lunghezza ~19.6 unità): così il gruppo che la contiene può ruotare
 * attorno al pomo, come farebbe un braccio.
 */
function Blade({ ornate = false }: { ornate?: boolean }) {
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
      <rect
        x="-4"
        y="-7.6"
        width="8"
        height="1.7"
        rx="0.85"
        className={ornate ? 'fill-amber-300' : 'fill-primary'}
      />
      <rect x="-0.95" y="-5.9" width="1.9" height="5.1" rx="0.95" className="fill-current opacity-55" />
      <circle r="1.3" className={ornate ? 'fill-amber-300' : 'fill-primary'} />
    </g>
  );
}

/**
 * Due spade incrociate che si scontrano in loop: caricano, colpiscono al
 * centro con una scintilla e rinculano. Tutto in CSS (keyframes in
 * `globals.css`), quindi resta un Server Component; con
 * `prefers-reduced-motion` le lame restano ferme in posa incrociata.
 */
export function ClashingSwordsIcon({
  className,
  ornate = false,
}: {
  className?: string;
  ornate?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('h-5 w-5 overflow-visible', className)}
    >
      {ornate && (
        <>
          <circle
            cx="12"
            cy="12"
            r="10.2"
            className="swords-arena-orbit fill-none stroke-current opacity-25"
            strokeWidth="0.7"
            strokeDasharray="1.8 2.8"
          />
          <path
            d="M12 2.8 20 6v5.8c0 4.6-3.2 8-8 10.2-4.8-2.2-8-5.6-8-10.2V6Z"
            className="swords-arena-shield fill-current opacity-15"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <path
            d="M12 5.2 17.6 7.4v4.1c0 3.2-2.1 5.6-5.6 7.4-3.5-1.8-5.6-4.2-5.6-7.4V7.4Z"
            className="fill-slate-950/25 stroke-white/20"
            strokeWidth="0.55"
          />
        </>
      )}

      <g className="swords-blade-left">
        <Blade ornate={ornate} />
      </g>
      <g className="swords-blade-right">
        <Blade ornate={ornate} />
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
        {ornate && (
          <>
            <circle cx="6.3" cy="0" r="0.35" className="fill-amber-200" />
            <circle cx="-6.3" cy="0" r="0.35" className="fill-amber-200" />
            <circle cx="0" cy="6.2" r="0.4" className="fill-white" />
          </>
        )}
      </g>
    </svg>
  );
}
