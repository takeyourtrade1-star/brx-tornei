import React, { useEffect, useRef, useState } from "react";
import { useP2PRoom } from "./useP2PRoom";

/* ============================================================================
   Tavolo Duello (Kakegurui) — Sasso/Carta/Forbice, best-of-3, timer 7s/turno.
   Due modalità:
     · Single Player — vs CPU
     · 1v1 in rete   — WebRTC P2P (signaling manuale copia/incolla, vedi
                       useP2PRoom + docs/ARCADE_ROOM_PLAN.md §10)
   In rete ogni lato risolve in modo deterministico dalla coppia di mosse
   scambiate (niente host-authority → niente desync).
   ========================================================================== */

const ACCENT = "#ff2a6d";
const WIN_TARGET = 2;
const TURN_MS = 7000;
const MOVES = {
  rock: { label: "Sasso", icon: "🪨", accent: "#ff7300" },
  paper: { label: "Carta", icon: "📄", accent: "#818cf8" },
  scissors: { label: "Forbice", icon: "✂️", accent: "#34d399" },
};
const ORDER = ["rock", "paper", "scissors"];
const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };
const EMOTE = { win: "😏", lose: "😱", draw: "😐", ready: "💪" };
const rndMove = () => ORDER[Math.floor(Math.random() * 3)];

function cpuPick(history) {
  if (history.length >= 3 && Math.random() < 0.45) {
    const cnt = { rock: 0, paper: 0, scissors: 0 };
    history.forEach((m) => (cnt[m] += 1));
    const fav = [...ORDER].sort((a, b) => cnt[b] - cnt[a])[0];
    return ORDER.find((m) => BEATS[m] === fav) || rndMove();
  }
  return rndMove();
}

export default function KakeguruiGame({ onExit, onResult }) {
  const [mode, setMode] = useState(null); // null | 'sp' | 'mp'
  const netMsgRef = useRef(null);
  const [room, actions] = useP2PRoom((m) => netMsgRef.current && netMsgRef.current(m));

  /* ESC: se non connesso esce dal gioco; il Duel gestisce il proprio ESC */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && (mode === null || room.state !== "connected")) {
        e.preventDefault(); e.stopPropagation();
        if (mode === "mp") actions.disconnect();
        onExit && onExit();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, room.state]);

  const backToMenu = () => { actions.disconnect(); setMode(null); };

  if (mode === "sp") {
    return <Duel net={null} onExit={onExit} onBack={() => setMode(null)} onResult={onResult} />;
  }
  if (mode === "mp") {
    if (room.state === "connected") {
      const net = {
        seat: room.isHost ? "host" : "guest",
        send: actions.sendGameState,
        bind: (fn) => { netMsgRef.current = fn; },
        latency: room.latency,
        state: room.state,
      };
      return <Duel net={net} onExit={onExit} onBack={backToMenu} onResult={onResult} />;
    }
    return <Lobby room={room} actions={actions} onExit={onExit} onBack={backToMenu} />;
  }

  /* menu modalità */
  return (
    <div className="ag-root" style={{ "--accent": ACCENT }}>
      <style>{KAK_CSS}</style>
      <div className="ag-top">
        <button type="button" className="ag-back" onClick={() => onExit && onExit()}>← Sala</button>
        <div className="ag-title">TAVOLO DUELLO</div>
        <div className="ag-stats"><div className="ag-stat">Sasso · Carta · Forbice</div></div>
      </div>
      <div className="ag-stage kak-stage">
        <div className="ag-over">
          <h2>TAVOLO DUELLO</h2>
          <p>Sasso batte Forbice · Forbice batte Carta · Carta batte Sasso. Primo a <b>{WIN_TARGET}</b> round vince.</p>
          <div className="ag-btns">
            <button type="button" className="ag-btn" onClick={() => setMode("sp")}>🎮 Single Player</button>
            <button type="button" className="ag-btn" onClick={() => setMode("mp")}>⚔️ 1v1 in rete</button>
          </div>
        </div>
      </div>
      <div className="ag-hintbar">Scegli una modalità · ESC esci</div>
    </div>
  );
}

