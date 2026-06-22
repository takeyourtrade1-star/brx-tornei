# Piano: Stanza Arcade Retro — IsoRoomGame

## Overview
Aggiungere una **seconda stanza isometrica** accessibile dalla Sala Tornei tramite una **porta interattiva** sulla parete destra. La stanza sarà un **sala giochi arcade retro** con 3 minigiochi giocabili, decorazioni a tema 8-bit, e premio esclusivo: una carta speciale "Token Arcade" per il deck builder.

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
| Cabinato 2 — "Mana Rush" | cx=5, cy=2 | 2x1 blocca | minigioco |
| Cabinato 3 — "Sigil Match" | cx=8, cy=2 | 2x1 blocca | minigioco |
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

### 3.1 🎮 Stack Attack (Tower Stacking)
**Genere:** Arcade / Timing  
**Tema:** Costruisci una torre di carte TCG che cresce verso l'alto.

**Meccanica:**
- Blocchi (carte) cadono da destra verso sinistra oscillando
- Premi **SPAZIO** o click per piazzare la carta
- Se la carta non è allineata, la parte in eccedenza cade e la base si restringe
- 3 vite, punteggio basato su altezza + perfezione allineamento
- Ogni 10 carte perfette: combo ×2

**Visual:**
- Carte stile retro Game Boy (verde su nero)
- Bordi che brillano con il colore della rarità (comune/rara/epica)
- Sfondo: griglia scanline con stelle scorrevoli

**Premio:**
- 500+ punti → 1 gettone arcade
- Record personale → sblocca carta "Torre di Carte" (comune, estetica retro)

---

### 3.2 🎮 Mana Rush (Rhythm / Reflex)
**Genere:** Rhythm / Pattern Matching  
**Tema:** Canalizza mana scorrendo lungo 4 sentieri elementali.

**Meccanica:**
- 4 corsie verticali (🔥 Fuoco, 💧 Acqua, 🌿 Terra, ⚡ Aria)
- Simboli elementali scorrono dall'alto verso il basso
- Premi **Q/W/E/R** o click sulle corsie quando il simbolo tocca la zona di "cast"
- Timing perfetto = mana critico (colore oro)
- Catena di 10 perfetti → "Overload" (tutti i simboli diventano arcobaleno, punteggio ×3 per 5s)

**Visual:**
- Barra mana che riempie lo schermo del cabinato
- Particelle elementali che esplodono ai lati
- Scanline orizzontali + vignettatura ai bordi

**Premio:**
- 20+ combo perfetta → 1 gettone arcade
- 50+ combo perfetta → sblocca carta "Mana Overflow" (rara, effetto foil arcobaleno)

---

### 3.3 🎮 Sigil Match (Memory / Puzzle)
**Genere:** Memory / Puzzle Speed  
**Tema:** Abbina i sigilli delle carte prima che il timer scada.

**Meccanica:**
- Griglia 4×4 di carte coperte (8 coppie di sigilli)
- Click per girare 2 carte
- Abbina tutte le coppie prima che il "Sabbie del Tempo" finiscano (60s)
- Power-up casuali: "Rivelazione" (mostra 1 coppia per 2s), "Congela" (+10s)
- Difficoltà crescente: livello 2 → 6×4, livello 3 → 6×6 con sigilli simili

**Visual:**
- Dorso carte con pattern geometrico neon
- Sigilli stilizzati (fiamma, stella, scudo, sole, ecc.)
- Timer a clessidra visuale nella parte superiore
- Effetto "shake" quando sbagli

**Premio:**
- Completamento livello 1 → 1 gettone arcade
- Livello 3 senza errori → sblocca carta "Memoria Eidetica" (epica, dorso speciale)

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
    ArcadeRoom.jsx          # componente stanza (simile a IsoRoomGame)
    ArcadeBackground.jsx    # builder sfondo arcade
    ArcadeSprites.jsx       # sprite cabinati, divano, neon
    StackAttackGame.jsx     # minigioco 1
    ManaRushGame.jsx        # minigioco 2
    SigilMatchGame.jsx      # minigioco 3
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
   - [ ] **Mana Rush:** 4 corsie, timing, combo system
   - [ ] **Sigil Match:** griglia memory, timer, power-up

4. **Sistema premi**
   - [ ] Implementare gettoni e high scores
   - [ ] Creare UI distributore gettoni
   - [ ] Aggiungere carte premio al deck builder

5. **Polish**
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

*Piano v1.0 — Generato per il progetto brx-tornei / IsoRoomGame*
