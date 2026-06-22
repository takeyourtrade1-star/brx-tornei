# Piano: Stanza Arcade Retro — IsoRoomGame

## Overview
Aggiungere una **seconda stanza isometrica** accessibile dalla Sala Tornei tramite una **porta interattiva**. La stanza è una **sala giochi arcade retro** con **4 stazioni giocabili**:

1. **TCG Jump** — platformer stile Mario, 3 livelli di test (cabinato)
2. **Stack Attack** — torre di carte, timing/precisione (cabinato)
3. **Card Memory** — memory con le carte, 3 livelli (cabinato)
4. **Tavolo Duello (Kakegurui)** — duello carte Sasso/Carta/Forbice, single-player + multiplayer P2P, **migrato da `new_frontend_brx`** (tavolo dedicato)

Più decorazioni a tema 8-bit e premio esclusivo: carte cosmetiche "Arcade" per il deck builder.

> **Vincolo architetturale chiave:** tutte e 4 le stazioni sono in **Canvas 2D puro** (coerente con `IsoRoomGame`). Il duello Kakegurui — oggi React + framer-motion in `new_frontend_brx` — viene **riscritto in canvas pixel-art**, riusando però il livello di rete (`useP2PRoom`) così com'è. Vedi §10.

---

## 1. Architettura & Flusso

```
[Sala Tornei] ──porta──> [Sala Arcade]
     ↑                        │
     └──────── torna ─────────┘
```

### 1.1 Stato aggiuntivo (IsoRoomGame state)
```js
room: "tournament" | "arcade"   // stanza corrente
transition: null | { dir, t }   // animazione cambio stanza
arcade: {
  machines: [],      // stato dei 3 cabinati
  tickets: 0,        // gettoni arcade guadagnati/spesi
  highScores: {},    // record locali per gioco
  unlockedCards: [], // carte sbloccate come premi
}
```

### 1.2 Cambio stanza
- **Porta** sulla parete destra della Sala Tornei (cx=11, cy=4-5)
- Click / avvicinamento → animazione di **dissolvenza** o **slide laterale** (0.8s)
- Avatar si sposta nella nuova stanza dalla porta opposta
- La camera si riposiziona sul centro della stanza arcade
- Tasto **ESC** o click porta → ritorno alla Sala Tornei

---

## 2. Layout Stanza Arcade

### 2.1 Dimensioni
- Stessa griglia: `COLS=12, ROWS=10`
- Palette: colori neon + scuri (atmosfera arcade notturna)

### 2.2 Elementi decorativi (footprint vuoto o bloccante)

| Oggetto | Posizione | Tipo | Interazione |
|---------|-----------|------|-------------|
| Porta (verso Tornei) | cx=0, cy=4-5 | passaggio | ritorno |
| Cabinato 1 — "Stack Attack" | cx=2, cy=2 | 2x1 blocca | minigioco |
| Cabinato 2 — "TCG Jump" | cx=5, cy=2 | 2x1 blocca | minigioco |
| Cabinato 3 — "Card Memory" | cx=8, cy=2 | 2x1 blocca | minigioco |
| Tavolo Duello — "Kakegurui" | cx=5, cy=6 | 2x2 blocca | duello carte (SP + P2P) |
| Divanetto rosso | cx=3, cy=7 | 2x1 blocca | easter egg |
| Distributore gettoni | cx=10, cy=8 | 1x1 | UI ticket |
| Neon "ARCADE" | parete fondo | decorazione | luce pulsante |
| Poster giochi | pareti | decorazione | easter egg |
| Cestino popcorn | cx=1, cy=8 | 1x1 | easter egg |

### 2.3 Palette aggiuntiva (P_ARCADE)
```js
neonPink: "#ff2a6d", neonBlue: "#05d9e8", neonGreen: "#39ff14",
neonPurple: "#b026ff", neonYellow: "#fff01f",
cabinet: "#1a1a2e", cabinetL: "#252542", screenGlow: "#00ff9d",
arcadeFloor: "#0d0d1a", arcadeFloorB: "#12122a",
```

---

## 3. I 3 Minigiochi

Tutti i minigiochi usano **Canvas 2D puro** (coerente con il resto del progetto), con grafica pixel-art procedurale, niente asset esterni.

### 3.1 🎮 Card Memory (Memory Puzzle)
**Genere:** Memory / Puzzle  
**Tema:** Abbina le coppie di carte TCG prima che scada il tempo.

