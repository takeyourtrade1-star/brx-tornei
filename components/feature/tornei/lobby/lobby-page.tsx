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
import type { ReputationSummary } from '@/lib/data/player-api-client';
import type { FormatFilter, Selection } from '@/lib/validations/selection';
import type { SessionUser } from '@/types/auth';
import type { Tournament } from '@/types/tournament';
import type { Deck } from '@/types/deck';
import type { NotificationSnapshot } from '@/types/notification';
import type { SocialRoomFriendPresence } from '@/types/social';
import { getFormat, type FormatId } from '@/lib/data/catalog';
import { TableSeatModal } from './table-seat-modal';
import { LobbyTableList } from './lobby-table-list';
import { AcceptMatchModal } from './accept-match-modal';
import { FeedbackNotices } from './feedback-notices';
import { useServerConnectionQuality } from '@/hooks/use-server-connection-quality';
import { useTournamentRealtimeRefresh } from '@/hooks/use-tournament-realtime-refresh';
import { ArcadeRoomLauncher } from './arcade-room-launcher';
import { ArcadeAccessGate } from './arcade-access-gate';

interface LobbyPageProps {
  tournaments: Tournament[];
  initialDecks: Deck[];
  user: SessionUser;
  /** Gamertag torneo-only: unica identità mostrata in lobby. */
  gamertag: string;
  selection: Selection;
  formatId: FormatFilter;
  formatName: string;
  modeName: string;
  reputation: ReputationSummary | null;
  initialNotifications: NotificationSnapshot;
  initialFriends: SocialRoomFriendPresence[];
  arcadeAccessGranted: boolean;
  /** Apertura una tantum della modale richiesta da una superficie secondaria. */
  focusTableId?: string;
  openCreate?: boolean;
}

type ModalState =
  | { mode: 'create'; format: FormatId }
  | { mode: 'host' | 'join'; tournamentId: string }
  | null;

