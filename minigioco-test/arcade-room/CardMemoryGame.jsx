import React, { useEffect, useRef, useState } from "react";

/* ============================================================================
   Card Memory — abbina le coppie di sigilli prima che scada il tempo.
   3 livelli: 4x4 (60s) · 6x4 (90s) · 6x6 (120s). Punteggio = coppie + bonus
   tempo residuo, accumulato sui livelli. Tutto DOM/CSS (niente canvas).
   ========================================================================== */

const ACCENT = "#b026ff";

/* Sigilli vettoriali monoline (viewBox 0 0 24 24, stroke=currentColor): un set
   coerente in stile rune-neon, niente emoji eterogenee. */
const SIGILS = [
  /* fiamma   */ '<path d="M12 3c3 4 1 6 2 8 1-1 1-2 1-3 2 2 2 5 2 6a6 6 0 1 1-12 0c0-2 1-4 3-6 0 1 0 2 1 3 1-3-1-5 3-8z" fill="currentColor" fill-opacity=".18"/><path d="M12 3c3 4 1 6 2 8 1-1 1-2 1-3 2 2 2 5 2 6a6 6 0 1 1-12 0c0-2 1-4 3-6 0 1 0 2 1 3 1-3-1-5 3-8z"/>',
  /* stella   */ '<path d="M12 3l2.5 5.5L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.5-.8z" fill="currentColor" fill-opacity=".18"/><path d="M12 3l2.5 5.5L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.5-.8z" stroke-linejoin="round"/>',
  /* scudo    */ '<path d="M12 3l7 2v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V5z" fill="currentColor" fill-opacity=".18"/><path d="M12 3l7 2v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V5z"/><path d="M12 8v6M9 11h6"/>',
  /* sole     */ '<circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity=".2"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M18.5 5.5l-2 2M7.5 16.5l-2 2"/>',
  /* luna     */ '<path d="M16 4a8 8 0 1 0 4 12 7 7 0 0 1-4-12z" fill="currentColor" fill-opacity=".18"/><path d="M16 4a8 8 0 1 0 4 12 7 7 0 0 1-4-12z"/>',
  /* fulmine  */ '<path d="M13 3l-7 10h4l-2 8 8-11h-5z" fill="currentColor" fill-opacity=".2"/><path d="M13 3l-7 10h4l-2 8 8-11h-5z" stroke-linejoin="round"/>',
  /* fiocco   */ '<path d="M12 3v18M4 7.5l16 9M20 7.5l-16 9M12 6l-2.5 2.5M12 6l2.5 2.5M12 18l-2.5-2.5M12 18l2.5-2.5"/>',
  /* trifoglio*/ '<path d="M12 13c-3-4-7-1-5 2 1.5 2 5 0 5-2zM12 13c3-4 7-1 5 2-1.5 2-5 0-5-2zM12 13c0-4-4-5-5-2-1 2.5 2 4 5 2z" fill="currentColor" fill-opacity=".18"/><path d="M12 13c-3-4-7-1-5 2 1.5 2 5 0 5-2zM12 13c3-4 7-1 5 2-1.5 2-5 0-5-2zM12 13c0-4-4-5-5-2-1 2.5 2 4 5 2z"/><path d="M12 13v8"/>',
  /* gemma    */ '<path d="M6 9l3-4h6l3 4-6 11z" fill="currentColor" fill-opacity=".2"/><path d="M6 9l3-4h6l3 4-6 11zM6 9h12M9 5l3 4 3-4M12 9v11"/>',
  /* spada    */ '<path d="M12 3l3 3-7 7-1 1-2-2 1-1z" fill="currentColor" fill-opacity=".18"/><path d="M14 5l5-2-2 5M12 3l3 3-9 9-2-2zM6 16l-2 2 1 3 3-1 1-2"/>',
  /* serpente */ '<path d="M5 18c4 0 4-6 8-6s4 6 6 4" /><path d="M19 16a1.4 1.4 0 1 0 0-.1z" fill="currentColor"/><path d="M5 18a1.4 1.4 0 1 0 0-.1z" fill="currentColor"/>',
  /* dado     */ '<rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" fill-opacity=".14"/><rect x="5" y="5" width="14" height="14" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none"/>',
  /* corona   */ '<path d="M4 9l3 8h10l3-8-5 4-3-6-3 6z" fill="currentColor" fill-opacity=".18"/><path d="M4 9l3 8h10l3-8-5 4-3-6-3 6zM6 19h12"/>',
  /* occhio   */ '<path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" fill="currentColor" fill-opacity=".14"/><path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/>',
  /* fiore    */ '<circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/><path d="M12 12c0-4 6-4 4 0M12 12c4 0 4 6 0 4M12 12c0 4-6 4-4 0M12 12c-4 0-4-6 0-4" fill="currentColor" fill-opacity=".18"/><path d="M12 12c0-4 6-4 4 0M12 12c4 0 4 6 0 4M12 12c0 4-6 4-4 0M12 12c-4 0-4-6 0-4"/>',
  /* orbe     */ '<circle cx="12" cy="11" r="6" fill="currentColor" fill-opacity=".16"/><circle cx="12" cy="11" r="6"/><path d="M9 9a3 3 0 0 1 3-1.5"/><path d="M7 19h10l-1-3H8z" fill="currentColor" fill-opacity=".18"/><path d="M7 19h10l-1-3H8z"/>',
  /* mirino   */ '<circle cx="12" cy="12" r="7" fill="currentColor" fill-opacity=".12"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  /* moneta   */ '<circle cx="12" cy="12" r="7" fill="currentColor" fill-opacity=".16"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="4.4"/><path d="M12 9.5v5M10.5 11h2.2a1.3 1.3 0 0 1 0 2.6"/>',
];
const SYMBOLS = SIGILS.map((_, i) => i);
const Sigil = ({ i }) => (
  <svg className="mem-sig" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" aria-hidden dangerouslySetInnerHTML={{ __html: SIGILS[i] }} />
);
const LEVELS = [
  { cols: 4, rows: 4, time: 60 },
  { cols: 6, rows: 4, time: 90 },
  { cols: 6, rows: 6, time: 120 },
];