/* ============================ LOBBY P2P ================================== */
function Lobby({ room, actions, onExit, onBack }) {
  const [tab, setTab] = useState("host"); // host | guest
  const [paste, setPaste] = useState("");
  const [copied, setCopied] = useState(false);

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* clipboard negata: l'utente seleziona a mano */ }
  };

  const busy = room.state === "creating" || room.state === "joining";

  return (
    <div className="ag-root" style={{ "--accent": ACCENT }}>
      <style>{KAK_CSS}</style>
      <div className="ag-top">
        <button type="button" className="ag-back" onClick={onBack}>← Modalità</button>
        <div className="ag-title">1V1 IN RETE</div>
        <div className="ag-stats"><div className="ag-stat">{stateLabel(room.state)}</div></div>
      </div>

      <div className="ag-stage kak-stage kak-lobby">
        <div className="kak-tabs">
          <button className={"kak-tab" + (tab === "host" ? " on" : "")} onClick={() => setTab("host")} disabled={room.isHost === false && room.state !== "idle"}>Crea sfida</button>
          <button className={"kak-tab" + (tab === "guest" ? " on" : "")} onClick={() => setTab("guest")} disabled={room.isHost === true && room.state !== "idle"}>Unisciti</button>
        </div>

        {tab === "host" ? (
          <div className="kak-lobbybox">
            <p className="kak-step">1 · Crea l&apos;invito e mandalo all&apos;amico</p>
            {!room.localSignal ? (
              <button className="ag-btn" onClick={actions.createRoom} disabled={busy}>{busy ? "Genero…" : "Crea invito"}</button>
            ) : (
              <>
                <CodeBox value={room.localSignal} onCopy={() => copy(room.localSignal)} copied={copied} label={`Codice invito${room.roomCode ? " · stanza " + room.roomCode : ""}`} />
                <p className="kak-step">2 · Incolla qui la sua risposta</p>
                <textarea className="kak-paste" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Incolla il codice risposta…" />
                <button className="ag-btn" onClick={() => actions.submitAnswer(paste)} disabled={!paste.trim()}>Connetti</button>
              </>
            )}
          </div>
        ) : (
          <div className="kak-lobbybox">
            <p className="kak-step">1 · Incolla l&apos;invito ricevuto</p>
            <textarea className="kak-paste" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Incolla il codice invito…" disabled={!!room.localSignal} />
            {!room.localSignal ? (
              <button className="ag-btn" onClick={() => actions.joinRoom(paste)} disabled={!paste.trim() || busy}>{busy ? "Connetto…" : "Genera risposta"}</button>
            ) : (
              <>
                <p className="kak-step">2 · Manda questa risposta all&apos;host e attendi</p>
                <CodeBox value={room.localSignal} onCopy={() => copy(room.localSignal)} copied={copied} label="Codice risposta" />
                <div className="kak-waiting"><i className="kak-spin" /> In attesa dell&apos;host…</div>
              </>
            )}
          </div>
        )}

        {room.error && <div className="kak-err">⚠ {room.error}</div>}
        <p className="kak-tip">Suggerimento: il primo codice è lungo, copialo <b>tutto</b>. Funziona meglio sulla stessa rete Wi-Fi.</p>
      </div>
      <div className="ag-hintbar">Signaling manuale (nessun server) · ESC esci</div>
    </div>
  );
}

function CodeBox({ value, onCopy, copied, label }) {
  return (
    <div className="kak-codebox">
      <div className="kak-codelbl">{label}</div>
      <textarea className="kak-code" readOnly value={value} onFocus={(e) => e.target.select()} />
      <button className="kak-copy" onClick={onCopy}>{copied ? "✓ Copiato" : "Copia"}</button>
    </div>
  );
}

