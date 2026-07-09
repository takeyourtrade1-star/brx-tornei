'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Gamepad2,
  Hourglass,
  Layers,
  LogOut,
  Mic,
  MicOff,
  Swords,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { leaveTournamentAction, readyTournamentAction } from '@/actions/tournaments';
import type { MatchSticker } from './match-stickers';
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

/** Chip giocatore nel ready check: nome + stato pronto. */
function ReadyChip({
  username,
  ready,
  isMe = false,
}: {
  username: string;
  ready: boolean;
  isMe?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold',
        ready ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/70',
      )}
    >
      {ready ? <CheckCircle2 className="h-4 w-4" /> : <Hourglass className="h-4 w-4" />}
      {username}
      {isMe && (
        <span className="text-[10px] uppercase tracking-wider opacity-70">tu</span>
      )}
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

  // Toggle camera/microfono: si disabilita la track (enabled=false), che
  // viaggia già nel P2P — l'avversario riceve nero/silenzio senza rinegoziare.
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  useEffect(() => {
    if (!localStream) return;
    for (const t of localStream.getVideoTracks()) t.enabled = camOn;
    for (const t of localStream.getAudioTracks()) t.enabled = micOn;
  }, [localStream, camOn, micOn]);

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

  // Ready check: a tavolo pieno (2/2) il match parte solo quando entrambi
  // premono "Pronto". Lo stato arriva dal server (participants[].ready).
  const tableFull = tournament.participants.length >= tournament.maxPlayers;
  const readyPhase = tournament.status === 'in_registrazione' && tableFull && isPlayer;
  const myReady =
    tournament.participants.find((p) => p.id === userId)?.ready ?? false;
  const opponentReady =
    tournament.participants.find((p) => p.id !== userId)?.ready ?? false;
  const [readyError, setReadyError] = useState<string | null>(null);
  const [readyPending, startReady] = useTransition();
  const handleReady = () => {
    setReadyError(null);
    startReady(async () => {
      const res = await readyTournamentAction(tournament.id, !myReady);
      if (res.error) {
        setReadyError(res.error);
        return;
      }
      router.refresh();
    });
  };

  // Overlay sticker: quando in chat arriva una provocazione (mia o sua),
  // l'emoji esplode al centro dell'area video per ~2.2s (durata allineata
  // all'animazione CSS sticker-overlay-pop).
  const [stickerShot, setStickerShot] = useState<{
    sticker: MatchSticker;
    fromUserId: string;
    key: number;
  } | null>(null);
  const stickerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stickerKey = useRef(0);
  const handleSticker = useCallback((sticker: MatchSticker, fromUserId: string) => {
    stickerKey.current += 1;
    setStickerShot({ sticker, fromUserId, key: stickerKey.current });
    if (stickerTimer.current) clearTimeout(stickerTimer.current);
    stickerTimer.current = setTimeout(() => setStickerShot(null), 2200);
  }, []);
  useEffect(
    () => () => {
      if (stickerTimer.current) clearTimeout(stickerTimer.current);
    },
    [],
  );

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
    // In attesa: polling fitto per accorgersi dell'avversario che si siede
    // (più fitto ancora durante il ready check, per vedere il suo "Pronto").
    // In partita: polling più lento, serve solo a scoprire un eventuale
    // abbandono dell'avversario (torneo → terminata).
    // router.refresh() rifà il render RSC dell'intera pagina: a tab nascosta
    // è lavoro (e traffico) buttato, si riprende al ritorno sulla tab.
    const intervalMs =
      tournament.status === 'in_registrazione' ? (tableFull ? 3000 : 5000) : 12000;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [tournament.status, tableFull, router]);

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

      {tournament.status === 'in_registrazione' && !tableFull && (
        <p className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          In attesa del secondo giocatore… La partita inizierà quando il torneo sarà completo.
        </p>
      )}

      {readyPhase && (
        <div className="mb-4 flex flex-col items-center gap-3 rounded-2xl border border-[#FF7300]/40 bg-[#FF7300]/[0.08] px-4 py-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Swords className="h-5 w-5 text-[#FF7300]" />
            <ReadyChip username={local.username} ready={myReady} isMe />
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
              vs
            </span>
            <ReadyChip username={remote.username} ready={opponentReady} />
          </div>
          <div className="flex items-center gap-3">
            {myReady && !opponentReady && (
              <span className="text-xs font-semibold text-white/60">
                In attesa dell’avversario…
              </span>
            )}
            <button
              type="button"
              disabled={readyPending}
              onClick={handleReady}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-wide text-white transition active:scale-[0.98] disabled:opacity-50',
                myReady
                  ? 'border border-white/20 bg-white/10 hover:bg-white/15'
                  : 'ready-pulse bg-gradient-to-r from-[#FF7300] to-orange-500 hover:opacity-90',
              )}
            >
              {myReady ? (
                <>
                  <Hourglass className="h-4 w-4" />
                  Annulla pronto
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Pronto!
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {readyError && isPlayer && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {readyError}
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
        <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Overlay sticker: esplode al centro dell'area video e sfuma da solo */}
          {stickerShot && (
            <div
              key={stickerShot.key}
              className="pointer-events-none absolute inset-0 z-30 grid place-items-center"
              aria-hidden
            >
              <div className="sticker-overlay flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'text-7xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)] sm:text-8xl',
                    stickerShot.sticker.animation,
                  )}
                >
                  {stickerShot.sticker.emoji}
                </span>
                <span className="rounded-full bg-black/60 px-3 py-1 text-sm font-black uppercase tracking-widest text-[#FF9C4A] backdrop-blur-sm">
                  {stickerShot.sticker.label}
                </span>
                <span className="text-[11px] font-bold text-white/75 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
                  {stickerShot.fromUserId === userId
                    ? me
                    : (participantNames[stickerShot.fromUserId] ?? 'Avversario')}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="relative aspect-video sm:aspect-auto sm:min-h-[300px]">
              {isObserver ? (
                <WebcamTile username={playerA.username} />
              ) : (
                <WebcamTile
                  stream={localStream}
                  username={local.username}
                  feedLabel={feedLabel}
                  videoDisabled={!camOn}
                />
              )}
              {isPlayer && (
                <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase text-white backdrop-blur-sm">
                  Tu
                </span>
              )}
              {isPlayer && localStream && (
                <div className="absolute bottom-2 right-2 z-10 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMicOn((v) => !v)}
                    aria-label={micOn ? 'Spegni microfono' : 'Accendi microfono'}
                    aria-pressed={!micOn}
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-full border backdrop-blur-sm transition active:scale-95',
                      micOn
                        ? 'border-white/25 bg-black/50 text-white hover:bg-black/70'
                        : 'border-red-500/50 bg-red-500/80 text-white hover:bg-red-500',
                    )}
                  >
                    {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCamOn((v) => !v)}
                    aria-label={camOn ? 'Spegni camera' : 'Accendi camera'}
                    aria-pressed={!camOn}
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-full border backdrop-blur-sm transition active:scale-95',
                      camOn
                        ? 'border-white/25 bg-black/50 text-white hover:bg-black/70'
                        : 'border-red-500/50 bg-red-500/80 text-white hover:bg-red-500',
                    )}
                  >
                    {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </button>
                </div>
              )}
              {isPlayer && !micOn && (
                <span className="pointer-events-none absolute left-2 top-9 z-10 grid h-6 w-6 place-items-center rounded-full bg-red-500/85 text-white">
                  <MicOff className="h-3.5 w-3.5" />
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
              onSticker={handleSticker}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
