import React, { useEffect, useRef, useState } from "react";
import { useArcadeCanvas, clamp, rr } from "./game-kit";

/* ============================================================================
   TCG Jump — platformer stile Mario, 3 livelli di test. ← → muovi, SPAZIO
   salta (tieni premuto per saltare più in alto). Raccogli mana coins, salta
   sugli Slime per eliminarli (toccarli di lato = vita persa, come cadere nel
   vuoto). Raggiungi la bandiera 🏁 per completare il livello. 3 vite.
   ========================================================================== */

const ACCENT = "#39ff14";
const WORLD_H = 200;
const GRAV = 640;
const MOVE = 98;
const JUMP_V = -212;
const PW = 14, PH = 20; // player size

/* ---- livelli: piattaforme (ground a segmenti = buchi), coins, slimes, goal ---- */
const LEVELS = [
  {
    name: "Prati", w: 1120, sky: ["#7ec0ff", "#bfe9ff"], ground: "#6b9b3a", groundD: "#4a6e26", brick: "#c08a4a",
    plats: [
      { x: 0, y: 184, w: 1120, h: 16 },
      { x: 230, y: 150, w: 70, h: 12 },
      { x: 360, y: 124, w: 70, h: 12 },
      { x: 560, y: 150, w: 90, h: 12 },
      { x: 760, y: 130, w: 70, h: 12 },
    ],
    coins: [[150, 160], [255, 128], [390, 102], [600, 128], [620, 128], [790, 108], [900, 160], [980, 160]],
    slimes: [],
    spawn: [40, 150], goal: [1070, 140],
  },
  {
    name: "Caverna", w: 1280, sky: ["#241a3a", "#3a2a5e"], ground: "#3b4a6b", groundD: "#26314a", brick: "#5a6ea0",
    plats: [
      { x: 0, y: 184, w: 360, h: 16 },
      { x: 470, y: 184, w: 250, h: 16 },
      { x: 820, y: 184, w: 460, h: 16 },
      { x: 300, y: 140, w: 90, h: 12 },
      { x: 540, y: 120, w: 90, h: 12 },
      { x: 700, y: 150, w: 70, h: 12 },
      { x: 920, y: 132, w: 90, h: 12 },
    ],
    coins: [[120, 160], [330, 118], [575, 98], [720, 128], [870, 160], [955, 110], [1050, 160], [1150, 160]],
    slimes: [[850, 160, 980, 160], [490, 160, 700, 160]],
    spawn: [30, 150], goal: [1230, 140],
  },
  {
    name: "Castello", w: 1420, sky: ["#2a1020", "#4a1830"], ground: "#5a2630", groundD: "#3a161e", brick: "#8a4a4a",
    plats: [
      { x: 0, y: 184, w: 300, h: 16 },
      { x: 400, y: 184, w: 200, h: 16 },
      { x: 700, y: 184, w: 180, h: 16 },
      { x: 980, y: 184, w: 440, h: 16 },
      { x: 250, y: 144, w: 80, h: 12 },
      { x: 470, y: 128, w: 80, h: 12 },
      { x: 640, y: 150, w: 70, h: 12 },
      { x: 800, y: 126, w: 80, h: 12 },
      { x: 1040, y: 140, w: 90, h: 12 },
    ],
    coins: [[120, 160], [285, 122], [505, 106], [675, 128], [835, 104], [930, 160], [1085, 118], [1200, 160], [1300, 160]],
    slimes: [[420, 160, 580, 160], [1000, 160, 1180, 160], [710, 160, 860, 160]],
    spawn: [30, 150], goal: [1370, 140],
  },
];