**Meccanica:**
- Livello 1: griglia 4×4 (8 coppie, 60s)
- Livello 2: griglia 6×4 (12 coppie, 90s)
- Livello 3: griglia 6×6 (18 coppie, 120s) — sigilli simili per aumentare la difficoltà
- Click per girare 2 carte; se combaciano restano scoperte
- 3 errori consecutivi → "Suggerimento" lampeggia su una coppia per 1s
- Power-up casuali: "Rivelazione" (scopre 1 coppia per 2s), "Tempo" (+15s)

**Visual:**
- Dorso carte: pattern geometrico neon pulsante
- Fronte: sigilli stilizzati (fiamma, stella, scudo, sole, luna, ecc.)
- Timer a barra visuale in cima allo schermo
- Effetto "shake" e flash rosso quando sbagli
- Confetti dorati al completamento

**Premio:**
- Livello 1 completato → 1 gettone arcade
- Livello 3 completato → 3 gettoni + sblocca carta "Memoria Eidetica" (epica)

---

### 3.2 🎮 TCG Jump (Platformer stile Mario)
**Genere:** Platformer 2D  
**Tema:** L'avatar pixelato salta tra piattaforme e raccoglie mana coins.

**Meccanica:**
- **3 livelli di test**, progressione semplice:
  - **Livello 1 — Prati:** pavimento piatto, 3 salti su blocchi, raccogli 10 mana coins, nessun nemico
  - **Livello 2 — Caverna:** piattaforme a diverse altezze, 1 nemico "Slime" che cammina avanti-indietro (1 hit = restart livello), raccogli 15 mana coins
  - **Livello 3 — Castello:** mix di piattaforme + 2 Slime + boss "Drago Mini" che spara palle di fuoco lente (pattern fisso), raccogli 20 mana coins per vincere
- Controlli: **← →** per muoversi, **SPAZIO** per saltare (tenere premuto per salto più alto)
- Fisica: gravità costante, velocità orizzontale fissa, collisione AABB semplice
- Checkpoint a metà livello (bandierina)
- 3 vite totali, perdi 1 vita cadendo nel vuoto o toccando un nemico

**Visual:**
- Personaggio: sprite 24×24 dell'avatar in stile pixel (animazione idle, run, jump)
- Piattaforme: blocchi marrone-terra con bordo erba verde (stile Mario)
- Nemici: Slime verde 16×16 (animazione 2 frame), Drago 32×24 (2 frame ali)
- Sfondo: parallasse a 2 livelli (nuvole/montagne lente, alberi più veloci)
- Particelle: polvere al salto, scintille al raccogliere coin

**Premio:**
- Livello 1 completato → 1 gettone arcade
- Livello 3 completato → 5 gettoni + sblocca carta "Saltatore Leggendario" (rara)
- Speedrun < 60s sul livello 3 → sblocca skin avatar "Cappello Rosso"

---

### 3.3 🎮 Stack Attack (Tower Stacking)
**Genere:** Arcade / Timing  
**Tema:** Costruisci una torre di carte TCG che cresce verso l'alto.

**Meccanica:**
- Blocchi (carte) cadono da destra verso sinistra oscillando su una griglia
- Premi **SPAZIO** o click/tap per piazzare la carta
- Se la carta non è allineata, la parte in eccedenza cade e la base si restringe
- 3 vite totali — perdi 1 vita quando una carta cade completamente fuori
- Punteggio basato su altezza torre + perfezione allineamento
- Ogni 10 carte perfette consecutive → combo ×2 per la prossima carta
- Livello 2: carta si muove più velocemente, oscillazione più ampia
- Livello 3: doppia oscillazione (avanti-indietro + su-giù leggero)

**Visual:**
- Carte stile retro Game Boy (verde su nero per livello 1, blu per 2, viola per 3)
- Bordi che brillano con il colore della rarità (comune/rara/epica) ogni 5 carte
- Sfondo: griglia scanline con stelle scorrevoli
- Carte cadute che rimangono visibili in basso con effetto "pile"
- Effetto "shake" della torre quando piazzi perfettamente

**Premio:**
- 20+ carte impilate → 1 gettone arcade
- 50+ carte impilate → 3 gettoni
- Record personale → sblocca carta "Torre di Carte" (comune, estetica retro Game Boy)

---

## 4. Sistema Gettoni & Premi

