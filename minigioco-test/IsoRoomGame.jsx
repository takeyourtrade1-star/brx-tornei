'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import ArcadeGameModal from './arcade-room/ArcadeGameModal';
import { MirrorModal } from './avatar/mirror-modal';
import { PiazzaSocialPanel } from './social-room/PiazzaSocialPanel';
import { WorldHud } from './world-ui/WorldHud';
import { WorldModalShell } from './world-ui/WorldModalShell';
import { TutorialOverlay } from './world-ui/TutorialOverlay';
import { createGame } from './world-client/world-game';
import { getWorldActivity } from './world-client/world-activity';
import { useWorldControls } from './world-client/use-world-controls';
import { useWorldEngine } from './world-client/use-world-engine';
import { useWorldActivity } from './world-client/use-world-activity';
import { useWorldSocial } from './world-client/use-world-social';
import { useWorldTutorial } from './world-client/use-world-tutorial';
import { useWorldLook } from './world-runtime/use-world-look';

const EMPTY_TOURNAMENTS = [];
const OFFICIAL_IDS = new Set(['pc', 'board', 'decks']);
const ARCADE_IDS = new Set(['arcade1', 'arcade2', 'arcade3', 'kakegurui']);

/** Foglia interattiva Canvas. Sessione, tornei e mutazioni restano nei confini server. */
export default function IsoRoomGame({
  roomName = 'Sala Tornei', username = 'Giocatore', initialRoom = 'tournament',
  tournaments = EMPTY_TOURNAMENTS, initialLook, onOpenTournaments,
  onOpenCreateTournament, onOpenDecks, onExitToSimple,
  integrationMode = 'site', quality: qualityProp = 'auto', paused = false, __debug,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const apiRef = useRef({});
  const chatInputRef = useRef(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const controls = useWorldControls({
    gameRef, initialRoom, qualityProp, onOpenTournaments,
    onOpenCreateTournament, onOpenDecks, onExitToSimple,
  });
  const tutorial = useWorldTutorial(gameRef);
  const onPreview = useCallback((look) => gameRef.current?.setLook(look), []);
  const look = useWorldLook({ initialLook, onPreview });
  const stats = useMemo(() => getWorldActivity(tournaments, username).stats, [tournaments, username]);
  const { room, modal, quality, muted, closing, powering } = controls;
  const engine = useWorldEngine({
    createGame, canvasRef, wrapRef, gameRef, apiRef,
    options: { initialRoom: room, look: look.draft, stats, integrationMode },
    quality, muted, paused: paused || settingsOpen || modal === 'mirror', debug: __debug,
  });
  const social = useWorldSocial({ room, username, syncedLook: look.saved, gameRef, generation: engine.generation });
  useWorldActivity(tournaments, username, gameRef, room, engine.generation);

  apiRef.current = {
    ...controls.callbacks, ...tutorial.callbacks,
    openModal: (id) => {
      if (!tutorial.tutorialActive || !OFFICIAL_IDS.has(id)) controls.callbacks.openModal(id);
    },
    closeModal: () => {
      if (tutorial.tutorialActive && !modal) gameRef.current?.zoomOut();
      else controls.closeModal();
    },
    sendMove: social.sendMove,
    sendChat: social.sendChat,
    focusChat: () => chatInputRef.current?.focus(),
  };
  const navigate = useCallback((nextRoom) => gameRef.current?.navigateTo(nextRoom), []);
  const interact = useCallback((id) => {
    if (id === 'photo') gameRef.current?.hotkey('P');
    else gameRef.current?.interact(id);
  }, []);
  const openWardrobe = useCallback(() => gameRef.current?.openWardrobe(), []);
  const simpleViewLabel = integrationMode === 'site' ? 'Torna alla lobby' : 'Vista semplice';
  const roomLabel = room === 'tournament' ? roomName : room === 'piazza' ? 'Piazza degli amici' : 'Sala Arcade';

  return (
    <div
      ref={wrapRef}
      className={`irg-root bg-header-bg text-white${quality === 'low' ? ' irg-quality-low' : ''}${powering ? ' irg-powering' : ''}`}
      aria-label="Asso World"
      data-world-room={room}
      data-world-quality={quality}
    >
      <canvas ref={canvasRef} className="irg-canvas" tabIndex={0} aria-label={`${roomLabel}. Clicca per muoverti oppure usa WASD e frecce.`} />
      <WorldHud
        room={room} roomLabel={roomLabel} username={username}
        onlineLabel={room === 'piazza' ? social.connected ? `${social.players.length} in piazza` : 'Offline' : undefined}
        quality={quality} muted={muted}
        onNavigate={navigate} onAction={interact} onWardrobe={openWardrobe}
        onQualityChange={controls.setQualityChoice} onMusicToggle={controls.toggleMute}
        onOverlayChange={setSettingsOpen}
        tutorialAvailable={!tutorial.tutorialActive} onTutorial={tutorial.repeatTutorial}
        actionDisabled={paused || Boolean(modal) || tutorial.tutorialActive}
      />
      {room === 'piazza' && !modal && !tutorial.tutorialActive && (
        <div className="absolute bottom-20 left-3 right-3 z-20 sm:left-auto sm:right-4 sm:w-80" onKeyDown={(event) => event.stopPropagation()}>
          <PiazzaSocialPanel players={social.players} connected={social.connected}
            error={social.connectionError} onSendChat={social.sendChat} inputRef={chatInputRef} />
        </div>
      )}
      <button type="button"
        className="absolute bottom-20 left-3 z-20 hidden min-h-11 items-center gap-2 rounded-md border border-white/15 bg-header-bg/90 px-3 text-xs font-bold text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex"
        onClick={controls.handleSimpleView} disabled={powering} aria-label={simpleViewLabel}>
        <span aria-hidden>←</span>{simpleViewLabel}
      </button>
      <button type="button"
        className="absolute right-3 top-16 z-20 min-h-11 rounded-md border border-white/15 bg-header-bg/90 px-2 text-[10px] font-bold text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:hidden"
        onClick={controls.handleSimpleView} disabled={powering} aria-label={simpleViewLabel}>Esci</button>
      <TutorialOverlay {...tutorial} wrapRef={wrapRef}
        simpleViewLabel={simpleViewLabel} onSimpleView={controls.handleSimpleView} />
      {modal === 'mirror' && (
        <WorldModalShell id="mirror" title="Il tuo guardaroba" closing={closing}
          onClose={controls.closeModal} className="irg-m-mirror">
          <MirrorModal quality={quality} look={look.draft} onChange={look.applyLook}
            pending={look.pending} error={look.error} retrySave={look.retrySave} />
        </WorldModalShell>
      )}
      {ARCADE_IDS.has(modal) && (
        <WorldModalShell id={modal} closing={closing} allowGameKeys
          onClose={controls.closeModal} className="irg-m-arcade" contentClassName="flex h-full min-h-0 flex-col p-0 sm:p-0">
          <ArcadeGameModal gameId={modal} onExit={controls.closeModal}
            username={username} integrationMode={integrationMode} quality={quality} />
        </WorldModalShell>
      )}
      {engine.error && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-header-bg p-6 text-center" role="alert">
          <div><p>{engine.error}</p><button type="button" onClick={engine.retry}
            className="mt-4 min-h-11 rounded-md bg-primary px-5 font-bold text-primary-foreground">Riprova</button></div>
        </div>
      )}
    </div>
  );
}
