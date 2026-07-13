'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords } from 'lucide-react';
import { activeMatchStatusAction } from '@/actions/tournaments';
import { clearActiveMatch, readActiveMatch } from '@/lib/active-match-storage';

interface ActiveMatchBannerState {
  tournamentId: string;
  opponent: string | null;
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

  if (!match) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[900] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full border border-primary/40 bg-header-bg/95 py-2 pl-4 pr-2 text-white shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]"
        />
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Partita in corso
          </p>
          <p className="truncate text-xs font-bold text-white/85">
            {match.opponent ? `vs ${match.opponent}` : 'Il tuo tavolo ti aspetta'}
          </p>
        </div>
        <Link
          href={`/tornei/${match.tournamentId}/live`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-primary to-orange-600 px-4 text-[11px] font-black uppercase tracking-wide text-white shadow-[0_10px_24px_-10px_rgba(255,115,0,0.8)] ring-1 ring-white/20 transition hover:brightness-110 active:scale-95"
        >
          <Swords className="h-3.5 w-3.5" />
          Torna alla partita
        </Link>
      </div>
    </div>
  );
}
