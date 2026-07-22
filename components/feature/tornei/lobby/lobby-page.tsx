'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createTableAction,
  joinTournamentAction,
  leaveTournamentAction,
} from '@/actions/tournaments';
import { buildLobbyTables, findMyTables, type LobbyTable } from '@/lib/lobby';
import type { FormatId } from '@/lib/data/catalog';
import type { Selection } from '@/lib/validations/selection';
import type { SessionUser } from '@/types/auth';
import type { Tournament } from '@/types/tournament';
import { TableSeatModal } from './table-seat-modal';
import { FriendConnectionModal } from './friend-connection-modal';
import { LobbyTableList } from './lobby-table-list';

interface LobbyPageProps {
  tournaments: Tournament[];
  user: SessionUser;
  selection: Selection;
  formatId: FormatId;
  formatName: string;
  modeName: string;
}

type ModalState = { mode: 'host' | 'join'; tournamentId: string } | null;
type ConnectionModalState =
  | { mode: 'create' }
  | { mode: 'join'; tournamentId: string }
  | null;

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
  const [connectionModal, setConnectionModal] = useState<ConnectionModalState>(null);
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

  // Con PIÙ partite attive (stato incoerente: partita vecchia mai abbandonata)
  // NON reindirizzo: resto in lobby, dove ogni tavolo ha il suo "Abbandona".
  useEffect(() => {
    const mine = findMyTables(tournaments, user.id);
    if (mine.length === 0) return;
    const [only] = mine;
    if (mine.length === 1 && only) {
      if (only.format !== selection.format || only.mode !== selection.mode) {
        router.replace(`/tornei?format=${only.format}&mode=${only.mode}`, { scroll: false });
        return;
      }
      const started = only.status === 'iniziata' && only.matchId;
      const readyCheck =
        only.status === 'in_registrazione' &&
        only.participants.length >= only.maxPlayers;
      if (started || readyCheck) {
        goLiveTo(only.id);
        return;
      }
    }
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, 4000);
    return () => clearInterval(iv);
  }, [tournaments, user.id, router, goLiveTo, selection.format, selection.mode]);

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
        if (table.tournament.withFriend) {
          setConnectionModal({ mode: 'join', tournamentId: table.tournament.id });
        } else {
          setModal({ mode: 'join', tournamentId: table.tournament.id });
        }
        return;
      }

      if (table.kind === 'empty') {
        // Tavolo vuoto già esistente: mi ci siedo (riuso) invece di crearne uno nuovo.
        if (table.tournament) {
          if (table.tournament.withFriend) {
            setConnectionModal({ mode: 'join', tournamentId: table.tournament.id });
          } else {
            setModal({ mode: 'join', tournamentId: table.tournament.id });
          }
          return;
        }
        setConnectionModal({ mode: 'create' });
      }
    },
    [tournaments, user.id],
  );

  const handleConnectionConfirm = useCallback(
    (withFriend: boolean) => {
      if (!connectionModal) return;
      setError(null);
      if (connectionModal.mode === 'join') {
        const tournamentId = connectionModal.tournamentId;
        setConnectionModal(null);
        setModal({ mode: 'join', tournamentId });
        return;
      }

      startTransition(async () => {
        const res = await createTableAction(selection.format, selection.mode, withFriend);
        if (res.error || !res.createdId) {
          setError(res.error ?? 'Impossibile creare il tavolo.');
          return;
        }
        setConnectionModal(null);
        setModal({ mode: 'host', tournamentId: res.createdId });
        router.refresh();
      });
    },
    [connectionModal, router, selection.format, selection.mode],
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
        if (res.matchId || res.tableFull) {
          // Tavolo pieno: si va in pagina partita per il ready check.
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
      <LobbyTableList
        tables={tables}
        user={user}
        selection={selection}
        formatId={formatId}
        formatName={formatName}
        modeName={modeName}
        busy={busy}
        error={error}
        onSit={handleSit}
        onOpen={handleOpen}
        onLeave={handleLeave}
        onGoLive={handleGoLive}
      />

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
      <FriendConnectionModal
        open={connectionModal !== null}
        mode={connectionModal?.mode ?? 'create'}
        busy={busy}
        error={error}
        onClose={() => setConnectionModal(null)}
        onConfirm={handleConnectionConfirm}
      />
    </>
  );
}
