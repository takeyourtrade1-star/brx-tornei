"use client";

import { useState, useCallback, useEffect, useRef } from "react";

/* ============================================================================
   useP2PRoom — connessione 1v1 peer-to-peer via WebRTC nativo (RTCPeerConnection
   + DataChannel), signaling MANUALE: l'host genera un "codice invito" (offer),
   l'ospite lo incolla e rimanda un "codice risposta" (answer). Nessun server,
   nessuna dipendenza, nessun polyfill. Stessa API del piano (§10).

   Stati: idle → creating/joining → waiting → connected (→ disconnected/error)
   Messaggi applicativi: { type:'game_state', ...payload, timestamp } via onMsg.
   ========================================================================== */

const ICE = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

/* base64url <-> stringa (per incollare il SDP comodamente) */
function toB64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromB64Url(v) {
  const n = v.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (n.length % 4)) % 4;
  const bin = atob(n + "=".repeat(pad));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function encodeDesc(desc) {
  return toB64Url(JSON.stringify({ type: desc.type, sdp: desc.sdp }));
}
function decodeDesc(code) {
  const t = code.trim();
  if (/^\d{6}$/.test(t)) throw new Error("Hai incollato il codice stanza (6 cifre): serve il codice completo di connessione.");
  let raw = t;
  if (!(t.startsWith("{") && t.endsWith("}"))) {
    try { raw = fromB64Url(t); } catch { throw new Error("Codice non valido o corrotto. Copia di nuovo tutto il testo."); }
  }
  let obj;
  try { obj = JSON.parse(raw); } catch { throw new Error("Codice non valido o corrotto."); }
  if (!obj || (obj.type !== "offer" && obj.type !== "answer") || typeof obj.sdp !== "string") {
    throw new Error("Codice di connessione non valido.");
  }
  return obj;
}

/* attende il termine della raccolta ICE (equivale a trickle:false) */
function waitIce(pc) {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    let done = false;
    const finish = () => { if (done) return; done = true; pc.removeEventListener("icegatheringstatechange", check); resolve(); };
    const check = () => { if (pc.iceGatheringState === "complete") finish(); };
    pc.addEventListener("icegatheringstatechange", check);
    // fallback: non aspettare all'infinito se un candidato resta appeso
    setTimeout(finish, 2500);
  });
}

export function useP2PRoom(onMsg) {
  const [room, setRoom] = useState({
    state: "idle", localSignal: null, remoteSignal: null,
    isHost: false, roomCode: null, error: null, latency: 0,
  });
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const pingRef = useRef(null);
  const msgRef = useRef(onMsg);
  msgRef.current = onMsg;

  const patch = useCallback((p) => setRoom((prev) => ({ ...prev, ...p })), []);

  const cleanup = useCallback(() => {
    if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
    if (dcRef.current) { try { dcRef.current.close(); } catch (e) { /* noop */ } dcRef.current = null; }
    if (pcRef.current) { try { pcRef.current.close(); } catch (e) { /* noop */ } pcRef.current = null; }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const wireChannel = useCallback((dc) => {
    dcRef.current = dc;
    dc.onopen = () => {
      patch({ state: "connected", error: null });
      pingRef.current = setInterval(() => {
        try { dc.send(JSON.stringify({ type: "ping", timestamp: Date.now() })); } catch (e) { /* noop */ }
      }, 1500);
    };
    dc.onclose = () => { patch({ state: "disconnected" }); if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; } };
    dc.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.type === "ping") { try { dc.send(JSON.stringify({ type: "pong", timestamp: m.timestamp })); } catch (e) { /* noop */ } }
      else if (m.type === "pong") { patch({ latency: Date.now() - m.timestamp }); }
      else if (m.type === "game_state" && msgRef.current) { msgRef.current(m); }
    };
  }, [patch]);

  const wirePc = useCallback((pc) => {
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "failed" || s === "disconnected" || s === "closed") patch({ state: "disconnected" });
    };
  }, [patch]);

  const createRoom = useCallback(async () => {
    try {
      cleanup();
      patch({ state: "creating", isHost: true, error: null, localSignal: null, remoteSignal: null });
      const pc = new RTCPeerConnection({ iceServers: ICE });
      pcRef.current = pc; wirePc(pc);
      wireChannel(pc.createDataChannel("game", { ordered: true }));
      await pc.setLocalDescription(await pc.createOffer());
      await waitIce(pc);
      patch({ state: "waiting", localSignal: encodeDesc(pc.localDescription), roomCode: String(Math.floor(100000 + Math.random() * 900000)) });
    } catch (err) {
      patch({ state: "error", error: err.message || "Errore creazione stanza" });
    }
  }, [cleanup, patch, wirePc, wireChannel]);

  const joinRoom = useCallback(async (code) => {
    try {
      cleanup();
      patch({ state: "joining", isHost: false, error: null, localSignal: null });
      const offer = decodeDesc(code);
      const pc = new RTCPeerConnection({ iceServers: ICE });
      pcRef.current = pc; wirePc(pc);
      pc.ondatachannel = (ev) => wireChannel(ev.channel);
      await pc.setRemoteDescription(offer);
      await pc.setLocalDescription(await pc.createAnswer());
      await waitIce(pc);
      patch({ state: "waiting", localSignal: encodeDesc(pc.localDescription) });
    } catch (err) {
      patch({ state: "error", error: err.message || "Codice non valido" });
    }
  }, [cleanup, patch, wirePc, wireChannel]);

  const submitAnswer = useCallback(async (code) => {
    try {
      if (!pcRef.current) throw new Error("Crea prima una stanza.");
      const answer = decodeDesc(code);
      await pcRef.current.setRemoteDescription(answer);
      patch({ remoteSignal: code.trim() });
    } catch (err) {
      patch({ state: "error", error: err.message || "Risposta non valida" });
    }
  }, [patch]);

  const sendGameState = useCallback((payload) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") {
      try { dc.send(JSON.stringify({ ...payload, type: "game_state", timestamp: Date.now() })); } catch (e) { /* noop */ }
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    setRoom({ state: "idle", localSignal: null, remoteSignal: null, isHost: false, roomCode: null, error: null, latency: 0 });
  }, [cleanup]);

  return [room, { createRoom, joinRoom, submitAnswer, sendGameState, disconnect }];
}