### 4.1 Gettoni Arcade (Tickets)
- Valuta interna alla stanza arcade, NON collegata ai crediti Ebartex
- Si guadagnano giocando (soglie di punteggio)
- Si spendono al **distributore gettoni** per:
  - 5 ticket → 1 busta "Arcade Pack" (contiene 3 carte cosmetiche retro)
  - 20 ticket → sblocca skin avatar "Gamer Retro" (felpa pixelata + cuffie)
  - 50 ticket → sblocca carta leggendaria "High Score King"

### 4.2 Carte Premio
Le carte sbloccate appaiono nel **deck builder** della Sala Tornei con:
- Dorso personalizzato (scanline, neon, pixel art)
- Rarita speciale "Arcade" (colore arcobaleno nel bordo)
- Testo flavor che cita il minigioco

---

## 5. Implementazione Tecnica

### 5.1 File da creare/modificare

**Nuovi file:**
```
minigioco-test/
  arcade-room/
    ArcadeBackground.jsx    # builder sfondo arcade (sala iso)
    ArcadeSprites.jsx       # sprite cabinati, tavolo duello, divano, neon
    StackAttackGame.jsx     # cabinato 1 — torre di carte
    TcgJumpGame.jsx         # cabinato 2 — platformer Mario, 3 livelli
    CardMemoryGame.jsx      # cabinato 3 — memory, 3 livelli
    KakeguruiGame.jsx       # tavolo duello — RPS canvas (riscrittura, vedi §10)
    useP2PRoom.js           # COPIATO da new_frontend_brx (rete, invariato)
    ArcadeModal.jsx         # wrapper modale per i giochi
    TicketMachine.jsx       # UI distributore gettoni
    arcade-config.js        # costanti, palette, configurazioni
```

**File da modificare:**
```
minigioco-test/
  IsoRoomGame.jsx          # aggiungere porta + stato room/transition
  quality-config.js        # aggiungere preset qualità per arcade
```

### 5.2 Pattern da seguire

**Door interaction** (nuovo in `INTERACTIVES`):
```js
door: {
  name: "Porta Arcade",
  icon: "🕹️",
  desc: "Sala Giochi Retro",
  approach: [[10, 4], [10, 5]],
  footTiles: [],
  focus: { x: 600, y: 250, z: 1.4 },
  faceTile: [11, 4],
  action: "changeRoom",
  target: "arcade"
}
```

**Room transition** (in `IsoRoomGame` loop):
```js
if (st.transition) {
  st.transition.t += dt;
  const p = easeInOutCubic(clamp(st.transition.t / 0.8, 0, 1));
  // fade out/in o slide
  if (st.transition.t >= 0.8) {
    st.room = st.transition.target;
    st.transition = null;
    // reset posizione avatar nella nuova stanza
  }
}
```

**Cabinato interaction** (pattern simile a `pc`/`decks`):
```js
arcade1: {
  name: "Stack Attack",
  icon: "🎮",
  desc: "Costruisci la torre",
  approach: [[1, 2], [2, 3], [3, 2]],
  footTiles: [[2, 2], [2, 3]],
  focus: { x: 150, y: 220, z: 1.6 },
  faceTile: [2, 3],
  game: "stackAttack"
}
```

### 5.3 Rendering cabinati

Sprite isometrico `mkSprite(2, 1, 80, ...)`:
- Base: cuboide 2×1×22px, colore `cabinet`
- Schermo: riquadro inclinato, fill `screenGlow` con scanline
- Marquee top: sprite con nome gioco in pixel font
- Joystick: piccolo cerchio nero + stik marrone
- Bottoni: 2-3 cerchi colorati (neon)

---

## 6. UI / HUD

### 6.1 Nella Sala Arcade
- **Top-left:** tasto "← Torna ai Tornei" (click o ESC)
- **Top-right:** contatore gettoni 🎫 (animato quando guadagni)
- **Bottom-left:** legenda tasti (1/2/3 per cabinati, ESC per uscire)

### 6.2 Nei minigiochi
- **Overlay** a schermo intero dentro la modale (stile `DecksModal`)
- **Pausa:** tasto P → menu con "Riprendi / Ricomincia / Esci"
- **Game Over:** schermata con punteggio, high score, ticket guadagnati, bottone "Riprova"

### 6.3 Schermata sblocco premio
Quando sblocchi una carta, appare una **animazione stile "level up"**:
- Canvas con particelle dorati
- Carta che ruota in 3D (prospettiva CSS)
- Testo "Nuova carta sbloccata!"
- Bottone "Aggiungi al mazzo" (chiude e apre deck builder)

