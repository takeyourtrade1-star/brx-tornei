import { Check, ScanLine, ShieldCheck } from 'lucide-react';
import type { Deck } from '@/types/deck';
import { cn } from '@/lib/utils';

const VERIFICATION_LABEL: Record<Deck['verificationStatus'], string> = {
  verified: 'Verificato',
  mismatch: 'Discrepanza',
  scanned: 'Scansionato',
  declared: 'Dichiarato',
  none: 'Non verificato',
};

const VERIFICATION_CLASS: Record<Deck['verificationStatus'], string> = {
  verified: 'bg-emerald-500/20 text-emerald-300',
  mismatch: 'bg-red-500/20 text-red-300',
  scanned: 'bg-amber-500/20 text-amber-300',
  declared: 'bg-amber-500/20 text-amber-300',
  none: 'bg-white/10 text-white/50',
};

interface JoinTournamentDeckContentProps {
  decks: Deck[];
  formatName: string;
  selectedDeckId: string;
  scryfallRequired: boolean;
  scanRequired: boolean;
  error: string | null;
  onSelect: (deckId: string) => void;
}

export function JoinTournamentDeckContent({
  decks,
  formatName,
  selectedDeckId,
  scryfallRequired,
  scanRequired,
  error,
  onSelect,
}: JoinTournamentDeckContentProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-5 pt-1">
      {(scryfallRequired || scanRequired) && (
        <div className="space-y-2 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] p-3.5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-amber-300/90">
            Requisiti di questo torneo
          </p>
          {scryfallRequired && (
            <div className="flex items-center gap-2.5 text-sm text-amber-100/90">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              Controllo legalità Asso Vision
            </div>
          )}
          {scanRequired && (
            <div className="flex items-center gap-2.5 text-sm text-amber-100/90">
              <ScanLine className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              Verifica fisica Asso Vision (ultime 24h)
            </div>
          )}
        </div>
      )}

      {decks.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-sm text-white/70">Nessun mazzo per questo formato.</p>
          <a href="/mazzi" className="mt-3 inline-block rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-2 text-xs font-bold text-white">
            Crea un mazzo
          </a>
        </div>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-extrabold uppercase tracking-[0.12em] text-white/40">
            I tuoi mazzi {formatName}
          </legend>
          {decks.map((deck) => {
            const selected = selectedDeckId === deck.id;
            return (
              <label
                key={deck.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition',
                  selected
                    ? 'border-primary/60 bg-primary/[0.12] ring-1 ring-primary/30'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
                )}
              >
                <input type="radio" name="deck" value={deck.id} checked={selected} onChange={() => onSelect(deck.id)} className="sr-only" />
                <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full border transition', selected ? 'border-primary bg-primary text-white' : 'border-white/25')}>
                  {selected && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{deck.name}</span>
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-bold', VERIFICATION_CLASS[deck.verificationStatus])}>
                  {VERIFICATION_LABEL[deck.verificationStatus]}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/15 px-3 py-2.5 text-sm font-semibold text-white">
          {error}
        </p>
      )}
    </div>
  );
}
