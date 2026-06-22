# Sorgente di riferimento — Kakegurui (NON usare in build)

File originali del duello "dietro Asso", **migrati da `new_frontend_brx`** (ora rimossi da lì).
Servono **solo come riferimento** per la riscrittura in Canvas 2D pixel-art (vedi `docs/ARCADE_ROOM_PLAN.md` §10).

> I file hanno suffisso `.txt` apposta: il `tsconfig.json` di questo repo include `**/*.tsx`/`**/*.ts`, quindi con l'estensione originale verrebbero compilati e **romperebbero il build** (usano framer-motion + import `@/...` di `new_frontend_brx`, qui assenti). Toglierli mentalmente il `.txt` quando li leggi.

| File | Cosa estrarre |
|------|---------------|
| `KakeguruiArena.tsx.txt` | Regole RPS (Sasso/Carta/Forbice), `BEATS`, `WIN_TARGET=2`, `TURN_DURATION=7s`, fasi `betting→reveal→resolution`, tempi/feeling animazioni |
| `KakeguruiP2P.tsx.txt` | Flusso multiplayer, generazione mano random, integrazione con `useP2PRoom` |
| `P2PLobby.tsx.txt` | UI lobby: scambio segnali offer/answer (signaling manuale) |
| `useP2PRoom.ts.txt` | **Trasporto WebRTC** (`simple-peer`), da copiare quasi 1:1 in `../useP2PRoom.js` (togliere tipi TS) |

> Non importare questi file. Una volta completata la riscrittura (`KakeguruiGame.jsx`), questa cartella può essere eliminata.
