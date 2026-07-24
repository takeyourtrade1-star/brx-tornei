'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Minimize2 } from 'lucide-react';
import { getPlaymat, type PlaymatId } from '@/lib/playmats';
import { MatchCompactChat, type MatchCompactChatProps } from './match-compact-chat';
import { MatchLifeBadge } from './match-life-badge';
import { MatchMediaButton } from './match-media-button';
import { WebcamTile } from './webcam-tile';

interface MatchFullscreenArenaProps {
  open: boolean;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  localUsername: string;
  remoteUsername: string;
  localPlayerId: string;
  remotePlayerId: string;
  localFeedLabel?: string;
  connecting?: boolean;
  camOn: boolean;
  micOn: boolean;
  startingLife: number;
  lifeByPlayerId: Record<string, number>;
  lifeConnected: boolean;
  playmatId: PlaymatId;
  chat: MatchCompactChatProps;
  onToggleCam: () => void;
  onToggleMic: () => void;
  onLifeChange: (playerId: string, delta: number) => void;
  onLifeReset?: () => void;
  onClose: () => void;
}

export function MatchFullscreenArena({
  open,
  localStream,
  remoteStream,
  localUsername,
  remoteUsername,
  localPlayerId,
  remotePlayerId,
  localFeedLabel,
  connecting = false,
  camOn,
  micOn,
  startingLife,
  lifeByPlayerId,
  lifeConnected,
  playmatId,
  chat,
  onToggleCam,
  onToggleMic,
  onLifeChange,
  onLifeReset,
  onClose,
}: MatchFullscreenArenaProps) {
  const [mounted, setMounted] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const dialogRef = useRef<HTMLElement | null>(null);
  const playmat = getPlaymat(playmatId);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const background = Array.from(document.body.children)
      .filter((element) => element !== dialog)
      .map((element) => ({
        element,
        ariaHidden: element.getAttribute('aria-hidden'),
        inert: element.hasAttribute('inert'),
      }));
    background.forEach(({ element }) => {
      element.setAttribute('aria-hidden', 'true');
      element.setAttribute('inert', '');
    });
    const focusable = () => Array.from(
      dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])') ?? [],
    );
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0]!;
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      background.forEach(({ element, ariaHidden, inert }) => {
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
        if (!inert) element.removeAttribute('inert');
      });
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <section
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Partita in fullscreen"
      className="fixed inset-0 z-[1200] overflow-hidden bg-stone-950 text-white"
      style={{ backgroundImage: 'url(' + playmat.src + ')', backgroundPosition: 'center', backgroundSize: 'cover' }}
    >
      <div className="absolute inset-0 bg-black/35" aria-hidden />
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/85 to-transparent py-4 pl-4 pr-16 sm:pl-6 sm:pr-20">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Il tuo tavolo</p>
          <h2 className="font-sans text-lg font-black sm:text-xl">{localUsername}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileChatOpen((current) => !current)}
            aria-expanded={mobileChatOpen}
            aria-controls="match-fullscreen-mobile-chat"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/50 backdrop-blur-md md:hidden"
            aria-label={mobileChatOpen ? 'Nascondi chat' : 'Mostra chat'}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <MatchMediaButton on={micOn} label="microfono" onClick={onToggleMic} />
          <MatchMediaButton on={camOn} label="camera" onClick={onToggleCam} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Riduci fullscreen"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 text-xs font-black uppercase backdrop-blur-md hover:bg-black/70 sm:px-4"
          >
            <Minimize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Riduci</span>
          </button>
        </div>
      </div>

      <div className="relative z-10 grid h-full min-h-0 grid-cols-1 gap-3 px-3 pb-24 pt-20 sm:px-6 sm:pt-24 md:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)] md:gap-5">
        {/* Fuori dall'overlay della webcam: sul desktop la chat occupa una vera
            colonna laterale, allineata verticalmente all'area video. */}
        <aside className="hidden h-full min-h-0 md:block" aria-label="Chat della partita">
          <MatchCompactChat {...chat} fullHeight />
        </aside>

        <div className="grid min-h-0 place-items-center">
          <div className="relative w-[min(91vw,138vh)] max-w-full overflow-hidden rounded-[1.35rem] bg-black/70 p-1.5 shadow-[0_30px_90px_rgba(0,0,0,0.7)] ring-1 ring-primary/35 [aspect-ratio:16/9] sm:rounded-[2rem] sm:p-2.5 md:w-[min(100%,calc((100dvh-12rem)*16/9))]">
            <div className="absolute inset-1.5 sm:inset-2.5">
              <WebcamTile
                stream={remoteStream}
                username={remoteUsername}
                connecting={connecting}
                muted={false}
              />
            </div>
            <span className="pointer-events-none absolute left-5 top-5 z-10 rounded-full bg-sky-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
              Webcam avversario
            </span>
          </div>
        </div>
      </div>

      {mobileChatOpen && (
        <aside id="match-fullscreen-mobile-chat" className="absolute inset-x-3 bottom-24 z-50 md:hidden" aria-label="Chat della partita">
          <MatchCompactChat {...chat} />
        </aside>
      )}

      {/* La tua preview e i punti vita dell'avversario restano in basso a destra. */}
      <div className="absolute bottom-5 right-4 z-40 flex items-end gap-2">
        <div className="min-w-0">
          <MatchLifeBadge
            username={remoteUsername}
            life={lifeByPlayerId[remotePlayerId] ?? startingLife}
            playerId={remotePlayerId}
            connected={lifeConnected}
            variant="remote"
            roleLabel="Avversario"
            interactive={false}
            onChange={onLifeChange}
          />
        </div>
        <div className="w-[min(28vw,300px)] rounded-2xl border border-primary/30 bg-black/75 p-1.5 shadow-[0_22px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:min-w-[240px]">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">La tua webcam</span>
            <span className="truncate pl-2 text-[10px] font-bold text-white">{localUsername}</span>
          </div>
          <div className="relative w-full overflow-hidden rounded-xl [aspect-ratio:16/9]">
            <div className="absolute inset-0">
              <WebcamTile
                stream={localStream}
                username={localUsername}
                feedLabel={localFeedLabel}
                videoDisabled={!camOn}
                compact
                hideUsername
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 z-40 -translate-x-1/2">
        <MatchLifeBadge
          username={localUsername}
          life={lifeByPlayerId[localPlayerId] ?? startingLife}
          playerId={localPlayerId}
          connected={lifeConnected}
          variant="local"
          roleLabel="Tu"
          startingLife={startingLife}
          onChange={onLifeChange}
          onReset={onLifeReset}
        />
      </div>
    </section>,
    document.body,
  );
}
