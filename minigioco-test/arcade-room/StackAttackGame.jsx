import React, { useEffect, useRef, useState } from "react";
import { useArcadeCanvas, clamp, rr } from "./game-kit";

/* ============================================================================
   Stack Attack — impila le carte. Una carta oscilla in alto: premi SPAZIO /
   tap per piazzarla. La parte fuori allineamento viene tagliata e la base si
   restringe; allineamento perfetto = combo e niente taglio. 3 vite: ne perdi
   una se la carta manca del tutto la torre. Punteggio = carte impilate.
   ========================================================================== */

const ACCENT = "#05d9e8";
const WORLD_W = 360;       // larghezza logica del campo (scalata al canvas)
const BLOCK_H = 24;        // altezza carta (world px)
const BASE_W = 150;        // larghezza carta iniziale
const PERFECT = 4;         // tolleranza per il "perfetto" (world px)
const ROW_Y = 0.64;        // riga attiva a ~64% dell'altezza
const START_SPEED = 95;    // velocità oscillazione iniziale (world px/s)

function blockColor(i) {
  const hue = (160 + i * 14) % 360;
  return {
    fill: `hsl(${hue} 70% 52%)`,
    top: `hsl(${hue} 75% 62%)`,
    side: `hsl(${hue} 65% 38%)`,
  };
}

