'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords } from 'lucide-react';
import { activeMatchStatusAction } from '@/actions/tournaments';
import { clearActiveMatch, readActiveMatch } from '@/lib/active-match-storage';
import { useGraceCountdown } from '@/hooks/use-grace-countdown';

interface ActiveMatchBannerState {
  tournamentId: string;
  opponent: string | null;
  graceDeadline: string | null;
}

/**
 * Banner flottante "Torna alla partita": appare su tutta la dashboard quando
 * l'utente partecipa a una partita in corso ma non è nella pagina live
 * (uscito per sbaglio, connessione caduta, tab chiusa…). Il riferimento
 * salvato in localStorage viene sempre rivalidato lato server.
 */
export function ReturnToMatchBanner() {
  const pathname = usePathname();
  const [match, setMatch] = useState<ActiveMatchBannerState | null>(null);
  const onLivePage = /^\/tornei\/[^/]+\/live/.test(pathname ?? '');

  useEffect(() => {
    if (onLivePage) {
      setMatch(null);
      return;
    }
    const stored = readActiveMatch();
    if (!stored) {
      setMatch(null);
      return;
    }

    let cancelled = false;
    void activeMatchStatusAction(stored.tournamentId).then((result) => {
      if (cancelled) return;
      if (result.status === 'active') {
        setMatch({
          tournamentId: stored.tournamentId,
          opponent: result.opponent ?? stored.opponent ?? null,
          graceDeadline: result.graceDeadline ?? null,
        });
        return;
      }
      setMatch(null);
      // Solo una risposta certa invalida il riferimento: su errore API lo si
      // conserva per riprovare alla prossima navigazione.
      if (result.status === 'inactive') clearActiveMatch(stored.tournamentId);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, onLivePage]);

  const remaining = useGraceCountdown(match?.graceDeadline);

  if (!match) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[900] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2">
      <div className="flex items-center gap-3.5 rounded-2xl border border-primary/35 bg-header-bg/95 p-2.5 pl-4 text-white shadow-2xl backdrop-blur-md">
        <span
          aria-hidden
          className={`h-2.5 w-2.5 shrink-0 animate-pulse rounded-full shadow-sm ${
            remaining !== null ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
        />
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            {remaining !== null ? `Rientra entro ${remaining}s!` : 'Partita in corso'}
          </p>
          <p className="truncate text-xs font-bold text-white">
            {match.opponent ? `vs ${match.opponent}` : 'Il tuo tavolo ti aspetta'}
          </p>
        </div>
        <Link
          href={`/tornei/${match.tournamentId}/live`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:brightness-110 active:scale-95"
        >
          <Swords className="h-3.5 w-3.5" />
          Torna alla partita
        </Link>
      </div>
    </div>
  );
}
