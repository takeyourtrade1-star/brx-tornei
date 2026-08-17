import { Trophy } from 'lucide-react';
import { getAvatarForPlayer } from '@/lib/avatars';
import { cn } from '@/lib/utils';
import type { BestOf } from '@/types/tournament';

/**
 * Modale condiviso durante una proposta di risultato.
 * Stile liquid glass arancione coerente con MatchDeclareModal.
 */
export function MatchResultPendingPanel({
  awaitingMe,
  reselection,
  remaining,
  reconnecting,
  busy,
  localName,
  opponentName,
  localId,
  opponentId,
  bestOf,
  claimedWinnerId,
  scoreByPlayerId,
  error,
  onDeclare,
}: {
  awaitingMe: boolean;
  reselection: boolean;
  remaining: number | null;
  reconnecting: boolean;
  busy: boolean;
  localName: string;
  opponentName: string;
  localId: string;
  opponentId: string;
  bestOf: BestOf;
  claimedWinnerId?: string;
  scoreByPlayerId?: Record<string, number>;
  error?: string | null;
  onDeclare: (iWon: boolean, loserScore: number) => void;
}) {
  const countdown = remaining !== null ? ` (${remaining}s)` : '';
  const winsNeeded = bestOf === 'BO5' ? 3 : bestOf === 'BO1' ? 1 : 2;
  const myAvatar = getAvatarForPlayer(localName, true);
  const oppAvatar = getAvatarForPlayer(opponentName, false);
  const proposedWinnerName = claimedWinnerId === localId
    ? localName
    : claimedWinnerId === opponentId
      ? opponentName
      : null;
  const proposedLoserId = claimedWinnerId === localId ? opponentId : localId;
  const proposedWinnerScore = claimedWinnerId ? scoreByPlayerId?.[claimedWinnerId] : undefined;
  const proposedLoserScore = scoreByPlayerId?.[proposedLoserId];
  const proposedWinnerIsMe = claimedWinnerId === localId;
  const proposal = proposedWinnerName && proposedWinnerScore !== undefined && proposedLoserScore !== undefined
    ? `${proposedWinnerName} ${proposedWinnerScore} – ${proposedLoserScore}`
    : null;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label="Risultato proposto"
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
    >
      <div className="relative my-auto w-full max-w-lg overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-b from-[#161d36]/95 via-[#0c1226]/95 to-[#060a16]/98 p-5 text-white shadow-2xl shadow-black/60 backdrop-blur-2xl ring-1 ring-white/10 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative flex items-start gap-3.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/40 bg-gradient-to-br from-primary/25 via-amber-500/15 to-transparent text-primary shadow-[0_0_20px_rgba(255,115,0,0.3)] backdrop-blur-md">
            <Trophy className="h-5.5 w-5.5 drop-shadow-[0_2px_6px_rgba(255,115,0,0.8)]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base font-black uppercase tracking-tight text-white sm:text-lg">
              {reselection ? 'Scegliete di nuovo' : 'Risultato proposto'}
            </h2>
            <p className="mt-0.5 text-xs font-medium leading-relaxed text-white/60">
              {reconnecting
                ? 'Risposta sospesa durante la riconnessione. Avrai nuovamente tutto il tempo quando il collegamento torna.'
                : reselection && awaitingMe
                ? 'Le prime scelte erano diverse. Indicate entrambi il vincitore una seconda volta.'
                : awaitingMe
                ? `Indica il vincitore entro${countdown}. Se le dichiarazioni non coincidono, la partita resta aperta.`
                : `In attesa della scelta di ${opponentName}${countdown}. Alla scadenza la proposta viene annullata.`}
            </p>
            {proposal && (
              <p className="mt-2 inline-flex rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-black text-orange-100">
                {proposal}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-2 text-xs font-bold text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>

        {awaitingMe && !reconnecting && (
          <div className="relative mt-4">
          {proposal && proposedLoserScore !== undefined && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDeclare(proposedWinnerIsMe, proposedLoserScore)}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-orange-600 px-5 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              Conferma {proposal}
            </button>
          )}
          <p className="mb-2 mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
            {proposal ? 'Oppure indica il risultato corretto' : 'Indica il risultato'}
          </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {Array.from({ length: winsNeeded }, (_, loserScore) => (
                <ResultPlayerCard
                  key={`me-${loserScore}`}
                  name={localName}
                  label={`Vittoria mia · ${winsNeeded} – ${loserScore}`}
                  avatar={myAvatar}
                  disabled={busy}
                  onSelect={() => onDeclare(true, loserScore)}
                />
              ))}
              {Array.from({ length: winsNeeded }, (_, loserScore) => (
                <ResultPlayerCard
                  key={`opponent-${loserScore}`}
                  name={opponentName}
                  label={`Vittoria avversario · ${winsNeeded} – ${loserScore}`}
                  avatar={oppAvatar}
                  disabled={busy}
                  onSelect={() => onDeclare(false, loserScore)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Card giocatore per la scelta nel modale. */
function ResultPlayerCard({
  name,
  label,
  avatar,
  disabled,
  onSelect,
}: {
  name: string;
  label: string;
  avatar: ReturnType<typeof getAvatarForPlayer>;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const AvatarIcon = avatar.icon;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'group relative flex flex-1 items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left backdrop-blur-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50',
        'border-white/15 bg-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.25)]',
        'hover:border-primary/60 hover:bg-gradient-to-r hover:from-primary/[0.18] hover:via-amber-500/[0.08] hover:to-white/[0.05] hover:shadow-[0_0_25px_rgba(255,115,0,0.3)] hover:-translate-y-0.5',
      )}
    >
      {/* Riflesso superiore in vetro */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transition-opacity group-hover:via-primary/70"
      />
      {/* Glow nell'angolo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-primary/10 blur-xl transition-all duration-300 group-hover:bg-primary/25 group-hover:scale-125"
      />

      <div className={cn('relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-gradient-to-b from-slate-900 via-header-bg to-black p-1 shadow-inner group-hover:border-primary/60 transition-colors', avatar.bgGradient)}>
        <AvatarIcon className={cn('h-5.5 w-5.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] transition-transform duration-200 group-hover:scale-110', avatar.color)} />
      </div>

      <div className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-black text-white">{name}</span>
        <span className="text-[10px] font-black uppercase tracking-wider text-primary group-hover:text-amber-300 transition-colors">
          {label}
        </span>
      </div>

      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/40 shadow-xs transition-all duration-200 group-hover:border-primary/50 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_15px_rgba(255,115,0,0.5)]">
        <Trophy className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}
