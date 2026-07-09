'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { ArrowLeft, CheckCircle2, Gamepad2, Layers, LogOut, Wifi, WifiOff } from 'lucide-react';
import { leaveTournamentAction } from '@/actions/tournaments';
import type { Participant, Tournament } from '@/types/tournament';
import type { LiveViewRole } from '@/lib/validations/live';
import { getFormat, getMode } from '@/lib/data/catalog';
import { usePlayerWebcam } from '@/hooks/use-player-webcam';
import { useMatchPeerConnection } from '@/hooks/use-match-peer-connection';
import { resolveMatchSides } from './match-players';
import { WebcamTile } from './webcam-tile';
import { MatchCommentsPanel } from './match-comments-panel';
import { cn } from '@/lib/utils';

interface MatchLiveViewProps {
  tournament: Tournament;
  role: LiveViewRole;
  me: string;
  userId: string;
  accessToken: string;
  isHost: boolean;
}

function ConnectionBadge({ state, error }: { state: string; error: string | null }) {
  const live = state === 'connected';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
        live
          ? 'bg-emerald-500/20 text-emerald-300'
          : state === 'failed'
            ? 'bg-red-500/20 text-red-300'
            : 'bg-white/10 text-white/60',
      )}
    >
      {live ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {live ? 'Video connesso' : error ? 'Errore video' : 'Connessione…'}
    </span>
  );
}

/** Mazzo del giocatore mostrato sotto la sua webcam. */
function DeckStrip({ player, formatName }: { player: Participant; formatName: string }) {
  const waiting = player.id === '__waiting__';
  const deck = player.deck;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FF7300]/15 text-[#FF7300]">
        <Layers className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-white">
          {waiting ? 'In attesa…' : (deck?.name ?? 'Mazzo non dichiarato')}
        </p>
        <p className="truncate text-[11px] text-white/50">
          {formatName}
          {deck?.archetype ? ` · ${deck.archetype}` : ''}
        </p>
      </div>
      {deck?.verified && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          Verificato
        </span>
      )}
    </div>
  );
}

/** Riepilogo partita (modalità · best of · formato) sopra i commenti. */
function MatchInfoBar({
  modeName,
  bestOfLabel,
  formatName,
}: {
  modeName: string;
  bestOfLabel: string;
  formatName: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/85">
        <Gamepad2 className="h-3.5 w-3.5 text-[#FF7300]" />
        {modeName}
      </span>
      <span className="inline-flex items-center rounded-full bg-[#FF7300]/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[#FF7300]">
        {bestOfLabel}
      </span>
      <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-white/40">
        {formatName}
      </span>
    </div>
  );
}

/**
 * Vista partita live: due webcam P2P (con mazzo sotto ognuna), riepilogo
 * modalità/best-of sopra i commenti.
 */
