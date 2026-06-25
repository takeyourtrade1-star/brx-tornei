# 09 — Arcade Room Technical Specification

> **Document type**: Full Technical Specification — Arcade Room Subsystem  
> **Version**: 1.0  
> **Date**: June 2026  
> **Frontend path**: `frontend/minigioco-test/arcade-room/`  
> **Backend docs**: `02_TECHNICAL_SPEC.md` Section 10, `04_DEVELOPMENT_ROADMAP.md` Phase 10  
> **Status**: Frontend implemented; backend Phase 10 pending

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Mini-Game 1: Stack Attack](#3-mini-game-1-stack-attack)
4. [Mini-Game 2: TCG Jump](#4-mini-game-2-tcg-jump)
5. [Mini-Game 3: Card Memory](#5-mini-game-3-card-memory)
6. [Mini-Game 4: Tavolo Duello (Kakegurui)](#6-mini-game-4-tavolo-duello-kakegurui)
7. [P2P Room System (useP2PRoom.js)](#7-p2p-room-system-usep2proomjs)
8. [Isometric Room and Navigation](#8-isometric-room-and-navigation)
9. [Backend API Specification](#9-backend-api-specification)
10. [Database Schema](#10-database-schema)
11. [Redis Data Structures](#11-redis-data-structures)
12. [Score and Ticket System](#12-score-and-ticket-system)
13. [WebRTC Signaling: Arcade vs Tournament](#13-webrtc-signaling-arcade-vs-tournament)
14. [Security Considerations](#14-security-considerations)
15. [Integration Points](#15-integration-points)

---

## 1. System Overview

### 1.1 Purpose

The Arcade Room is a secondary entertainment space within the Ebartex Tournaments platform. It provides four mini-games for players to enjoy between tournament matches. The room uses an **isometric 2D pixel-art aesthetic** rendered in pure Canvas 2D.

### 1.2 Key Design Principles

1. **Zero server-side game logic**: All game logic runs entirely in the browser. The backend only records scores and manages leaderboards.
2. **No backend signaling for P2P**: The Kakegurui multiplayer (1v1 WebRTC) uses **fully manual copy-paste signaling** — the server never sees SDP offers or answers.
3. **Serverless by design**: Games 1–3 (Stack Attack, TCG Jump, Card Memory) have no real-time server involvement whatsoever.
4. **Score integrity via server validation**: Score submission is validated server-side (max score bounds) to prevent trivial cheating.
5. **Reward currency**: Tickets earned in games are tracked in a server-side wallet for future reward integration.

### 1.3 File Structure

```
frontend/minigioco-test/arcade-room/
├── arcade-config.js              # Room theme, furniture layout, interactive stations
├── arcade-registry.js            # Maps interactive IDs to game components
├── arcade-cabinets.jsx           # Cabinet/station visual components
├── ArcadeBackground.jsx          # Isometric room background renderer
├── ArcadeGameModal.jsx           # Full-screen game overlay (common shell for all games)
├── ArcadeSprites.jsx             # Shared sprite components for isometric view
├── game-kit.js                   # Shared game utilities (canvas loop, math helpers, CSS)
├── StackAttackGame.jsx           # Mini-game: stack the blocks
├── TcgJumpGame.jsx               # Mini-game: platformer
├── CardMemoryGame.jsx            # Mini-game: memory matching
├── KakeguruiGame.jsx             # Mini-game: Rock-Paper-Scissors P2P
├── useP2PRoom.js                 # WebRTC hook for P2P arcade connections
└── _kakegurui-source/            # Original TypeScript reference files (not compiled)
    ├── README.md
    ├── KakeguruiArena.tsx.txt
    ├── KakeguruiP2P.tsx.txt
    ├── P2PLobby.tsx.txt
    └── useP2PRoom.ts.txt
```

### 1.4 Game Registry

```javascript
// arcade-registry.js
export const REGISTRY = {
  arcade1:    StackAttackGame,   // station: Casse dello Slot
  arcade2:    TcgJumpGame,       // station: TCG Jump Machine  
  arcade3:    CardMemoryGame,    // station: Memory Panel
  kakegurui:  KakeguruiGame,     // station: Tavolo Duello
};
```

---

## 2. Frontend Architecture

### 2.1 Component Hierarchy

```
IsoRoomGame (parent, isometric room navigator)
    └── ArcadeBackground (isometric tiled floor + walls + furniture)
        └── ArcadeSprites (interactive stations — cabinets, table)
            └── [on interact] ArcadeGameModal (full-screen overlay)
                └── {REGISTRY[gameId]} (the specific game component)
                    └── game-kit.js hooks and utilities
```

### 2.2 ArcadeGameModal Interface

Every game receives a standardized interface from `ArcadeGameModal`:

```jsx
// Props interface for all game components
{
  onExit: () => void,         // User closes the game (ESC or back button)
  onResult: ({               // Game ends with a score
    score: number,
    gameId: string,           // 'stackAttack' | 'tcgJump' | 'cardMemory' | 'kakegurui'
    isNewBest: boolean,
    ticketsEarned: number,
  }) => void,
}
```

**Important**: `onResult` is called ONLY when the game definitively ends with a score (not on pause or exit). The parent component is responsible for calling the backend `POST /arcade/scores` endpoint with the result.

### 2.3 game-kit.js Utilities

The shared game toolkit provides:

```javascript
// Math helpers
clamp(v, a, b)                 // Clamp value between a and b
lerp(a, b, t)                  // Linear interpolation
rand(a, b)                     // Random float in [a, b)
randInt(a, b)                  // Random int in [a, b] inclusive
choice(arr)                    // Random element from array
easeOutCubic(t)                // Easing function
easeOutBack(t)                 // Bounce-back easing

// Drawing helper
rr(ctx, x, y, w, h, r)        // Rounded rectangle path (no fill/stroke — caller decides)

// Canvas management
useArcadeCanvas(canvasRef, wrapRef, onFrame)
// Sets up a DPR-correct canvas loop with ResizeObserver
// onFrame(ctx, width, height, deltaTime) called every requestAnimationFrame
// dt is clamped to 50ms max to prevent physics explosions on tab refocus
```

### 2.4 SHELL_CSS — Common UI Theme

All games share `SHELL_CSS` from `game-kit.js`: a dark neon-arcade theme with:
- Background: `radial-gradient(#16112e, #0a0a16, #050509)` — deep space aesthetic
- Font: `'Press Start 2P'` for headings, `system-ui` for body
- Classes: `.ag-root`, `.ag-top`, `.ag-back`, `.ag-title`, `.ag-stats`, `.ag-stat`, `.ag-stage`, `.ag-over`, `.ag-btn`
- Game-specific accent color via CSS variable `--accent`

Each game imports and injects `SHELL_CSS` via a `<style>` tag. The CSS is idempotent (injected once per game mount).

---

## 3. Mini-Game 1: Stack Attack

### 3.1 Game Description

Stack Attack is a stacking game inspired by classic Tetris-style stacking challenges. A card-shaped block oscillates horizontally at the top of the screen. The player presses SPACE (keyboard) or taps (touch) to drop it onto the growing tower.

### 3.2 Game Mechanics

| Parameter | Value |
|---|---|
| World width | 360 logical pixels |
| Block height | 24px |
| Initial block width | 150px |
| Perfect zone tolerance | ±4px (overlap counts as "perfect") |
| Active row position | 64% of screen height |
| Starting oscillation speed | 95px/s |
| Lives | 3 (lost when block misses tower entirely) |
| Speed increase per block | Increases gradually |
| Combo system | Perfect drops = no trimming + combo multiplier |

### 3.3 Scoring

```
Each successfully placed block = +1 to score
Perfect placement = no width trimming + combo counter
Combo bonus: visual flash effect (no extra score currently — can be added)
Game over: when lives run out OR when block width < 6px (too thin to continue)
```

### 3.4 Rendering Architecture

```javascript
// Key constants
WORLD_W = 360        // Logical coordinate space (independent of screen size)
BLOCK_H = 24         // Block height in world pixels

// Coordinate system: (0,0) at top-left; Y grows downward
// Camera scrolls UP as tower grows (camY offset applied to all draws)

// Game state object (G.current):
{
  blocks: Array<{x, w, ci}>,    // Stack of placed blocks
  active: {x, w, ci, dir} | null, // Currently oscillating block
  debris: Array<{...}>,         // Falling trimmed pieces
  camY: number,                 // Current camera Y offset
  camTarget: number,            // Target camera Y (for smooth scroll)
  speed: number,                // Current oscillation speed (px/s)
  score: number,                // Current score
  lives: number,                // Remaining lives
  combo: number,                // Current combo streak
  shake: number,                // Screen shake remaining (ms)
  flash: number,                // Flash effect remaining (ms)
}
```

### 3.5 Block Color System

```javascript
function blockColor(i) {
  const hue = (160 + i * 14) % 360;  // Rotates through color wheel
  return {
    fill: `hsl(${hue} 70% 52%)`,
    top:  `hsl(${hue} 75% 62%)`,     // Brighter top face for 3D effect
    side: `hsl(${hue} 65% 38%)`,     // Darker side face
  };
}
```

### 3.6 Controls

| Input | Action |
|---|---|
| `SPACE` | Drop active block |
| `Tap/click` anywhere | Drop active block |

### 3.7 Backend Score Reporting

| Field | Value |
|---|---|
| `game_id` | `"stackAttack"` |
| `score` range | 0–500 (max blocks physically achievable before block too thin) |
| Max score (validation bound) | 500 |
| Score semantics | Number of blocks successfully placed |

---

## 4. Mini-Game 2: TCG Jump

### 4.1 Game Description

TCG Jump is a side-scrolling platformer inspired by Mario Bros. The player controls a character moving through 3 themed levels: Prati (Meadows), Caverna (Cave), and Castello (Castle). Collect mana coins, avoid/stomp slimes, reach the finish flag.

### 4.2 Game Mechanics

| Parameter | Value |
|---|---|
| Gravity | 640 px²/s (world space) |
| Horizontal movement | 98 px/s |
| Jump velocity | -212 px/s (up) |
| Player size | 14×20 world pixels |
| World height | 200 world pixels |
| Lives | 3 (lost by falling or touching slime sides) |
| Levels | 3 (Prati, Caverna, Castello) |

### 4.3 Level Definitions

```javascript
// Level 1: Prati (Meadows)
// Width: 1120px world, sky: soft blue, ground: green
// 5 platforms, 8 coins, 0 slimes, spawn at x=40

// Level 2: Caverna (Cave)  
// Width: 1280px world, sky: deep purple, ground: slate blue
// 7 platforms (with gaps at x=360–470 and x=720–820), 8 coins, 2 slimes

// Level 3: Castello (Castle)
// Width: 1420px world, sky: dark red, ground: burgundy
// 9 platforms (multiple gaps), 9 coins, 3 slimes, most complex
```

### 4.4 Physics System

```
Player movement:
- Horizontal: velocity ± MOVE (instantaneous, no acceleration)
- Vertical: gravity accumulates each frame (dt-based)
- Jump: instant velocity set to JUMP_V when grounded
- Variable jump height: jump velocity maintained while SPACE held (up to apex)

Platform collision (AABB):
- Check new position after physics step
- Push player out of platform along minimum overlap axis
- Slimes: bounce off top (stomp kill) or damage if touched on sides/bottom

Camera:
- Horizontal scrolling only
- Camera X follows player with offset (player visible in left third)
```

### 4.5 Enemy: Slimes

```
Slimes patrol between two X coordinates (defined per-level).
Movement speed: 40 px/s world
Direction flip: at patrol bounds
Collision:
  - Player jumps ON TOP of slime (player bottom overlaps slime top + falling): slime dies
  - Player touches slime from side or below: player loses 1 life, brief invincibility frames
```

### 4.6 Scoring

```
Score = (coins collected) × 100 + (completion bonus per level × 500) + (lives remaining × 200)
Level score accumulates across all 3 levels.
Game won when Level 3 flag reached.
Game lost when lives run out on any level.
```

### 4.7 Controls

| Input | Action |
|---|---|
| `←` / `A` | Move left |
| `→` / `D` | Move right |
| `SPACE` | Jump (hold for higher jump) |
| Touch: left half tap | Move left |
| Touch: right half tap | Move right |
| Touch: upper zone tap | Jump |

### 4.8 Backend Score Reporting

| Field | Value |
|---|---|
| `game_id` | `"tcgJump"` |
| `score` range | 0–10,000 |
| Max score (validation bound) | 10,000 |
| Score semantics | Coins × 100 + completion bonus + lives bonus |

---

## 5. Mini-Game 3: Card Memory

### 5.1 Game Description

Card Memory is a classic memory matching game using 18 unique SVG sigil symbols (rune/neon style). Cards are laid out face-down; the player flips two at a time to find matching pairs. Three difficulty levels with increasing grid sizes.

### 5.2 Levels

| Level | Grid | Cards | Pairs | Time Limit |
|---|---|---|---|---|
| 1 (Beginner) | 4×4 | 16 | 8 | 60 seconds |
| 2 (Advanced) | 6×4 | 24 | 12 | 90 seconds |
| 3 (Master) | 6×6 | 36 | 18 | 120 seconds |

### 5.3 The 18 Sigils

The game uses 18 custom SVG sigil symbols: Fiamma (flame), Stella (star), Scudo (shield), Sole (sun), Luna (moon), Fulmine (lightning), Fiocco (snowflake), Trifoglio (clover), Gemma (gem), Spada (sword), Serpente (serpent), Dado (die), Corona (crown), Occhio (eye), Fiore (flower), Orbe (orb), Mirino (crosshair), Moneta (coin).

These are designed as monoline vector paths with a neon-glow aesthetic consistent with the arcade theme.

### 5.4 Game Mechanics

```
Card state machine:
  unflipped → flipped (player clicks) → matched (pair found) | unflipped (no match, after delay)

Flip logic:
  - Track flipped array (max 2 cards at a time)
  - Lock clicks while comparison is in progress (lock.current = true)
  - After 1st flip: wait for 2nd flip
  - After 2nd flip: compare symbols
    - Match: mark both as matched, unlock immediately
    - No match: wait 900ms (display both), then unflip, unlock
  
Move counter: increments on each pair comparison (not each individual flip)
Timer: countdown from LEVELS[level].time; game over when reaches 0
Win condition: all pairs matched before timer reaches 0
Level progression: clear level 1 → level 2 → level 3 → complete
```

### 5.5 Scoring Formula

```javascript
// Per level:
matchBonus = pairs_matched_in_level × 100
timeBonus = time_remaining_seconds × 3

// Score accumulates across levels:
total_score += matchBonus + timeBonus + (completed_level ? 200 : 0)

// Perfect game (all 3 levels, all pairs, no timeouts):
// Max theoretical score: (8+12+18) × 100 + (60+90+120) × 3 + 3 × 200
// = 3,800 + 810 + 600 = ~5,210 points
```

### 5.6 Rendering

```
Card Memory uses DOM + CSS animation (NOT Canvas 2D).
This is the one exception to the "Canvas 2D" rule — the grid layout and
card flip animations are cleaner with CSS 3D transforms and CSS Grid.

Card flip animation: CSS transform: rotateY(180deg) with perspective
Matched card state: opacity 0.5 + grayscale filter
Background: CSS gradient matching arcade theme
```

### 5.7 Backend Score Reporting

| Field | Value |
|---|---|
| `game_id` | `"cardMemory"` |
| `score` range | 0–6,000 |
| Max score (validation bound) | 6,000 |
| Score semantics | Match bonus + time bonus + completion bonus (accumulated across 3 levels) |

---

## 6. Mini-Game 4: Tavolo Duello (Kakegurui)

### 6.1 Game Description

Tavolo Duello is a Rock-Paper-Scissors dueling game with anime/Kakegurui aesthetics. It supports two modes: **Single Player** (vs AI) and **Multiplayer 1v1** (via WebRTC P2P with manual signaling).

The game is best-of-5 (first to 2 wins in a series). Rounds have a 7-second timer per turn.

### 6.2 Game Constants

```javascript
WIN_TARGET = 2          // Rounds needed to win the best-of-3
TURN_MS = 7000          // 7 seconds per turn to choose
MOVES = {
  rock:     { label: "Sasso",  icon: "🪨", accent: "#ff7300" },
  paper:    { label: "Carta",  icon: "📄", accent: "#818cf8" },
  scissors: { label: "Forbice", icon: "✂️", accent: "#34d399" },
}
ORDER = ["rock", "paper", "scissors"]
BEATS = { rock: "scissors", paper: "rock", scissors: "paper" }
EMOTE = { win: "😏", lose: "😱", draw: "😐", ready: "💪" }
```

### 6.3 AI Opponent (Single Player Mode)

```javascript
function cpuPick(history) {
  // 45% chance: adaptive strategy (counter opponent's favorite move)
  // 55% chance: random move
  if (history.length >= 3 && Math.random() < 0.45) {
    const cnt = { rock: 0, paper: 0, scissors: 0 };
    history.forEach((m) => (cnt[m] += 1));
    const fav = [...ORDER].sort((a, b) => cnt[b] - cnt[a])[0];
    return ORDER.find((m) => BEATS[m] === fav) || rndMove();
  }
  return rndMove();
}
// History = player's previous moves in the current match
// Simple frequency-based counter-strategy (no deep ML)
```

### 6.4 Multiplayer Mode — P2P Flow

```
Phase 1: Menu Selection
  Player A: selects "1v1 in rete" → opens Lobby
  Player A: clicks "Crea Stanza" → useP2PRoom.createRoom()
    → generates WebRTC offer SDP + roomCode
    → roomCode displayed in UI for sharing

Phase 2: Signaling (Manual Copy-Paste)
  Player A: copies roomCode + SDP offer → shares via external chat
  Player B: opens Lobby, pastes roomCode → useP2PRoom.joinRoom(offerString)
    → generates SDP answer
    → answer string displayed in UI for sharing back to Player A
  Player A: pastes answer string → useP2PRoom.submitAnswer(answerString)
    → WebRTC connection established

Phase 3: Connected (DataChannel Open)
  Both players: see "Connesso!" state → enter Duel component with P2P enabled

Phase 4: Duel (Synchronous)
  Each turn:
    1. Both players choose move within 7 seconds (or auto-timeout)
    2. Local player's move stored; sent immediately to peer via DataChannel
    3. Wait for peer's move to arrive via DataChannel
    4. Deterministic resolution: both sides compute outcome from the same pair of moves
    5. No server authority needed — both sides compute the same result
  
  Win condition: first to WIN_TARGET rounds wins the match

Phase 5: Match End
  onResult({
    score: localWins * 100 + (won ? 500 : 0),
    gameId: 'kakegurui',
    isNewBest: ...,
    ticketsEarned: ...,
  })
```

### 6.5 Deterministic Resolution

The key insight for P2P consistency: both sides receive the full pair of moves `{localMove, peerMove}` before resolving. Resolution is pure function with no randomness:

```javascript
function resolve(myMove, theirMove) {
  if (myMove === theirMove) return "draw";
  return BEATS[myMove] === theirMove ? "win" : "lose";
}
// Both peers call resolve(myMove, peerMove) independently
// Same inputs → same outputs → no desync possible
```

### 6.6 Component Structure

```jsx
KakeguruiGame
  ├── Mode Menu (null state): "Solo" | "1v1 in rete"
  ├── Lobby (mp, !connected): P2P signaling UI
  │   ├── Create Room: shows roomCode + SDP offer to copy
  │   ├── Join Room: paste offer → generates answer to copy back
  │   └── Submit Answer: finalize connection
  └── Duel (sp or connected mp):
      ├── Timer countdown (7s per turn, visual progress bar)
      ├── Move selector (rock/paper/scissors buttons)
      ├── Round result display (win/lose/draw + emote)
      ├── Score tracker (your wins vs opponent wins)
      └── Match end overlay (victory/defeat + onResult)
```

### 6.7 Backend Score Reporting

| Field | Value |
|---|---|
| `game_id` | `"kakegurui"` |
| `score` range (solo) | 0–700 (wins×100 + victory bonus 500) |
| `score` range (multiplayer) | 0–700 (same formula) |
| Max score (validation bound) | 700 |
| Score semantics | Rounds won × 100 + 500 if match won |
| Multiplayer vs solo | No distinction in score submission (same API endpoint) |

---

## 7. P2P Room System (useP2PRoom.js)

### 7.1 Purpose

`useP2PRoom.js` is a React hook that implements a fully manual WebRTC P2P connection for the Kakegurui mini-game. It uses the native browser WebRTC API directly — no `simple-peer`, no socket.io, no server signaling.

### 7.2 Core Dependencies

```javascript
// NO external dependencies beyond React.
// Uses browser native WebRTC API only:
// - RTCPeerConnection
// - RTCDataChannel
// - navigator.mediaDevices (NOT USED — arcade only uses DataChannel, no video)
```

### 7.3 ICE Configuration

```javascript
const ICE_CFG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};
// IMPORTANT: No TURN server for arcade.
// Rationale: Arcade P2P uses only DataChannel (no video/audio).
// DataChannel connections have much higher NAT traversal success rate than
// video streams, making TURN unnecessary in most cases.
// If P2P fails (very restrictive NAT), the user falls back to Single Player mode.
```

### 7.4 SDP Encoding Utilities

```javascript
function toB64Url(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromB64Url(str) {
  const b = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - (b.length % 4)) % 4);
  return atob(b + pad);
}

// These transform binary SDP strings into URL-safe base64 for
// copy-paste in text fields or external messengers.
// The "room code" in the UI IS the encoded SDP offer.
```

### 7.5 ICE Gathering Completion

```javascript
async function waitIce(pc) {
  // Wait for all ICE candidates to be gathered before sharing the offer.
  // This embeds all ICE candidates in the SDP itself (trickling disabled).
  // Benefit: the recipient only needs ONE string (no separate ICE candidate exchange).
  // Trade-off: slightly longer SDP string; initial connection setup takes 1–3 extra seconds.
  
  if (pc.iceGatheringState === 'complete') return;
  return new Promise((resolve) => {
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') resolve();
    });
  });
}
```

### 7.6 Hook State Machine

```
States: 'idle' | 'creating' | 'waiting' | 'connected'

'idle':
  → createRoom() → 'creating' (generating offer, gathering ICE)
  → joinRoom(offer) → 'waiting' (generating answer, waiting for submitAnswer)

'creating':
  → ICE gathering complete → roomCode generated → display offer to user
  → peer submits answer → 'connected'

'waiting':
  → answer generated → display answer to user
  → user copies answer back to peer host
  → submitAnswer() from host side → their 'creating' state → 'connected' (both)

'connected':
  → DataChannel open → sendGameState(data) available
  → receive messages via onMessage callback
```

### 7.7 Full Hook API

```javascript
const [room, actions] = useP2PRoom(onMessage);

// room state (read-only):
{
  state: 'idle' | 'creating' | 'waiting' | 'connected',
  roomCode: string | null,    // The encoded SDP offer (acts as "room code")
  answer: string | null,      // The encoded SDP answer (guest generates this)
  isHost: boolean,            // true if this peer called createRoom()
  latency: number,            // RTT in ms (from ping/pong, 0 if not measured)
  error: string | null,       // Last error message (if any)
}

// actions:
{
  createRoom: async () => void,           // Generate offer, start ICE gathering
  joinRoom: async (offerCode: string) => void,  // Accept offer, generate answer
  submitAnswer: async (answerCode: string) => void, // (host) accept remote answer
  sendGameState: (data: object) => void,  // Send JSON data to peer via DataChannel
  disconnect: () => void,                 // Close connection, reset to idle
}

// onMessage callback:
// Called when peer sends data via sendGameState
// Receives parsed JSON object
```

### 7.8 DataChannel Configuration

```javascript
const dc = pc.createDataChannel('game', {
  ordered: true,          // In-order delivery (game state depends on sequencing)
  maxRetransmits: 3,      // Retry up to 3 times (trade-off: latency vs reliability)
});

// Message format (all messages are JSON):
{ type: 'game_state', payload: {...} }  // Game state updates
{ type: 'ping', ts: timestamp }         // Latency measurement
{ type: 'pong', ts: original_timestamp } // Latency response
```

### 7.9 Ping/Pong Latency Measurement

```javascript
// Host sends ping every 3 seconds after connection:
function sendPing() {
  actions.sendGameState({ type: 'ping', ts: performance.now() });
}

// Guest responds with pong:
function onMessage(msg) {
  if (msg.type === 'ping') {
    actions.sendGameState({ type: 'pong', ts: msg.ts });
  }
  if (msg.type === 'pong') {
    const rtt = performance.now() - msg.ts;
    setLatency(Math.round(rtt));  // Update room.latency
  }
}

// Displayed in Lobby UI: "Latenza: 45ms"
// Used in Duel component for move timeout adjustment (high latency = small buffer added)
```

### 7.10 Connection Lifecycle

```
createRoom():
  1. new RTCPeerConnection(ICE_CFG)
  2. createDataChannel('game', {ordered:true, maxRetransmits:3})
  3. Set up DataChannel event handlers (onopen, onmessage, onerror, onclose)
  4. createOffer() → setLocalDescription(offer)
  5. waitIce(pc) → gather all ICE candidates
  6. roomCode = toB64Url(pc.localDescription.sdp)
  7. setState({state:'creating', roomCode, isHost:true})

joinRoom(offerCode):
  1. new RTCPeerConnection(ICE_CFG)
  2. Set up ondatachannel handler
  3. offerSdp = fromB64Url(offerCode)
  4. setRemoteDescription({type:'offer', sdp:offerSdp})
  5. createAnswer() → setLocalDescription(answer)
  6. waitIce(pc)
  7. answer = toB64Url(pc.localDescription.sdp)
  8. setState({state:'waiting', answer, isHost:false})
  
submitAnswer(answerCode): [host only]
  1. answerSdp = fromB64Url(answerCode)
  2. setRemoteDescription({type:'answer', sdp:answerSdp})
  3. WebRTC connection negotiation begins
  4. On DataChannel open: setState({state:'connected'})

disconnect():
  1. dc.close()
  2. pc.close()
  3. setState({state:'idle', all null fields})
```

---

## 8. Isometric Room and Navigation

### 8.1 Room Configuration (arcade-config.js)

```javascript
// Color palette
P_ARCADE = {
  floor1: "#1e1b2e",    // Primary floor tile
  floor2: "#252240",    // Alternate floor tile
  wall:   "#12101e",    // Wall color
  accent: "#05d9e8",    // Cyan neon accent
  glow:   "#ff2a6d",    // Pink neon glow
  // ... additional palette entries
}

// Interactive stations (game cabinets + table)
INTERACTIVES_ARCADE = {
  arcade1:   { game: 'stackAttack', ... },   // Stack Attack cabinet
  arcade2:   { game: 'tcgJump', ... },       // TCG Jump cabinet
  arcade3:   { game: 'cardMemory', ... },    // Card Memory panel
  kakegurui: { game: 'kakegurui', ... },     // Tavolo Duello
}

// Station metadata
STATIONS = [
  { key: 'arcade1',   name: 'Stack Attack',  kind: 'arcade', accent: '#05d9e8', icon: '🃏' },
  { key: 'arcade2',   name: 'TCG Jump',      kind: 'arcade', accent: '#39ff14', icon: '🐸' },
  { key: 'arcade3',   name: 'Card Memory',   kind: 'arcade', accent: '#b026ff', icon: '🔮' },
  { key: 'kakegurui', name: 'Tavolo Duello', kind: 'table',  accent: '#ff2a6d', icon: '⚔️' },
]
```

### 8.2 Player Navigation

The player character (isometric sprite) walks through the arcade room using tile-based navigation. When the player approaches an interactive station (enters the "approach tiles" zone defined in `INTERACTIVES_ARCADE`), a prompt appears to interact. On confirm, `ArcadeGameModal` opens with the corresponding game component.

### 8.3 ArcadeGameModal

```jsx
// ArcadeGameModal provides:
// 1. Full-screen dark overlay (z-index: 100)
// 2. Injects SHELL_CSS into document once (idempotent)
// 3. Passes {onExit, onResult} props to the game component
// 4. Handles onResult: calls API to submit score, shows ticket toast

// Score submission (called by ArcadeGameModal on onResult):
async function submitScore(result) {
  const response = await fetch('/api/arcade/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      game_id: result.gameId,
      score: result.score,
      idempotency_key: crypto.randomUUID(), // Prevent duplicate submissions
    }),
  });
  
  if (response.ok) {
    const data = await response.json();
    showToast(`+${data.tickets_earned} ticket! Punteggio: ${result.score}`);
    if (data.is_personal_best) showToast("Nuovo record personale! 🏆");
  }
}
```

---

## 9. Backend API Specification

### 9.1 Score Submission

**Endpoint**: `POST /arcade/scores`  
**Auth**: `require_auth` (JWT required; membership NOT required for arcade)  
**Rate limit**: 10 requests / hour / user / game

```
Request:
POST /arcade/scores
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "game_id": "stackAttack",          // stackAttack | tcgJump | cardMemory | kakegurui
  "score": 142,
  "idempotency_key": "uuid-v4",      // UUID generated client-side; prevents duplicate submission
  "metadata": {                       // Optional, game-specific
    "level_reached": 2,              // TCG Jump: highest level reached
    "perfect_drops": 8,              // Stack Attack: perfect placements
    "moves_used": 23,                // Card Memory: total moves made
    "opponent_mode": "cpu"           // Kakegurui: "cpu" | "p2p"
  }
}

Response 201:
{
  "score_id": "uuid",
  "score": 142,
  "is_personal_best": true,
  "tickets_earned": 5,
  "new_wallet_balance": 47,
  "rank_change": {                    // null if not personal best
    "previous_rank": 15,
    "new_rank": 12,
    "game_id": "stackAttack"
  }
}

Errors:
400 - Score exceeds max for game_id
401 - Invalid or missing JWT
409 - Duplicate idempotency_key
429 - Rate limit exceeded (10/hour/game)
```

### 9.2 Leaderboard

**Endpoint**: `GET /arcade/leaderboard/{game_id}`  
**Auth**: Public (no auth required)  
**Cache**: Redis, TTL 5 minutes

```
Request:
GET /arcade/leaderboard/stackAttack?limit=100

Response 200:
[
  {
    "rank": 1,
    "user_id": "uuid",
    "username": "PlayerXYZ",          // Fetched from user profile
    "score": 487,
    "achieved_at": "2026-06-15T14:32:00Z"
  },
  ...
]

Valid game_id values: stackAttack | tcgJump | cardMemory | kakegurui
Max limit: 100 (default: 100)
```

### 9.3 Personal Score History

**Endpoint**: `GET /arcade/me/scores`  
**Auth**: `require_auth`

```
Request:
GET /arcade/me/scores?game_id=stackAttack&limit=20&page=1

Response 200:
{
  "scores": [
    {
      "score_id": "uuid",
      "game_id": "stackAttack",
      "score": 142,
      "is_personal_best": false,
      "tickets_earned": 5,
      "created_at": "2026-06-20T12:30:00Z"
    }
  ],
  "personal_best": {
    "stackAttack": 487,
    "tcgJump": 3200,
    "cardMemory": 1800,
    "kakegurui": 700
  },
  "total": 45,
  "page": 1
}
```

### 9.4 Wallet

**Endpoint**: `GET /arcade/me/wallet`  
**Auth**: `require_auth`

```
Response 200:
{
  "balance": 47,
  "total_earned": 152,
  "total_spent": 105,
  "recent_transactions": [
    {
      "type": "earn",
      "amount": 5,
      "source": "stackAttack",
      "created_at": "2026-06-20T12:30:00Z"
    }
  ]
}
```

**Endpoint**: `POST /arcade/me/wallet/spend`  
**Auth**: `require_auth`  
**Idempotent**: Yes (idempotency_key required)

```
Request:
{
  "amount": 10,
  "reward_id": "badge_neon_frame",    // Future reward catalog item
  "idempotency_key": "uuid-v4"
}

Response 200:
{
  "new_balance": 37,
  "reward": {
    "id": "badge_neon_frame",
    "name": "Neon Frame Badge",
    "description": "Badge esclusivo per il profilo"
  }
}

Error 400: insufficient balance
```

### 9.5 P2P Room Registry (Kakegurui)

**Endpoint**: `POST /arcade/rooms`  
**Auth**: `require_auth`  
**Purpose**: Registers a room code for discoverability. Does NOT relay SDP.

```
Request:
POST /arcade/rooms
Authorization: Bearer {jwt}

{
  "game_id": "kakegurui"
}

Response 201:
{
  "room_code": "AK3F9Z",    // 6-char alphanumeric, cryptographically random
  "game_id": "kakegurui",
  "expires_in": 1800,        // 30 minutes in seconds
  "created_at": "2026-06-20T12:30:00Z"
}
```

**Endpoint**: `GET /arcade/rooms/{code}`  
**Auth**: `require_auth`

```
Response 200:
{
  "room_code": "AK3F9Z",
  "game_id": "kakegurui",
  "host_user_id": "uuid",
  "status": "waiting",       // waiting | full | expired
  "created_at": "2026-06-20T12:30:00Z",
  "expires_at": "2026-06-20T13:00:00Z"
}

Response 404: Room code not found (expired or never created)
```

**Important**: The SDP offer/answer is NEVER sent to this endpoint. It is exchanged client-to-client (copy-paste). This endpoint only provides metadata about the room for the optional server-assisted matchmaking flow.

---

## 10. Database Schema

### 10.1 arcade_scores Table (Partitioned)

```sql
CREATE TABLE arcade_scores (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL,
    game_id          VARCHAR(20)  NOT NULL,
    score            INTEGER      NOT NULL,
    is_personal_best BOOLEAN      NOT NULL DEFAULT false,
    tickets_earned   INTEGER      NOT NULL DEFAULT 0,
    metadata         JSONB,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Quarterly partitions
CREATE TABLE arcade_scores_2026_q1 PARTITION OF arcade_scores
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE arcade_scores_2026_q2 PARTITION OF arcade_scores
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE arcade_scores_2026_q3 PARTITION OF arcade_scores
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE arcade_scores_2026_q4 PARTITION OF arcade_scores
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- Indexes
CREATE INDEX idx_arcade_scores_user_game    ON arcade_scores (user_id, game_id, created_at DESC);
CREATE INDEX idx_arcade_scores_game_score   ON arcade_scores (game_id, score DESC);
CREATE INDEX idx_arcade_scores_personal_best ON arcade_scores (user_id, game_id) WHERE is_personal_best = true;

-- Constraints
ALTER TABLE arcade_scores ADD CONSTRAINT chk_game_id  
    CHECK (game_id IN ('stackAttack', 'tcgJump', 'cardMemory', 'kakegurui'));
ALTER TABLE arcade_scores ADD CONSTRAINT chk_score_positive 
    CHECK (score >= 0);
```

### 10.2 arcade_wallets Table

```sql
CREATE TABLE arcade_wallets (
    id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id      UUID        NOT NULL UNIQUE,
    balance      INTEGER     NOT NULL DEFAULT 0,
    total_earned INTEGER     NOT NULL DEFAULT 0,
    total_spent  INTEGER     NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_wallet_balance_non_negative CHECK (balance >= 0),
    CONSTRAINT chk_wallet_earned_non_negative  CHECK (total_earned >= 0),
    CONSTRAINT chk_wallet_spent_non_negative   CHECK (total_spent >= 0)
);

CREATE TRIGGER trg_wallets_updated_at
    BEFORE UPDATE ON arcade_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 11. Redis Data Structures

### 11.1 Global Leaderboards (Sorted Sets)

```
KEY:   arcade:leaderboard:{game_id}
TYPE:  Sorted Set (ZSET)
VALUE: member = user_id (string), score = game_score (float)
TTL:   None (permanent; backed up by DB sync worker every 15 min)

Usage:
  Set/update personal best:
    ZADD arcade:leaderboard:stackAttack NX | XX GT {score} {user_id}
  Get top 100:
    ZREVRANGE arcade:leaderboard:stackAttack 0 99 WITHSCORES
  Get user's rank:
    ZREVRANK arcade:leaderboard:stackAttack {user_id}
  Get user's score:
    ZSCORE arcade:leaderboard:stackAttack {user_id}
```

### 11.2 Wallet Cache

```
KEY:   arcade:wallet:{user_id}
TYPE:  Hash
VALUE: { balance: "47", total_earned: "152", total_spent: "105" }
TTL:   3600 (1 hour; invalidated on wallet operations)

Usage:
  HGETALL arcade:wallet:{user_id}
  HINCRBY arcade:wallet:{user_id} balance {delta}
  HINCRBY arcade:wallet:{user_id} total_earned {amount}
```

### 11.3 P2P Room Registry

```
KEY:   arcade:room:{room_code}
TYPE:  String (JSON)
VALUE: { host_user_id, game_id, created_at, status }
TTL:   1800 (30 minutes — auto-expiry)

Usage:
  Create:  SET arcade:room:AK3F9Z {json} EX 1800
  Read:    GET arcade:room:AK3F9Z
  Expire:  Automatic (TTL-based)
  No delete needed — TTL handles cleanup
```

### 11.4 Score Idempotency Keys

```
KEY:   arcade:submit:{user_id}:{idempotency_key}
TYPE:  String
VALUE: "1" (sentinel)
TTL:   86400 (24 hours)

Usage:
  Check before processing: EXISTS arcade:submit:{user_id}:{idem_key}
  Set after processing:    SET arcade:submit:{user_id}:{idem_key} 1 EX 86400
```

### 11.5 Rate Limiting

```
KEY:   ratelimit:arcade_score:{user_id}:{game_id}:{hour_epoch}
TYPE:  String (integer counter)
TTL:   3600 (1 hour window)

Usage:
  INCR ratelimit:arcade_score:{user_id}:{game_id}:{hour_epoch}
  EXPIRE ratelimit:... 3600 (only on first increment)
  if count > 10: return 429
```

---

## 12. Score and Ticket System

### 12.1 Score Limits (Max Validation Bounds)

```python
GAME_SCORE_LIMITS = {
    "stackAttack": 500,    # ~500 blocks max before width < 6px
    "tcgJump":    10000,   # Max possible with 3 levels + all coins + perfect lives
    "cardMemory":  6000,   # Max with all levels, fast completion, lives bonus
    "kakegurui":    700,   # 2 wins × 100 + victory bonus 500
}
```

### 12.2 Ticket Earning Thresholds

```python
TICKET_THRESHOLDS = {
    "stackAttack": [
        TicketThreshold(min_score=10,  tickets=1),   # Casual play
        TicketThreshold(min_score=50,  tickets=3),   # Getting good
        TicketThreshold(min_score=100, tickets=5),   # Skilled
        TicketThreshold(min_score=200, tickets=10),  # Expert
        TicketThreshold(min_score=400, tickets=20),  # Master
    ],
    "tcgJump": [
        TicketThreshold(min_score=500,  tickets=1),
        TicketThreshold(min_score=2000, tickets=3),
        TicketThreshold(min_score=5000, tickets=7),
        TicketThreshold(min_score=8000, tickets=15),
    ],
    "cardMemory": [
        TicketThreshold(min_score=200,  tickets=2),
        TicketThreshold(min_score=1000, tickets=5),
        TicketThreshold(min_score=3000, tickets=10),
        TicketThreshold(min_score=5000, tickets=18),
    ],
    "kakegurui": [
        TicketThreshold(min_score=100, tickets=2),   # Win at least 1 round
        TicketThreshold(min_score=500, tickets=8),   # Win the match (vs CPU or P2P)
        TicketThreshold(min_score=600, tickets=12),  # Win 2-0 sweep
    ],
}

# Tickets are NOT cumulative by tier — only the highest tier reached applies.
# Highest tier = the LAST threshold whose min_score is satisfied.
# Example: stackAttack score=120 → min_score=100 satisfied → 5 tickets.
```

### 12.3 Ticket Economy Notes

- Tickets have **no monetary value** — they are cosmetic/reward points
- Wallet balance cannot go below 0 (DB CHECK constraint)
- No "purchase" mechanism exists in MVP — all tickets are earned through gameplay
- Future reward catalog will define what tickets can be spent on

---

## 13. WebRTC Signaling: Arcade vs Tournament

This section documents the critical architectural distinction between the two WebRTC use cases in the platform.

### 13.1 Comparison Table

| Aspect | Tournament WebRTC | Arcade WebRTC (Kakegurui) |
|---|---|---|
| **Purpose** | Video/audio call between host and participant | DataChannel game state between two players |
| **Media type** | Video + Audio (camera streams) | Text data only (JSON game state) |
| **Signaling** | Server-relayed via ECS + Redis | Fully manual (copy-paste SDP) |
| **TURN server** | Required (5% of connections) | NOT required (DataChannel has higher P2P success) |
| **ICE servers** | coturn (TURN) + Google STUN | Google STUN only |
| **Backend involvement** | High: stores signaling messages, coordinates timing | None: backend never sees SDP |
| **Privacy** | User must trust server with signaling | Fully private (no server intermediary) |
| **Reconnection** | Server can re-deliver ICE candidates | Must restart from scratch |
| **Latency requirement** | Low (video needs < 150ms for natural feeling) | Moderate (game state can tolerate 200–500ms) |
| **Backend complexity** | Redis signaling, poll endpoints | Zero (P2P registration optional) |
| **Failure mode** | Server signaling failure → match broken | P2P failure → fallback to Single Player |

### 13.2 Tournament Signaling Architecture

```
HOST's Browser                           PARTICIPANT's Browser
     │                                           │
     │ POST /signaling/offer                     │
     │ {matchId, sdpOffer}                       │
     ▼                                           │
ECS FastAPI ──► Redis SET signal:{matchId}:offer │
                                                 │
                                                 │ GET /signaling/offer?matchId=...
                                                 │ ◄── ECS FastAPI ◄── Redis GET
                                                 │
                                                 │ POST /signaling/answer
                                                 │ {matchId, sdpAnswer}
                                                 │ ECS FastAPI ──► Redis SET signal:{matchId}:answer
                                                 │
GET /signaling/answer?matchId=...                │
◄── ECS FastAPI ◄── Redis GET                    │
     │                                           │
     │◄═══════════════════════════════════════► │
     │    WebRTC P2P (video + audio direct)      │
     │    TURN relay if NAT traversal fails      │
```

### 13.3 Arcade Signaling Architecture

```
Player A (Host)                         Player B (Guest)
     │                                           │
     │  useP2PRoom.createRoom()                  │
     │  → RTCPeerConnection.createOffer()        │
     │  → waitIce() until complete               │
     │  → roomCode = toB64Url(offer.sdp)         │
     │                                           │
     │  [COPIES roomCode via external chat]──────►│
     │                                           │ useP2PRoom.joinRoom(roomCode)
     │                                           │ → RTCPeerConnection
     │                                           │ → setRemoteDescription(offer)
     │                                           │ → createAnswer()
     │                                           │ → waitIce()
     │                                           │ → answer = toB64Url(answer.sdp)
     │                                           │
     │◄──────[COPIES answer back via chat]────────│
     │  useP2PRoom.submitAnswer(answerCode)       │
     │  → setRemoteDescription(answer)            │
     │                                           │
     │◄═══════════════════════════════════════► │
     │  WebRTC DataChannel (JSON game state)     │
     │  STUN only — NO server relay              │
     │  NO video/audio — tiny data packets       │
```

---

## 14. Security Considerations

### 14.1 Score Integrity

| Threat | Mitigation |
|---|---|
| Client-side score manipulation | Server validates `score <= GAME_SCORE_LIMITS[game_id]` |
| Replay attacks (same score submitted twice) | Idempotency key (UUID) stored in Redis for 24h |
| Score flood (rapid submissions) | Rate limit: 10 submissions/hour/user/game |
| Negative score submission | DB CHECK constraint: `score >= 0`; Pydantic `ge=0` validator |
| Bot auto-submission | Rate limit + idempotency; statistical monitoring in Phase 13 |
| Future: statistical outliers | Phase 13: flag scores > 3σ from user's personal average for manual review |

### 14.2 P2P Room Registry

The P2P room registry stores only metadata — no sensitive data:
- `host_user_id` is visible to anyone with the room code (by design — needed for joining)
- `game_id` is not sensitive
- Room codes expire automatically in 30 minutes
- Room codes are cryptographically random (cannot be guessed or enumerated in practice)

### 14.3 Wallet Security

```python
# All wallet debit operations use atomic DB transactions
# Pattern: UPSERT with conditional balance check

await db.execute(
    update(ArcadeWallet)
    .where(
        and_(
            ArcadeWallet.user_id == user_id,
            ArcadeWallet.balance >= amount,  # Prevent negative balance at DB level
        )
    )
    .values(
        balance=ArcadeWallet.balance - amount,
        total_spent=ArcadeWallet.total_spent + amount,
    )
    .returning(ArcadeWallet.balance)
)
# If rowcount == 0: insufficient balance (either user_id not found or balance < amount)
```

---

## 15. Integration Points

### 15.1 Frontend → Backend Integration

```javascript
// Called by ArcadeGameModal on game end
// Location: ArcadeGameModal.jsx (or its parent IsoRoomGame)

async function handleGameResult(result) {
  // 1. Submit score to backend
  const scoreResponse = await apiClient.post('/arcade/scores', {
    game_id: result.gameId,
    score: result.score,
    idempotency_key: crypto.randomUUID(),
    metadata: result.metadata || {},
  });
  
  // 2. Update local leaderboard (optimistic)
  dispatch(updateLeaderboard({
    gameId: result.gameId,
    score: result.score,
    isPersonalBest: scoreResponse.is_personal_best,
  }));
  
  // 3. Update wallet display
  dispatch(setWalletBalance(scoreResponse.new_wallet_balance));
  
  // 4. Show feedback toast
  if (scoreResponse.tickets_earned > 0) {
    toast.success(`+${scoreResponse.tickets_earned} 🎟️ ticket guadagnati!`);
  }
  if (scoreResponse.is_personal_best) {
    toast.success(`🏆 Nuovo record personale: ${result.score}!`);
  }
}
```

### 15.2 Leaderboard Display Integration

```javascript
// Leaderboard component fetches from API (no auth required)
const { data: leaderboard } = useSWR(
  `/arcade/leaderboard/${gameId}?limit=100`,
  fetcher,
  { refreshInterval: 5 * 60 * 1000 }  // Refresh every 5 minutes
);
```

### 15.3 Access Control

```
Game access:   Requires auth (JWT) for score submission; public for leaderboard viewing
Membership:    NOT required for arcade (intentional: arcade is open to all registered users)
Rationale:     Arcade is a retention/engagement tool; restrict it less than tournaments
```

### 15.4 Background Worker: Leaderboard Sync

```python
# Runs every 15 minutes via asyncio scheduled task
# Ensures Redis leaderboard survives cache flushes by rebuilding from Aurora

async def sync_arcade_leaderboards(db: AsyncSession, redis: Redis) -> None:
    for game_id in ['stackAttack', 'tcgJump', 'cardMemory', 'kakegurui']:
        stmt = (
            select(ArcadeScore.user_id, func.max(ArcadeScore.score).label('best_score'))
            .where(ArcadeScore.game_id == game_id)
            .group_by(ArcadeScore.user_id)
        )
        result = await db.execute(stmt)
        scores = result.all()
        
        if scores:
            mapping = {str(row.user_id): row.best_score for row in scores}
            # ZADD with GT flag: only updates if new score is higher
            # This prevents the sync from overwriting a Redis score that's more current
            await redis.zadd(f"arcade:leaderboard:{game_id}", mapping, gt=True)
    
    logger.info(f"Arcade leaderboard sync completed for {len(game_ids)} games")
```

---

*End of Arcade Room Technical Specification v1.0*
