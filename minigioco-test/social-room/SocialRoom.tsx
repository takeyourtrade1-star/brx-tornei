"use client";

import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { getCspNonce } from "../csp-nonce";
import {
  MAX_CHAT_LENGTH,
  SOCIAL_ROOM_BOUNDS,
  stableHash,
  type SocialRoomFriendInput,
  type SocialRoomPlayer,
} from "./social-room-protocol";
import {
  useSocialRoomPresence,
  type SocialRoomPresenceApi,
} from "./use-social-room-presence";

export interface SocialRoomProps {
  readonly roomId?: string;
  readonly gamertag?: string;
  readonly avatarId?: string;
  readonly initialFriends?: readonly SocialRoomFriendInput[];
  readonly enabled?: boolean;
  readonly onExit?: () => void;
}

const AVATAR_GLYPHS = ["🧙", "🦊", "🐉", "🛸", "🧝", "🐼", "🦄", "🤖"];

function avatarGlyph(avatarId: string): string {
  return AVATAR_GLYPHS[stableHash(avatarId) % AVATAR_GLYPHS.length] ?? "🙂";
}

function sourceLabel(player: SocialRoomPlayer): string {
  if (player.isSelf) return "Tu";
  return player.source === "live-tab" ? "Live tab" : "Amico online";
}

function transportLabel(room: SocialRoomPresenceApi): string {
  if (!room.connected) return "Locale non disponibile";
  return room.transportMode === "broadcast-channel" ? "Tab locali connessi" : "Fallback storage attivo";
}

function moveFromClick(event: MouseEvent<HTMLDivElement>): { x: number; y: number } | null {
  const bounds = event.currentTarget.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * SOCIAL_ROOM_BOUNDS.maxX,
    y: ((event.clientY - bounds.top) / bounds.height) * SOCIAL_ROOM_BOUNDS.maxY,
  };
}

function PlayerToken({ player }: { readonly player: SocialRoomPlayer }): React.JSX.Element {
  return (
    <div
      aria-label={`${player.gamertag}, ${sourceLabel(player)}`}
      className="social-room-player"
      style={{
        left: `${6 + player.position.x / SOCIAL_ROOM_BOUNDS.maxX * 88}%`,
        top: `${8 + player.position.y / SOCIAL_ROOM_BOUNDS.maxY * 78}%`,
      }}
    >
      {player.bubble && (
        <div className="social-room-bubble" role="status">
          {player.bubble.text}
        </div>
      )}
      <div className={`social-room-avatar ${player.isSelf ? "is-self" : ""}`}>
        {avatarGlyph(player.avatarId)}
      </div>
      <div className="social-room-name">{player.gamertag}</div>
      <div className="social-room-source">{sourceLabel(player)}</div>
    </div>
  );
}

function RoomHeader({ room, onExit }: { readonly room: SocialRoomPresenceApi; readonly onExit?: () => void }): React.JSX.Element {
  return (
    <header className="social-room-header">
      <div>
        <p className="social-room-kicker">EBARTEX · ARCADE</p>
        <h1>Sala Piazza</h1>
        <p className="social-room-subtitle">Una piazza dove incontrare gli amici online e parlare.</p>
      </div>
      <div className="social-room-actions">
        <span className={`social-room-status ${room.connected ? "is-connected" : ""}`}>
          <span aria-hidden="true">●</span> {transportLabel(room)}
        </span>
        {onExit && <button type="button" onClick={onExit}>↩ Porta Tornei</button>}
      </div>
    </header>
  );
}

