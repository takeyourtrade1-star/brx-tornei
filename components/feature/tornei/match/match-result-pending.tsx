'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Trophy } from 'lucide-react';
import { getAvatarForPlayer } from '@/lib/avatars';
import type { BestOf } from '@/types/tournament';
import { MatchResultCard } from './match-result-card';

/**
 * Modale condiviso durante una proposta di risultato.
 * Spazioso (max-w-2xl), stile liquid glass arancione con pill punteggio dedicate.
 * Teletrasportato su document.body con z-[9999] per evitare qualsiasi sovrapposizione da webcam/layer.
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const winsNeeded = bestOf === 'BO5' ? 3 : bestOf === 'BO1' ? 1 : 2;
  const myAvatar = getAvatarForPlayer(localName, true);
  const oppAvatar = getAvatarForPlayer(opponentName, false);
  const proposedWinnerName =
    claimedWinnerId === localId
      ? localName
      : claimedWinnerId === opponentId
        ? opponentName
        : null;
  const proposedLoserId = claimedWinnerId === localId ? opponentId : localId;
  const proposedWinnerScore = claimedWinnerId ? scoreByPlayerId?.[claimedWinnerId] : undefined;
  const proposedLoserScore = scoreByPlayerId?.[proposedLoserId];
  const proposedWinnerIsMe = claimedWinnerId === localId;
  const proposal =
    proposedWinnerName && proposedWinnerScore !== undefined && proposedLoserScore !== undefined
      ? `${proposedWinnerName} ${proposedWinnerScore} – ${proposedLoserScore}`
      : null;

  if (!mounted) return null;

  return createPortal(
    <section
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label="Risultato proposto"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 p-4 sm:p-6 backdrop-blur-md"
    >
      <div className="flex min-h-full items-center justify-center py-4">
        <div className="relative my-auto w-full max-w-2xl overflow-hidden rounded-[26px] border border-white/15 bg-gradient-to-b from-[#161d36]/95 via-[#0c1226]/95 to-[#060a16]/98 p-5 text-white shadow-2xl shadow-black/70 backdrop-blur-2xl ring-1 ring-white/10 sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 left-1/2 h-36 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
          />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/25 via-amber-500/15 to-transparent text-primary shadow-[0_0_24px_rgba(255,115,0,0.35)] backdrop-blur-md">
                <Trophy className="h-6 w-6 drop-shadow-[0_2px_6px_rgba(255,115,0,0.8)]" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                  {reselection ? 'Scegliete di nuovo' : 'Risultato proposto'}
                </h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-white/65 sm:text-sm">
                  {reconnecting
                    ? 'Risposta sospesa durante la riconnessione. Avrai nuovamente tempo al ripristino del collegamento.'
                    : reselection && awaitingMe
                      ? 'Le prime dichiarazioni erano discordanti. Selezionate entrambi il vincitore effettivo.'
                      : awaitingMe
                        ? 'Indica il vincitore confermando la proposta o selezionando il risultato corretto.'
                        : `In attesa della conferma di ${opponentName}. Alla scadenza la proposta verrà annullata.`}
                </p>
                {proposal && (
                  <div className="mt-2.5 inline-flex items-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-3.5 py-1 text-xs font-black text-orange-200 shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-primary">Proposta attuale:</span>
                    <span className="font-display tracking-wide">{proposal}</span>
                  </div>
                )}
                {error && (
                  <p role="alert" className="mt-2 text-xs font-bold text-red-300">
                    {error}
                  </p>
                )}
              </div>
            </div>

            {/* Countdown Badge */}
            {remaining !== null && (
              <div className="flex shrink-0 items-center gap-1.5 self-start rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-black text-amber-300 shadow-[0_0_12px_rgba(255,115,0,0.2)]">
                <Clock className="h-3.5 w-3.5 animate-pulse text-primary" />
                <span>{remaining}s</span>
              </div>
            )}
          </div>

          {awaitingMe && !reconnecting && (
            <div className="relative mt-6 space-y-4">
              {proposal && proposedLoserScore !== undefined && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDeclare(proposedWinnerIsMe, proposedLoserScore)}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-orange-600 px-6 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 sm:text-sm"
                >
                  <Trophy className="h-4 w-4" />
                  Conferma {proposal}
                </button>
              )}

              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                    {proposal ? 'Oppure indica il risultato corretto' : 'Indica il risultato'}
                  </p>
                  <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: winsNeeded }, (_, loserScore) => (
                    <MatchResultCard
                      key={`me-${loserScore}`}
                      name={localName}
                      isMe={true}
                      scoreDisplay={`${winsNeeded} – ${loserScore}`}
                      avatar={myAvatar}
                      disabled={busy}
                      onSelect={() => onDeclare(true, loserScore)}
                    />
                  ))}
                  {Array.from({ length: winsNeeded }, (_, loserScore) => (
                    <MatchResultCard
                      key={`opponent-${loserScore}`}
                      name={opponentName}
                      isMe={false}
                      scoreDisplay={`${winsNeeded} – ${loserScore}`}
                      avatar={oppAvatar}
                      disabled={busy}
                      onSelect={() => onDeclare(false, loserScore)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>,
    document.body,
  );
}