export function MatchLiveView({
  tournament,
  role,
  me,
  userId,
  accessToken,
  isHost,
}: MatchLiveViewProps) {
  const router = useRouter();
  const isObserver = role === 'observer';
  const isPlayer = !isObserver;

  const { local, remote, players } = resolveMatchSides(tournament, me, userId);
  const [playerA, playerB] = players;

  // Giocatore mostrato in ciascuna webcam (sinistra/destra) per associare il mazzo.
  const leftPlayer = isObserver ? playerA : local;
  const rightPlayer = isObserver ? playerB : remote;
  const modeName = getMode(tournament.mode)?.name ?? tournament.mode;
  const formatName = getFormat(tournament.format)?.name ?? tournament.format;
  const bestOfLabel = 'Best of 3';

  const { stream: localStream, feedLabel, error: webcamError } = usePlayerWebcam(isPlayer);
  const peerSessionId = tournament.matchWebcamSessionId ?? tournament.matchId ?? null;
  const peerRole = isHost ? 'host' : 'guest';

  const { state: peerState, remoteStream, error: peerError } = useMatchPeerConnection({
    sessionId: peerSessionId,
    role: peerRole,
    active: isPlayer && tournament.status === 'iniziata' && !!peerSessionId,
    localStream,
  });

  const peerConnecting =
    isPlayer &&
    tournament.status === 'iniziata' &&
    !remoteStream &&
    peerState !== 'failed' &&
    peerState !== 'idle';

  // Abbandono partita: possibile anche a match iniziato (prima era solo
  // pre-inizio in lobby, e le partite morte restavano appese per sempre).
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaving, startLeaving] = useTransition();
  const handleLeave = () => {
    const message =
      tournament.status === 'iniziata'
        ? 'Vuoi abbandonare la partita? Verrai rimosso dal tavolo.'
        : 'Vuoi alzarti dal tavolo?';
    if (!window.confirm(message)) return;
    startLeaving(async () => {
      const res = await leaveTournamentAction(tournament.id);
      if (res.error) {
        setLeaveError(res.error);
        return;
      }
      router.push('/tornei');
      router.refresh();
    });
  };

  useEffect(() => {
    if (tournament.status === 'terminata') return;
    // In attesa: polling fitto per accorgersi dell'avversario che si siede.
    // In partita: polling più lento, serve solo a scoprire un eventuale
    // abbandono dell'avversario (torneo → terminata).
    // router.refresh() rifà il render RSC dell'intera pagina: a tab nascosta
    // è lavoro (e traffico) buttato, si riprende al ritorno sulla tab.
    const intervalMs = tournament.status === 'in_registrazione' ? 5000 : 12000;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [tournament.status, router]);

  const participantNames = Object.fromEntries(
    tournament.participants.map((p) => [p.id, p.username]),
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col px-4 py-4 pb-16 sm:px-6">
      <header className="simple-panel mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/tornei"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15"
            aria-label="Torna ai tornei"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-lg font-black uppercase tracking-wide text-white">
              Partita live
            </h1>
            <p className="text-xs text-white/55">
              {playerA.username} vs {playerB.username}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/85">
            <Gamepad2 className="h-3.5 w-3.5 text-[#FF7300]" />
            {modeName}
          </span>
          <span className="inline-flex items-center rounded-full bg-[#FF7300]/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[#FF7300]">
            {bestOfLabel}
          </span>
          {isPlayer && tournament.status === 'iniziata' && (
            <ConnectionBadge state={peerState} error={peerError} />
          )}
          {isPlayer && tournament.status !== 'terminata' && (
            <button
              type="button"
              disabled={leaving}
              onClick={handleLeave}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {tournament.status === 'iniziata' ? 'Abbandona' : 'Alzati'}
            </button>
          )}
        </div>
      </header>

      {tournament.status === 'in_registrazione' && (
        <p className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          In attesa del secondo giocatore… La partita inizierà quando il torneo sarà completo.
        </p>
      )}

      {tournament.status === 'terminata' && (
        <p className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white/85">
          <span>La partita è terminata (fine match o abbandono dell’avversario).</span>
          <Link
            href="/tornei"
            className="rounded-full bg-gradient-to-r from-[#FF7300] to-orange-500 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white transition hover:opacity-90"
          >
            Torna ai tavoli
          </Link>
        </p>
      )}

      {(webcamError || peerError || leaveError) && isPlayer && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {leaveError ?? webcamError ?? peerError}
        </p>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <div className="relative aspect-video sm:aspect-auto sm:min-h-[300px]">
              {isObserver ? (
                <WebcamTile username={playerA.username} />
              ) : (
                <WebcamTile stream={localStream} username={local.username} feedLabel={feedLabel} />
              )}
              {isPlayer && (
                <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase text-white backdrop-blur-sm">
                  Tu
                </span>
              )}
            </div>
            <DeckStrip player={leftPlayer} formatName={formatName} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="relative aspect-video sm:aspect-auto sm:min-h-[300px]">
              <WebcamTile
                stream={isPlayer ? remoteStream : null}
                username={remote.username}
                connecting={isPlayer ? peerConnecting : false}
                muted={false}
              />
            </div>
            <DeckStrip player={rightPlayer} formatName={formatName} />
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <MatchInfoBar modeName={modeName} bestOfLabel={bestOfLabel} formatName={formatName} />
          <div className="min-h-0 flex-1">
            <MatchCommentsPanel
              me={me}
              userId={userId}
              matchId={tournament.matchId}
              accessToken={accessToken}
              active={isPlayer && tournament.status === 'iniziata' && !!tournament.matchId}
              participantNames={participantNames}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
