'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTournamentFromGameAction, joinTournamentAction } from '@/actions/tournaments';
import { WebcamLinkModal } from './webcam-link-modal';
import { MatchViewModal, type MatchRole } from './match/match-view-modal';
import { MatchPip } from './match/match-pip';
import { TournamentRequestSentModal } from './tournament-request-sent-modal';
import { TournamentGameCanvas } from './tournament-game-canvas';
import { TournamentSimpleView } from './tournament-simple-view';
import { webcamLink } from '@/lib/webrtc/webcam-stream-store';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import type { InventoryItem } from '@/types/inventory';
import type { Selection } from '@/lib/validations/selection';
import type { Tournament } from '@/types/tournament';

interface TournamentGameViewProps {
  tournaments: Tournament[];
  inventory: InventoryItem[];
  selection: Selection;
  user: any;
  formatId: string;
  formatName: string;
  modeName: string;
}

type PendingAction =
  | { kind: 'create'; tournament: Tournament }
  | { kind: 'join'; id: string };

interface MatchSession {
  tournament: Tournament;
  role: MatchRole;
}

export function TournamentGameView({
  tournaments,
  inventory,
  selection,
  user,
  formatId,
  formatName,
  modeName,
}: TournamentGameViewProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [match, setMatch] = useState<MatchSession | null>(null);
  const [pip, setPip] = useState<Tournament | null>(null);
  const [requestSent, setRequestSent] = useState<string | null>(null);
  const [simpleView, setSimpleView] = useState(true);
  const router = useRouter();
  const [creating, startTransition] = useTransition();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreateTournament = (t: Tournament) => setPending({ kind: 'create', tournament: t });

  const handleJoinTournament = (id: string) => {
    const t = tournaments.find((x) => x.id === id);
    if (t?.isPrivate) {
      setRequestSent(t.format ? t.format.replace('-', ' ') : 'Torneo privato');
      startTransition(async () => {
        await joinTournamentAction(id);
        router.refresh();
      });
      return;
    }
    setPending({ kind: 'join', id });
  };

  const handleObserveTournament = (id: string) => {
    const t = tournaments.find((x) => x.id === id);
    if (t) setMatch({ tournament: t, role: 'observer' });
  };

  const handleSkipToMatch = () => {
    if (!pending) return;
    const t =
      pending.kind === 'join'
        ? tournaments.find((x) => x.id === pending.id)
        : pending.tournament;
    setPending(null);
    if (t) setMatch({ tournament: t, role: 'player' });
  };

  const handleActivatePip = () => {
    if (match) {
      setPip(match.tournament);
      setMatch(null);
    }
  };

  const confirmPending = () => {
    if (!pending) return;
    startTransition(async () => {
      if (pending.kind === 'create') {
        await createTournamentFromGameAction(pending.tournament);
      } else {
        await joinTournamentAction(pending.id);
      }
      router.refresh();
      setPending(null);
    });
  };

  if (isMobile === null) {
    return (
      <div className="min-h-screen" aria-busy="true" aria-label="Caricamento tornei">
        <div className="header-gradient h-20 w-full" />
        <div className="mx-auto mt-4 flex w-full max-w-content flex-col gap-6 px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <div className="h-10 w-64 animate-pulse rounded-lg bg-white/10" />
            <div className="h-11 w-44 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="simple-panel h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isMobile || simpleView) {
    return (
      <TournamentSimpleView
        user={user}
        isMobile={isMobile}
        showMinigameBack={simpleView && !isMobile}
        onBackToMinigame={() => setSimpleView(false)}
        tournaments={tournaments}
        selection={selection}
        formatId={formatId as FormatId}
        formatName={formatName}
        modeName={modeName}
      />
    );
  }

  return (
    <>
      <TournamentGameCanvas
        user={user}
        formatId={formatId as FormatId}
        formatName={formatName}
        modeId={selection.mode as ModeId}
        modeName={modeName}
        tournaments={tournaments}
        inventory={inventory}
        onCreateTournament={handleCreateTournament}
        onJoinTournament={handleJoinTournament}
        onObserveTournament={handleObserveTournament}
        onExitToSimple={() => setSimpleView(true)}
      />

      <WebcamLinkModal
        open={!!pending}
        busy={creating}
        confirmLabel={pending?.kind === 'join' ? 'Partecipa' : 'Crea Torneo'}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
        onSkip={handleSkipToMatch}
      />

      <MatchViewModal
        open={!!match}
        tournament={match?.tournament ?? null}
        role={match?.role ?? 'observer'}
        me={user.name ?? user.email}
        playerStream={webcamLink.get()}
        onClose={() => setMatch(null)}
        onPip={handleActivatePip}
      />

      {pip && (
        <MatchPip
          tournament={pip}
          me={user.name ?? user.email}
          onExpand={() => {
            setMatch({ tournament: pip, role: 'observer' });
            setPip(null);
          }}
          onClose={() => setPip(null)}
        />
      )}

      <TournamentRequestSentModal
        open={!!requestSent}
        requestLabel={requestSent ?? ''}
        onClose={() => setRequestSent(null)}
      />
    </>
  );
}
