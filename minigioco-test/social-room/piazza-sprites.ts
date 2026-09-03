/**
 * Sprite degli arredi isometrici per Sala Piazza:
 * - 3 macchine arcade retro (con CRT, comandi, e cartello "IN ARRIVO / FUORI SERVIZIO")
 * - 2 tavolini da gioco TCG con tappetini, carte e sedie
 * - arredi decorativi (piante in vaso, panca)
 */

import { P_PIAZZA as P } from "./piazza-config";
import {
  hexA,
  isoBox,
  isoVec,
  mkSprite,
  quadFill,
  shade,
  type IsoSprite,
} from "./piazza-iso";

export interface PiazzaFurnitureMap {
  readonly cab1: IsoSprite;
  readonly cab2: IsoSprite;
  readonly cab3: IsoSprite;
  readonly table1: IsoSprite;
  readonly table2: IsoSprite;
  readonly plant1: IsoSprite;
  readonly plant2: IsoSprite;
  readonly bench: IsoSprite;
}

function mkChair(ctx: CanvasRenderingContext2D, tx: number, ty: number, backNorth: boolean): void {
  const w = 0.42;
  const d = 0.42;
  for (const [lx, ly] of [[0.03, 0.03], [w - 0.09, 0.03], [0.03, d - 0.09], [w - 0.09, d - 0.09]]) {
    isoBox(ctx, tx + lx, ty + ly, 0.06, 0.06, 9, P.woodD, { noEdge: true });
  }
  isoBox(ctx, tx, ty, w, d, 3, P.sofa, { z: 9, top: P.sofaL, left: shade(P.sofa, 0.9), right: shade(P.sofa, 0.75) });
  const by = backNorth ? ty : ty + d - 0.08;
  isoBox(ctx, tx, by, w, 0.08, 13, P.sofaD, { z: 12, top: P.sofa, noEdge: true });
}

