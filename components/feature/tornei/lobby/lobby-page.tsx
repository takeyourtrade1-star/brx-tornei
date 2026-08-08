'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createTableAction,
  joinTournamentAction,
  leaveTournamentAction,
  readyTournamentAction,
} from '@/actions/tournaments';
import { buildLobbyTables, findMyTables, type LobbyTable } from '@/lib/lobby';
import type { FormatId } from '@/lib/data/catalog';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import type { Selection } from '@/lib/validations/selection';
import type { SessionUser } from '@/types/auth';
import type { Tournament } from '@/types/tournament';
import { TableSeatModal } from './table-seat-modal';
import { FriendConnectionModal } from './friend-connection-modal';
import { LobbyTableList } from './lobby-table-list';
import { AcceptMatchModal } from './accept-match-modal';

interface LobbyPageProps {
  tournaments: Tournament[];
  user: SessionUser;
  /** Gamertag torneo-only: unica identità mostrata in lobby. */
  gamertag: string;
  selection: Selection;
  formatId: FormatId;
  formatName: string;
  modeName: string;
  reputation: ReputationSummary | null;
}

type ModalState = { mode: 'host' | 'join'; tournamentId: string } | null;
type ConnectionModalState =
  | { mode: 'create' }
  | { mode: 'join'; tournamentId: string }
  | null;

export function LobbyPage({
  tournaments,
  user,
  gamertag,
  selection,
  formatId,
  formatName,
  modeName,
  reputation,
}: LobbyPageProps) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [connectionModal, setConnectionModal] = useState<ConnectionModalState>(null);
  const [error, setError] = useState<string | null>(null);
  const [approvalPhase, setApprovalPhase] = useState<'accepting' | 'declined' | null>(null);
  const [busy, startTransition] = useTransition();
  const myUsername = gamertag;
  const tables = useMemo(
    () => buildLobbyTables({ tournaments, userId: user.id }),
    [tournaments, user.id],
  );

  const goLiveTo = useCallback(
    (id: string) => router.push(`/tornei/${id}/live`),
    [router],
  );

  // Con PIÙ partite attive (stato incoerente: partita vecchia mai abbandonata)
  // NON reindirizzo: resto in lobby, dove ogni tavolo ha il suo "Alzati".
  useEffect(() => {
    const mine = findMyTables(tournaments, user.id);
    const [only] = mine;
    if (mine.length === 1 && only) {
      if (only.format !== selection.format || only.mode !== selection.mode) {
        router.replace(`/tornei?format=${only.format}&mode=${only.mode}`, { scroll: false });
        return;
      }
      const started = only.status === 'iniziata' && only.matchId;
      if (started) {
        goLiveTo(only.id);
        return;
      }
    }
    // Poll sempre attivo (anche senza tavoli miei): un nuovo tavolo creato
    // da altri deve comparire subito, senza reload manuale.
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, 3000);
    return () => clearInterval(iv);
  }, [tournaments, user.id, router, goLiveTo, selection.format, selection.mode]);

  // Accettazione stile LoL in LOBBY: tavolo pieno e partita non ancora
  // iniziata → modale "Avversario trovato". Il tavolo resta in lobby.
  const approvalTarget = useMemo(() => {
    const mine = findMyTables(tournaments, user.id);
    if (mine.length !== 1) return null;
    const [table] = mine;
    if (!table || table.status !== 'in_registrazione') return null;
    if (table.participants.length < table.maxPlayers) return null;
    return table;
  }, [tournaments, user.id]);

  // L'id resta disponibile anche quando il tavolo torna a un solo giocatore
  // (stato "declined"): il leave automatico ne ha ancora bisogno.
  const [approvalId, setApprovalId] = useState<string | null>(null);
  useEffect(() => {
    if (approvalTarget) setApprovalId(approvalTarget.id);
  }, [approvalTarget]);

  // Latch del pannello: una volta "declined" resta visibile (auto-leave
  // incluso) anche se il target derivato sparisce ai refresh successivi.
  const wasFullRef = useRef(false);
  useEffect(() => {
    const mine = findMyTables(tournaments, user.id);
    const [table] = mine;
    const status = table?.status;
    const isFull =
      mine.length === 1 &&
      status === 'in_registrazione' &&
      (table?.participants.length ?? 0) >= (table?.maxPlayers ?? 0);
    const wasFull = wasFullRef.current;
    if (isFull) wasFullRef.current = true;
    if (status === 'iniziata') wasFullRef.current = false;

    setApprovalPhase((current) => {
      if (current !== 'accepting' && current !== 'declined' && isFull && status === 'in_registrazione') {
        // Tavolo pieno: chiudo eventuali modali di seduta e apro l'accept.
        setModal(null);
        return 'accepting';
      }
      // Tavolo tornato a un solo giocatore mentre ero in attesa di accettare:
      // l'avversario ha rifiutato (o è sparito) → pannello dedicato.
      if (current === 'accepting' && wasFull && !isFull && status === 'in_registrazione') {
        return 'declined';
      }
      // Match partito o nessun tavolo: il pannello si chiude.
      if (current === 'accepting' && (!isFull || status !== 'in_registrazione')) return null;
      return current;
    });
  }, [tournaments, user.id]);

  const myReady = Boolean(
    approvalTarget?.participants.find((participant) => participant.id === user.id)?.ready,
  );
  const opponentReady = Boolean(
    approvalTarget?.participants.find((participant) => participant.id !== user.id)?.ready,
  );

  const handleApprovalAccept = useCallback(() => {
    if (!approvalTarget) return;
    const targetId = approvalTarget.id;
    setError(null);
    startTransition(async () => {
      const res = await readyTournamentAction(targetId, true);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.matchId) {
        // Match già creato: si va direct alla schermata live (webcam).
        goLiveTo(targetId);
        return;
      }
      router.refresh();
    });
  }, [approvalTarget, router, goLiveTo]);

  // Uscita dal tavolo senza confirm: rifiuto o timeout dell'accettazione.
  // L'id viene dallo stato persistente anche in fase "declined".
  const handleApprovalLeave = useCallback(() => {
    const targetId = approvalId;
    if (!targetId) return;
    setError(null);
    startTransition(async () => {
      const res = await leaveTournamentAction(targetId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setApprovalPhase(null);
      router.refresh();
    });
  }, [approvalId, router]);

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
        if (res.matchId) {
          // Match già partito (es. tavolo pieno con entrambi pronti):
          // si va direttamente alla schermata live.
          goLiveTo(tournamentId);
        } else {
          // Tavolo pieno in attesa di congedo: l'accettazione stile LoL
          // appare in lobby, nessun redirect esplicito.
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
        gamertag={gamertag}
        selection={selection}
        formatId={formatId}
        formatName={formatName}
        modeName={modeName}
        busy={busy}
        error={error}
        reputation={reputation}
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

      <AcceptMatchModal
        phase={approvalPhase}
        myUsername={myUsername}
        opponentUsername={approvalTarget ? opponentFor(approvalTarget.id) : null}
        busy={busy}
        error={error}
        myReady={myReady}
        opponentReady={opponentReady}
        onAccept={handleApprovalAccept}
        onLeave={handleApprovalLeave}
        onOpponentTimeout={() => setApprovalPhase('declined')}
      />
    </>
  );
}
