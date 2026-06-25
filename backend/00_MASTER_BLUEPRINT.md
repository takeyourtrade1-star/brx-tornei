# 00 — Ebartex Tournaments: Master Blueprint

> **Document type**: Executive Technical Blueprint  
> **Version**: 2.0  
> **Audience**: Engineering leads, solution architects, senior developers, automated agent orchestrators  
> **Scope**: Complete Python microservice backend for `tournaments.ebartex.com`, running on AWS ECS Fargate  
> **Updated**: June 2026 — incorporates Membership/Tessera system, Arcade Room P2P, 3-role infrastructure model, tournament UI refactor

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Context & Frontend Analysis](#2-platform-context--frontend-analysis)
3. [Integration Map with ebartex.com](#3-integration-map-with-ebartexcom)
4. [Microservice Boundaries & Responsibilities](#4-microservice-boundaries--responsibilities)
5. [Technology Stack Choices & Rationale](#5-technology-stack-choices--rationale)
6. [AWS Architecture Overview](#6-aws-architecture-overview)
7. [Security Architecture](#7-security-architecture)
8. [Scalability Strategy](#8-scalability-strategy)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Development Phases Overview](#10-development-phases-overview)
11. [Naming Conventions & Project Conventions](#11-naming-conventions--project-conventions)
12. [Membership & Tessera System](#12-membership--tessera-system)
13. [Arcade Room & P2P Mini-Games](#13-arcade-room--p2p-mini-games)
14. [Three-Role Infrastructure Model](#14-three-role-infrastructure-model)

---

## 1. Executive Summary

Ebartex Tournaments is a vertically specialized TCG (Trading Card Game — Magic: The Gathering) tournament platform operating as a subdomain of `ebartex.com`. It enables players to create, join, and spectate live Magic the Gathering matches online, using a dual-camera setup (PC webcam for face, phone camera via QR/WebRTC for hands/cards).

The frontend is a Next.js 15 application deployed to `tournaments.ebartex.com`. It currently uses in-memory mock data for tournament operations. **This document specifies the new Python backend microservice** (herein referred to as **Tournament Service** or **TS**) that will replace all mocks and power the full tournament lifecycle, real-time match updates, WebRTC signaling, leaderboards, notifications, membership management, and arcade room coordination.

### Platform at a Glance

| Dimension | Current State (MVP) | Target State |
|---|---|---|
| Tournament types | Heads-Up 1v1 only | Heads-Up + Multiplayer (Swiss, Elimination) |
| Buy-in | For Fun only | For Fun + optional paid entries |
| Game formats | 8 (Old School → Commander) | Same + extensible |
| Players (concurrent) | ~10 (mock) | 1,000+ concurrent, 200+ simultaneous tournaments |
| Real-time | None (static mock data) | WebSocket + SSE push for match state |
| Webcam signaling | HTTP polling on Next.js API route | Dedicated WebSocket signaling server on ECS |
| Persistence | In-memory (ephemeral) | PostgreSQL Aurora + Redis ElastiCache |
| Auth | Proxied to ebartex.com FastAPI | JWT from same FastAPI, validated locally |
| Spectator/PiP | UI-only simulation | Real match state streamed to observers |
| **Membership/Tessera** | **Mock/client-only** | **Full tessera issuance, tier management, gate enforcement** |
| **Arcade Room** | **Frontend P2P only (no infra)** | **P2P signaling relay + leaderboard + room registry** |
| **3-Role Video** | **Not implemented** | **Host/Participant (bidirectional) + Spectator (broadcast)** |

### Key Business Rules

- **Heads-Up** (`mode: 'heads-up'`): exactly 2 players; **ALWAYS 1v1** — this is a fundamental constraint
- **Best-Of**: BO1, BO3, or BO5; games tracked per player; match winner determined by `ceil(bestOf / 2)` games
- **Privacy**: private tournaments (`isPrivate: true`) require join-request approval before the player receives the webcam QR
- **Match phases** (Magic phases): Cambio → Mantenimento → Acquisizione → Principale I → Combattimento → Principale II → Fine (per-turn cycle)
- **Life totals**: each game starts at 20 life; reaching 0 ends that game
- **Dual camera**: player has face stream (PC webcam) + hands stream (phone via WebRTC QR link)
- **Observer role**: spectators watch live match state; Picture-in-Picture available
- **Signaling store**: keyed by `sessionId`, TTL 600 seconds, max 300 messages, backed by Redis
- **Membership gate**: users with `status: 'none'` are redirected to `/associazione` before accessing tournaments
- **Arcade P2P**: completely serverless mini-games use manual WebRTC signaling (copy/paste base64url offer/answer) — the backend only provides a leaderboard API, not real-time signaling

---

## 2. Platform Context & Frontend Analysis

### 2.1 Frontend Routes & Pages

| Route | Description | Backend Dependency |
|---|---|---|
| `/` | Redirect to `/hub` or `/login` | `GET /me` (session check via SSO) |
| `/login` | Password login or email-code login | Auth microservice (existing) |
| `/login/verify-mfa` | TOTP/SMS MFA verification | Auth microservice (existing) |
| `/login/code` | Email one-time code flow | Auth microservice (existing) |
| `/registrati` | Registration stub → ebartex.com | Auth microservice (existing) |
| `/auth/bridge` | SSO bridge: refresh token → local session | Auth microservice (existing) |
| `/hub` | Format selector (step 1) | None (static catalog) |
| `/hub/modalita` | Mode selector (step 2) | None (static catalog) |
| `/tornei` | Tournament dashboard table with advanced filters | **TS**: `GET /tournaments?format=&mode=&buyIn=` |
| `/tornei/webcam/[sessionId]` | Phone webcam sender page (public route, no auth) | **TS**: WebRTC signaling relay |
| `/associazione` | Membership onboarding form | **TS**: `POST /membership/enroll` |
| `/tessera` | Membership card reveal & management | **TS**: `GET /membership/me`, `GET /membership/card` |

### 2.2 Server Actions → Backend Calls

| Server Action | Current Behavior | Target Backend Call |
|---|---|---|
| `createTournamentAction(formData)` | Adds to in-memory mock | `POST /tournaments` |
| `joinTournamentAction(id)` | Adds participant to mock | `POST /tournaments/{id}/join` |
| `createTournamentFromGameAction(t)` | Adds mock from mini-game | `POST /tournaments` (same endpoint) |
| `enrollMembershipAction(input)` | Client-only mock | `POST /membership/enroll` |
| `skipMembershipAction()` | Sets local state only | `POST /membership/skip` |
| `submitArcadeScoreAction(gameId, score)` | No backend | `POST /arcade/scores` |
| `logoutAction()` | POST `/api/auth/logout` to auth service | (no change) |
| `loginAction(formData)` | POST to auth service | (no change) |
| `verifyMfaAction(formData)` | POST to auth service | (no change) |

### 2.3 TypeScript Types → Backend Data Model Mapping

The following TypeScript types from `types/tournament.ts` define the exact API contract:

```typescript
// Canonical tournament object the frontend expects
interface Tournament {
  id: string;           // UUID
  format: FormatId;     // 'old-school' | 'premodern' | 'pioneer' | 'modern' | 'standard' | 'legacy' | 'pauper' | 'commander'
  mode: ModeId;         // 'heads-up' | 'multiplayer'
  buyIn: BuyIn;         // 'for_fun'
  bestOf: BestOf;       // 'BO1' | 'BO3' | 'BO5'
  status: TournamentStatus; // 'in_registrazione' | 'iniziata' | 'terminata'
  maxPlayers: number;   // 2 for heads-up (ALWAYS 1v1)
  participants: Participant[]; // [{id: string, username: string}]
  createdAt: string;    // ISO 8601
  isPrivate?: boolean;  // optional, defaults false
}

// Membership state managed by use-membership.ts hook
interface MembershipState {
  status: 'none' | 'active' | 'skipped' | 'pending';
  cardNumber?: string;    // e.g. "EBX-2026-00042"
  tier: 'standard' | 'gold' | 'platinum';
  firstName?: string;
  lastName?: string;
  club?: string;
  enrolledAt?: string;  // ISO 8601
  expiresAt?: string;   // ISO 8601 (annual renewal)
}
```

### 2.4 WebRTC Signaling Protocol (Reverse Engineered)

From `lib/webrtc/signaling.ts` and the webcam API route:

```
Tournament Match Signaling (server-relayed):
  1. PC (host role) calls POST /api/tornei/webcam/{sessionId} with {from: 'host', kind: 'offer', data: RTCSdpInit}
  2. Phone (guest role) polls GET /api/tornei/webcam/{sessionId}?role=guest&since=0 at 600ms
  3. Phone sends POST with {from: 'guest', kind: 'answer', data: RTCSdpInit}
  4. Both sides exchange 'candidate' messages (ICE trickle)
  5. After P2P connection: either side sends {kind: 'bye'} to clean up
  Session TTL: 600 seconds. Max stored messages: 300. Backend store: Redis (or in-memory fallback)

Arcade Room Signaling (fully manual, NO server relay needed):
  1. Host calls createRoom() → RTCPeerConnection + DataChannel → waitIce() → encodeDesc(localDescription) → base64url string
  2. Host copies the base64url "offer code" and sends it to guest out-of-band (UI text field)
  3. Guest calls joinRoom(offerCode) → setRemoteDescription → createAnswer → waitIce() → encodeDesc(localDescription)
  4. Guest copies "answer code" back to host
  5. Host calls submitAnswer(answerCode) → setRemoteDescription → WebRTC P2P connected
  6. DataChannel sends JSON game_state messages directly P2P — no server involved
  
  ⚡ Key difference: Arcade P2P requires NO backend signaling. The server only stores leaderboard scores.
```

**The TS must provide an identical or enhanced signaling relay endpoint for TOURNAMENT MATCHES** — the Next.js API route will be replaced. Arcade room signaling is entirely client-side.

### 2.5 Tournament UI Refactor (v2)

The tournament list now includes:
- **Advanced filters**: format selector grid, mode selector, buy-in filter toggle
- **Sticky toolbar**: filters remain visible while scrolling the table
- **Desktop/Mobile separate views**: responsive layout with column prioritization
- **Status indicators**: colored badges for `in_registrazione` / `iniziata` / `terminata`
- **Participant count**: shows `X/maxPlayers` with a progress indicator

These UI changes translate to additional query parameters on the tournament listing endpoint:
```
GET /api/v1/tournaments?format=modern&mode=heads-up&buyIn=for_fun&status=in_registrazione&limit=50&offset=0
```

### 2.6 External Services Already in Use

| Service | Purpose | Auth Method |
|---|---|---|
| Ebartex Auth FastAPI (existing) | User auth, JWT RS256, MFA | Bearer JWT |
| BRX Sync Microservice | User inventory (`GET /api/v1/sync/inventory/{userId}`) | Bearer JWT |
| Meilisearch | Card catalog search | API key |
| CloudFront CDN | Static assets (images, fonts, videos) | Signed URLs |
| Upstash Redis | WebRTC signaling store (HTTP REST) | Bearer token |

---

## 3. Integration Map with ebartex.com

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         ebartex.com Ecosystem                                 │
│                                                                               │
│  ┌─────────────────────┐        ┌────────────────────────────────────────────┐│
│  │  ebartex.com         │  SSO   │  tournaments.ebartex.com                   ││
│  │  (Next.js frontend)  │◄──────►│  (Next.js 15 frontend)                     ││
│  │  new_frontend_brx    │cookies │  brx-tornei/frontend                       ││
│  └─────────────────────┘        └──────────┬───────────────────────────────  ││
│           │                                 │ Server Actions / RSC fetch       ││
│           │                                 │                                  ││
│  ┌────────▼────────────┐        ┌──────────▼──────────────────────────────┐  ││
│  │  Auth Microservice  │        │  Tournament Microservice (NEW — v2)      │  ││
│  │  FastAPI (existing) │◄──────►│  FastAPI + Python 3.12                  │  ││
│  │  JWT RS256          │  token │  ECS Fargate                            │  ││
│  │  /api/auth/*        │  verify│  tournaments-api.ebartex.com            │  ││
│  └────────┬────────────┘        └──────────┬──────────────────────────────┘  ││
│           │                                 │                                  ││
│  ┌────────▼──────────┐         ┌───────────▼──────────────────────────────┐  ││
│  │  BRX Sync Service │         │  Data Layer                               │  ││
│  │  (existing)       │         │  ┌─────────────┐  ┌───────────────┐      │  ││
│  │  /api/v1/sync/*   │         │  │  RDS Aurora  │  │ ElastiCache   │      │  ││
│  └───────────────────┘         │  │  PostgreSQL  │  │ Redis         │      │  ││
│                                 │  └─────────────┘  └───────────────┘      │  ││
│  ┌───────────────────┐         │                                            │  ││
│  │  Meilisearch      │         │  ┌───────────────────────────────────┐    │  ││
│  │  Card Catalog     │         │  │  SQS/SNS Event Bus                │    │  ││
│  └───────────────────┘         │  │  (notifications, analytics)       │    │  ││
│                                 │  └───────────────────────────────────┘    │  ││
│  ┌───────────────────┐         │                                            │  ││
│  │  CloudFront CDN   │         │  ┌───────────────────────────────────┐    │  ││
│  │  + S3 Buckets     │         │  │  AWS IVS (Spectator Broadcast)    │    │  ││
│  └───────────────────┘         │  │  Low-latency HLS → spectators     │    |  ││
│                                 │  └───────────────────────────────────┘    │  ││
│                                 └───────────────────────────────────────────┘  ││
└───────────────────────────────────────────────────────────────────────────────┘│
```

### 3.1 SSO Token Flow

The frontend receives a JWT `access_token` (RS256, signed by Auth microservice) stored in an HttpOnly cookie `ebartex_access_token`. The Tournament Service **validates this JWT locally** using the Auth service's public key (fetched at startup via `GET /api/auth/.well-known/jwks.json` and cached). No network round-trip to Auth service per request — pure in-process JWT validation.

```
Request → Tournament Service
  ├─ Extract Bearer token from Authorization header
  │   (frontend proxy sends it as a header, not a cookie, for API calls)
  ├─ Validate JWT signature against cached JWKS
  ├─ Check exp, iss, aud claims
  └─ Extract sub (user_id), email, roles, membership_status (if present in JWT)
```

### 3.2 Membership Integration

When a user first accesses `tournaments.ebartex.com`, the `MembershipGate` component checks their `status` via `useMembership()` hook. If `status === 'none'`, the user is redirected to `/associazione` where they fill out the `MembershipOnboardingForm`. The Tournament Service stores membership records and issues a `cardNumber` (format: `EBX-YYYY-NNNNN`). Membership is **annual** and must be renewed.

### 3.3 Cookie and CORS Configuration

| Origin | Allowed Methods | Notes |
|---|---|---|
| `https://tournaments.ebartex.com` | GET, POST, PUT, DELETE, OPTIONS | Main consumer |
| `https://www.ebartex.com` | GET, OPTIONS | Cross-check leaderboards |
| `http://localhost:3001` | GET, POST, PUT, DELETE, OPTIONS | Dev only |
| `http://localhost:3000` | GET, POST, PUT, DELETE, OPTIONS | Dev only |

All API responses include `Access-Control-Allow-Credentials: true`. JWT passed as `Authorization: Bearer <token>` header from server-side Next.js code.

---

## 4. Microservice Boundaries & Responsibilities

### 4.1 Existing Microservices (Not Modified)

| Service | Owner | Responsibility |
|---|---|---|
| `auth-service` | Ebartex Platform | User authentication, JWT issuance, MFA, passwordless |
| `sync-service` | Ebartex Platform | Card inventory sync, blueprint catalog |
| `meilisearch` | Ebartex Platform | Card catalog full-text search |

### 4.2 Tournament Service (This Document — New Build, v2)

The **Tournament Service** is a single Python FastAPI application with logical modules:

```
tournament-service/
├── api/
│   ├── v1/
│   │   ├── tournaments.py      # Tournament CRUD + lifecycle
│   │   ├── matches.py          # Match management + results
│   │   ├── signaling.py        # WebRTC signaling relay (HTTP polling + WebSocket)
│   │   ├── participants.py     # Join/leave/approve requests
│   │   ├── leaderboard.py      # Rankings per format
│   │   ├── notifications.py    # Push + in-app notifications
│   │   ├── health.py           # Health check endpoints
│   │   ├── membership.py       # Tessera enrollment, card management
│   │   └── arcade.py           # Arcade room leaderboard + room registry
│   └── ws/
│       ├── match_events.py     # WebSocket endpoint for live match state
│       ├── lobby.py            # Lobby updates
│       └── notifications.py    # User notification stream
├── core/
│   ├── auth.py                 # JWT validation (JWKS)
│   ├── config.py               # Settings (pydantic-settings)
│   ├── database.py             # SQLAlchemy async engine + session
│   ├── redis.py                # Redis client (aioredis)
│   └── exceptions.py           # Custom HTTP exceptions
├── services/
│   ├── tournament_service.py   # Business logic: create, list, filter
│   ├── match_service.py        # Business logic: start match, record results
│   ├── bracket_service.py      # Bracket generation (Swiss, elimination)
│   ├── signaling_service.py    # Signaling message store/relay
│   ├── leaderboard_service.py  # ELO calculation, ranking
│   ├── notification_service.py # Push/email/in-app notifications
│   ├── membership_service.py   # Tessera issuance, tier management
│   └── arcade_service.py       # Arcade score submission, room registry
├── models/
│   ├── tournament.py           # SQLAlchemy ORM models
│   ├── match.py
│   ├── participant.py
│   ├── signaling.py
│   ├── leaderboard.py
│   ├── membership.py           # NEW: tessera records, tier, club
│   └── arcade_score.py         # NEW: per-game high scores
├── schemas/
│   ├── tournament.py           # Pydantic request/response schemas
│   ├── match.py
│   ├── participant.py
│   ├── common.py
│   ├── membership.py           # NEW: MembershipState, EnrollRequest
│   └── arcade.py               # NEW: ScoreSubmit, LeaderboardEntry
├── workers/
│   ├── match_expiry.py         # Background worker: expire stale matches
│   └── notification_dispatch.py # SQS consumer for push notifications
├── migrations/                 # Alembic migrations
├── tests/
└── main.py                     # FastAPI app factory
```

### 4.3 Responsibility Matrix (Updated v2)

| Responsibility | Tournament Service | Auth Service | Sync Service | Frontend |
|---|---|---|---|---|
| Tournament CRUD | ✅ | ❌ | ❌ | calls TS |
| Match lifecycle | ✅ | ❌ | ❌ | calls TS |
| WebRTC signaling relay (matches) | ✅ | ❌ | ❌ | calls TS |
| WebRTC signaling (arcade) | ❌ (P2P direct) | ❌ | ❌ | fully client-side |
| Live match state (WebSocket) | ✅ | ❌ | ❌ | subscribes |
| Leaderboard/ELO | ✅ | ❌ | ❌ | reads TS |
| JWT validation | ✅ (local) | issues JWT | ❌ | proxies |
| **Membership/Tessera** | **✅ (new)** | ❌ | ❌ | calls TS |
| **Arcade leaderboard** | **✅ (new)** | ❌ | ❌ | calls TS |
| **Spectator broadcast (IVS)** | **✅ channel mgmt** | ❌ | ❌ | watches stream |
| User profile | reads via JWT | ✅ | ❌ | reads both |
| Card inventory | ❌ | ❌ | ✅ | reads Sync |
| Card catalog search | ❌ | ❌ | reads Meili | reads Meili |
| Push notifications | ✅ (dispatch) | ❌ | ❌ | receives |
| Bracket generation | ✅ | ❌ | ❌ | displays |

---

## 5. Technology Stack Choices & Rationale

### 5.1 Application Framework: FastAPI 0.115+

**Chosen**: FastAPI with Python 3.12  
**Rationale**:
- The existing Auth microservice is already FastAPI — same stack, shared institutional knowledge
- Async-native via `asyncio` + `uvicorn` — ideal for WebSocket connections and high-concurrency signaling
- Automatic OpenAPI/Swagger generation — essential for frontend contract validation
- Pydantic v2 for data validation — mirrors Zod validation philosophy of the frontend
- Python async ecosystem (aioredis, asyncpg, aiobotocore) is mature

### 5.2 ASGI Server: Uvicorn + Gunicorn

```
gunicorn -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:8000
```
- 4 workers per container (CPU: 2 vCPU target in production)
- Each worker handles thousands of concurrent WebSocket connections
- Graceful shutdown supported (ECS task stop → SIGTERM → 30s drain)

### 5.3 Database: PostgreSQL 16 via RDS Aurora Serverless v2

**Chosen**: Aurora PostgreSQL Serverless v2 with `asyncpg` driver via SQLAlchemy 2.0 async  
**New tables in v2**: `memberships`, `membership_history`, `arcade_scores`, `arcade_rooms`

### 5.4 Cache & Real-Time State: Redis 7 via ElastiCache

**Usage (new in v2)**:
- Arcade room registry (active P2P room codes, TTL 3600s)
- Membership status cache per user (TTL 300s)
- New Redis key conventions:
```
membership:status:{userId}           STRING  TTL: 300s   Cached membership state JSON
arcade:room:{roomCode}               HASH    TTL: 3600s  P2P room metadata
arcade:leaderboard:{gameId}          ZSET    NO TTL      user_id → high score
arcade:room:{roomCode}:offer         STRING  TTL: 600s   Encoded offer SDP (for server-assisted mode)
```

### 5.5 Message Queue: SQS + SNS

**New in v2**: `membership-events` SNS fan-out for:
- `membership.enrolled`: new tessera issued
- `membership.renewed`: annual renewal
- `membership.expired`: tessera expired (send reminder)

### 5.6 Spectator Video: AWS IVS

**Chosen**: AWS Interactive Video Service (IVS) for spectator broadcasting  
**Architecture**: 
- The match HOST streams their screen/camera to IVS via RTMP (using OBS or browser MediaRecorder)
- IVS provides a low-latency HLS playback URL (≤5s latency with LL-HLS)
- Spectators receive the IVS playback URL via the Tournament Service `GET /matches/{id}/stream`
- No video data passes through ECS Fargate tasks — IVS handles all ingestion and delivery

This cleanly separates the **bidirectional WebRTC** (host ↔ participant, server-signaled) from the **one-to-many broadcast** (host → N spectators, via IVS CDN).

---

## 6. AWS Architecture Overview

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  CloudFront Distribution                                                     │
│  Origins: ALB (API), S3 (assets), IVS (spectator HLS stream)               │
│  Behaviors:                                                                  │
│    /api/*      → ALB (no cache, forward auth header)                        │
│    /ws/*       → ALB (WebSocket upgrade, no cache)                          │
│    /assets/*   → S3 (cache 1 year, immutable)                              │
│    /stream/*   → IVS playback CDN (direct passthrough)                     │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Application Load   │
                    │  Balancer (ALB)     │
                    │  HTTPS :443         │
                    │  WS :443 /ws/*      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
   ┌──────────▼───────────┐       ┌─────────────▼──────────┐
   │  ECS Fargate Service │       │  ECS Fargate Service   │
   │  tournament-api      │       │  tournament-api        │
   │  (AZ-a)              │       │  (AZ-b)                │
   │  2 vCPU, 4GB RAM     │       │  2 vCPU, 4GB RAM       │
   │  4 uvicorn workers   │       │  4 uvicorn workers     │
   └──────────┬───────────┘       └─────────────┬──────────┘
              │                                 │
              └──────────────┬──────────────────┘
                             │
           ┌─────────────────┴──────────────────────┐
           │                                        │
┌──────────▼───────────┐            ┌───────────────▼────────────┐
│  RDS Aurora           │            │  ElastiCache Redis 7       │
│  PostgreSQL 16        │            │  Cluster Mode              │
│  Serverless v2        │            │  r7g.large (2 shards)      │
│  Primary + Reader     │            │  Multi-AZ                  │
│  PgBouncer sidecar    │            └────────────────────────────┘
└──────────────────────┘
           │
┌──────────▼──────────────────────────────────────┐
│  AWS IVS (Interactive Video Service)             │
│  ┌─────────────────┐  ┌────────────────────────┐ │
│  │  IVS Channel     │  │  IVS Playback URL       │ │
│  │  (per match)     │  │  → CDN → spectators     │ │
│  │  RTMP ingest     │  │  LL-HLS ≤5s latency     │ │
│  └─────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 6.1 Network: VPC Layout

```
VPC: 10.0.0.0/16
  Public Subnets (ALB, NAT GW):
    10.0.1.0/24  (AZ eu-south-1a)
    10.0.2.0/24  (AZ eu-south-1b)
  Private Subnets (ECS, RDS, Redis):
    10.0.10.0/24 (AZ eu-south-1a)
    10.0.11.0/24 (AZ eu-south-1b)
  Database Subnets:
    10.0.20.0/24 (AZ eu-south-1a)
    10.0.21.0/24 (AZ eu-south-1b)
```

**Primary region**: `eu-south-1` (Milan) — closest to the Italian player base per the UI (`🇮🇹` flag is most common in mock data). IVS is available in `eu-west-1` (Ireland) as nearest EU region with IVS support; use CloudFront to minimize latency for Italian viewers.

---

## 7. Security Architecture

### 7.1 Authentication Pipeline

```
Request arrives at Tournament Service
  ↓
Middleware: extract Authorization: Bearer <jwt>
  ↓
JWKS Cache (refreshed every 12h or on verify failure):
  GET https://api.ebartex.com/api/auth/.well-known/jwks.json
  ↓
python-jose verifies RS256 signature
  ↓
Claims extraction:
  sub → user_id (string, UUID format)
  email → user email
  name → display name (optional)
  roles → ["user"] or ["admin", "user"]
  exp → expiry check
  iss → must equal "https://api.ebartex.com"
  ↓
Inject into request state as CurrentUser dependency
  ↓
[NEW] Membership check for tournament endpoints:
  Check membership:status:{userId} in Redis (TTL 300s)
  If status === 'none' → 403 MEMBERSHIP_REQUIRED
  (Frontend gate handles redirect, but backend enforces it too)
```

### 7.2 RBAC (Role-Based Access Control)

| Role | Permissions |
|---|---|
| `anonymous` | Read public tournament listings (future: none required for listing) |
| `player` (authenticated user) | Create/join tournaments, submit match results, view own history |
| `player_with_membership` | All player perms + paid tournaments, premium features |
| `organizer` (elevated player) | Manage tournaments they created, approve/reject join requests |
| `admin` | Full access: manage any tournament, view all match data, ban users |

---

## 8. Scalability Strategy

### 8.1 Target Scale

| Metric | MVP Target | Scale Target |
|---|---|---|
| Concurrent users | 100 | 5,000 |
| Simultaneous tournaments | 20 | 500 |
| Active WebSocket connections | 50 | 10,000 |
| Signaling messages/sec | 10 | 2,000 |
| API requests/sec | 50 | 5,000 |
| DB connections | 20 | 400 (via PgBouncer) |
| **Concurrent spectators** | **N/A** | **10,000 (via IVS CDN)** |
| **Arcade P2P rooms** | **N/A** | **500 (no server load — P2P direct)** |
| **Membership enrollments/day** | **10** | **500** |

---

## 9. Data Flow Diagrams

### 9.1 Create Tournament Flow
*(unchanged from v1 — see §9.1 original)*

### 9.2 Join Tournament Flow
*(unchanged from v1 — see §9.2 original)*

### 9.3 WebRTC Signaling Flow (Tournament Match — Server Relayed)

```
PC (host) creates tournament and gets sessionId = tournamentId

PC → POST /api/v1/signaling/{sessionId}/messages
  { from: "host", kind: "offer", data: { sdp: "..." } }
  → Stored in Redis: RPUSH webcam:sig:{sessionId}:msgs

Phone (guest) opens /tornei/webcam/{sessionId} (no auth)
Phone → GET /api/v1/signaling/{sessionId}/messages?role=guest&since=0
  ← { messages: [{ seq: 1, from: "host", kind: "offer", data: {...} }] }

Phone → POST /api/v1/signaling/{sessionId}/messages
  { from: "guest", kind: "answer", data: { sdp: "..." } }

[ICE candidate exchange follows same pattern]

After P2P established:
  Video travels P2P (no server relay) — DTLS-SRTP encrypted
  Either side → POST .../messages { kind: "bye" }
  Redis key expires (TTL 600s)
```

### 9.4 Arcade Room P2P Flow (Fully Manual — No Server Relay)

```
User A (host) opens Kakegurui table:
  createRoom() → RTCPeerConnection + DataChannel → waitIce(2.5s) → encodeDesc → base64url
  UI shows: "Codice invito: eyJ0eXBlIjoib2ZmZXIi..."

User B (guest) opens same game:
  joinRoom(offerCode) → RTCPeerConnection → createAnswer → waitIce → encodeDesc → base64url
  UI shows: "Codice risposta: eyJ0eXBlIjoiYW5zd2Vy..."

User A calls submitAnswer(answerCode) → setRemoteDescription → P2P connected

DataChannel open: JSON game_state messages flow directly P2P
  { type: "game_state", player1Score: 1, player2Score: 0, currentRound: 2, phase: "reveal" }

Match ends → either side sends disconnect()
No server state to clean up — TTLs in Redis for any optional metadata
```

### 9.5 Spectator Live Stream Flow

```
Match starts → Tournament Service creates IVS channel:
  POST → AWS IVS CreateChannel
  Receives: { ingestEndpoint: "rtmps://...", streamKey: "sk_...", playbackUrl: "https://..." }
  Stores playbackUrl in match record

HOST player receives streamKey (via WebSocket notification):
  { event: "match.started", data: { match_id, webcam_session_id, ivs_stream_key } }
  HOST configures OBS or browser-based streaming → RTMPS ingest

Spectators visit match page:
  GET /api/v1/matches/{matchId}/stream → { playbackUrl: "https://..." }
  Frontend uses video element with LL-HLS src

IVS CDN delivers video to N spectators (potentially thousands)
  Latency: ~3-5 seconds (LL-HLS)
  No load on ECS Fargate or Redis for video delivery

Match ends → Tournament Service DeleteChannel (IVS)
  Recording optionally archived to S3 (IVS recording config)
```

### 9.6 Membership Enrollment Flow

```
New user visits tournaments.ebartex.com:
  MembershipGate checks → GET /api/v1/membership/me
  → { status: 'none' }
  → Frontend redirects to /associazione

User fills MembershipOnboardingForm:
  { firstName, lastName, birthDate, email, phone, city, club }
  → POST /api/v1/membership/enroll

Tournament Service:
  1. Validate JWT → extract user_id
  2. Validate input (Pydantic)
  3. Check: no existing active membership
  4. Generate cardNumber: "EBX-{YYYY}-{NNNNN:05d}"
  5. Insert membership record (PostgreSQL)
  6. Set membership:status:{userId} in Redis (TTL 300s) → { status: 'active' }
  7. Publish membership.enrolled event (SNS)
  8. Return 201 with MembershipResponse

User is redirected to /tessera:
  GET /api/v1/membership/card → card details + reveal animation data
```

---

## 10. Development Phases Overview

| Phase | Name | Duration | Key Deliverables |
|---|---|---|---|
| 0 | Foundation | 1 week | Scaffold, CI/CD, IaC (CDK), DB migrations, health checks |
| 1 | Core Tournament API | 2 weeks | CRUD endpoints, auth integration, tournament lifecycle |
| 2 | Match Management | 2 weeks | Match creation, result submission, game tracking |
| 3 | Real-Time WebSocket | 2 weeks | WebSocket server, Redis pub/sub, live match state |
| 4 | WebRTC Signaling | 1 week | Proper signaling endpoint replacing Next.js API route |
| 5 | Bracket Engine | 2 weeks | Swiss, single-elimination, seeding algorithms |
| 6 | Leaderboard & ELO | 1 week | Per-format ELO, ranking queries |
| 7 | Notifications | 1 week | In-app, email, push (future) |
| 8 | Admin & Analytics | 2 weeks | Admin endpoints, CloudWatch dashboards, event analytics |
| **9** | **Membership/Tessera** | **1 week** | **Enrollment, card issuance, gate enforcement, tier management** |
| **10** | **Arcade Room Backend** | **1 week** | **Leaderboard API, room registry, score persistence** |
| **11** | **Spectator IVS Integration** | **1 week** | **IVS channel management, playback URL distribution** |
| 12 | Hardening | 2 weeks | Load testing, security pen test, monitoring, runbooks |

**Total estimate**: 19 weeks (≈5 months) for full production-ready system with 2-person backend team.

**MVP for replacing mocks** (Phases 0–2): 5 weeks.  
**MVP + Membership** (Phases 0–2 + 9): 6 weeks.

---

## 11. Naming Conventions & Project Conventions

### 11.1 Repository Layout

```
brx-tornei/backend/           # This documentation
brx-tornei/tournament-service/ # Python application source (to be created)
brx-tornei/infrastructure/     # AWS CDK code (TypeScript)
brx-tornei/frontend/           # Next.js frontend (existing)
```

### 11.2 API Versioning

All endpoints under `/api/v1/`. Breaking changes → new version prefix. Non-breaking additions within v1.

### 11.3 Response Format

All successful responses:
```json
{
  "data": { ... },       // The actual payload
  "meta": {              // Optional pagination/metadata
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

All error responses:
```json
{
  "detail": "Human-readable error message in Italian (for user-facing) or English (for dev)",
  "code": "TOURNAMENT_NOT_FOUND",  // Machine-readable error code
  "field": "format"                // Optional: which field caused the error
}
```

### 11.4 Tournament Status Machine

```
in_registrazione ──► iniziata ──► terminata
       │                              ▲
       └──────────── cancelled ───────┘
                   (admin only)
```

### 11.5 Locale & Language

- API responses: field names in `snake_case` English
- Error messages in the `detail` field: Italian for user-facing errors (matching frontend pattern), English for developer/log errors

---

## 12. Membership & Tessera System

### 12.1 Overview

The membership system gates access to the tournament platform. Every Ebartex user must either:
1. **Enroll** (fill the `MembershipOnboardingForm` → receive a tessera with card number)
2. **Skip** (acknowledged but not enrolled — limited features, no rated tournaments)

The `MembershipGate` React component enforces this at the UI level. The backend enforces it at the API level for premium endpoints.

### 12.2 Membership Tiers

| Tier | Privileges | Annual Cost | Requirements |
|---|---|---|---|
| `standard` | Access all free tournaments, arcade room, leaderboard | Free | Just enroll |
| `gold` | + Paid tournaments (buy-in), priority matchmaking | €25/year | Verified club member |
| `platinum` | + Organizer privileges, custom tournament branding | €75/year | 50+ matches played, verified |

### 12.3 Card Number Format

```
EBX-{YEAR}-{SEQUENCE}
Example: EBX-2026-00042

Where:
  EBX = Ebartex prefix
  YEAR = year of enrollment (4 digits)
  SEQUENCE = sequential ID within the year (5 digits, zero-padded)
```

### 12.4 Data Model (PostgreSQL)

```sql
CREATE TABLE memberships (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         TEXT        NOT NULL UNIQUE,
    card_number     TEXT        NOT NULL UNIQUE,  -- EBX-YYYY-NNNNN
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','expired','suspended','skipped')),
    tier            VARCHAR(20) NOT NULL DEFAULT 'standard'
                        CHECK (tier IN ('standard','gold','platinum')),
    first_name      TEXT        NOT NULL,
    last_name       TEXT        NOT NULL,
    birth_date      DATE,
    email           TEXT,
    phone           TEXT,
    city            TEXT,
    club            TEXT,
    enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
    renewed_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_card ON memberships(card_number);
CREATE INDEX idx_memberships_status ON memberships(status, expires_at);
```

### 12.5 Membership Endpoints

```
GET  /api/v1/membership/me         → current user's membership state
POST /api/v1/membership/enroll     → submit enrollment form
POST /api/v1/membership/skip       → acknowledge and skip (limited access)
POST /api/v1/membership/renew      → annual renewal
GET  /api/v1/membership/card       → card number + visual data for reveal animation
GET  /api/v1/membership/clubs      → list of affiliated clubs (for the form dropdown)
```

---

## 13. Arcade Room & P2P Mini-Games

### 13.1 Architecture

The Arcade Room is a second isometric room within the `IsoRoomGame` canvas environment, accessible via a door from the Tournament Room. It contains 4 playable stations:

| Game | Type | P2P? | Server needed? |
|---|---|---|---|
| Kakegurui (Tavolo Duello) | Card RPS (Sasso/Carta/Forbice) | ✅ 1v1 WebRTC | No (manual signaling) |
| Stack Attack | Arcade timing | ❌ Single-player | No |
| TCG Jump | Platformer | ❌ Single-player | No |
| Card Memory | Memory puzzle | ❌ Single-player | No |

### 13.2 P2P Signaling (Arcade — Manual, No Server)

The `useP2PRoom.js` hook implements pure WebRTC with RTCPeerConnection + DataChannel. No server relay:
- Host creates offer → base64url-encodes SDP → displays as text to copy
- Guest pastes offer → creates answer → base64url-encodes → displays to copy back
- Host pastes answer → P2P connected
- All game messages flow via DataChannel (`{ type: 'game_state', ...payload }`)

**Implications for backend**: The backend does NOT need to implement arcade signaling relay. The backend only needs:
1. **Score submission endpoint**: `POST /api/v1/arcade/scores`
2. **Leaderboard endpoint**: `GET /api/v1/arcade/leaderboard/{gameId}`
3. **Room registry (optional)**: `POST /api/v1/arcade/rooms` for future server-assisted matchmaking

### 13.3 Token Economy

```
arcade_tickets ← earned in games (stored in localStorage for MVP, PostgreSQL for production)
  └── 5 tickets → 1 Arcade Pack (3 cosmetic cards)
  └── 20 tickets → "Gamer Retro" avatar skin
  └── 50 tickets → legendary card "High Score King"
```

### 13.4 Backend Endpoints (Arcade)

```
POST /api/v1/arcade/scores           → submit score for a completed game session
GET  /api/v1/arcade/leaderboard/{id} → global high scores for a mini-game
GET  /api/v1/arcade/me/scores        → current user's score history
POST /api/v1/arcade/rooms            → register a P2P room (optional, for matchmaking UI)
GET  /api/v1/arcade/rooms/{code}     → check if a room code is active
```

---

## 14. Three-Role Infrastructure Model

This section defines the **fundamental infrastructure distinction** between the three user roles in a tournament match. This distinction drives all WebRTC, video, and bandwidth architecture decisions.

### 14.1 Role Definitions

| Role | Description | Video Direction | Bandwidth per participant | Server load |
|---|---|---|---|---|
| **HOST (Organizer)** | Creates the room, manages the match, streams camera | Bidirectional WebRTC (sends + receives) | ↑ 1–3 Mbps + ↓ 1–3 Mbps | Signaling relay only |
| **PARTICIPANT (Player)** | Joins the 1v1 match, plays against the host | Bidirectional WebRTC (sends + receives) | ↑ 1–3 Mbps + ↓ 1–3 Mbps | Signaling relay only |
| **SPECTATOR (Viewer)** | Watches the match live, read-only | One-way broadcast (receives only) | ↓ 1–4 Mbps | IVS CDN (no server load) |

### 14.2 Infrastructure Consequences

```
TOURNAMENT ROOM (1v1):
  HOST ←──── WebRTC P2P ────► PARTICIPANT
      │                            │
      │    [SDP signaling relay]    │
      └────────► TS API ◄──────────┘
                   (Redis)
      
  SPECTATORS (N viewers):
      HOST → RTMP → IVS Ingest → IVS CDN → N spectators
      (N can be 0 to 10,000+ — IVS scales independently)

ARCADE ROOM (P2P no server):
  PLAYER_A ←──── WebRTC P2P ────► PLAYER_B
  (manual offer/answer via UI, no server relay at all)
```

### 14.3 Scalability by Role

| Metric | Host | Participant | Spectator |
|---|---|---|---|
| Server signaling load | Low (100 msg/session) | Low (100 msg/session) | Zero |
| Bandwidth through server | ~0 Mbps (P2P after signaling) | ~0 Mbps (P2P after signaling) | ~0 Mbps (IVS CDN) |
| Concurrent scalability | Limited by ECS signaling capacity | Same as host | Unlimited (IVS) |
| Infrastructure needed | STUN/TURN + Redis signaling | Same | IVS channel + CDN |
| Cost per room | ~$0.001/min (signaling only) | Included in room cost | ~$0.0001/viewer-min (IVS) |

---

*End of Master Blueprint v2.0 — see `01_FUNCTIONAL_REQUIREMENTS.md` through `06_SECURITY_CHECKLIST.md` for exhaustive detail on each dimension. See `07_INFRASTRUCTURE_COMPARISON.md` for multi-provider analysis and `09_ARCADE_ROOM_SPEC.md` for full arcade technical spec.*
