import React, { useEffect, useRef, useState } from "react";

/* ============================================================================
   Card Memory — abbina le coppie di sigilli prima che scada il tempo.
   3 livelli: 4x4 (60s) · 6x4 (90s) · 6x6 (120s). Punteggio = coppie + bonus
   tempo residuo, accumulato sui livelli. Tutto DOM/CSS (niente canvas).
   ========================================================================== */

const ACCENT = "#b026ff";
const SYMBOLS = ["🔥", "⭐", "🛡️", "☀️", "🌙", "⚡", "❄️", "🍀", "💎", "🗡️", "🐉", "🎲", "👑", "🧿", "🌹", "🔮", "🎯", "🪙"];
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
                  aria-label={c.flipped || c.matched ? c.sym : "carta coperta"}
                >
                  <span className="mem-inner">
                    <span className="mem-back" aria-hidden>◆</span>
                    <span className="mem-front" aria-hidden>{c.sym}</span>
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
.mem-stage{display:flex;flex-direction:column;padding:12px;gap:10px;background:radial-gradient(120% 100% at 50% 0,#1a0f2e,#08060f);}
.mem-timer{position:relative;height:16px;border-radius:8px;background:rgba(255,255,255,.06);overflow:hidden;border:1px solid rgba(255,255,255,.12);flex:none;}
.mem-timefill{height:100%;background:linear-gradient(90deg,#b026ff,#05d9e8);transition:width .1s linear;}
.mem-timefill.mem-low{background:linear-gradient(90deg,#ff2a6d,#ff8a3d);animation:memPulse .6s infinite;}
@keyframes memPulse{0%,100%{opacity:1}50%{opacity:.55}}
.mem-timetxt{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:8px;color:#fff;}
.mem-grid{flex:1;min-height:0;display:grid;gap:8px;align-content:center;justify-content:center;}
.mem-card{appearance:none;border:0;background:none;cursor:pointer;padding:0;aspect-ratio:3/4;
  width:100%;max-width:84px;justself:center;perspective:600px;}
.mem-inner{position:relative;display:block;width:100%;height:100%;transition:transform .32s;transform-style:preserve-3d;}
.mem-card.mem-up .mem-inner{transform:rotateY(180deg);}
.mem-back,.mem-front{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  border-radius:9px;backface-visibility:hidden;-webkit-backface-visibility:hidden;}
.mem-back{background:linear-gradient(145deg,#2a1a4e,#160d2c);border:2px solid rgba(176,38,255,.55);
  color:rgba(176,38,255,.8);font-size:20px;box-shadow:inset 0 0 14px rgba(176,38,255,.25);}
.mem-front{background:linear-gradient(145deg,#11212e,#0a1620);border:2px solid #05d9e8;
  transform:rotateY(180deg);font-size:clamp(20px,5vw,34px);box-shadow:0 0 14px rgba(5,217,232,.3);}
.mem-card.mem-matched .mem-front{border-color:#39ff14;box-shadow:0 0 16px rgba(57,255,20,.5);animation:memMatch .4s;}
@keyframes memMatch{0%{transform:rotateY(180deg) scale(1)}50%{transform:rotateY(180deg) scale(1.12)}100%{transform:rotateY(180deg) scale(1)}}
.mem-card:hover:not(.mem-up) .mem-back{border-color:#b026ff;box-shadow:inset 0 0 14px rgba(176,38,255,.45);}
`;