function makeDeck(level) {
  const { cols, rows } = LEVELS[level];
  const pairs = (cols * rows) / 2;
  const syms = shuffle(SYMBOLS.slice()).slice(0, pairs);
  const deck = shuffle([...syms, ...syms].map((sym, i) => ({ id: i, sym, flipped: false, matched: false })));
  return deck;
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CardMemoryGame({ onExit, onResult }) {
  const [phase, setPhase] = useState("ready"); // ready|playing|win|lose|complete
  const [level, setLevel] = useState(0);
  const [cards, setCards] = useState([]);
  const [time, setTime] = useState(LEVELS[0].time);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const flipped = useRef([]);
  const lock = useRef(false);
  const endRef = useRef(0);
  const scoreRef = useRef(0);

  const startLevel = (lv) => {
    setCards(makeDeck(lv));
    flipped.current = [];
    lock.current = false;
    setMoves(0);
    setTime(LEVELS[lv].time);
    endRef.current = performance.now() + LEVELS[lv].time * 1000;
    setLevel(lv);
    setPhase("playing");
  };

  const startGame = () => { scoreRef.current = 0; setScore(0); startLevel(0); };

  /* timer fluido via rAF mentre si gioca */
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    const tick = () => {
      const left = Math.max(0, (endRef.current - performance.now()) / 1000);
      setTime(left);
      if (left <= 0) { loseLevel(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, level]);

  /* ESC esce */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onExit && onExit(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loseLevel = () => {
    if (onResult) onResult({ game: "cardMemory", score: scoreRef.current, level: level + 1 });
    setPhase("lose");
  };

  const clickCard = (id) => {
    if (lock.current || phase !== "playing") return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    const next = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setCards(next);
    flipped.current.push(id);

    if (flipped.current.length === 2) {
      setMoves((m) => m + 1);
      lock.current = true;
      const [a, b] = flipped.current;
      const ca = next.find((c) => c.id === a), cb = next.find((c) => c.id === b);
      if (ca.sym === cb.sym) {
        window.setTimeout(() => {
          setCards((cur) => {
            const upd = cur.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c));
            checkWin(upd);
            return upd;
          });
          flipped.current = [];
          lock.current = false;
          scoreRef.current += 10;
          setScore(scoreRef.current);
        }, 320);
      } else {
        window.setTimeout(() => {
          setCards((cur) => cur.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c)));
          flipped.current = [];
          lock.current = false;
        }, 720);
      }
    }
  };

  const checkWin = (deck) => {
    if (deck.every((c) => c.matched)) {
      const bonus = Math.round(Math.max(0, (endRef.current - performance.now()) / 1000)) * 2;
      scoreRef.current += bonus + 25;
      setScore(scoreRef.current);
      if (level >= LEVELS.length - 1) {
        if (onResult) onResult({ game: "cardMemory", score: scoreRef.current, level: LEVELS.length, complete: true });
        setPhase("complete");
      } else {
        setPhase("win");
      }
    }
  };

  const { cols } = LEVELS[level];
  const timePct = Math.max(0, Math.min(1, time / LEVELS[level].time));
  const timeLow = time <= 10;

  return (
    <div className="ag-root" style={{ "--accent": ACCENT }}>
      <style>{MEM_CSS}</style>
      <div className="ag-top">
        <button type="button" className="ag-back" onClick={() => onExit && onExit()}>← Sala</button>
        <div className="ag-title">CARD MEMORY</div>
        <div className="ag-stats">
          <div className="ag-stat">Liv <b>{level + 1}/3</b></div>
          <div className="ag-stat">Punti <b>{score}</b></div>
          <div className="ag-stat">Mosse <b>{moves}</b></div>
        </div>
      </div>

      <div className="ag-stage mem-stage">
        {phase === "playing" && (
          <>
            <div className="mem-timer">
              <div className={"mem-timefill" + (timeLow ? " mem-low" : "")} style={{ width: `${timePct * 100}%` }} />
              <span className="mem-timetxt">{Math.ceil(time)}s</span>
            </div>
            <div className="mem-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {cards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={"mem-card" + (c.flipped || c.matched ? " mem-up" : "") + (c.matched ? " mem-matched" : "")}
                  onClick={() => clickCard(c.id)}
                  aria-label={c.flipped || c.matched ? "sigillo " + (c.sym + 1) : "carta coperta"}
                >
                  <span className="mem-inner">
                    <span className="mem-back" aria-hidden><span className="mem-rune">✦</span></span>
                    <span className="mem-front" aria-hidden><Sigil i={c.sym} /></span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "ready" && (
          <div className="ag-over">
            <h2>CARD MEMORY</h2>
            <p>Scopri due carte: se i sigilli combaciano restano girate. Abbina tutte le coppie prima che scada il tempo. 3 livelli sempre più grandi!</p>
            <div className="ag-btns"><button type="button" className="ag-btn" onClick={startGame}>GIOCA</button></div>
          </div>
        )}

        {phase === "win" && (
          <div className="ag-over">
            <h2>LIVELLO {level + 1} FATTO!</h2>
            <p>Punti: <span className="ag-big">{score}</span></p>
            <div className="ag-btns"><button type="button" className="ag-btn" onClick={() => startLevel(level + 1)}>LIVELLO {level + 2} →</button></div>
          </div>
        )}

        {phase === "lose" && (
          <div className="ag-over">
            <h2>TEMPO SCADUTO</h2>
            <p>Sei arrivato al livello {level + 1}.<br />Punti: <span className="ag-big">{score}</span></p>
            <div className="ag-btns">
              <button type="button" className="ag-btn" onClick={startGame}>RIPROVA</button>
              <button type="button" className="ag-btn ag-ghost" onClick={() => onExit && onExit()}>ESCI</button>
            </div>
          </div>
        )}

        {phase === "complete" && (
          <div className="ag-over">
            <h2>🏆 COMPLETATO!</h2>
            <p>Hai battuto tutti e 3 i livelli!<br />Punteggio finale: <span className="ag-big">{score}</span></p>
            <div className="ag-btns">
              <button type="button" className="ag-btn" onClick={startGame}>ANCORA</button>
              <button type="button" className="ag-btn ag-ghost" onClick={() => onExit && onExit()}>ESCI</button>
            </div>
          </div>
        )}
      </div>

      <div className="ag-hintbar">Clicca le carte · ESC = esci</div>
    </div>
  );
}

