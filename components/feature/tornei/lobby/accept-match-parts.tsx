import { AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectionQuality } from '@/types/tournament';
import type { Deck } from '@/types/deck';
import { ConnectionQualityBadge } from '../connection-quality-badge';

export const DECKLESS_DECK_ID = '';

export function CornerMarks({ tone }: { tone: string }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-3">
      <span className={cn('absolute left-0 top-0 h-4 w-4 rounded-tl-md border-l-2 border-t-2', tone)} />
      <span className={cn('absolute right-0 top-0 h-4 w-4 rounded-tr-md border-r-2 border-t-2', tone)} />
      <span className={cn('absolute bottom-0 left-0 h-4 w-4 rounded-bl-md border-b-2 border-l-2', tone)} />
      <span className={cn('absolute bottom-0 right-0 h-4 w-4 rounded-br-md border-b-2 border-r-2', tone)} />
    </span>
  );
}

export function AcceptPlayerChip({
  label,
  ready,
  pending = false,
  connection,
}: {
  label: string;
  ready: boolean;
  pending?: boolean;
  connection?: ConnectionQuality;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 transition-colors',
        ready ? 'border-emerald-400/40 bg-emerald-500/15' : 'border-white/10 bg-white/[0.05]',
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {ready ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-label="Ha accettato" />
        ) : (
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full bg-white/35', pending && 'animate-pulse bg-primary')} aria-hidden />
        )}
        <span className="truncate text-[13px] font-black text-white">{label}</span>
      </span>
      <ConnectionQualityBadge connection={connection} dark />
    </div>
  );
}

/** Dichiarazione facoltativa del mazzo nel modale di accettazione: la finestra
 * è ancora "pending", quindi il backend accetta lo snapshot del mazzo prima
 * del ready. Default = senza mazzo. */
export function AcceptDeckPicker({
  decks,
  value,
  disabled = false,
  onChange,
}: {
  decks: Deck[];
  value: string;
  disabled?: boolean;
  onChange: (deckId: string) => void;
}) {
  if (decks.length === 0 && value === DECKLESS_DECK_ID) return null;
  return (
    <fieldset disabled={disabled} className="mt-3 w-full text-left">
      <legend className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
        Mazzo (facoltativo)
      </legend>
      <div className="mt-1.5 max-h-24 space-y-1 overflow-y-auto pr-1">
        <DeckOption
          label="Gioca senza mazzo"
          checked={value === DECKLESS_DECK_ID}
          onSelect={() => onChange(DECKLESS_DECK_ID)}
        />
        {decks.map((deck) => (
          <DeckOption
            key={deck.id}
            label={deck.name}
            checked={value === deck.id}
            onSelect={() => onChange(deck.id)}
          />
        ))}
      </div>
    </fieldset>
  );
}

function DeckOption({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 transition',
        checked
          ? 'border-primary/50 bg-primary/10'
          : 'border-white/10 bg-white/[0.04] hover:border-white/25',
      )}
    >
      <input
        type="radio"
        name="accept-deck"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          'grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border',
          checked ? 'border-primary bg-primary text-white' : 'border-white/30',
        )}
      >
        {checked && <Check className="h-2 w-2" strokeWidth={3} aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white/85">
        {label}
      </span>
    </label>
  );
}

export function DeclinedPanel({
  opponentUsername,
  secondsLeft,
  busy,
  onLeave,
}: {
  opponentUsername: string | null;
  secondsLeft: number;
  busy: boolean;
  onLeave: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center">
      <span
        className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-[0_16px_40px_-12px_rgba(239,68,68,0.7)] ring-1 ring-white/20"
        aria-hidden
      >
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-2xl font-black uppercase tracking-[0.14em] text-white">
        Sfida annullata
      </h2>
      <p className="mt-1.5 text-sm font-semibold text-white/50">
        {opponentUsername ?? 'Il giocatore'} non ha accettato.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onLeave}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-orange-600 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_14px_32px_-12px_rgba(255,115,0,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Lobby ({secondsLeft}s)
      </button>
    </div>
  );
}

export function AcceptCountdownRing({
  seconds,
  fraction,
  label,
  urgent,
}: {
  seconds: number | null;
  fraction: number;
  label: string;
  urgent: boolean;
}) {
  return (
    <span
      className={cn(
        'relative mt-6 grid h-28 w-28 place-items-center rounded-full',
        urgent ? 'animate-pulse' : 'accept-ring-glow',
      )}
      role="timer"
      aria-label={label}
      style={{
        background: `conic-gradient(${
          urgent ? '#f87171' : '#FF7300'
        } ${Math.max(0, fraction) * 360}deg, rgba(255,255,255,0.07) 0deg 360deg)`,
      }}
    >
      <span className="grid h-[5.75rem] w-[5.75rem] place-items-center rounded-full bg-[#070a16] text-4xl font-black tabular-nums text-white">
        {seconds ?? '—'}
      </span>
    </span>
  );
}