export function LobbyPage({
  tournaments,
  initialDecks,
  user,
  gamertag,
  selection,
  formatId,
  formatName,
  modeName,
  reputation,
  initialNotifications,
  initialFriends,
  arcadeAccessGranted,
  focusTableId,
  openCreate = false,
}: LobbyPageProps) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [arcadeUnlocked, setArcadeUnlocked] = useState(arcadeAccessGranted);
  const [arcadeGateOpen, setArcadeGateOpen] = useState(false);
  const [arcadeOpen, setArcadeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalPhase, setApprovalPhase] = useState<'accepting' | 'declined' | null>(null);
  const [busy, startTransition] = useTransition();
  const myUsername = gamertag;
  const monitoredTable = useMemo(
    () => findMyTables(tournaments, user.id).find((table) => table.status === 'in_registrazione'),
    [tournaments, user.id],
  );
  const realtimeServerTime = useTournamentRealtimeRefresh({
    tournamentId: monitoredTable?.id,
    active: Boolean(monitoredTable),
  });
  const measuredQuality = useServerConnectionQuality(monitoredTable?.webcamSessionId);
  const focusHandledRef = useRef<string | null>(null);
  const focusKey = openCreate ? 'create' : focusTableId ? `table:${focusTableId}` : null;

  const clearArcadeFocus = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.delete('focusTable');
    params.delete('focusCreate');
    const query = params.toString();
    router.replace(`${window.location.pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!focusKey) {
      focusHandledRef.current = null;
      return;
    }
    if (focusHandledRef.current === focusKey) return;

    if (openCreate) {
      focusHandledRef.current = focusKey;
      setError(null);
      if (selection.format === 'all') {
        setError('Seleziona un formato specifico per creare un tavolo.');
      } else {
        setModal({ mode: 'create', format: selection.format });
      }
      clearArcadeFocus();
      return;
    }

    if (!focusTableId) return;
    const target = tournaments.find((tournament) => tournament.id === focusTableId);
    if (!target) return;

    focusHandledRef.current = focusKey;
    setError(null);
    const mine = target.participants.some((participant) => participant.id === user.id);
    if (mine) {
      setModal({ mode: 'host', tournamentId: target.id });
    } else if (target.status === 'in_registrazione' && target.participants.length < target.maxPlayers) {
      setModal({ mode: 'join', tournamentId: target.id });
    } else {
      setError('Questo tavolo non è più disponibile.');
    }
    clearArcadeFocus();
  }, [clearArcadeFocus, focusKey, focusTableId, openCreate, selection.format, tournaments, user.id]);
  const tables = useMemo(
    () =>
      buildLobbyTables({ tournaments, userId: user.id, format: selection.format }).map((table) => ({
        ...table,
        seats: table.seats.map((seat) =>
          seat.occupied && seat.isMe && measuredQuality
            ? { ...seat, connection: measuredQuality }
            : seat,
        ) as LobbyTable['seats'],
      })),
    [tournaments, user.id, measuredQuality, selection.format],
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
      const friendChallengeReady =
        only.withFriend === true &&
        only.isPrivate === true &&
        only.status === 'in_registrazione' &&
        only.participants.length >= only.maxPlayers;
      if (started || friendChallengeReady) {
        goLiveTo(only.id);
        return;
      }
    }
    // Poll fallback sempre attivo: 5s sul proprio ready check, 10s sulla
    // lobby generica. Gli eventi WebSocket coprono il percorso normale e la
    // lista aggregata evita di moltiplicare le quote per formato.
    const intervalMs = monitoredTable ? 5_000 : 10_000;
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => clearInterval(iv);
  }, [tournaments, user.id, router, goLiveTo, monitoredTable, selection.format, selection.mode]);

  // Se l'host chiude la finestra del browser mentre attende da solo al tavolo,
  // invia il segnale asincrono di uscita per liberare immediatamente il tavolo.
  useEffect(() => {
    if (!monitoredTable || monitoredTable.participants.length > 1) return;
    const tableId = monitoredTable.id;
    const handleUnload = () => {
      try {
        void leaveTournamentAction(tableId);
      } catch {
        // ignore
      }
    };
    window.addEventListener('pagehide', handleUnload);
    return () => window.removeEventListener('pagehide', handleUnload);
  }, [monitoredTable]);

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
        if (table.tournament?.id === mine.id) {
          setModal({ mode: 'host', tournamentId: mine.id });
        } else {
          setError(`Sei già seduto al tavolo di ${myUsername}. Alzati prima di cambiare sfida.`);
        }
        return;
      }

      if (table.kind === 'joinable' && table.tournament) {
        // La scelta del mazzo è facoltativa sui tavoli casuali.
        setModal({ mode: 'join', tournamentId: table.tournament.id });
        return;
      }

      if (table.kind === 'empty') {
        if (table.tournament) {
          setModal({ mode: 'join', tournamentId: table.tournament.id });
          return;
        }
        // "Tutti i formati" è solo una vista: il tavolo vuoto richiede un formato
        // preciso e il bottone è già bloccato client-side (createLocked).
        if (selection.format === 'all') {
          setError('Seleziona un formato specifico per creare un tavolo.');
          return;
        }
        setModal({ mode: 'create', format: selection.format });
      }
    },
    [tournaments, user.id, myUsername, selection.format],
  );

  const handleConfirmJoin = useCallback(
    (deckId: string) => {
      if (!modal) return;
      setError(null);
      startTransition(async () => {
        if (modal.mode === 'create') {
          const res = await createTableAction(modal.format, selection.mode, deckId);
          if (res.error || !res.createdId) {
            setError(res.error ?? 'Impossibile creare il tavolo.');
            return;
          }
          setModal({ mode: 'host', tournamentId: res.createdId });
          router.refresh();
          return;
        }
        const tournamentId = modal.tournamentId;
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
    [modal, router, goLiveTo, selection.mode],
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

  const modalTournament = modal && modal.mode !== 'create'
    ? tournaments.find((tournament) => tournament.id === modal.tournamentId)
    : null;
  const modalFormatId = modal?.mode === 'create'
    ? modal.format
    : (modalTournament?.format ?? 'modern');
  const modalFormatName = getFormat(modalFormatId)?.name ?? formatName;

  const handleOpenArcade = useCallback(() => {
    if (arcadeUnlocked) {
      setArcadeOpen(true);
      return;
    }
    setArcadeGateOpen(true);
  }, [arcadeUnlocked]);

  const handleArcadeUnlocked = useCallback(() => {
    setArcadeUnlocked(true);
    setArcadeGateOpen(false);
    setArcadeOpen(true);
  }, []);

  const handleCloseArcadeGate = useCallback(() => setArcadeGateOpen(false), []);
  const handleCloseArcade = useCallback(() => setArcadeOpen(false), []);
  const handleOpenArcadeCreate = useCallback((format: FormatId) => {
    setError(null);
    setModal({ mode: 'create', format });
  }, []);

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
        initialNotifications={initialNotifications}
        createLocked={selection.format === 'all'}
        onOpenMinigame={handleOpenArcade}
        onSit={handleSit}
        onOpen={handleOpen}
        onLeave={handleLeave}
        onGoLive={handleGoLive}
      />

      <TableSeatModal
        open={modal !== null}
        mode={modal?.mode ?? 'host'}
        formatId={modalFormatId}
        formatName={modalFormatName}
        myUsername={myUsername}
        opponentUsername={modalTournament ? opponentFor(modalTournament.id) : null}
        currentDeckId={modalTournament
          ?.participants.find((participant) => participant.id === user.id)?.deck?.id}
        busy={busy}
        error={error}
        onClose={() => {
          setError(null);
          setModal(null);
        }}
        onLeave={() => {
          const t = modalTournament;
          if (t) handleLeave({ key: t.id, kind: 'mine', tournament: t, seats: [{ occupied: false }, { occupied: false }], started: false });
        }}
        onConfirmJoin={handleConfirmJoin}
      />
      <AcceptMatchModal
        phase={approvalPhase}
        myUsername={myUsername}
        opponentUsername={approvalTarget ? opponentFor(approvalTarget.id) : null}
        busy={busy}
        error={error}
        myReady={myReady}
        opponentReady={opponentReady}
        readyDeadline={approvalTarget?.readyDeadline}
        serverTime={realtimeServerTime ?? approvalTarget?.serverTime}
        myConnection={
          measuredQuality ??
          approvalTarget?.participants.find((participant) => participant.id === user.id)?.connection
        }
        opponentConnection={
          approvalTarget?.participants.find((participant) => participant.id !== user.id)?.connection
        }
        onAccept={handleApprovalAccept}
        onLeave={handleApprovalLeave}
        onOpponentTimeout={() => setApprovalPhase('declined')}
      />
      <FeedbackNotices
        userId={user.id}
        negativeNotice={reputation?.negativeFeedbackNotice ?? null}
        positiveNotice={reputation?.positiveFeedbackNotice ?? null}
      />
      <ArcadeAccessGate
        open={arcadeGateOpen}
        onClose={handleCloseArcadeGate}
        onUnlocked={handleArcadeUnlocked}
      />
      <ArcadeRoomLauncher
        open={arcadeOpen && arcadeUnlocked}
        onClose={handleCloseArcade}
        tournaments={tournaments}
        tables={tables}
        initialDecks={initialDecks}
        initialFriends={initialFriends}
        gamertag={gamertag}
        formatId={formatId}
        formatName={formatName}
        modeId={selection.mode}
        modeName={modeName}
        busy={busy}
        error={error}
        createLocked={selection.format === 'all'}
        onOpenCreateTournament={handleOpenArcadeCreate}
        onSit={handleSit}
        onOpen={handleOpen}
        onLeave={handleLeave}
        onGoLive={handleGoLive}
      />
    </>
  );
}
