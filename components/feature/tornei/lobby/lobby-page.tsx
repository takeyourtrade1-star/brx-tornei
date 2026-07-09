'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { FormatSelectorGrid } from '@/components/feature/tornei/format-selector-grid';
import { ModeSelectorRow } from '@/components/feature/tornei/mode-selector-row';
import {
  createTableAction,
  joinTournamentAction,
  leaveTournamentAction,
} from '@/actions/tournaments';
import { buildLobbyTables, findMyTables, type LobbyTable } from '@/lib/lobby';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import type { Selection } from '@/lib/validations/selection';
import type { SessionUser } from '@/types/auth';
import type { Tournament } from '@/types/tournament';
import { TableCard } from './table-card';
import { TableSeatModal } from './table-seat-modal';

interface LobbyPageProps {
  tournaments: Tournament[];
  user: SessionUser;
  selection: Selection;
  formatId: FormatId;
  formatName: string;
  modeName: string;
}

type ModalState = { mode: 'host' | 'join'; tournamentId: string } | null;

export function LobbyPage({
  tournaments,
  user,
  selection,
  formatId,
  formatName,
  modeName,
}: LobbyPageProps) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const myUsername = user.name ?? user.email;

  const tables = useMemo(
    () => buildLobbyTables({ tournaments, userId: user.id }),
    [tournaments, user.id],
  );

  const goLiveTo = useCallback(
    (id: string) => router.push(`/tornei/${id}/live`),
    [router],
  );

  // Se sono seduto al mio tavolo e il match è partito, entro in partita.
  // Se sono in attesa, faccio polling per accorgermi quando qualcuno si siede.
  // Con PIÙ partite attive (stato incoerente: partita vecchia mai abbandonata)
  // NON reindirizzo: resto in lobby, dove ogni tavolo ha il suo "Abbandona".
  useEffect(() => {
    const mine = findMyTables(tournaments, user.id);
    if (mine.length === 0) return;
    const [only] = mine;
    if (mine.length === 1 && only && only.status === 'iniziata' && only.matchId) {
      goLiveTo(only.id);
      return;
    }
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, 4000);
    return () => clearInterval(iv);
  }, [tournaments, user.id, router, goLiveTo]);

  const opponentFor = useCallback(
    (tournamentId: string): string | null => {
      const t = tournaments.find((x) => x.id === tournamentId);
      if (!t) return null;
      const other = t.participants.find((p) => p.id !== user.id);
      return other?.username ?? null;
    },
    [tournaments, user.id],
  );

  const handleSit = useCallback(
    (table: LobbyTable) => {
      setError(null);

      // Sono già seduto altrove: non creo doppioni, riapro il mio tavolo.
      const mine = findMyTables(tournaments, user.id)[0];
      if (mine) {
        setModal({ mode: 'host', tournamentId: mine.id });
        return;
      }

      if (table.kind === 'joinable' && table.tournament) {
        setModal({ mode: 'join', tournamentId: table.tournament.id });
        return;
      }

      if (table.kind === 'empty') {
        // Tavolo vuoto già esistente: mi ci siedo (riuso) invece di crearne uno nuovo.
        if (table.tournament) {
          setModal({ mode: 'join', tournamentId: table.tournament.id });
          return;
        }
        // Nessun tavolo vuoto disponibile: ne creo uno nuovo.
        startTransition(async () => {
          const res = await createTableAction(selection.format, selection.mode);
          if (res.error || !res.createdId) {
            setError(res.error ?? 'Impossibile creare il tavolo.');
            return;
          }
          setModal({ mode: 'host', tournamentId: res.createdId });
          router.refresh();
        });
      }
    },
    [selection.format, selection.mode, router, tournaments, user.id],
  );

  const handleConfirmJoin = useCallback(
    (deckId: string) => {
      if (!modal) return;
      const tournamentId = modal.tournamentId;
      setError(null);
      startTransition(async () => {
        const res = await joinTournamentAction(tournamentId, deckId);
        if (res.error) {
          setError(res.error);
          return;
        }
        setModal(null);
        if (res.matchId) {
          goLiveTo(tournamentId);
        } else {
          router.refresh();
        }
      });
    },
    [modal, router, goLiveTo],
  );

  const handleLeave = useCallback(
    (table: LobbyTable) => {
      if (!table.tournament) return;
      const id = table.tournament.id;
      setError(null);
      startTransition(async () => {
        const res = await leaveTournamentAction(id);
        if (res.error) {
          setError(res.error);
          return;
        }
        setModal(null);
        router.refresh();
      });
    },
    [router],
  );

  const handleOpen = useCallback((table: LobbyTable) => {
    if (!table.tournament) return;
    setModal({ mode: 'host', tournamentId: table.tournament.id });
  }, []);

  const handleGoLive = useCallback(
    (table: LobbyTable) => {
      if (table.tournament) goLiveTo(table.tournament.id);
    },
    [goLiveTo],
  );

  return (
    <>
      <DashboardHeader user={user} />

      <main className="mx-auto mt-4 flex w-full max-w-content animate-auth-enter flex-col px-4 pb-16 sm:px-6">
        <div className="sticky top-2 z-40 mb-5 rounded-3xl border border-white/[0.08] bg-header-bg/95 px-4 py-4 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.35)] sm:px-5">
          <div className="flex flex-col items-center gap-4">
            <section className="flex w-full flex-col items-center gap-2">
              <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-white/50">
                Formato
              </h2>
              <FormatSelectorGrid selectedFormatId={formatId} currentModeId={selection.mode as ModeId} />
            </section>
            <section className="flex w-full flex-col items-center gap-2 border-t border-white/10 pt-3">
              <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-white/50">
                Modalità
              </h2>
              <ModeSelectorRow selectedModeId={selection.mode as ModeId} currentFormatId={formatId} />
            </section>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-sans text-base font-bold uppercase tracking-widest text-white/70 sm:text-lg">
            Tavoli <span className="text-white">{formatName}</span>
            <span className="mx-2 text-white/40" aria-hidden>
              ·
            </span>
            <span className="text-white/60">{modeName}</span>
          </h1>
          <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Best of 3
          </span>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {tables.map((table) => (
            <TableCard
              key={table.key}
              table={table}
              busy={busy}
              onSit={handleSit}
              onOpen={handleOpen}
              onLeave={handleLeave}
              onGoLive={handleGoLive}
            />
          ))}
        </div>
      </main>

      <TableSeatModal
        open={modal !== null}
        mode={modal?.mode ?? 'host'}
        formatId={formatId}
        formatName={formatName}
        myUsername={myUsername}
        opponentUsername={modal ? opponentFor(modal.tournamentId) : null}
        busy={busy}
        error={error}
        onClose={() => {
          setError(null);
          setModal(null);
        }}
        onLeave={() => {
          const t = tournaments.find((x) => x.id === modal?.tournamentId);
          if (t) handleLeave({ key: t.id, kind: 'mine', tournament: t, seats: [{ occupied: false }, { occupied: false }], started: false });
        }}
        onConfirmJoin={handleConfirmJoin}
      />
    </>
  );
}
