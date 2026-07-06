'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import type { Tournament } from '@/types/tournament';
import type { LiveViewRole } from '@/lib/validations/live';
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

/**
 * Vista partita live minimale: due webcam P2P, nomi giocatori e commenti.
 */
export function MatchLiveView({ tournament, role, me, userId, isHost }: MatchLiveViewProps) {
  const router = useRouter();
  const isObserver = role === 'observer';
  const isPlayer = !isObserver;

  const { local, remote, players } = resolveMatchSides(tournament, me, userId);
  const [playerA, playerB] = players;

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

  useEffect(() => {
    if (tournament.status !== 'in_registrazione') return;
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [tournament.status, router]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col px-4 py-4 pb-16 sm:px-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
        {isPlayer && tournament.status === 'iniziata' && (
          <ConnectionBadge state={peerState} error={peerError} />
        )}
      </header>

      {tournament.status === 'in_registrazione' && (
        <p className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          In attesa del secondo giocatore… La partita inizierà quando il torneo sarà completo.
        </p>
      )}

      {(webcamError || peerError) && isPlayer && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {webcamError ?? peerError}
        </p>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div className="relative aspect-video sm:aspect-auto sm:min-h-[300px]">
            <WebcamTile
              stream={isPlayer ? remoteStream : null}
              username={remote.username}
              connecting={isPlayer ? peerConnecting : false}
            />
          </div>
        </div>

        <MatchCommentsPanel me={me} />
      </div>
    </div>
  );
}