---

## 7. Polish & Easter Egg

### 7.1 Atmosfera
- Luci al neon che pulsano (sin wave su alpha)
- Riflessi sul pavimento lucido (gradienti verticali sotto i cabinati)
- Musica di sottofondo chiptune (opzionale, toggle con giradischi)
- Schermi dei cabinati che mostrano **demo** quando non giocati (attract mode)

### 7.2 Easter Egg
- Click sul **divanetto** → battuta: "Qui ci ho fatto il mio primo High Score... e la mia prima pennica."
- Click sul **popcorn** → suono "crunch" + particelle gialle
- Click sul neon "ARCADE" → lampeggia più veloce per 3s
- Se hai tutte e 3 le carte premio → il distributore mostra un messaggio segreto

### 7.3 Integrazione Tutorial
Aggiungere uno step nel tutorial di Asso:
```js
{ kind: "demo", id: "door", text: "Bonus: la porta 🕹️ conduce alla sala arcade retro, con minigiochi e premi esclusivi!" }
```

---

## 8. Task di Implementazione (ordine consigliato)

1. **Setup base**
   - [ ] Creare `arcade-config.js` con palette, costanti, layout
   - [ ] Creare `ArcadeBackground.jsx` (sfondo stanza con neon)
   - [ ] Creare `ArcadeSprites.jsx` (cabinati, divano, distributore)

2. **Transizione stanze**
   - [ ] Aggiungere stato `room` e `transition` in `IsoRoomGame`
   - [ ] Aggiungere porta interattiva con animazione fade
   - [ ] Implementare ritorno alla Sala Tornei

3. **Minigiochi (uno per volta)**
   - [ ] **Stack Attack:** logica caduta carte, collisione, punteggio
   - [ ] **TCG Jump:** fisica platformer, 3 livelli, nemici, collisione AABB
   - [ ] **Card Memory:** griglia memory, timer, power-up, 3 livelli

4. **Tavolo Duello Kakegurui (migrazione, vedi §10)**
   - [ ] Copiare `useP2PRoom.ts` → `useP2PRoom.js` + aggiungere dep `simple-peer`
   - [ ] Riscrivere il duello RPS in canvas (`KakeguruiGame.jsx`)
   - [ ] Lobby P2P (signaling manuale copia/incolla) in canvas/overlay
   - [ ] Wire come interactive `kakegurui` (tavolo 2x2)

5. **Sistema premi**
   - [ ] Implementare gettoni e high scores
   - [ ] Creare UI distributore gettoni
   - [ ] Aggiungere carte premio al deck builder

6. **Polish**
   - [ ] Attract mode sugli schermi
   - [ ] Easter egg e battute
   - [ ] Integrazione tutorial
   - [ ] Test responsiveness e performance

---

## 9. Requisiti di Qualità

- **Performance:** 60fps costanti (usare `requestAnimationFrame`, niente setState in loop)
- **Responsive:** canvas si adatta al container (stesso pattern di IsoRoomGame)
- **Accessibility:** tastiera completamente utilizzabile nei minigiochi
- **No asset esterni:** tutta la grafica procedurale in canvas (rispetta il vincolo del progetto)
- **Coerenza:** stile pixel-art, palette armonica, stesse convenzioni di naming

---

## 10. Migrazione "Tavolo Duello" (Kakegurui da new_frontend_brx)

### 10.1 Cos'è oggi
Il gioco "dietro Asso" è un **duello a carte Sasso/Carta/Forbice** (best-of-3, timer 7s/turno, emote), montato nella mascotte `CardMascotte.tsx`. È un duello stile *Kakegurui*: la logica è piccola, le ~2600 righe sono quasi tutte **polish visivo** (framer-motion, shimmer, tailwind).

**File sorgente (`new_frontend_brx`):**
| File | Righe | Ruolo |
|------|-------|-------|
| `components/feature/game/KakeguruiArena.tsx` | 1618 | Duello single-player vs CPU + sotto-componenti carta (`HandMoveCard`, `DuelCard`, `ArenaCardBack`) |
| `components/feature/game/KakeguruiP2P.tsx` | 1000 | Versione multiplayer (riusa i componenti carta di Arena) |
| `components/game/P2PLobby.tsx` | — | UI lobby: scambio segnali offer/answer |
| `hooks/useP2PRoom.ts` | — | **Trasporto WebRTC** (`simple-peer`), signaling manuale base64url |

