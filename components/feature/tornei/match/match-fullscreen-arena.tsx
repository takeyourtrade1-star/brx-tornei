'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { getPlaymat, type PlaymatId } from '@/lib/playmats';
import { MatchCompactChat, type MatchCompactChatProps } from './match-compact-chat';
import { MatchFullscreenHeader } from './match-fullscreen-header';
import { MatchWebcamDisconnectOverlay } from './match-live-parts';
import { WebcamTile } from './webcam-tile';

interface MatchFullscreenArenaProps {
  open: boolean;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  localUsername: string; remoteUsername: string;
  localPlayerId: string; remotePlayerId: string;
  localFeedLabel?: string; connecting?: boolean;
  peerReconnecting?: boolean; graceRemaining?: number | null;
  remoteEmptyLabel?: string; camOn: boolean; micOn: boolean;
  opponentMuted?: boolean; mirroredLocal?: boolean; mirroredRemote?: boolean;
  startingLife: number; lifeByPlayerId: Record<string, number>;
  lifeConnected: boolean; playmatId: PlaymatId; chat: MatchCompactChatProps;
  judge?: ReactNode;
  onToggleCam: () => void; onToggleMic: () => void;
  onToggleOpponentMute?: () => void; onToggleMirrorLocal?: () => void;
  onToggleMirrorRemote?: () => void;
  onLifeChange: (playerId: string, delta: number) => void;
  onLifeReset?: () => void; onRetryPeer?: () => void; onClose: () => void;
}

export function MatchFullscreenArena(props: MatchFullscreenArenaProps) {
  const {
    open, localStream, remoteStream, localUsername, remoteUsername,
    localPlayerId, remotePlayerId, localFeedLabel, connecting = false,
    peerReconnecting = false, graceRemaining = null,
    remoteEmptyLabel, camOn, micOn, opponentMuted = false,
    mirroredLocal = false, mirroredRemote = false, startingLife,
    lifeByPlayerId, lifeConnected, playmatId, chat, judge, onToggleCam,
    onToggleMic, onToggleOpponentMute, onToggleMirrorLocal,
    onToggleMirrorRemote, onLifeChange, onLifeReset, onRetryPeer, onClose,
  } = props;
  const [mounted, setMounted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const dialogRef = useRef<HTMLElement | null>(null);
  const playmat = getPlaymat(playmatId);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const background = Array.from(document.body.children)
      .filter((el) => el !== dialog)
      .map((el) => ({ el, ariaHidden: el.getAttribute('aria-hidden'), inert: el.hasAttribute('inert') }));
    background.forEach(({ el }) => { el.setAttribute('aria-hidden', 'true'); el.setAttribute('inert', ''); });

    const focusable = () => Array.from(
      dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled])') ?? [],
    );
    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
      background.forEach(({ el, ariaHidden, inert }) => {
        if (ariaHidden === null) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', ariaHidden);
        if (!inert) el.removeAttribute('inert');
      });
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <section
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Partita a schermo intero"
      className="fixed inset-0 z-[1200] flex flex-col overflow-hidden bg-[#060814] text-white"
      style={{ backgroundImage: `url(${playmat.src})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" aria-hidden />

      {/* MASTER TOP HUD: punti vita e controlli completamente FUORI dai video */}
      <MatchFullscreenHeader
        localUsername={localUsername}
        remoteUsername={remoteUsername}
        localPlayerId={localPlayerId}
        remotePlayerId={remotePlayerId}
        startingLife={startingLife}
        lifeByPlayerId={lifeByPlayerId}
        lifeConnected={lifeConnected}
        onLifeChange={onLifeChange}
        onLifeReset={onLifeReset}
        camOn={camOn}
        micOn={micOn}
        opponentMuted={opponentMuted}
        onToggleCam={onToggleCam}
        onToggleMic={onToggleMic}
        onToggleOpponentMute={onToggleOpponentMute}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((c) => !c)}
        onClose={onClose}
      />

      {/* ARENA WEBCAM: Focus sull'avversario a tutto schermo con PiP propria */}
      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4">
        {/* Webcam Avversario massimizzata */}
        <div className="relative flex h-full w-full max-w-[calc((100dvh-5rem)*1.7778)] aspect-video items-center justify-center overflow-hidden rounded-2xl border border-sky-400/35 bg-black/90 shadow-2xl ring-1 ring-sky-400/20">
          <WebcamTile
            stream={remoteStream}
            username={remoteUsername}
            connecting={connecting}
            muted={opponentMuted}
            mirrored={mirroredRemote}
            onToggleMirror={onToggleMirrorRemote}
            emptyLabel={remoteEmptyLabel}
            hideUsername
          />
          <MatchWebcamDisconnectOverlay
            reconnecting={peerReconnecting}
            remaining={graceRemaining}
            disconnectedIsMe={false}
            opponentName={remoteUsername}
            onRetry={onRetryPeer}
          />
          <span className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-sky-400/30 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-300 backdrop-blur-md shadow">
            Webcam avversario
          </span>
        </div>

        {/* Picture-in-Picture del proprio tavolo */}
        <div className="absolute bottom-4 right-4 z-30 w-48 sm:w-60 rounded-xl border border-primary/35 bg-header-bg/95 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-primary/25">
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">La tua webcam</span>
            <span className="truncate text-[10px] font-bold text-white/70 max-w-[100px]">{localUsername}</span>
          </div>
          <div className="relative w-full overflow-hidden rounded-lg aspect-video bg-black/90">
            <WebcamTile
              stream={localStream}
              username={localUsername}
              feedLabel={localFeedLabel}
              videoDisabled={!camOn}
              mirrored={mirroredLocal}
              onToggleMirror={onToggleMirrorLocal}
              compact
              hideUsername
            />
          </div>
        </div>
      </main>

      {/* CASSETTO CHAT FLUTTUANTE (non sottrae larghezza alle webcam) */}
      {chatOpen && (
        <aside className="absolute bottom-4 right-4 top-20 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-white/15 bg-header-bg/95 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-black uppercase text-primary">Chat di partita</span>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              aria-label="Chiudi chat"
              className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-white/60 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <MatchCompactChat {...chat} fullHeight />
          </div>
        </aside>
      )}

      {judge}
    </section>,
    document.body,
  );
}
