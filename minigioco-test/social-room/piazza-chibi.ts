/**
 * Renderer procedurale per avatar Chibi pixel-art, badge giocatore e bolle di chat.
 * Genera grafiche coerenti con l'omino principale di IsoRoomGame.
 */

import { stableHash } from "./social-room-protocol";
import { mkCanvas, type IsoSprite } from "./piazza-iso";

export type Direction = "se" | "sw" | "ne" | "nw";

interface ChibiLook {
  readonly skin: string;
  readonly skinD: string;
  readonly hair: string;
  readonly shirt: string;
  readonly shirtD: string;
  readonly pant: string;
}

const LOOK_PALETTES: readonly ChibiLook[] = [
  { skin: "#f2c79a", skinD: "#d9a878", hair: "#5a4632", shirt: "#4ba3a3", shirtD: "#357d7d", pant: "#394260" },
  { skin: "#ffd8b1", skinD: "#e0b088", hair: "#d4a373", shirt: "#e76f51", shirtD: "#b84f37", pant: "#264653" },
  { skin: "#d4a373", skinD: "#aa7648", hair: "#2b2d42", shirt: "#2a9d8f", shirtD: "#1e6f65", pant: "#1f2421" },
  { skin: "#fcd5ce", skinD: "#e8a598", hair: "#6b705c", shirt: "#9d4edd", shirtD: "#7b2cbf", pant: "#343a40" },
  { skin: "#eddcd2", skinD: "#cb997e", hair: "#b08968", shirt: "#3a86ff", shirtD: "#2060cc", pant: "#2b2d42" },
];

function getChibiLook(avatarId: string): ChibiLook {
  const index = Math.abs(stableHash(avatarId)) % LOOK_PALETTES.length;
  return LOOK_PALETTES[index] ?? LOOK_PALETTES[0]!;
}

function drawChibiBody(
  ctx: CanvasRenderingContext2D,
  back: boolean,
  walkFrame: number,
  look: ChibiLook,
): void {
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const b = walkFrame % 2 === 1 ? -1 : 0;
  const legOffset = walkFrame === 1 ? 2 : walkFrame === 3 ? -2 : 0;

  // Gambe e scarpe
  px(8, 36 + b - legOffset, 4, 12, look.pant);
  px(16, 36 + b + legOffset, 4, 12, look.pant);
  px(7, 48 + b - legOffset, 5, 4, "#ffffff");
  px(15, 48 + b + legOffset, 5, 4, "#ffffff");

  // Torso / vestito
  px(7, 20 + b, 14, 16, look.shirt);
  px(7, 33 + b, 14, 3, look.shirtD);

  // Braccia
  const armA = walkFrame === 1 ? 2 : walkFrame === 3 ? -2 : 0;
  const armB = -armA;
  px(4, 21 + b + armA, 3, 11, look.shirt);
  px(21, 21 + b + armB, 3, 11, look.shirt);
  px(4, 32 + b + armA, 3, 3, look.skin);
  px(21, 32 + b + armB, 3, 3, look.skin);

  // Testa e viso
  if (back) {
    px(6, 6 + b, 16, 14, look.hair);
    px(7, 18 + b, 14, 3, look.hair);
  } else {
    px(6, 6 + b, 16, 14, look.skin);
    px(6, 4 + b, 16, 5, look.hair);
    px(5, 5 + b, 3, 10, look.hair);
    // Occhi
    px(9, 12 + b, 2, 2, "#1b1e2e");
    px(17, 12 + b, 2, 2, "#1b1e2e");
    // Sorriso leggero
    px(12, 16 + b, 4, 1, look.skinD);
  }
}

export function createChibiSprite(
  avatarId: string,
  dir: Direction,
  walkFrame: number,
): IsoSprite {
  const cv = mkCanvas(32, 56);
  const ctx = cv.getContext("2d");
  if (!ctx) return { cv, ax: 16, ay: 54 };
  ctx.imageSmoothingEnabled = false;

  const look = getChibiLook(avatarId);
  const back = dir === "ne" || dir === "nw";
  const flip = dir === "sw" || dir === "nw";

  ctx.save();
  if (flip) {
    ctx.translate(32, 0);
    ctx.scale(-1, 1);
  }
  ctx.translate(2, 0);
  drawChibiBody(ctx, back, walkFrame, look);
  ctx.restore();

  return { cv, ax: 16, ay: 54 };
}

export function drawChatBubble(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  text: string,
): void {
  ctx.save();
  ctx.font = "bold 11px Inter, system-ui, sans-serif";
  const maxW = 160;
  const metrics = ctx.measureText(text);
  const bubbleW = Math.min(maxW, Math.max(54, metrics.width + 18));
  const lines = metrics.width > maxW - 18 ? 2 : 1;
  const bubbleH = lines === 1 ? 26 : 38;
  const bx = Math.round(headX - bubbleW / 2);
  const by = Math.round(headY - bubbleH - 14);

  // Sfondo e bordo del fumetto
  ctx.fillStyle = "rgba(10, 14, 26, 0.94)";
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(bx, by, bubbleW, bubbleH, 8);
  ctx.fill();
  ctx.stroke();

  // Punta del triangolo verso la testa
  ctx.beginPath();
  ctx.moveTo(headX - 5, by + bubbleH);
  ctx.lineTo(headX, by + bubbleH + 7);
  ctx.lineTo(headX + 5, by + bubbleH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Testo nel fumetto
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (lines === 1) {
    ctx.fillText(text, headX, by + bubbleH / 2);
  } else {
    const mid = Math.floor(text.length / 2);
    const spaceIdx = text.lastIndexOf(" ", mid);
    const splitAt = spaceIdx > 0 ? spaceIdx : mid;
    const l1 = text.slice(0, splitAt);
    const l2 = text.slice(splitAt).trim();
    ctx.fillText(l1, headX, by + 12);
    ctx.fillText(l2, headX, by + 26);
  }
  ctx.restore();
}

export function drawPlayerNametag(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  name: string,
  isSelf: boolean,
): void {
  ctx.save();
  ctx.font = "bold 9px 'Press Start 2P', monospace";
  const metrics = ctx.measureText(name);
  const pad = 6;
  const w = metrics.width + pad * 2 + 10;
  const h = 16;
  const x = Math.round(headX - w / 2);
  const y = Math.round(headY - h - 4);

  ctx.fillStyle = isSelf ? "rgba(45, 25, 15, 0.88)" : "rgba(15, 20, 35, 0.88)";
  ctx.strokeStyle = isSelf ? "#f2b94b" : "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.stroke();

  // Punto indicatore
  ctx.fillStyle = isSelf ? "#52b788" : "#64dfdf";
  ctx.beginPath();
  ctx.arc(x + 7, y + h / 2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Nome
  ctx.fillStyle = isSelf ? "#ffe8a3" : "#eef2ff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(name, x + 13, y + h / 2 + 1);
  ctx.restore();
}
