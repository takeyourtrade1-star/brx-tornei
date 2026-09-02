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
import { useLobbyAcceptance } from '@/hooks/use-lobby-acceptance';
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

type ModalState = { mode: 'host'; tournamentId: string } | null;

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
  /** Mazzo facoltativo dichiarato nel modale di accettazione ('' = senza). */
  const [approvalDeckId, setApprovalDeckId] = useState('');
  const [actionTournament, setActionTournament] = useState<Tournament | null>(null);
  const [busy, startTransition] = useTransition();
  const myUsername = gamertag;
  const liveNavigationRef = useRef<string | null>(null);
  const goLiveTo = useCallback(
    (id: string) => {
      if (liveNavigationRef.current === id) return;
      liveNavigationRef.current = id;
      router.prefetch(`/tornei/${id}/live`);
      router.push(`/tornei/${id}/live`);
    },
    [router],
  );

  const closeSeatModal = useCallback(() => setModal(null), []);
  /**
   * Seduta diretta, senza modale: si entra sempre senza mazzo. La
   * dichiarazione resta facoltativa e successiva — da "Gestisci tavolo"
   * mentre si aspetta, o dal modale di accettazione quando il tavolo si
   * riempie (il backend accetta lo snapshot finché il match non è partito).
   */
  const runJoin = useCallback(
    (tournamentId: string, deckId?: string) => {
      setError(null);
      startTransition(async () => {
        const res = await joinTournamentAction(tournamentId, deckId);
        if (res.error) {
          setError(res.error);
          return;
        }
        if (res.tournament) setActionTournament(res.tournament);
        setModal(null);
        if (res.matchId) {
          goLiveTo(tournamentId);
        } else {
          router.refresh();
        }
      });
    },
    [goLiveTo, router],
  );

  const runCreate = useCallback(
    (format: FormatId) => {
      setError(null);
      startTransition(async () => {
        const res = await createTableAction(format, selection.mode);
        if (res.error || !res.createdId) {
          setError(res.error ?? 'Impossibile creare il tavolo.');
          return;
        }
        router.refresh();
      });
    },
    [router, selection.mode],
  );

  const {
    monitoredTable,
    trackedTournament,
    coordinatedTournament,
    approvalPhase,
    setApprovalPhase,
    approvalTarget,
    approvalId,
    myReady,
    opponentReady,
  } = useLobbyAcceptance({
    tournaments,
    userId: user.id,
    actionTournament,
    goLiveTo,
    onApprovalOpen: () => {
      closeSeatModal();
      // Ogni nuova accettazione riparte senza mazzo: la scelta è esplicita.
      setApprovalDeckId('');
    },
  });
  const measuredQuality = useServerConnectionQuality(
    actionTournament?.webcamSessionId ?? monitoredTable?.webcamSessionId,
  );
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
        runCreate(selection.format);
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
      runJoin(target.id);
    } else {
      setError('Questo tavolo non è più disponibile.');
    }
    clearArcadeFocus();
  }, [clearArcadeFocus, focusKey, focusTableId, openCreate, runCreate, runJoin, selection.format, tournaments, user.id]);
  /** Mazzi compatibili col formato del tavolo in accettazione (dichiarazione
   * facoltativa al via): dai dati già in pagina, nessuna fetch extra. */
  const approvalDecks = useMemo(
    () =>
      approvalTarget
        ? initialDecks.filter((deck) => deck.formatId === approvalTarget.format)
        : [],
    [approvalTarget, initialDecks],
  );

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
    // Poll fallback sempre attivo: più frequente sul proprio tavolo, dove la
    // precisione della fase conta; la lobby generica resta più leggera.
    // Il timer resta difensivo: ogni refresh della lobby vale ~5 read
    // (tavoli, mazzi, profilo, reputazione, amici) e il backend ammette
    // 120 read/min per utente — a 1s la quota esaurirebbe in ~24s e il 429
    // successivo Crasherebbe l'RSC ("connessione momentaneamente interrotta").
    // Il canale WebSocket copre già la reattività immediata.
    const intervalMs = trackedTournament ? 5_000 : 10_000;
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => clearInterval(iv);
  }, [tournaments, user.id, router, goLiveTo, trackedTournament, selection.format, selection.mode]);

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

  const handleApprovalAccept = useCallback(() => {
    if (!approvalTarget) return;
    const targetId = approvalTarget.id;
    setError(null);
    startTransition(async () => {
      // Dichiarazione facoltativa al via: il tavolo è ancora in attesa, quindi
      // il backend accetta lo snapshot del mazzo prima del ready.
      if (approvalDeckId) {
        const declared = await joinTournamentAction(targetId, approvalDeckId);
        if (declared.error) {
          setError(declared.error);
          return;
        }
        if (declared.tournament) setActionTournament(declared.tournament);
      }
      const res = await readyTournamentAction(targetId, true);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.tournament) setActionTournament(res.tournament);
      if (res.matchId) {
        // Match già creato: si va direct alla schermata live (webcam).
        setApprovalPhase(null);
        goLiveTo(targetId);
        return;
      }
      router.refresh();
    });
  }, [approvalDeckId, approvalTarget, router, goLiveTo, setApprovalPhase]);

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
      setActionTournament(null);
      router.refresh();
    });
  }, [approvalId, router, setApprovalPhase]);

  const opponentFor = useCallback(
    (tournamentId: string): string | null => {
      const t = coordinatedTournament?.id === tournamentId
        ? coordinatedTournament
        : tournaments.find((x) => x.id === tournamentId)
          ?? (actionTournament?.id === tournamentId ? actionTournament : null);
      if (!t) return null;
      const other = t.participants.find((p) => p.id !== user.id);
      return other?.username ?? null;
    },
    [actionTournament, coordinatedTournament, tournaments, user.id],
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

      if (table.tournament) {
        runJoin(table.tournament.id);
        return;
      }
      // "Tutti i formati" è solo una vista: il tavolo vuoto richiede un formato
      // preciso e il bottone è già bloccato client-side (createLocked).
      if (selection.format === 'all') {
        setError('Seleziona un formato specifico per creare un tavolo.');
        return;
      }
      runCreate(selection.format);
    },
    [tournaments, user.id, myUsername, selection.format, runJoin, runCreate],
  );

  const handleConfirmJoin = useCallback(
    (deckId: string) => {
      if (!modal) return;
      runJoin(modal.tournamentId, deckId);
    },
    [modal, runJoin],
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
        if (id === actionTournament?.id) setActionTournament(null);
        router.refresh();
      });
    },
    [actionTournament?.id, router],
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

  const modalTournament = modal
    ? tournaments.find((tournament) => tournament.id === modal.tournamentId)
    : null;
  const modalFormatId = modalTournament?.format ?? 'modern';
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
  const handleOpenArcadeCreate = useCallback(
    (format: FormatId) => runCreate(format),
    [runCreate],
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
        serverTime={approvalTarget?.serverTime}
        myConnection={
          measuredQuality ??
          approvalTarget?.participants.find((participant) => participant.id === user.id)?.connection
        }
        opponentConnection={
          approvalTarget?.participants.find((participant) => participant.id !== user.id)?.connection
        }
        decks={approvalDecks}
        deckId={approvalDeckId}
        onDeckChange={setApprovalDeckId}
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