export default function TcgJumpGame({ onExit, onResult }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const G = useRef(null);
  const keys = useRef({ left: false, right: false, jump: false });
  const phaseRef = useRef("ready");
  const [phase, setPhase] = useState("ready");
  const [level, setLevel] = useState(0);
  const [lives, setLives] = useState(3);
  const [coins, setCoins] = useState(0);
  const scoreRef = useRef(0);

  const loadLevel = (lv) => {
    const L = LEVELS[lv];
    G.current = {
      L,
      p: { x: L.spawn[0], y: L.spawn[1], vx: 0, vy: 0, onGround: false, dir: 1, anim: 0, jumpHeld: false },
      coins: L.coins.map(([x, y]) => ({ x, y, taken: false })),
      slimes: L.slimes.map(([x0, , x1]) => ({ x: x0, y: 164, x0, x1, dir: 1, dead: 0 })),
      camX: 0, t: 0, win: 0,
    };
    setLevel(lv);
  };

  const startGame = () => { scoreRef.current = 0; setCoins(0); setLives(3); loadLevel(0); phaseRef.current = "playing"; setPhase("playing"); };
  const nextLevel = () => { loadLevel(level + 1); phaseRef.current = "playing"; setPhase("playing"); };

  const loseLife = () => {
    setLives((lv) => {
      const n = lv - 1;
      if (n <= 0) { phaseRef.current = "over"; setPhase("over"); if (onResult) onResult({ game: "tcgJump", level: level + 1, coins, score: scoreRef.current }); }
      else { const L = LEVELS[level]; const g = G.current; g.p = { x: L.spawn[0], y: L.spawn[1], vx: 0, vy: 0, onGround: false, dir: 1, anim: 0, jumpHeld: false }; g.slimes.forEach((s) => { s.x = s.x0; s.dir = 1; s.dead = 0; }); }
      return n;
    });
  };

  const completeLevel = () => {
    if (level >= LEVELS.length - 1) { phaseRef.current = "complete"; setPhase("complete"); if (onResult) onResult({ game: "tcgJump", level: LEVELS.length, coins, complete: true, score: scoreRef.current }); }
    else { phaseRef.current = "win"; setPhase("win"); }
  };

  /* input tastiera */
  useEffect(() => {
    const dn = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onExit && onExit(); return; }
      if (e.code === "ArrowLeft" || e.code === "KeyA") { keys.current.left = true; e.preventDefault(); }
      if (e.code === "ArrowRight" || e.code === "KeyD") { keys.current.right = true; e.preventDefault(); }
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        keys.current.jump = true; e.preventDefault();
        if (phaseRef.current !== "playing") startGame();
      }
    };
    const up = (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keys.current.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") keys.current.right = false;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") keys.current.jump = false;
    };
    window.addEventListener("keydown", dn, true);
    window.addEventListener("keyup", up, true);
    return () => { window.removeEventListener("keydown", dn, true); window.removeEventListener("keyup", up, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadLevel(0); /* eslint-disable-next-line */ }, []);

  useArcadeCanvas(canvasRef, wrapRef, (ctx, w, h, dt) => {
    const g = G.current;
    if (!g) return;
    const sy = h / WORLD_H;
    const viewW = w / sy;
    const L = g.L;

    if (phaseRef.current === "playing") {
      step(g, dt, keys.current, viewW, loseLife, completeLevel, scoreRef, setCoins);
    }

    // camera
    g.camX = clamp(g.p.x - viewW * 0.42, 0, Math.max(0, L.w - viewW));

    // ---- render ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, L.sky[0]); sky.addColorStop(1, L.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    g.t += dt;
    drawParallax(ctx, w, h, g.camX, level, g.t);

    ctx.save();
    ctx.scale(sy, sy);
    ctx.translate(-g.camX, 0);

    // piattaforme
    for (const pl of L.plats) drawPlatform(ctx, pl, L, g.t);

    // goal flag (asta + bandiera ondeggiante con stemma)
    const [gx, gy] = L.goal;
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(gx + 1, gy + 2, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    const poleG = ctx.createLinearGradient(gx - 2, 0, gx + 3, 0);
    poleG.addColorStop(0, "#aeb6d8"); poleG.addColorStop(0.5, "#f2f5ff"); poleG.addColorStop(1, "#8088ad");
    ctx.fillStyle = poleG; ctx.fillRect(gx - 1, gy - 44, 3, 44);
    ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.arc(gx + 0.5, gy - 45, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(gx + 2, gy - 43);
    for (let i = 0; i <= 18; i++) { const u = i / 18; const fx = gx + 2 + u * 22; const fy = gy - 43 + u * 13 + Math.sin(g.t * 4 + u * 5) * 2.2 * u; ctx.lineTo(fx, fy); }
    for (let i = 18; i >= 0; i--) { const u = i / 18; const fx = gx + 2 + u * 22; const fy = gy - 31 + u * 13 + Math.sin(g.t * 4 + u * 5) * 2.2 * u; ctx.lineTo(fx, fy); }
    ctx.closePath();
    ctx.fillStyle = ACCENT; ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.arc(gx + 13, gy - 30, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0d3a08"; ctx.font = "7px 'Press Start 2P', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("★", gx + 13, gy - 29);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

    // coins (moneta che ruota con luccichio)
    for (const c of g.coins) {
      if (c.taken) continue;
      const sw = Math.abs(Math.cos(g.t * 4 + c.x * 0.3)) * 6 + 1.5;
      const bob = Math.sin(g.t * 3 + c.x) * 1.5;
      const cy = c.y + bob;
      ctx.fillStyle = "rgba(255,210,60,.18)"; ctx.beginPath(); ctx.arc(c.x, cy - 0.5, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#c8920f"; ctx.beginPath(); ctx.ellipse(c.x, cy, sw, 6.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.ellipse(c.x, cy, Math.max(0.6, sw - 1.3), 5.3, 0, 0, Math.PI * 2); ctx.fill();
      if (sw > 3) { ctx.fillStyle = "#fff6c8"; ctx.beginPath(); ctx.ellipse(c.x - sw * 0.25, cy - 1.4, Math.max(0.4, sw * 0.32), 1.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#a8740a"; ctx.font = "6px 'Press Start 2P', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("✦", c.x, cy + 0.5); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; }
    }

    // slimes (corpo gelatinoso lucido con occhi)
    for (const s of g.slimes) {
      if (s.dead) { ctx.globalAlpha = Math.max(0, 1 - s.dead); ctx.fillStyle = "#39ff14"; rr(ctx, s.x - 9, s.y + 7, 18, 3, 1.5); ctx.fill(); ctx.globalAlpha = 1; continue; }
      const sq = Math.sin(g.t * 8 + s.x) * 1.6;
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(s.x, s.y + 8, 9, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      const bodyG = ctx.createLinearGradient(0, s.y - 8, 0, s.y + 8);
      bodyG.addColorStop(0, "#5be36a"); bodyG.addColorStop(1, "#249a37");
      ctx.fillStyle = bodyG;
      ctx.beginPath();
      ctx.moveTo(s.x - 9, s.y + 8);
      ctx.quadraticCurveTo(s.x - 9, s.y - 7 - sq, s.x, s.y - 7 - sq);
      ctx.quadraticCurveTo(s.x + 9, s.y - 7 - sq, s.x + 9, s.y + 8);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.ellipse(s.x - 3, s.y - 3 - sq, 2.4, 1.5, -0.5, 0, Math.PI * 2); ctx.fill();
      const ed = s.dir;
      for (const ex of [-3.5, 3.5]) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.x + ex, s.y, 2.1, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#0a2a10"; ctx.beginPath(); ctx.arc(s.x + ex + ed * 0.7, s.y + 0.3, 1, 0, Math.PI * 2); ctx.fill(); }
    }

    // player
    drawPlayer(ctx, g.p, g.t);

    ctx.restore();
  });

  const touch = (k, v) => (e) => { e.preventDefault(); keys.current[k] = v; if (k === "jump" && v && phaseRef.current !== "playing") startGame(); };

  return (
    <div className="ag-root" style={{ "--accent": ACCENT }}>
      <style>{JUMP_CSS}</style>
      <div className="ag-top">
        <button type="button" className="ag-back" onClick={() => onExit && onExit()}>← Sala</button>
        <div className="ag-title">TCG JUMP</div>
        <div className="ag-stats">
          <div className="ag-stat">{LEVELS[level].name} <b>{level + 1}/3</b></div>
          <div className="ag-stat">🪙 <b>{coins}</b></div>
          <div className="ag-stat">Vite <b>{"♥".repeat(Math.max(0, lives)) || "—"}</b></div>
        </div>
      </div>

      <div className="ag-stage" ref={wrapRef}>
        <canvas ref={canvasRef} />

        {phase === "playing" && (
          <div className="jmp-touch">
            <div className="jmp-dpad">
              <button className="jmp-tbtn" onPointerDown={touch("left", true)} onPointerUp={touch("left", false)} onPointerLeave={touch("left", false)}>◀</button>
              <button className="jmp-tbtn" onPointerDown={touch("right", true)} onPointerUp={touch("right", false)} onPointerLeave={touch("right", false)}>▶</button>
            </div>
            <button className="jmp-tbtn jmp-jump" onPointerDown={touch("jump", true)} onPointerUp={touch("jump", false)} onPointerLeave={touch("jump", false)}>⤒</button>
          </div>
        )}

        {phase === "ready" && (
          <div className="ag-over">
            <h2>TCG JUMP</h2>
            <p><b>← →</b> muovi · <b>SPAZIO</b> salta (tieni premuto per saltare più in alto). Salta sugli Slime per schiacciarli, raccogli le mana coins e raggiungi la 🏁.</p>
            <div className="ag-btns"><button type="button" className="ag-btn" onClick={startGame}>GIOCA</button></div>
          </div>
        )}
        {phase === "win" && (
          <div className="ag-over">
            <h2>{LEVELS[level].name.toUpperCase()} OK!</h2>
            <p>Coins totali: <span className="ag-big">{coins}</span></p>
            <div className="ag-btns"><button type="button" className="ag-btn" onClick={nextLevel}>{LEVELS[level + 1] ? LEVELS[level + 1].name : "Avanti"} →</button></div>
          </div>
        )}
        {phase === "over" && (
          <div className="ag-over">
            <h2>GAME OVER</h2>
            <p>Arrivato a: {LEVELS[level].name}<br />Coins: <span className="ag-big">{coins}</span></p>
            <div className="ag-btns">
              <button type="button" className="ag-btn" onClick={startGame}>RIPROVA</button>
              <button type="button" className="ag-btn ag-ghost" onClick={() => onExit && onExit()}>ESCI</button>
            </div>
          </div>
        )}
        {phase === "complete" && (
          <div className="ag-over">
            <h2>🏆 FINITO!</h2>
            <p>Hai completato tutti e 3 i livelli!<br />Coins: <span className="ag-big">{coins}</span></p>
            <div className="ag-btns">
              <button type="button" className="ag-btn" onClick={startGame}>ANCORA</button>
              <button type="button" className="ag-btn ag-ghost" onClick={() => onExit && onExit()}>ESCI</button>
            </div>
          </div>
        )}
      </div>
      <div className="ag-hintbar">← → muovi · SPAZIO salta · ESC esci</div>
    </div>
  );
}

/* ---- fisica ---- */
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function step(g, dt, keys, viewW, loseLife, completeLevel, scoreRef, setCoins) {
  const p = g.p, L = g.L;
  // orizzontale
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  p.vx = dir * MOVE;
  if (dir) p.dir = dir;
  p.anim += Math.abs(p.vx) * dt * 0.12;

  // salto + salto variabile
  if (keys.jump && p.onGround) { p.vy = JUMP_V; p.onGround = false; p.jumpHeld = true; }
  if (!keys.jump && p.jumpHeld && p.vy < 0) { p.vy *= 0.5; p.jumpHeld = false; }
  if (p.vy >= 0) p.jumpHeld = false;

  p.vy += GRAV * dt;

  // muovi X e risolvi
  p.x += p.vx * dt;
  for (const pl of L.plats) {
    if (rectsOverlap(p.x - PW / 2, p.y - PH, PW, PH, pl.x, pl.y, pl.w, pl.h)) {
      if (p.vx > 0) p.x = pl.x - PW / 2;
      else if (p.vx < 0) p.x = pl.x + pl.w + PW / 2;
      p.vx = 0;
    }
  }
  p.x = clamp(p.x, PW / 2, L.w - PW / 2);

  // muovi Y e risolvi
  p.y += p.vy * dt;
  p.onGround = false;
  for (const pl of L.plats) {
    if (rectsOverlap(p.x - PW / 2, p.y - PH, PW, PH, pl.x, pl.y, pl.w, pl.h)) {
      if (p.vy > 0) { p.y = pl.y; p.vy = 0; p.onGround = true; }
      else if (p.vy < 0) { p.y = pl.y + pl.h + PH; p.vy = 0; }
    }
  }

  // caduta nel vuoto
  if (p.y - PH > WORLD_H + 10) { loseLife(); return; }

  // coins
  for (const c of g.coins) {
    if (c.taken) continue;
    if (Math.abs(c.x - p.x) < 11 && Math.abs(c.y - (p.y - PH / 2)) < 14) {
      c.taken = true; scoreRef.current += 5; setCoins((n) => n + 1);
    }
  }

  // slimes
  for (const s of g.slimes) {
    if (s.dead) { s.dead = Math.min(1, s.dead + dt * 2); continue; }
    s.x += s.dir * 34 * dt;
    if (s.x <= s.x0) { s.x = s.x0; s.dir = 1; }
    if (s.x >= s.x1) { s.x = s.x1; s.dir = -1; }
    if (rectsOverlap(p.x - PW / 2, p.y - PH, PW, PH, s.x - 8, s.y - 4, 16, 14)) {
      const stomp = p.vy > 0 && (p.y - PH * 0.3) < s.y;
      if (stomp) { s.dead = 0.01; p.vy = JUMP_V * 0.62; scoreRef.current += 10; }
      else { loseLife(); return; }
    }
  }

  // goal
  const [gx, gy] = L.goal;
  if (rectsOverlap(p.x - PW / 2, p.y - PH, PW, PH, gx - 4, gy - 36, 26, 40)) completeLevel();
}

/* ---- disegno ---- */
/* piattaforma: blocco con cima erbosa/illuminata, corpo a mattoni, ombra */
function drawPlatform(ctx, pl, L, t) {
  const isGround = pl.w > 200;
  // ombra proiettata
  ctx.fillStyle = "rgba(0,0,0,.16)";
  ctx.fillRect(pl.x + 3, pl.y + pl.h, pl.w, 4);
  // corpo (mattoni)
  const bodyG = ctx.createLinearGradient(0, pl.y, 0, pl.y + pl.h);
  bodyG.addColorStop(0, L.groundD); bodyG.addColorStop(1, shadeHex(L.groundD, 0.72));
  ctx.fillStyle = bodyG; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
  // fughe mattoni
  ctx.strokeStyle = "rgba(0,0,0,.22)"; ctx.lineWidth = 1;
  const bh = 8;
  for (let row = 0, ry = pl.y + 6; ry < pl.y + pl.h - 1; row++, ry += bh) {
    ctx.beginPath(); ctx.moveTo(pl.x, ry + 0.5); ctx.lineTo(pl.x + pl.w, ry + 0.5); ctx.stroke();
    const off = (row % 2) * 8;
    for (let bx = pl.x + off; bx < pl.x + pl.w; bx += 16) { ctx.beginPath(); ctx.moveTo(bx + 0.5, ry); ctx.lineTo(bx + 0.5, ry + bh); ctx.stroke(); }
  }
  // bordo luminoso superiore (erba per i prati, pietra altrove)
  ctx.fillStyle = L.ground; ctx.fillRect(pl.x, pl.y, pl.w, 4);
  ctx.fillStyle = shadeHex(L.ground, 1.25); ctx.fillRect(pl.x, pl.y, pl.w, 1.5);
  if (L.name === "Prati") {
    ctx.fillStyle = L.ground;
    for (let bx = pl.x + 3; bx < pl.x + pl.w - 2; bx += 9) { const hgt = 2 + ((bx * 7) % 3); ctx.fillRect(bx, pl.y - hgt, 1, hgt); ctx.fillRect(bx + 3, pl.y - hgt + 1, 1, hgt - 1); }
  }
  // contorno
  ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.strokeRect(pl.x + 0.5, pl.y + 0.5, pl.w - 1, pl.h - 1);
}

function drawPlayer(ctx, p, t) {
  const x = p.x, y = p.y;
  const moving = Math.abs(p.vx) > 1;
  const step = Math.sin(p.anim) * (p.onGround && moving ? 1.4 : 0);
  const air = !p.onGround;
  const d = p.dir;
  // ombra
  ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.beginPath(); ctx.ellipse(x, y + 1, 7, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  // gambe (oscillano camminando; raccolte in volo)
  ctx.fillStyle = "#27304d";
  if (air) { ctx.fillRect(x - 5, y - 6, 4, 4); ctx.fillRect(x + 1, y - 6, 4, 4); }
  else { ctx.fillRect(x - 5, y - 6, 4, 6 + step); ctx.fillRect(x + 1, y - 6, 4, 6 - step); }
  ctx.fillStyle = "#8a5a2a"; ctx.fillRect(x - 5, y - 1 + (air ? -2 : 0), 4, 2); ctx.fillRect(x + 1, y - 1 + (air ? -2 : 0), 4, 2);
  // mantello
  ctx.fillStyle = "#7a1f5a"; ctx.beginPath();
  ctx.moveTo(x - d * 5, y - PH + 3); ctx.lineTo(x - d * 11, y - 4 + (air ? -3 : 0)); ctx.lineTo(x - d * 4, y - 5); ctx.closePath(); ctx.fill();
  // corpo (tunica)
  const bodyG = ctx.createLinearGradient(0, y - PH, 0, y - 4);
  bodyG.addColorStop(0, "#ff7a4d"); bodyG.addColorStop(1, "#e0432a");
  ctx.fillStyle = bodyG; rr(ctx, x - 6, y - PH, PW - 2, PH - 6, 3); ctx.fill();
  // cintura + gemma
  ctx.fillStyle = "#3a2410"; ctx.fillRect(x - 6, y - 9, PW - 2, 2);
  ctx.fillStyle = "#ffd23a"; ctx.fillRect(x - 1, y - 9.5, 2, 3);
  // braccio
  ctx.fillStyle = "#e0432a"; ctx.fillRect(x + d * 4, y - PH + 6, 2.5, 6);
  // testa
  ctx.fillStyle = "#ffd9a8"; rr(ctx, x - 5, y - PH - 1, 10, 8, 3); ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,.08)"; ctx.fillRect(x - 5, y - PH + 4, 10, 3);
  // cappello da mago a punta
  ctx.fillStyle = "#b5263f";
  ctx.beginPath(); ctx.moveTo(x - 7, y - PH - 1); ctx.lineTo(x + 7, y - PH - 1); ctx.lineTo(x + d * 5, y - PH - 11); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#7c1329"; ctx.fillRect(x - 7, y - PH - 2, 14, 2);
  ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.arc(x + d * 5, y - PH - 11, 1.6, 0, Math.PI * 2); ctx.fill();
  // occhi (direzione)
  ctx.fillStyle = "#1a1205";
  ctx.fillRect(x + (d > 0 ? 0 : -2), y - PH + 2, 2, 2.5);
  ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(x + (d > 0 ? 0 : -2), y - PH + 2, 1, 1);
}

function shadeHex(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(Math.round(((n >> 16) & 255) * f), 0, 255);
  const g = clamp(Math.round(((n >> 8) & 255) * f), 0, 255);
  const b = clamp(Math.round((n & 255) * f), 0, 255);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

let _bg = null;
function drawParallax(ctx, w, h, camX, level, t) {
  if (!_bg || _bg.w !== w || _bg.lv !== level) {
    _bg = {
      w, lv: level,
      hills: Array.from({ length: 8 }, (_, i) => ({ x: i * 170 + 40, r: 46 + (i % 3) * 18, near: i % 2 })),
      clouds: Array.from({ length: 6 }, (_, i) => ({ x: i * 150 + 30, y: 30 + (i % 3) * 26, s: 0.7 + (i % 3) * 0.35 })),
      stars: Array.from({ length: 40 }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.6, r: Math.random() * 1.3 + 0.3 })),
    };
  }
  if (level === 0) {
    // colline lontane + vicine
    for (const hl of _bg.hills) {
      const x = hl.x - camX * (hl.near ? 0.5 : 0.3);
      ctx.fillStyle = hl.near ? "rgba(90,160,90,.32)" : "rgba(150,200,235,.4)";
      ctx.beginPath(); ctx.arc(((x % (w + 200)) + w + 200) % (w + 200) - 100, h - 18, hl.r, Math.PI, 0); ctx.fill();
    }
    // nuvole
    for (const cl of _bg.clouds) {
      const x = ((cl.x - camX * 0.18 + t * 6) % (w + 120) + w + 120) % (w + 120) - 60;
      ctx.fillStyle = "rgba(255,255,255,.85)";
      for (const [dx, dy, r] of [[0, 0, 9], [9, 1, 7], [-9, 2, 7], [3, -4, 6]]) { ctx.beginPath(); ctx.arc(x + dx * cl.s, cl.y + dy, r * cl.s, 0, Math.PI * 2); ctx.fill(); }
    }
  } else if (level === 1) {
    // grotta: stelle/cristalli + stalattiti
    for (const s of _bg.stars) { ctx.fillStyle = `rgba(140,170,255,${0.2 + 0.2 * Math.sin(t * 2 + s.x)})`; ctx.fillRect(s.x, s.y, s.r, s.r); }
    ctx.fillStyle = "rgba(40,30,70,.6)";
    for (let i = 0; i < 14; i++) { const x = (i * 90 - camX * 0.5 % (w + 90) + w + 90) % (w + 90) - 45; const hh = 18 + (i % 4) * 12; ctx.beginPath(); ctx.moveTo(x - 8, 0); ctx.lineTo(x + 8, 0); ctx.lineTo(x, hh); ctx.closePath(); ctx.fill(); }
  } else {
    // castello: bandiere + torri silhouette
    ctx.fillStyle = "rgba(30,8,18,.55)";
    for (let i = 0; i < 9; i++) {
      const x = ((i * 150 - camX * 0.35) % (w + 150) + w + 150) % (w + 150) - 75;
      ctx.fillRect(x, h - 80, 50, 80);
      for (let m = 0; m < 4; m++) ctx.fillRect(x + m * 14, h - 88, 8, 8);
      ctx.fillStyle = "rgba(210,60,80,.5)"; ctx.beginPath(); ctx.moveTo(x + 25, h - 96); ctx.lineTo(x + 25, h - 110); ctx.lineTo(x + 38, h - 103); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(30,8,18,.55)";
    }
  }
}

const JUMP_CSS = `
.jmp-touch{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;
  align-items:flex-end;padding:14px 16px;pointer-events:none;z-index:3;}
.jmp-dpad{display:flex;gap:10px;}
.jmp-tbtn{pointer-events:auto;width:54px;height:54px;border-radius:50%;border:2px solid rgba(57,255,20,.5);
  background:rgba(10,20,10,.5);color:#cffccf;font-size:20px;cursor:pointer;touch-action:none;
  display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);}
.jmp-tbtn:active{background:rgba(57,255,20,.25);}
.jmp-jump{width:64px;height:64px;font-size:26px;}
@media (hover:hover) and (pointer:fine){.jmp-touch{display:none;}}
`;