export default function StackAttackGame({ onExit, onResult }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const G = useRef(null);
  const phaseRef = useRef("ready");
  const [phase, setPhase] = useState("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(0);

  const setPhaseBoth = (p) => { phaseRef.current = p; setPhase(p); };

  const reset = () => {
    G.current = {
      blocks: [{ x: WORLD_W / 2 - BASE_W / 2, w: BASE_W, ci: 0 }],
      active: null,
      debris: [],
      camY: 0,
      camTarget: 0,
      speed: START_SPEED,
      score: 0,
      lives: 3,
      combo: 0,
      shake: 0,
      flash: 0,
    };
    spawnActive();
    setScore(0); setLives(3);
  };

  const spawnActive = () => {
    const g = G.current;
    const top = g.blocks[g.blocks.length - 1];
    const fromLeft = g.blocks.length % 2 === 0;
    g.active = {
      x: fromLeft ? 8 : WORLD_W - 8 - top.w,
      w: top.w,
      ci: g.blocks.length,
      dir: fromLeft ? 1 : -1,
    };
  };

  const start = () => { reset(); setPhaseBoth("playing"); };

  const drop = () => {
    const g = G.current;
    if (phaseRef.current !== "playing" || !g || !g.active) return;
    const top = g.blocks[g.blocks.length - 1];
    const a = g.active;
    const left = Math.max(a.x, top.x);
    const right = Math.min(a.x + a.w, top.x + top.w);
    const overlap = right - left;
    const delta = a.x - top.x;

    if (overlap <= 2) {
      // manca del tutto → vita persa, carta cade
      g.debris.push({ x: a.x, w: a.w, ci: a.ci, vy: 0, vx: a.dir * 30, rot: 0, vr: a.dir * 3 });
      g.lives -= 1;
      g.shake = 10;
      setLives(g.lives);
      if (g.lives <= 0) { gameOver(); return; }
      spawnActive();
      return;
    }

    if (Math.abs(delta) <= PERFECT) {
      // perfetto: nessun taglio, leggera ricrescita + combo
      g.combo += 1;
      const newW = Math.min(BASE_W, top.w + 5);
      g.blocks.push({ x: top.x + (top.w - newW) / 2, w: newW, ci: a.ci, perfect: true });
      g.shake = 6;
      g.flash = 1;
    } else {
      // taglio dell'eccedenza (cade come debris)
      g.combo = 0;
      if (delta > 0) {
        g.debris.push({ x: right, w: a.x + a.w - right, ci: a.ci, vy: 0, vx: 40, rot: 0, vr: 4 });
      } else {
        g.debris.push({ x: a.x, w: left - a.x, ci: a.ci, vy: 0, vx: -40, rot: 0, vr: -4 });
      }
      g.blocks.push({ x: left, w: overlap, ci: a.ci });
    }

    g.score += 1;
    setScore(g.score);
    g.speed = START_SPEED + g.score * 3.5;
    const top2 = g.blocks[g.blocks.length - 1];
    g.camTarget = (g.blocks.length - 1) * BLOCK_H;
    spawnActive();
    // riposiziona active sopra il nuovo top
    g.active.w = top2.w;
  };

  const gameOver = () => {
    const g = G.current;
    g.active = null;
    setBest((b) => {
      const nb = Math.max(b, g.score);
      if (onResult) onResult({ game: "stackAttack", score: g.score, best: nb });
      return nb;
    });
    setPhaseBoth("over");
  };

  /* input: spazio per droppare, ESC per uscire */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onExit && onExit(); return; }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (phaseRef.current === "playing") drop();
        else if (phaseRef.current !== "playing") start();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointer = (e) => {
    e.preventDefault();
    if (phaseRef.current === "playing") drop();
  };

  useArcadeCanvas(canvasRef, wrapRef, (ctx, w, h, dt) => {
    const g = G.current;
    const sx = w / WORLD_W;
    // sfondo: griglia stellata + scanline
    ctx.fillStyle = "#04040a";
    ctx.fillRect(0, 0, w, h);
    drawStars(ctx, w, h, performance.now() / 1000);

    if (!g) return;

    // shake
    g.shake = Math.max(0, g.shake - dt * 40);
    const shx = g.shake ? (Math.random() - 0.5) * g.shake : 0;
    g.flash = Math.max(0, g.flash - dt * 3);

    // camera
    g.camY = lerpN(g.camY, g.camTarget, Math.min(1, dt * 6));

    // muovi carta attiva
    if (phaseRef.current === "playing" && g.active) {
      const a = g.active;
      a.x += a.dir * g.speed * dt;
      if (a.x <= 4) { a.x = 4; a.dir = 1; }
      if (a.x + a.w >= WORLD_W - 4) { a.x = WORLD_W - 4 - a.w; a.dir = -1; }
    }

    // y di una riga (world index i) sullo schermo
    const rowScreenY = (i) => h * ROW_Y - (i * BLOCK_H - g.camY) * sx;

    // disegna torre
    ctx.save();
    ctx.translate(shx, 0);
    for (let i = 0; i < g.blocks.length; i++) {
      const b = g.blocks[i];
      drawCard(ctx, b.x * sx, rowScreenY(i), b.w * sx, BLOCK_H * sx, b.ci, b.perfect);
    }
    // carta attiva
    if (g.active) {
      const a = g.active;
      drawCard(ctx, a.x * sx, rowScreenY(g.blocks.length), a.w * sx, BLOCK_H * sx, a.ci, false, true);
    }
    ctx.restore();

    // debris in caduta
    for (let i = g.debris.length - 1; i >= 0; i--) {
      const d = g.debris[i];
      d.vy += 900 * dt;
      d.fy = (d.fy ?? rowScreenY(g.blocks.length)) + d.vy * dt;
      d.x += d.vx * dt;
      d.rot += d.vr * dt;
      const px = d.x * sx, py = d.fy;
      ctx.save();
      ctx.translate(px + (d.w * sx) / 2, py + (BLOCK_H * sx) / 2);
      ctx.rotate(d.rot);
      drawCard(ctx, -(d.w * sx) / 2, -(BLOCK_H * sx) / 2, d.w * sx, BLOCK_H * sx, d.ci, false);
      ctx.restore();
      if (py > h + 60) g.debris.splice(i, 1);
    }

    // flash perfetto
    if (g.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${g.flash * 0.18})`;
      ctx.fillRect(0, 0, w, h);
    }

    // combo
    if (g.combo > 1 && phaseRef.current === "playing") {
      ctx.font = "bold 14px 'Press Start 2P','Segoe UI',monospace";
      ctx.fillStyle = ACCENT;
      ctx.textAlign = "center";
      ctx.fillText(`COMBO x${g.combo}`, w / 2, 34);
      ctx.textAlign = "left";
    }
  });

  // monta: niente auto-start, parte dalla schermata "ready"
  useEffect(() => { reset(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="ag-root" style={{ "--accent": ACCENT }}>
      <div className="ag-top">
        <button type="button" className="ag-back" onClick={() => onExit && onExit()}>← Sala</button>
        <div className="ag-title">STACK ATTACK</div>
        <div className="ag-stats">
          <div className="ag-stat">Carte <b>{score}</b></div>
          <div className="ag-stat">Vite <b>{"♥".repeat(Math.max(0, lives)) || "—"}</b></div>
        </div>
      </div>

      <div className="ag-stage" ref={wrapRef} onPointerDown={onPointer}>
        <canvas ref={canvasRef} />

        {phase === "ready" && (
          <div className="ag-over">
            <h2>STACK ATTACK</h2>
            <p>Premi <b>SPAZIO</b> o <b>tocca</b> per piazzare la carta sulla torre. Allineala bene: l&apos;eccedenza viene tagliata. Allineamento perfetto = combo!</p>
            <div className="ag-btns">
              <button type="button" className="ag-btn" onClick={start}>GIOCA</button>
            </div>
          </div>
        )}

        {phase === "over" && (
          <div className="ag-over">
            <h2>GAME OVER</h2>
            <p>Carte impilate: <span className="ag-big">{score}</span><br />Record: <span className="ag-big">{best}</span></p>
            <div className="ag-btns">
              <button type="button" className="ag-btn" onClick={start}>RIPROVA</button>
              <button type="button" className="ag-btn ag-ghost" onClick={() => onExit && onExit()}>ESCI</button>
            </div>
          </div>
        )}
      </div>

      <div className="ag-hintbar">SPAZIO / TAP = piazza · ESC = esci</div>
    </div>
  );
}

/* ---- disegno ---- */
function lerpN(a, b, t) { return a + (b - a) * t; }

function drawCard(ctx, x, y, w, h, ci, perfect, active) {
  const c = blockColor(ci);
  // corpo
  ctx.fillStyle = c.fill;
  rr(ctx, x, y, w, h, Math.min(5, h / 3)); ctx.fill();
  // banda superiore (luce)
  ctx.fillStyle = c.top;
  rr(ctx, x, y, w, Math.max(3, h * 0.32), Math.min(5, h / 3)); ctx.fill();
  // bordo
  ctx.lineWidth = perfect ? 2 : 1;
  ctx.strokeStyle = perfect ? "#fff" : (active ? "rgba(255,255,255,.8)" : "rgba(0,0,0,.35)");
  rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, Math.min(5, h / 3)); ctx.stroke();
  // bordo neon ogni 5 carte
  if (ci > 0 && ci % 5 === 0) {
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.5;
    rr(ctx, x + 1, y + 1, w - 2, h - 2, Math.min(5, h / 3)); ctx.stroke();
  }
}

let _stars = null;
function drawStars(ctx, w, h, t) {
  if (!_stars || _stars.w !== w || _stars.h !== h) {
    _stars = { w, h, pts: Array.from({ length: 46 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6 })) };
  }
  for (const s of _stars.pts) {
    const a = 0.25 + 0.25 * Math.sin(t * 2 + s.p);
    ctx.fillStyle = `rgba(120,160,255,${a})`;
    ctx.fillRect(s.x, s.y, s.r, s.r);
  }
}