function stateLabel(s) {
  return { idle: "Pronto", creating: "Genero invito…", joining: "Connetto…", waiting: "In attesa…", connected: "Connesso", error: "Errore", disconnected: "Disconnesso" }[s] || s;
}

/* ============================ DUELLO ==================================== */
function Duel({ net, onExit, onBack, onResult }) {
  const isMp = !!net;
  const [phase, setPhase] = useState("pick"); // pick|reveal|matchEnd|lost
  const [pScore, setPScore] = useState(0);
  const [oScore, setOScore] = useState(0);
  const [round, setRound] = useState(1);
  const [pPick, setPPick] = useState(null);
  const [oPick, setOPick] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [emote, setEmote] = useState("ready");
  const [time, setTime] = useState(TURN_MS);
  const [waiting, setWaiting] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const phaseRef = useRef("pick");
  const roundRef = useRef(1);
  const myMoveRef = useRef(null);
  const oppMoves = useRef({});
  const history = useRef([]);
  const pRef = useRef(0), oRef = useRef(0);
  const endRef = useRef(0);

  const setPhaseBoth = (p) => { phaseRef.current = p; setPhase(p); };

  /* avversario disconnesso (solo MP) */
  useEffect(() => {
    if (isMp && net.state === "disconnected" && phaseRef.current !== "matchEnd") {
      setPhaseBoth("lost");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMp && net.state]);

  /* aggancia ricezione messaggi di rete */
  useEffect(() => {
    if (!isMp) return;
    net.bind((m) => {
      if (!m || !m.move) return;
      oppMoves.current[m.round] = m.move;
      if (m.round === roundRef.current && phaseRef.current === "pick") maybeSettle();
    });
    return () => net.bind(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTurn = () => {
    myMoveRef.current = null;
    setPPick(null); setOPick(null); setOutcome(null); setEmote("ready"); setWaiting(false);
    setTime(TURN_MS); endRef.current = performance.now() + TURN_MS;
    setPhaseBoth("pick");
  };

  const startMatch = () => {
    pRef.current = 0; oRef.current = 0; setPScore(0); setOScore(0);
    roundRef.current = 1; setRound(1); history.current = []; oppMoves.current = {};
    setMatchResult(null);
    startTurn();
  };

  /* timer: scorre finché NON ho scelto */
  useEffect(() => {
    if (phase !== "pick") return;
    let raf = 0;
    const tick = () => {
      if (myMoveRef.current) return; // ho già scelto: niente fretta
      const left = Math.max(0, endRef.current - performance.now());
      setTime(left);
      if (left <= 0) { pick(rndMove()); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  const pick = (move) => {
    if (phaseRef.current !== "pick" || myMoveRef.current) return;
    myMoveRef.current = move;
    setPPick(move);
    history.current.push(move);
    if (isMp) {
      net.send({ move, round: roundRef.current });
      maybeSettle();
    } else {
      oppMoves.current[roundRef.current] = cpuPick(history.current);
      maybeSettle();
    }
  };

  const maybeSettle = () => {
    const my = myMoveRef.current;
    const opp = oppMoves.current[roundRef.current];
    if (my && opp) settle(my, opp);
    else if (my && isMp) setWaiting(true);
  };

  const settle = (my, opp) => {
    setWaiting(false);
    setPPick(my); setOPick(opp);
    let res = "draw";
    if (BEATS[my] === opp) res = "player";
    else if (BEATS[opp] === my) res = "opponent";
    setOutcome(res);
    setEmote(res === "player" ? "lose" : res === "opponent" ? "win" : "draw");
    setPhaseBoth("reveal");

    let np = pRef.current, no = oRef.current;
    if (res === "player") { np += 1; pRef.current = np; setPScore(np); }
    else if (res === "opponent") { no += 1; oRef.current = no; setOScore(no); }

    window.setTimeout(() => {
      if (np >= WIN_TARGET || no >= WIN_TARGET) {
        const win = np >= WIN_TARGET;
        setMatchResult(win ? "win" : "lose");
        setPhaseBoth("matchEnd");
        if (onResult) onResult({ game: "kakegurui", mode: isMp ? "mp" : "sp", win, pScore: np, oScore: no });
      } else {
        roundRef.current += 1; setRound(roundRef.current);
        startTurn();
      }
    }, 1700);
  };

  useEffect(() => { startMatch(); /* eslint-disable-next-line */ }, []);

  const escExit = () => { if (isMp) onBack && onBack(); else onExit && onExit(); };
  const revealed = phase === "reveal" || phase === "matchEnd";
  const timePct = Math.max(0, Math.min(1, time / TURN_MS));
  const timeLow = time <= 2500;

  return (
    <div className="ag-root" style={{ "--accent": ACCENT }}>
      <style>{KAK_CSS}</style>
      <div className="ag-top">
        <button type="button" className="ag-back" onClick={escExit}>← {isMp ? "Esci" : "Sala"}</button>
        <div className="ag-title">{isMp ? "DUELLO 1V1" : "TAVOLO DUELLO"}</div>
        <div className="ag-stats">
          <div className="ag-stat">Round <b>{round}</b></div>
          <div className="ag-stat">Tu <b>{pScore}</b> · {isMp ? "Avv" : "CPU"} <b>{oScore}</b></div>
          {isMp && <div className="ag-stat">📶 <b>{net.latency || 0}ms</b></div>}
        </div>
      </div>

      <div className="ag-stage kak-stage">
        <div className="kak-opp">
          <div className={"kak-avatar" + (outcome === "opponent" ? " kak-smug" : "")}>
            <span className="kak-emote" aria-hidden>{EMOTE[emote]}</span>
          </div>
          <div className="kak-pips">{pip(oScore)}</div>
        </div>

        <div className="kak-duel">
          <DuelCard move={oPick} reveal={revealed} who={isMp ? "AVV" : "CPU"} hidden={isMp && !revealed && !!oPick} />
          <div className={"kak-vs" + (outcome ? " kak-vs-" + outcome : "")}>
            {revealed ? (outcome === "player" ? "VINCI!" : outcome === "opponent" ? "PERDI" : "PARI") : "VS"}
          </div>
          <DuelCard move={pPick} reveal={revealed} who="TU" hidden={isMp && !revealed && !!pPick} />
        </div>

        <div className="kak-hand">
          <div className="kak-pips kak-pips-me">{pip(pScore)}</div>
          {phase === "pick" && !waiting && (
            <>
              <div className="kak-timer"><div className={"kak-timefill" + (timeLow ? " kak-low" : "")} style={{ width: `${timePct * 100}%` }} /></div>
              <div className="kak-cards">
                {ORDER.map((m, i) => (
                  <button key={m} type="button" className="kak-card" style={{ "--c": MOVES[m].accent }} onClick={() => pick(m)}>
                    <span className="kak-card-ico" aria-hidden>{MOVES[m].icon}</span>
                    <span className="kak-card-lbl">{MOVES[m].label}</span>
                    <span className="kak-card-key">{i + 1}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {phase === "pick" && waiting && (
            <div className="kak-waiting"><i className="kak-spin" /> In attesa della mossa avversaria…</div>
          )}
        </div>

        {phase === "matchEnd" && (
          <div className="ag-over">
            <h2>{matchResult === "win" ? "🏆 HAI VINTO!" : "💀 SCONFITTA"}</h2>
            <p>Risultato: <span className="ag-big">{pScore} – {oScore}</span></p>
            <div className="ag-btns">
              {!isMp && <button type="button" className="ag-btn" onClick={startMatch}>RIVINCITA</button>}
              <button type="button" className="ag-btn ag-ghost" onClick={escExit}>{isMp ? "TORNA" : "ESCI"}</button>
            </div>
          </div>
        )}

        {phase === "lost" && (
          <div className="ag-over">
            <h2>📴 AVVERSARIO USCITO</h2>
            <p>La connessione si è interrotta.</p>
            <div className="ag-btns"><button type="button" className="ag-btn ag-ghost" onClick={escExit}>TORNA</button></div>
          </div>
        )}
      </div>

      <div className="ag-hintbar">1 Sasso · 2 Carta · 3 Forbice · ESC esci</div>
      <KeyPicker active={phase === "pick" && !waiting} onPick={pick} />
    </div>
  );
}

/* tasti 1/2/3 per scegliere (montato solo quando serve) */
function KeyPicker({ active, onPick }) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === "1") onPick("rock");
      else if (e.key === "2") onPick("paper");
      else if (e.key === "3") onPick("scissors");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onPick]);
  return null;
}

function pip(n) {
  return [0, 1].map((i) => <i key={i} className={"kak-pip" + (i < n ? " on" : "")} />);
}

function DuelCard({ move, reveal, who, hidden }) {
  const m = move ? MOVES[move] : null;
  const show = reveal && m;
  return (
    <div className={"kak-duelcard" + (show ? " up" : "") + (hidden ? " locked" : "")} style={m && show ? { "--c": m.accent } : undefined}>
      <span className="kak-dc-who">{who}</span>
      <span className="kak-dc-face">
        {show ? <><span className="kak-dc-ico">{m.icon}</span><span className="kak-dc-lbl">{m.label}</span></>
          : <span className="kak-dc-back">{hidden ? "🔒" : "◆"}</span>}
      </span>
    </div>
  );
}

const KAK_CSS = `
.kak-stage{display:flex;flex-direction:column;justify-content:space-between;padding:14px 12px;gap:10px;
  background:radial-gradient(120% 100% at 50% 30%,#2a0f22,#0a0610);}
.kak-opp{display:flex;flex-direction:column;align-items:center;gap:6px;}
.kak-avatar{width:62px;height:62px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 40% 35%,#3a1430,#180812);border:2px solid rgba(255,42,109,.5);
  box-shadow:0 0 18px rgba(255,42,109,.3);transition:transform .2s;}
.kak-avatar.kak-smug{transform:scale(1.12);box-shadow:0 0 26px rgba(255,42,109,.6);}
.kak-emote{font-size:30px;}
.kak-duel{display:flex;align-items:center;justify-content:center;gap:14px;}
.kak-vs{font-size:13px;letter-spacing:1px;color:#fff;min-width:62px;text-align:center;text-shadow:0 0 12px #ff2a6d;}
.kak-vs-player{color:#39ff14;text-shadow:0 0 12px #39ff14;}
.kak-vs-opponent{color:#ff2a6d;}
.kak-vs-draw{color:#9fb0ff;text-shadow:none;}
.kak-duelcard{width:84px;height:112px;border-radius:12px;display:flex;flex-direction:column;align-items:center;
  justify-content:flex-end;gap:6px;padding-bottom:10px;position:relative;
  background:linear-gradient(160deg,#1a1a2e,#0c0c18);border:2px solid var(--c,rgba(255,255,255,.2));
  box-shadow:inset 0 0 18px rgba(0,0,0,.5);transition:transform .3s,box-shadow .3s;}
.kak-duelcard.up{box-shadow:inset 0 0 18px rgba(0,0,0,.4),0 0 18px var(--c);transform:translateY(-4px);}
.kak-duelcard.locked{border-color:rgba(57,255,20,.4);}
.kak-dc-who{position:absolute;top:7px;left:0;right:0;text-align:center;font-size:7px;color:#8a93b8;}
.kak-dc-face{display:flex;flex-direction:column;align-items:center;gap:5px;}
.kak-dc-ico{font-size:36px;}
.kak-dc-lbl{font-size:7px;color:#fff;}
.kak-dc-back{font-size:30px;color:rgba(255,255,255,.18);}
.kak-hand{display:flex;flex-direction:column;align-items:center;gap:8px;min-height:120px;justify-content:flex-end;}
.kak-timer{width:min(280px,80%);height:8px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden;}
.kak-timefill{height:100%;background:linear-gradient(90deg,#ff2a6d,#ff8a3d);transition:width .08s linear;}
.kak-timefill.kak-low{animation:kakP .5s infinite;}
@keyframes kakP{0%,100%{opacity:1}50%{opacity:.5}}
.kak-cards{display:flex;gap:10px;}
.kak-card{position:relative;appearance:none;cursor:pointer;width:78px;height:96px;border-radius:11px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  background:linear-gradient(160deg,#16162a,#0b0b16);border:2px solid var(--c);color:#fff;
  transition:transform .14s,box-shadow .16s;font-family:inherit;}
.kak-card:hover{transform:translateY(-6px);box-shadow:0 12px 24px rgba(0,0,0,.5),0 0 18px var(--c);}
.kak-card:active{transform:translateY(-2px) scale(.97);}
.kak-card-ico{font-size:30px;}
.kak-card-lbl{font-size:7px;letter-spacing:.5px;}
.kak-card-key{position:absolute;top:5px;right:6px;font-size:7px;color:var(--c);}
.kak-pips{display:flex;gap:7px;}
.kak-pip{width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);}
.kak-pip.on{background:var(--accent,#ff2a6d);box-shadow:0 0 10px var(--accent,#ff2a6d);border-color:transparent;}
.kak-pips-me{margin-bottom:2px;}
.kak-waiting{display:flex;align-items:center;gap:8px;font-size:8px;color:#cfd6f5;padding:14px;}
.kak-spin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.2);border-top-color:var(--accent,#ff2a6d);animation:kakSpin .8s linear infinite;}
@keyframes kakSpin{to{transform:rotate(360deg)}}

/* lobby */
.kak-lobby{justify-content:flex-start;gap:12px;padding:14px;overflow:auto;}
.kak-tabs{display:flex;gap:8px;width:100%;max-width:420px;margin:0 auto;}
.kak-tab{flex:1;appearance:none;cursor:pointer;font:inherit;font-size:8px;letter-spacing:.5px;color:#cfd6f5;
  padding:11px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);}
.kak-tab.on{color:#0d0d1a;background:var(--accent);border-color:transparent;box-shadow:0 0 14px rgba(255,42,109,.4);}
.kak-tab:disabled{opacity:.4;cursor:not-allowed;}
.kak-lobbybox{width:100%;max-width:420px;margin:0 auto;display:flex;flex-direction:column;gap:10px;align-items:stretch;}
.kak-step{font-size:8px;color:#9fb0ff;letter-spacing:.4px;margin:2px 0;font-family:'Segoe UI',system-ui,sans-serif;}
.kak-paste{width:100%;height:64px;resize:none;border-radius:9px;border:1px solid rgba(255,255,255,.16);
  background:rgba(0,0,0,.35);color:#eaf2ff;font-family:monospace;font-size:10px;padding:8px;}
.kak-codebox{position:relative;display:flex;flex-direction:column;gap:6px;}
.kak-codelbl{font-size:7px;color:#7c87ad;letter-spacing:.4px;}
.kak-code{width:100%;height:58px;resize:none;border-radius:9px;border:1px solid rgba(57,255,20,.35);
  background:rgba(0,20,8,.4);color:#bfffce;font-family:monospace;font-size:9px;padding:8px;}
.kak-copy{align-self:flex-end;appearance:none;cursor:pointer;font:inherit;font-size:8px;color:#0d0d1a;
  padding:7px 12px;border-radius:8px;border:0;background:#39ff14;box-shadow:0 0 12px rgba(57,255,20,.4);}
.kak-waiting{justify-content:center;}
.kak-err{font-size:8px;color:#ff9a9a;text-align:center;font-family:'Segoe UI',system-ui,sans-serif;max-width:420px;margin:0 auto;}
.kak-tip{font-size:7px;color:#7c87ad;text-align:center;line-height:1.8;font-family:'Segoe UI',system-ui,sans-serif;max-width:420px;margin:4px auto 0;}
`;