**Regole gioco** (da estrarre da Arena):
- `Move = 'rock' | 'paper' | 'scissors'` (Sasso/Carta/Forbice), `BEATS` standard RPS
- `WIN_TARGET = 2` (best of 3), `TURN_DURATION = 7s`
- Fasi: `betting → reveal → resolution`

### 10.2 Strategia: riscrivi il render, riusa la rete
Decisione presa: **riscrittura in Canvas 2D pixel-art** per coerenza con la stanza, **ma** la rete P2P si riusa intatta. Il livello di rete è già **logica-agnostico**: `useP2PRoom` scambia solo messaggi `GameState` (`{player1Score, player2Score, currentRound, player1Card, player2Card, phase}`), non sa nulla del render. Quindi:

```
┌─────────────────────────────────────────────┐
│ KakeguruiGame.jsx  (NUOVO, canvas pixel-art) │
│  ├─ core RPS: stato, timer, risoluzione      │  ← riscritto (logica piccola)
│  ├─ render carte/duello/emote in canvas      │  ← riscritto da zero
│  └─ modalità: SP (vs CPU) | P2P              │
└──────────────┬──────────────────────────────┘
               │ usa
┌──────────────▼──────────────────────────────┐
│ useP2PRoom.js  (COPIATO, invariato)          │  ← riuso 1:1
│  simple-peer + signaling manuale base64url   │
└──────────────────────────────────────────────┘
```

**Cosa si riscrive:** tutto il visivo (carte, animazioni flip/reveal, emote, timer-barra) in canvas, usando la palette `P_ARCADE` e lo stesso stile pixel degli altri cabinati.
**Cosa si copia 1:1:** `useP2PRoom.ts` → `useP2PRoom.js` (togliere i tipi TS). È serverless: l'host genera un codice offer, l'ospite incolla e rimanda un codice answer. Nessuna infra di signaling da deployare.
**Cosa NON si porta:** framer-motion, tailwind classes, `KakeguruiArena.tsx`/`KakeguruiP2P.tsx` (servono solo come riferimento per le regole e i tempi).

### 10.3 Dipendenze nuove in brx-tornei
```jsonc
// package.json
"simple-peer": "^9.11.1"        // dep (WebRTC P2P)
"@types/simple-peer": "^9.11.9" // devDep
```
> `framer-motion` **non** serve più (render in canvas). `lucide-react` già presente se servono icone HUD.

> ⚠️ `simple-peer` su Next.js può richiedere polyfill/`ssr:false`. Il componente arcade è già client-only (canvas), quindi caricare `useP2PRoom` solo lato client (dynamic import o guard `typeof window`) evita problemi SSR.

### 10.4 Wiring nella stanza
Nuovo interactive nella sala arcade (pattern identico a `decks`):
```js
kakegurui: {
  name: "Tavolo Duello", icon: "🎴", desc: "Sfida Sasso/Carta/Forbice",
  approach: [[4, 6], [7, 6], [5, 8], [6, 8]],
  footTiles: [[5, 6], [6, 6], [5, 7], [6, 7]],
  focus: { x: 380, y: 380, z: 1.5 }, faceTile: [5, 7],
  game: "kakegurui"
}
```
Modale dedicata (come `DecksModal`): menu iniziale **Single Player / Multiplayer**, poi monta `KakeguruiGame` con la modalità scelta.

### 10.5 Rischi & note
- **Tempi/feeling:** il bello del gioco è il ritmo (reveal drammatico, emote). Replicare i tempi (`TURN_DURATION_MS`, delay reveal) leggendoli dal sorgente, non a occhio.
- **P2P testing:** richiede 2 browser/dispositivi + scambio manuale del codice. Testare presto per validare `simple-peer` nel nuovo repo.
- **Carte come asset:** Arena usa carte stilizzate via CSS/gradient; in canvas vanno ridisegnate procedurali (coerenti con `deck-card`).
- **Repo separati:** `new_frontend_brx` e `brx-tornei` sono due repo distinti → "spostare" = copiare i file utili in brx-tornei. Valutare se rimuovere il gioco dalla mascotte in `new_frontend_brx` (richiesta "lo spostiamo") o lasciarlo in entrambi.

---

*Piano v1.1 — brx-tornei / IsoRoomGame · arcade room + migrazione Kakegurui*