export function mkPiazzaCabinet(accent: string, name: string, icon: string): IsoSprite {
  return mkSprite(2, 1, 104, (ctx) => {
    const X0 = 0.5;
    const Y0 = 0.2;
    const W = 1.0;
    const D = 0.6;
    const front = (u: number, hh: number) => {
      const p = isoVec(X0 + u * W, Y0 + D);
      return { x: p.x, y: p.y - hh };
    };

    // Plinto e struttura principale del cabinato
    isoBox(ctx, X0 - 0.06, Y0 - 0.02, W + 0.12, D + 0.06, 8, "#0d111d", { top: "#182035", noEdge: true });
    isoBox(ctx, X0, Y0, W, D, 74, "#141b2c", { top: "#202a42", left: "#182136", right: "#0e1524" });

    // Profili neon frontali
    ctx.strokeStyle = hexA(accent, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(front(0.04, 6).x, front(0.04, 6).y);
    ctx.lineTo(front(0.04, 74).x, front(0.04, 74).y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(front(0.96, 6).x, front(0.96, 6).y);
    ctx.lineTo(front(0.96, 74).x, front(0.96, 74).y);
    ctx.stroke();

    // Schermo CRT
    const bezel = [front(0.12, 66), front(0.88, 66), front(0.88, 32), front(0.12, 32)];
    quadFill(ctx, bezel, "#070a12");
    const sw = [front(0.18, 62), front(0.82, 62), front(0.82, 36), front(0.18, 36)];
    quadFill(ctx, sw, "#08151f");

    // Scanlines e icona pixel a video
    const sc = { x: (sw[0]!.x + sw[2]!.x) / 2, y: (sw[0]!.y + sw[2]!.y) / 2 };
    ctx.fillStyle = hexA(accent, 0.8);
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, sc.x, sc.y - 4);

    // Nastro / Cartello diagonale "IN ARRIVO"
    ctx.save();
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(sc.x - 22, sc.y + 4, 44, 10);
    ctx.strokeStyle = "#101426";
    ctx.lineWidth = 1;
    ctx.strokeRect(sc.x - 22, sc.y + 4, 44, 10);
    ctx.fillStyle = "#101426";
    ctx.font = "bold 5px 'Press Start 2P', monospace";
    ctx.fillText("IN ARRIVO", sc.x, sc.y + 9);
    ctx.restore();

    // Plancia comandi con joystick e pulsanti
    const deck = isoBox(ctx, X0 + 0.02, Y0 + D - 0.04, W - 0.04, 0.3, 6, "#1e293f", { z: 22, top: "#273550" });
    const dc = { x: (deck.up(deck.T).x + deck.up(deck.B).x) / 2, y: (deck.up(deck.T).y + deck.up(deck.B).y) / 2 };

    // Joystick rosso
    ctx.fillStyle = "#0c101c";
    ctx.beginPath();
    ctx.ellipse(dc.x - 8, dc.y + 2, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.metalL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dc.x - 8, dc.y + 1);
    ctx.lineTo(dc.x - 8, dc.y - 5);
    ctx.stroke();
    ctx.fillStyle = "#e63946";
    ctx.beginPath();
    ctx.arc(dc.x - 8, dc.y - 6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Pulsanti colorati
    const buttons = [[2, accent], [7, P.neonYellow], [12, P.neonOrange]] as const;
    for (const [dx, col] of buttons) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(dc.x + dx, dc.y + 1, 2.2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Marquee illuminato in alto
    isoBox(ctx, X0 - 0.04, Y0 + 0.04, W + 0.08, D - 0.08, 14, shade(accent, 0.5), {
      z: 74,
      top: shade(accent, 1.2),
      left: accent,
      right: shade(accent, 0.7),
      noEdge: true,
    });
    const mc = front(0.5, 83);
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#090d18";
    ctx.font = "bold 5.5px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, mc.x, mc.y + 1);
    ctx.restore();
  });
}

export function mkGamingTable(feltColor: string, feltL: string, feltD: string, accentIcon: string): IsoSprite {
  return mkSprite(2, 2, 74, (ctx) => {
    // Sedia a nord (dietro al tavolo)
    mkChair(ctx, 0.8, -0.55, true);

    // Struttura tavolo in legno massello
    isoBox(ctx, 0, 0, 2, 2, 24, P.woodD, {
      top: P.wood,
      left: shade(P.woodD, 0.9),
      right: shade(P.woodD, 0.7),
    });

    // Panno in feltro TCG da duello incassato
    isoBox(ctx, 0.08, 0.08, 1.84, 1.84, 2, feltColor, {
      z: 24,
      top: feltL,
      left: feltD,
      right: feltD,
      noEdge: true,
    });

    // Dettaglio playmat con carte e segnalini
    const tc = isoVec(1, 1);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(accentIcon, tc.x, tc.y - 24);

    // Carte distribuite sul tavolo
    const drawCard = (tx: number, ty: number, col: string) => {
      const z = 26;
      const p = isoVec(tx, ty);
      const pts = [
        { x: p.x, y: p.y - z },
        { x: p.x + 7, y: p.y - 3.5 - z },
        { x: p.x + 7, y: p.y + 3.5 - z },
        { x: p.x, y: p.y + 7 - z },
      ];
      quadFill(ctx, pts, col, "rgba(0,0,0,0.35)", 1);
    };
    drawCard(0.45, 0.7, "#457b9d");
    drawCard(1.4, 1.3, "#e63946");
    drawCard(0.9, 1.4, "#f1faee");

    // Segnalini / dadi
    const chip = (tx: number, ty: number, col: string) => {
      const p = isoVec(tx, ty);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 26, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    chip(1.4, 0.6, P.gold);
    chip(1.5, 0.7, P.neonCyan);

    // Sedia a sud (davanti al tavolo)
    mkChair(ctx, 0.8, 2.15, false);
  });
}

function mkPlant(): IsoSprite {
  return mkSprite(1, 1, 48, (ctx) => {
    // Vaso terracotta
    isoBox(ctx, 0.25, 0.25, 0.5, 0.5, 18, "#b56a44", { top: "#d97746", left: "#985232", right: "#7c3e22" });
    const c = isoVec(0.5, 0.5);
    // Foglie verdi pixel
    ctx.fillStyle = "#38b000";
    ctx.beginPath();
    ctx.arc(c.x, c.y - 28, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#70e000";
    ctx.beginPath();
    ctx.arc(c.x - 3, c.y - 31, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function mkBench(): IsoSprite {
  return mkSprite(1, 2, 36, (ctx) => {
    // Gambe metalliche
    for (const [lx, ly] of [[0.1, 0.1], [0.8, 0.1], [0.1, 1.8], [0.8, 1.8]]) {
      isoBox(ctx, lx, ly, 0.1, 0.1, 8, P.metalD, { noEdge: true });
    }
    // Seduta imbottita in velluto rosso
    isoBox(ctx, 0.05, 0.05, 0.9, 1.9, 8, P.sofa, { z: 8, top: P.sofaL, left: P.sofaD, right: shade(P.sofa, 0.7) });
  });
}

export function buildPiazzaFurniture(): PiazzaFurnitureMap {
  return {
    cab1: mkPiazzaCabinet(P.neonCyan, "PIXEL", "👾"),
    cab2: mkPiazzaCabinet(P.neonOrange, "DRAGON", "🐉"),
    cab3: mkPiazzaCabinet(P.neonPurple, "SPACE", "🚀"),
    table1: mkGamingTable(P.feltGreen, P.feltGreenL, P.feltGreenD, "🃏"),
    table2: mkGamingTable(P.feltBlue, P.feltBlueL, P.feltBlueD, "🎴"),
    plant1: mkPlant(),
    plant2: mkPlant(),
    bench: mkBench(),
  };
}
