"use client";

import { useState, type FormEvent } from "react";
import { getCspNonce } from "../csp-nonce";
import {
  MAX_CHAT_LENGTH,
  type SocialRoomFriendInput,
} from "./social-room-protocol";
import { useSocialRoomPresence } from "./use-social-room-presence";
import { usePiazzaEngine } from "./use-piazza-engine";

export interface SocialRoomProps {
  readonly roomId?: string;
  readonly gamertag?: string;
  readonly avatarId?: string;
  readonly initialFriends?: readonly SocialRoomFriendInput[];
  readonly enabled?: boolean;
  readonly onExit?: () => void;
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
  const [draft, setDraft] = useState("");

  const handleExit = () => {
    room.close();
    onExit?.();
  };

  const { canvasRef, wrapRef, inspectText, handleCanvasClick } = usePiazzaEngine({
    players: room.players,
    sendMove: room.sendMove,
    onExit: handleExit,
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (room.sendChat(draft)) setDraft("");
  };

  const statusLabel = room.connected
    ? `${room.players.length} in piazza`
    : "Connessione locale in corso…";

  return (
    <section ref={wrapRef} className="social-piazza-root" aria-label="Sala Piazza Ebartex">
      <style nonce={getCspNonce()}>{`
        .social-piazza-root{position:absolute;inset:0;z-index:70;display:flex;flex-direction:column;background:radial-gradient(1100px 650px at 50% 28%,#142347 0%,#0d111c 65%,#2e1b10 100%);overflow:hidden;user-select:none;font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
        .social-piazza-header{position:absolute;top:12px;left:16px;right:16px;z-index:15;display:flex;justify-content:space-between;align-items:center;pointer-events:none}
        .social-piazza-title-chip{display:flex;align-items:center;gap:8px;background:rgba(16,18,32,.78);border:1px solid rgba(255,255,255,.16);color:#ffe9b0;border-radius:10px;padding:8px 14px;font-family:'Press Start 2P','Courier New',monospace;font-size:9px;letter-spacing:.5px;backdrop-filter:blur(6px);pointer-events:auto}
        .social-piazza-controls{display:flex;align-items:center;gap:10px;pointer-events:auto}
        .social-piazza-status{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:rgba(10,14,26,.75);border:1px solid rgba(255,255,255,.14);color:#b8c7e0;font-size:11px;font-weight:700;backdrop-filter:blur(6px)}
        .social-piazza-status-dot{width:7px;height:7px;border-radius:50%;background:#52b788;box-shadow:0 0 6px #52b788}
        .social-piazza-exit-btn{border:1px solid #718096;border-radius:10px;padding:7px 13px;color:#f8f1e8;background:rgba(26,34,54,.85);cursor:pointer;font-weight:700;font-size:12px;transition:background-color .15s,transform .1s;backdrop-filter:blur(6px)}
        .social-piazza-exit-btn:hover{background:#ff9a5c;color:#1a1016;transform:scale(1.03)}
        .social-piazza-stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .social-piazza-canvas{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;cursor:crosshair;display:block}
        .social-piazza-inspect{position:absolute;bottom:76px;left:50%;transform:translateX(-50%);z-index:20;background:rgba(12,16,28,.92);border:1px solid #ffd166;color:#ffe9b0;border-radius:8px;padding:9px 16px;font-family:'Press Start 2P',monospace;font-size:8px;line-height:1.4;box-shadow:0 8px 24px rgba(0,0,0,.6);max-width:90%;text-align:center;animation:piazzaFadeIn .2s ease}
        @keyframes piazzaFadeIn{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}
        .social-piazza-footer{position:relative;z-index:15;display:flex;flex-direction:column;gap:6px;padding:10px 16px;background:rgba(10,14,26,.88);border-top:1px solid rgba(255,255,255,.12);backdrop-filter:blur(8px)}
        .social-piazza-chat{display:flex;gap:8px;max-width:800px;margin:0 auto;width:100%}
        .social-piazza-chat input{flex:1;min-width:0;border:1px solid #3e4c66;border-radius:10px;padding:9px 13px;color:#fff;background:rgba(20,28,48,.8);outline:none;font-size:13px}
        .social-piazza-chat input:focus{border-color:#ff9a5c;box-shadow:0 0 0 2px rgba(255,154,92,.25)}
        .social-piazza-chat button{border:0;border-radius:10px;padding:0 18px;color:#181014;background:#ff9a5c;font-weight:800;font-size:13px;cursor:pointer;transition:background-color .15s,transform .1s}
        .social-piazza-chat button:hover{background:#ffb07c;transform:scale(1.02)}
        .social-piazza-hint{text-align:center;color:#8d99ae;font-size:10px;letter-spacing:.3px}
        .social-piazza-hint b{color:#ffd166}
      `}</style>

      {/* Header HUD */}
      <header className="social-piazza-header">
        <div className="social-piazza-title-chip">
          <span aria-hidden="true">💬</span> SALA PIAZZA
        </div>
        <div className="social-piazza-controls">
          <span className="social-piazza-status">
            <span className="social-piazza-status-dot" aria-hidden="true" />
            {statusLabel}
          </span>
          {onExit && (
            <button type="button" className="social-piazza-exit-btn" onClick={handleExit}>
              ↩ Torna ai Tornei
            </button>
          )}
        </div>
      </header>

      {/* Canvas isometrico 60 FPS */}
      <div className="social-piazza-stage">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="social-piazza-canvas"
          aria-label="Sala Piazza: clicca sul pavimento o sugli arredi per interagire"
        />
        {inspectText && (
          <div className="social-piazza-inspect" role="status">
            {inspectText}
          </div>
        )}
      </div>

      {/* Chat e comandi */}
      <footer className="social-piazza-footer">
        <form className="social-piazza-chat" onSubmit={onSubmit}>
          <input
            value={draft}
            maxLength={MAX_CHAT_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Scrivi un messaggio in piazza… (appare come fumetto)"
            aria-label="Messaggio in piazza"
          />
          <button type="submit">Invia</button>
        </form>
        <div className="social-piazza-hint">
          <b>WASD / Frecce</b> o <b>Click</b> per muoverti · Clicca su <b>cabinati</b> o <b>tavoli</b> per ispezionare · <b>ESC</b> per uscire
        </div>
      </footer>
    </section>
  );
}