export function SocialRoom({
  roomId = "social-room",
  gamertag = "Giocatore",
  avatarId = "avatar-default",
  initialFriends = [],
  enabled = true,
  onExit,
}: SocialRoomProps): React.JSX.Element {
  const room = useSocialRoomPresence({ roomId, gamertag, avatarId, initialFriends, enabled });
  const sendMove = room.sendMove;
  const selfPosition = room.self.position;
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "Escape") {
        event.preventDefault();
        room.close();
        onExit?.();
        return;
      }
      const direction = {
        ArrowLeft: { x: -0.5, y: 0 },
        a: { x: -0.5, y: 0 },
        ArrowRight: { x: 0.5, y: 0 },
        d: { x: 0.5, y: 0 },
        ArrowUp: { x: 0, y: -0.5 },
        w: { x: 0, y: -0.5 },
        ArrowDown: { x: 0, y: 0.5 },
        s: { x: 0, y: 0.5 },
      }[event.key];
      if (!direction) return;
      event.preventDefault();
      sendMove({ x: selfPosition.x + direction.x, y: selfPosition.y + direction.y });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExit, room.close, sendMove, selfPosition.x, selfPosition.y]);

  const onFloorClick = (event: MouseEvent<HTMLDivElement>): void => {
    const position = moveFromClick(event);
    if (position) room.sendMove(position);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (room.sendChat(draft)) setDraft("");
  };

  const onExitClick = (): void => {
    room.close();
    onExit?.();
  };

  return (
    <section className="social-room-shell" aria-label="Sala Piazza Ebartex">
      <style nonce={getCspNonce()}>{`
        .social-room-shell{position:absolute;inset:0;z-index:70;overflow:auto;box-sizing:border-box;min-height:0;padding:20px;color:#f5f1e8;background:#111827;border:1px solid #394765;border-radius:22px;font-family:Inter,ui-sans-serif,system-ui,sans-serif;box-shadow:0 24px 80px #080b14aa}.social-room-shell *{box-sizing:border-box}.social-room-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:16px}.social-room-kicker{margin:0 0 4px;color:#ff9a5c;font-size:11px;font-weight:800;letter-spacing:.16em}.social-room-header h1{margin:0;font-size:clamp(24px,4vw,36px);letter-spacing:-.04em}.social-room-subtitle{margin:5px 0 0;color:#aeb9d0;font-size:13px}.social-room-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}.social-room-actions button{border:1px solid #566582;border-radius:999px;padding:9px 13px;color:#f8f1e8;background:#27334e;cursor:pointer;font-weight:700}.social-room-status{display:inline-flex;align-items:center;gap:6px;color:#f2bf8d;font-size:12px;font-weight:700}.social-room-status span{color:#e0715c}.social-room-status.is-connected span{color:#73dda0}.social-room-stage{position:relative;min-height:350px;height:min(58vh,520px);overflow:hidden;border:1px solid #435374;border-radius:18px;background:radial-gradient(circle at 50% 35%,#314b68 0,#1e324b 42%,#17243b 100%);cursor:crosshair}.social-room-stage:before{content:"";position:absolute;inset:12% 10%;border:1px solid #7891a744;border-radius:50%;box-shadow:0 0 0 28px #ffffff04,0 0 0 56px #ffffff03}.social-room-stage:after{content:"🕹️   💬   🃏";position:absolute;right:18px;bottom:14px;color:#c7d5e244;font-size:22px;letter-spacing:10px;pointer-events:none}.social-room-player{position:absolute;z-index:2;transform:translate(-50%,-50%);min-width:70px;text-align:center;pointer-events:none;transition:left .25s ease,top .25s ease}.social-room-avatar{display:grid;place-items:center;width:44px;height:44px;margin:auto;border:2px solid #8da3c9;border-radius:14px;background:#263b5d;box-shadow:0 7px 18px #0b1125aa;font-size:25px}.social-room-avatar.is-self{border-color:#ff9a5c;background:#573b49;box-shadow:0 0 0 4px #ff9a5c33,0 7px 18px #0b1125aa}.social-room-name{overflow:hidden;margin-top:5px;color:#fff;white-space:nowrap;text-overflow:ellipsis;font-size:12px;font-weight:800;text-shadow:0 2px 4px #0b1125}.social-room-source{color:#aeb9d0;font-size:10px}.social-room-bubble{position:absolute;bottom:74px;left:50%;width:max-content;max-width:190px;padding:7px 10px;border:1px solid #ffd4a5;border-radius:12px;color:#241b1b;background:#fff5e8;box-shadow:0 8px 22px #0b112588;font-size:12px;line-height:1.25;transform:translateX(-50%);white-space:normal}.social-room-bubble:after{content:"";position:absolute;bottom:-6px;left:50%;width:10px;height:10px;border-right:1px solid #ffd4a5;border-bottom:1px solid #ffd4a5;background:#fff5e8;transform:translateX(-50%) rotate(45deg)}.social-room-footer{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:end;margin-top:14px}.social-room-chat{display:flex;gap:8px}.social-room-chat input{min-width:0;flex:1;border:1px solid #4d5e80;border-radius:12px;padding:11px 13px;color:#fff;background:#1b2942;outline:none}.social-room-chat input:focus{border-color:#ff9a5c;box-shadow:0 0 0 3px #ff9a5c22}.social-room-chat button{border:0;border-radius:12px;padding:0 16px;color:#20151b;background:#ff9a5c;font-weight:800;cursor:pointer}.social-room-help{color:#aeb9d0;font-size:11px;line-height:1.4;text-align:right}.social-room-help strong{color:#f4d6b4}.social-room-legend{display:flex;gap:12px;margin-top:8px;color:#8e9bb4;font-size:11px}.social-room-legend b{color:#f2bf8d}@media(max-width:640px){.social-room-shell{padding:14px;border-radius:16px}.social-room-header{display:block}.social-room-actions{justify-content:flex-start;margin-top:12px}.social-room-footer{grid-template-columns:1fr}.social-room-help{text-align:left}.social-room-stage{min-height:330px}}
      `}</style>
      <RoomHeader room={room} onExit={onExit ? onExitClick : undefined} />
      <div
        className="social-room-stage"
        role="application"
        aria-label="Pavimento della Sala Piazza: fai click per muoverti"
        onClick={onFloorClick}
      >
        {room.players.map((player) => <PlayerToken key={player.peerId} player={player} />)}
      </div>
      <div className="social-room-footer">
        <form className="social-room-chat" onSubmit={onSubmit}>
          <input
            value={draft}
            maxLength={MAX_CHAT_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Scrivi nella stanza…"
            aria-label="Messaggio nella stanza"
          />
          <button type="submit">Invia</button>
        </form>
        <div className="social-room-help">
          <strong>Click</strong> sul pavimento o <strong>WASD / frecce</strong> per muoverti.<br />
          {room.players.length} presenti · il fumetto dura pochi secondi.
        </div>
      </div>
      <div className="social-room-legend" aria-label="Legenda presenze">
        <span><b>Tu</b> = questa scheda</span>
        <span><b>Live tab</b> = altro tab locale</span>
        <span><b>Amico online</b> = snapshot iniziale, movimento cosmetico</span>
      </div>
    </section>
  );
}