const MEM_CSS = `
.mem-stage{display:flex;flex-direction:column;padding:14px;gap:11px;
  background:
    radial-gradient(90% 60% at 50% -10%,rgba(176,38,255,.18),transparent 70%),
    radial-gradient(120% 100% at 50% 0,#1a0f2e,#08060f);}
.mem-timer{position:relative;height:15px;border-radius:8px;background:rgba(255,255,255,.06);overflow:hidden;border:1px solid rgba(255,255,255,.12);flex:none;}
.mem-timefill{height:100%;background:linear-gradient(90deg,#b026ff,#05d9e8);transition:width .1s linear;box-shadow:0 0 12px rgba(176,38,255,.5);}
.mem-timefill.mem-low{background:linear-gradient(90deg,#ff2a6d,#ff8a3d);animation:memPulse .6s infinite;}
@keyframes memPulse{0%,100%{opacity:1}50%{opacity:.55}}
.mem-timetxt{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:8px;color:#fff;text-shadow:0 1px 2px #000;}
.mem-grid{flex:1;min-height:0;display:grid;gap:9px;align-content:center;justify-content:center;}
.mem-card{appearance:none;border:0;background:none;cursor:pointer;padding:0;aspect-ratio:3/4;
  width:100%;max-width:88px;justify-self:center;perspective:700px;}
.mem-inner{position:relative;display:block;width:100%;height:100%;transition:transform .36s cubic-bezier(.2,.8,.3,1.2);transform-style:preserve-3d;}
.mem-card.mem-up .mem-inner{transform:rotateY(180deg);}
.mem-back,.mem-front{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  border-radius:11px;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;}
/* dorso: cornice doppia + trama a rombi diagonali */
.mem-back{
  background:
    repeating-linear-gradient(45deg,rgba(176,38,255,.16) 0 4px,transparent 4px 9px),
    repeating-linear-gradient(-45deg,rgba(5,217,232,.10) 0 4px,transparent 4px 9px),
    linear-gradient(155deg,#2c1a52,#140b2a);
  border:2px solid rgba(176,38,255,.6);box-shadow:inset 0 0 0 2px rgba(255,255,255,.04),inset 0 0 16px rgba(176,38,255,.28);}
.mem-rune{font-size:22px;color:rgba(176,38,255,.85);text-shadow:0 0 10px rgba(176,38,255,.7);
  width:60%;height:60%;display:flex;align-items:center;justify-content:center;
  border:1.5px solid rgba(176,38,255,.4);border-radius:50%;}
/* fronte: pergamena scura con sigillo neon ciano */
.mem-front{
  background:radial-gradient(80% 80% at 50% 35%,#16323f,#0a1620);
  border:2px solid #05d9e8;transform:rotateY(180deg);
  box-shadow:0 0 16px rgba(5,217,232,.35),inset 0 0 14px rgba(5,217,232,.12);color:#7df4ff;}
.mem-front::before{content:"";position:absolute;inset:5px;border:1px solid rgba(5,217,232,.3);border-radius:7px;}
.mem-sig{width:62%;height:62%;color:#86f6ff;filter:drop-shadow(0 0 5px rgba(5,217,232,.7));}
.mem-card.mem-matched .mem-front{border-color:#39ff14;box-shadow:0 0 18px rgba(57,255,20,.55);animation:memMatch .45s;}
.mem-card.mem-matched .mem-sig{color:#b6ff9c;filter:drop-shadow(0 0 6px rgba(57,255,20,.8));}
@keyframes memMatch{0%{transform:rotateY(180deg) scale(1)}50%{transform:rotateY(180deg) scale(1.13)}100%{transform:rotateY(180deg) scale(1)}}
.mem-card:hover:not(.mem-up) .mem-back{border-color:#d77bff;box-shadow:inset 0 0 16px rgba(176,38,255,.5);transform:translateY(-2px);transition:transform .12s;}
`;
