/**
 * Hook per il ciclo di rendering isometrico a 60 FPS, gestione input e movimento
 * multi-giocatore in Sala Piazza.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  getBlockedPiazzaTiles,
  INTERACTIVES_PIAZZA,
  tkey,
} from "./piazza-config";
import { buildPiazzaBackground, piazzaDoorBounds } from "./piazza-background";
import { buildPiazzaFurniture } from "./piazza-sprites";
import {
  createChibiSprite,
  drawChatBubble,
  drawPlayerNametag,
  type Direction,
} from "./piazza-chibi";
import {
  COLS,
  HTH,
  HTW,
  OX,
  OY,
  ROWS,
  tileTop,
  WW,
  WH,
  type IsoPoint,
} from "./piazza-iso";
import type { SocialRoomPlayer, SocialRoomPosition } from "./social-room-protocol";

export interface UsePiazzaEngineOptions {
  readonly players: readonly SocialRoomPlayer[];
  readonly sendMove: (pos: SocialRoomPosition) => boolean;
  readonly onExit?: () => void;
}

interface RenderPlayerState {
  x: number;
  y: number;
  tx: number;
  ty: number;
  dir: Direction;
  walkFrame: number;
  walkTime: number;
}

export function usePiazzaEngine(options: UsePiazzaEngineOptions) {
  const { players, sendMove, onExit } = options;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [inspectText, setInspectText] = useState<string | null>(null);
  const inspectTimerRef = useRef<number | null>(null);

  const playerStatesRef = useRef<Map<string, RenderPlayerState>>(new Map());
  const blockedTiles = useRef(getBlockedPiazzaTiles());

  const showInspect = useCallback((text: string) => {
    setInspectText(text);
    if (inspectTimerRef.current !== null) window.clearTimeout(inspectTimerRef.current);
    inspectTimerRef.current = window.setTimeout(() => setInspectText(null), 3800);
  }, []);

  const movePlayerTo = useCallback((targetX: number, targetY: number) => {
    const tx = Math.max(1, Math.min(COLS - 1, Math.round(targetX)));
    const ty = Math.max(1, Math.min(ROWS - 1, Math.round(targetY)));
    if (blockedTiles.current.has(tkey(tx, ty))) return;
    sendMove({ x: tx, y: ty });
  }, [sendMove]);

  // Click su canvas -> coordinate isometriche tile
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const clickX = (event.clientX - rect.left) * scale;
    const clickY = (event.clientY - rect.top) * scale;

    // Controllo click porta
    const door = piazzaDoorBounds().hit;
    if (clickX >= door.x && clickX <= door.x + door.w && clickY >= door.y && clickY <= door.y + door.h) {
      onExit?.();
      return;
    }

    // Inversione isometrica verso coordinate tile
    const u = (clickX - OX) / HTW;
    const v = (clickY - OY) / HTH;
    const cx = Math.floor((u + v) / 2);
    const cy = Math.floor((v - u) / 2);

    // Click su cabinati o arredi
    for (const [id, def] of Object.entries(INTERACTIVES_PIAZZA)) {
      if (def.approach.some(([ax, ay]) => ax === cx && ay === cy)) {
        showInspect(def.inspectionText);
        return;
      }
    }

    movePlayerTo(cx, cy);
  }, [movePlayerTo, onExit, showInspect]);

  // Tastiera WASD / Frecce
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onExit?.();
        return;
      }
      const self = players.find((p) => p.isSelf);
      if (!self) return;
      const step = {
        ArrowLeft: [-1, 0], a: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0],
        ArrowUp: [0, -1], w: [0, -1],
        ArrowDown: [0, 1], s: [0, 1],
      }[e.key];
      if (!step) return;
      e.preventDefault();
      movePlayerTo(self.position.x + step[0]!, self.position.y + step[1]!);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [players, movePlayerTo, onExit]);

  // Loop di rendering a 60 FPS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.imageSmoothingEnabled = false;

    canvas.width = WW;
    canvas.height = WH;

    const bgCv = buildPiazzaBackground();
    const furn = buildPiazzaFurniture();
    let rafId: number;
    let lastT = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;

      // Aggiornamento posizioni animate dei giocatori
      for (const p of players) {
        let st = playerStatesRef.current.get(p.peerId);
        if (!st) {
          st = { x: p.position.x, y: p.position.y, tx: p.position.x, ty: p.position.y, dir: "se", walkFrame: 0, walkTime: 0 };
          playerStatesRef.current.set(p.peerId, st);
        }
        st.tx = p.position.x;
        st.ty = p.position.y;

        const dx = st.tx - st.x;
        const dy = st.ty - st.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.05) {
          const speed = 3.6;
          const step = Math.min(dist, speed * dt);
          st.x += (dx / dist) * step;
          st.y += (dy / dist) * step;
          st.dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "se" : "nw") : (dy >= 0 ? "sw" : "ne");
          st.walkTime += dt * 8;
          st.walkFrame = Math.floor(st.walkTime) % 4;
        } else {
          st.x = st.tx;
          st.y = st.ty;
          st.walkFrame = 0;
        }
      }

      // Disegno sfondo
      ctx.drawImage(bgCv, 0, 0);

      // Raccolta elementi da ordinare in profondità (depth-sorting per Y isometrica)
      interface Drawable {
        readonly depth: number;
        readonly draw: () => void;
      }
      const drawList: Drawable[] = [];

      // Arredi fissi
      const addFurn = (k: keyof typeof furn, cx: number, cy: number) => {
        const sp = furn[k];
        const pt = tileTop(cx, cy);
        drawList.push({
          depth: cx + cy,
          draw: () => ctx.drawImage(sp.cv, pt.x - sp.ax, pt.y - sp.ay),
        });
      };
      addFurn("cab1", 2, 1);
      addFurn("cab2", 4, 1);
      addFurn("cab3", 6, 1);
      addFurn("table1", 2, 5);
      addFurn("table2", 7, 5);
      addFurn("plant1", 0, 0);
      addFurn("plant2", 11, 8);
      addFurn("bench", 10, 4);

      // Giocatori
      for (const p of players) {
        const st = playerStatesRef.current.get(p.peerId);
        if (!st) continue;
        const pt = tileTop(st.x, st.y);
        const sp = createChibiSprite(p.avatarId, st.dir, st.walkFrame);
        drawList.push({
          depth: st.x + st.y,
          draw: () => {
            // Ombra ovale sotto i piedi
            ctx.fillStyle = "rgba(0,0,0,0.22)";
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 4, 10, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Sprite avatar
            ctx.drawImage(sp.cv, pt.x - sp.ax, pt.y - sp.ay);
            // Badge gamertag
            drawPlayerNametag(ctx, pt.x, pt.y - 50, p.gamertag, p.isSelf);
            // Bolla chat
            if (p.bubble?.text) {
              drawChatBubble(ctx, pt.x, pt.y - 50, p.bubble.text);
            }
          },
        });
      }

      // Ordinamento per profondità e rendering
      drawList.sort((a, b) => a.depth - b.depth);
      for (const item of drawList) item.draw();

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [players]);

  return { canvasRef, wrapRef, inspectText, handleCanvasClick };
}
