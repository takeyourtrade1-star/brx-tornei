# 02 — Technical Specification

> **Document type**: Technical Specification  
> **Version**: 2.0  
> **Service**: Tournament Service — Python FastAPI  
> **Covers**: Data models, API contracts, WebSocket events, DB schema, Redis structures, event system  
> **Updated**: June 2026 — added Membership schemas, Arcade Room schemas, IVS integration, 3-role model, TURN server

---

## Table of Contents

1. [Pydantic Schemas (Request/Response)](#1-pydantic-schemas-requestresponse)
2. [REST API Endpoints — Complete Specification](#2-rest-api-endpoints--complete-specification)
3. [WebSocket Events — Complete Specification](#3-websocket-events--complete-specification)
4. [PostgreSQL Database Schema](#4-postgresql-database-schema)
5. [Redis Data Structures and TTLs](#5-redis-data-structures-and-ttls)
6. [Domain Events (SQS/SNS)](#6-domain-events-sqssns)
7. [External Service Integrations](#7-external-service-integrations)
8. [Caching Strategy Details](#8-caching-strategy-details)
9. [Rate Limiting Implementation](#9-rate-limiting-implementation)
10. [Membership Schemas and Endpoints (NEW)](#10-membership-schemas-and-endpoints-new)
11. [Arcade Room Schemas and Endpoints (NEW)](#11-arcade-room-schemas-and-endpoints-new)
12. [IVS Integration Spec (NEW)](#12-ivs-integration-spec-new)

---

## 1. Pydantic Schemas (Request/Response)

*(All schemas from v1.0 are unchanged. See sections 1.1–1.6 of original document. New schemas below.)*

### 1.1 Common Types (unchanged)
### 1.2 Tournament Schemas (unchanged)
### 1.3 Match Schemas (unchanged)
### 1.4 Signaling Schemas (unchanged)
### 1.5 Leaderboard Schemas (unchanged)
### 1.6 Notification Schemas (unchanged — see original doc)

### 1.7 Membership Schemas (NEW)

```python
# schemas/membership.py
from enum import Enum
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, date

class MembershipStatus(str, Enum):
    none = "none"
    active = "active"
    expired = "expired"
    suspended = "suspended"
    skipped = "skipped"

class MembershipTier(str, Enum):
    standard = "standard"
    gold = "gold"
    platinum = "platinum"

CLUBS = [
    "Ebartex Digital",
    "Ebartex Milano Centro",
    "Ebartex Roma Tuscolana",
    "Ebartex Torino Lingotto",
    "Ebartex Napoli Vomero",
    "Ebartex Bologna Fiera",
    "Online / Nessun circolo",
]

# ── Request Schemas ──────────────────────────────────────────────

class EnrollMembershipRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    birth_date: date = Field(..., description="ISO 8601 date, YYYY-MM-DD")
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=30)
    city: Optional[str] = Field(None, max_length=100)
    club: str = Field(..., description="Must be one of the registered clubs")
    consent: bool = Field(..., description="User must accept the Ebartex member regulations")

    @field_validator("birth_date")
    @classmethod
    def validate_age(cls, v: date) -> date:
        from datetime import date as date_type
        today = date_type.today()
        age = (today - v).days / 365.25
        if age < 16:
            raise ValueError("L'utente deve avere almeno 16 anni per iscriversi.")
        return v

    @field_validator("club")
    @classmethod
    def validate_club(cls, v: str) -> str:
        if v not in CLUBS:
            raise ValueError(f"Club non riconosciuto. Valori ammessi: {', '.join(CLUBS)}")
        return v

    @field_validator("consent")
    @classmethod
    def must_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("È necessario accettare il regolamento per procedere.")
        return v

class SkipMembershipRequest(BaseModel):
    acknowledged: bool = True  # user acknowledges limited access

class RenewMembershipRequest(BaseModel):
    pass  # no body needed for now; future: payment token

# ── Response Schemas ──────────────────────────────────────────────

class MembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    card_number: Optional[str] = None  # None if skipped
    status: MembershipStatus
    tier: MembershipTier
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    club: Optional[str] = None
    enrolled_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    renewed_at: Optional[datetime] = None

class MembershipStatusResponse(BaseModel):
    """Minimal response for the gate check (GET /membership/me)."""
    status: MembershipStatus  # 'none' if no record exists
    tier: Optional[MembershipTier] = None
    card_number: Optional[str] = None
    expires_at: Optional[datetime] = None
    days_until_expiry: Optional[int] = None  # Negative if expired

class MembershipCardResponse(BaseModel):
    """Card data for the reveal animation."""
    card_number: str
    tier: MembershipTier
    member_name: str
    club: str
    enrolled_at: str  # formatted "YYYY-MM-DD"
    expires_at: str   # formatted "YYYY-MM-DD"
    reveal_animation: str  # "card_flip_reveal" (future: tier-specific)
    qr_data: str      # data to encode in QR: "EBARTEX:{card_number}:{user_id_hash}"
```

### 1.8 Arcade Room Schemas (NEW)

```python
# schemas/arcade.py
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ArcadeGameId(str, Enum):
    stack_attack = "stack_attack"
    tcg_jump = "tcg_jump"
    card_memory = "card_memory"
    kakegurui = "kakegurui"

GAME_SCORE_LIMITS = {
    "stack_attack":  9_999_999,
    "tcg_jump":      9_999_999,
    "card_memory":   9_999_999,
    "kakegurui":     999,          # Win/loss count, not a score
}

TICKET_THRESHOLDS = {
    # (game_id, score_threshold): tickets_earned
    ("stack_attack",  20):   1,  # 20+ cards stacked
    ("stack_attack",  50):   3,
    ("tcg_jump",       1):   1,  # any level completed
    ("tcg_jump",       3):   5,  # all 3 levels
    ("card_memory",    1):   1,
    ("card_memory",    3):   3,
    ("kakegurui",      2):   2,  # won a best-of-3
}

# ── Request Schemas ──────────────────────────────────────────────

class SubmitScoreRequest(BaseModel):
    game_id: ArcadeGameId
    score: int = Field(..., ge=0, le=9_999_999)
    level_reached: int = Field(0, ge=0, le=3)  # 0 for P2P games
    session_duration_ms: int = Field(..., ge=0, le=3_600_000)  # max 1 hour
    idempotency_key: Optional[str] = Field(None, max_length=64)  # prevent double-submit

class CreateArcadeRoomRequest(BaseModel):
    game_id: ArcadeGameId
    offer_code: str = Field(..., min_length=10, max_length=5000, 
                            description="base64url-encoded WebRTC offer SDP")
    room_name: Optional[str] = Field(None, max_length=50)

class SpendTicketsRequest(BaseModel):
    amount: int = Field(..., ge=1, le=50)
    reward_id: str = Field(..., pattern=r'^(arcade_pack|gamer_retro_skin|high_score_king_card)$')
    idempotency_key: str = Field(..., max_length=64)

# ── Response Schemas ──────────────────────────────────────────────

class ArcadeScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    game_id: ArcadeGameId
    score: int
    level_reached: int
    session_duration_ms: int
    tickets_earned: int
    is_personal_best: bool
    global_rank: Optional[int] = None  # rank on global leaderboard
    played_at: datetime

class ArcadeLeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    score: int
    level_reached: int
    achieved_at: datetime

class ArcadeLeaderboardResponse(BaseModel):
    game_id: ArcadeGameId
    entries: list[ArcadeLeaderboardEntry]
    total_players: int
    last_updated_at: str

class ArcadeRoomResponse(BaseModel):
    room_code: str          # 6-char alphanumeric
    game_id: ArcadeGameId
    host_username: str
    offer_code: str         # base64url offer SDP for the guest to use
    created_at: datetime
    expires_at: datetime

class WalletResponse(BaseModel):
    tickets: int
    lifetime_earned: int
    lifetime_spent: int
    unlocked_rewards: list[str]  # reward_ids already claimed
```

### 1.9 IVS Stream Schemas (NEW)

```python
# schemas/stream.py
from pydantic import BaseModel
from typing import Optional

class MatchStreamResponse(BaseModel):
    match_id: str
    playback_url: str             # HLS/LL-HLS URL for spectators
    is_live: bool                 # True if host is currently streaming
    spectator_count: int
    stream_started_at: Optional[str] = None

class IVSChannelConfig(BaseModel):
    """Internal schema for IVS channel management."""
    channel_arn: str
    ingest_endpoint: str          # RTMPS ingest URL (delivered to HOST only)
    stream_key: str               # RTMPS stream key (delivered to HOST only)
    playback_url: str             # Public HLS URL
    channel_name: str             # e.g. "match-{matchId}"
```

---

## 2. REST API Endpoints — Complete Specification

*(All endpoints from v1.0 §2.1–2.10 remain unchanged. New endpoints below.)*

### 2.11 Membership Endpoints

#### `GET /api/v1/membership/me`

Check current user's membership status.

**Auth**: Required  
**Response 200**:
```json
{
  "data": {
    "status": "active",
    "tier": "standard",
    "card_number": "EBX-2026-00042",
    "expires_at": "2027-06-25T00:00:00Z",
    "days_until_expiry": 365,
    "first_name": "Marco",
    "last_name": "Rossi",
    "club": "Ebartex Milano Centro"
  }
}
```
If no record: `{ "data": { "status": "none" } }` (200)  
**Errors**: `401`

---

#### `POST /api/v1/membership/enroll`

Submit membership enrollment form.

**Auth**: Required  
**Request body**:
```json
{
  "first_name": "Marco",
  "last_name": "Rossi",
  "birth_date": "1995-04-15",
  "email": "marco@example.com",
  "phone": "+39 333 1234567",
  "city": "Milano",
  "club": "Ebartex Milano Centro",
  "consent": true
}
```

**Response 201**:
```json
{
  "data": {
    "id": "membership-uuid",
    "card_number": "EBX-2026-00042",
    "status": "active",
    "tier": "standard",
    "enrolled_at": "2026-06-25T10:00:00Z",
    "expires_at": "2027-06-25T10:00:00Z"
  }
}
```

**Errors**: `401`, `409` (already enrolled), `422` (validation), `429` (rate limited)

---

#### `POST /api/v1/membership/skip`

Acknowledge and skip membership (limited access mode).

**Auth**: Required  
**Request body**: `{}`  
**Response 200**: `{ "data": { "status": "skipped", "message": "Puoi completare l'iscrizione in qualsiasi momento." } }`

---

#### `GET /api/v1/membership/card`

Get card data for the reveal animation.

**Auth**: Required  
**Response 200**: `MembershipCardResponse`  
**Errors**: `401`, `404` (no active membership)

---

#### `POST /api/v1/membership/renew`

Renew expiring or expired membership.

**Auth**: Required  
**Response 200**: Updated `MembershipResponse`  
**Errors**: `401`, `400` (renewal not yet eligible — more than 30 days until expiry)

---

#### `GET /api/v1/membership/clubs`

List registered clubs.

**Auth**: Not required  
**Response 200**: `{ "data": ["Ebartex Digital", "Ebartex Milano Centro", ...] }`  
**Cache**: 1 hour

---

### 2.12 Arcade Endpoints

#### `POST /api/v1/arcade/scores`

Submit score for a completed game session.

**Auth**: Required  
**Request body**: `SubmitScoreRequest`  
**Response 200**: `ArcadeScoreResponse`  
**Errors**: `401`, `422`, `429`

---

#### `GET /api/v1/arcade/leaderboard/{game_id}`

Get global leaderboard for a mini-game.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `limit` | int | No | Default 50, max 100 |
| `offset` | int | No | Default 0 |

**Auth**: Not required  
**Response 200**: `ArcadeLeaderboardResponse`  
**Errors**: `404` (invalid game_id)

---

#### `GET /api/v1/arcade/leaderboard/{game_id}/me`

Current user's best score and rank.

**Auth**: Required  
**Response 200**: `ArcadeLeaderboardEntry` + user data  
**Errors**: `401`, `404` (user hasn't played this game)

---

#### `GET /api/v1/arcade/me/scores`

Current user's score history.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `game_id` | string | No | Filter by game |
| `limit` | int | No | Default 20, max 100 |
| `offset` | int | No | Default 0 |

**Auth**: Required  
**Response 200**: Paginated `ArcadeScoreResponse` list

---

#### `POST /api/v1/arcade/rooms`

Register a P2P room for server-assisted matchmaking (optional).

**Auth**: Required  
**Request body**: `CreateArcadeRoomRequest`  
**Response 201**: `ArcadeRoomResponse`  
**Errors**: `401`, `422`, `429`

---

#### `GET /api/v1/arcade/rooms/{room_code}`

Get P2P room details for a guest to join.

**Auth**: Not required  
**Response 200**: `ArcadeRoomResponse` (includes `offer_code` for the guest)  
**Errors**: `404` (room not found or expired)

---

#### `GET /api/v1/arcade/me/wallet`

Current user's ticket balance.

**Auth**: Required  
**Response 200**: `WalletResponse`

---

#### `POST /api/v1/arcade/me/wallet/spend`

Spend tickets on a reward.

**Auth**: Required  
**Request body**: `SpendTicketsRequest`  
**Response 200**: `{ "data": { "reward_id": "arcade_pack", "tickets_remaining": N, "unlocked": true } }`  
**Errors**: `401`, `400 INSUFFICIENT_TICKETS`, `409` (already unlocked this reward)

---

### 2.13 Stream Endpoints

#### `GET /api/v1/matches/{match_id}/stream`

Get playback URL for spectating a match.

**Auth**: Not required for public matches  
**Response 200**: `MatchStreamResponse`  
**Errors**: `404`, `403` (private match)

---

#### `POST /api/v1/matches/{match_id}/stream/reset-key`

Reset IVS stream key (organizer only, e.g., if key was compromised).

**Auth**: Required (organizer only)  
**Response 200**: `{ "data": { "new_stream_key_delivered_via_ws": true } }` (key sent via WS, NOT in HTTP response)  
**Errors**: `401`, `403`, `404`

---

#### `GET /api/v1/matches/{match_id}/spectators`

Get current spectator count.

**Auth**: Not required  
**Response 200**: `{ "data": { "count": 42 } }`

---

### 2.14 ICE Server Configuration Endpoint

#### `GET /api/v1/signaling/ice-servers`

Get ICE server configuration including TURN credentials.

**Auth**: Required  
**Response 200**:
```json
{
  "data": {
    "ice_servers": [
      { "urls": "stun:stun.l.google.com:19302" },
      { "urls": "stun:stun1.l.google.com:19302" },
      {
        "urls": "turn:turn.ebartex.com:3478",
        "username": "1751882400:user-uuid",
        "credential": "hmac_sha1_credential"
      },
      {
        "urls": "turns:turn.ebartex.com:5349",
        "username": "1751882400:user-uuid",
        "credential": "hmac_sha1_credential"
      }
    ],
    "expires_at": "2026-06-26T10:00:00Z"
  }
}
```

**Implementation (TURN credential generation)**:
```python
# HMAC-SHA1 ephemeral credential (coturn compatible)
import hmac, hashlib, base64, time

def generate_turn_credentials(user_id: str, secret: str, ttl: int = 86400) -> tuple[str, str]:
    expires = int(time.time()) + ttl
    username = f"{expires}:{user_id}"
    credential = base64.b64encode(
        hmac.new(secret.encode(), username.encode(), hashlib.sha1).digest()
    ).decode()
    return username, credential
```

---

## 3. WebSocket Events — Complete Specification

*(All events from v1.0 §3.1–3.4 remain unchanged. New events below.)*

### 3.5 New Match WebSocket Events (v2)

| Event | Trigger | Data | Role |
|---|---|---|---|
| `match.stream_ready` | IVS ingest receives first bytes | `{ ivs_stream_key, ingest_endpoint }` | HOST only |
| `match.spectator_count` | Spectator joins/leaves (10s interval) | `{ count: N }` | ALL |
| `match.connection_warning` | Poor P2P connection detected | `{ player_user_id, rtt_ms, reason }` | PARTICIPANTS |
| `match.ivs_created` | IVS channel provisioned | `{ playback_url }` | ALL |
| `membership.expiry_reminder` | Membership expires in ≤30 days | `{ days_remaining: N }` | Notif WS |

### 3.6 Arcade WebSocket Events (Future — not Phase 1)

| Event | Channel | Trigger | Data |
|---|---|---|---|
| `arcade.score_update` | `lobby:arcade:{gameId}` | New high score set | `{ username, score, previous_rank }` |
| `arcade.room_available` | `lobby:arcade:kakegurui` | New P2P room registered | `{ room_code, host_username }` |

---

## 4. PostgreSQL Database Schema

*(All tables from v1.0 §4.1 remain unchanged. New tables below.)*

### 4.2 New Tables (v2)

```sql
-- ─────────────────────────────────────────
-- MEMBERSHIPS
-- ─────────────────────────────────────────
CREATE TABLE memberships (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         TEXT        NOT NULL UNIQUE,
    card_number     TEXT        UNIQUE,         -- NULL if status = 'none' or 'skipped'
    status          VARCHAR(20) NOT NULL DEFAULT 'none'
                        CHECK (status IN ('none','active','expired','suspended','skipped')),
    tier            VARCHAR(20) NOT NULL DEFAULT 'standard'
                        CHECK (tier IN ('standard','gold','platinum')),
    first_name      TEXT,
    last_name       TEXT,
    birth_date      DATE,
    email           TEXT,
    phone           TEXT,
    city            TEXT,
    club            TEXT,
    consent_given   BOOLEAN     NOT NULL DEFAULT FALSE,
    enrolled_at     TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    renewed_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_card ON memberships(card_number) WHERE card_number IS NOT NULL;
CREATE INDEX idx_memberships_status ON memberships(status, expires_at);
CREATE INDEX idx_memberships_club ON memberships(club) WHERE status = 'active';

-- Sequence for card numbers within a year
CREATE SEQUENCE card_number_seq_2026 START WITH 1 INCREMENT BY 1 MAXVALUE 99999;
-- Note: New sequences created per year in the membership service layer

-- ─────────────────────────────────────────
-- ARCADE SCORES
-- ─────────────────────────────────────────
CREATE TABLE arcade_scores (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             TEXT        NOT NULL,
    game_id             VARCHAR(30) NOT NULL
                            CHECK (game_id IN ('stack_attack','tcg_jump','card_memory','kakegurui')),
    score               INTEGER     NOT NULL DEFAULT 0 CHECK (score >= 0),
    level_reached       SMALLINT    NOT NULL DEFAULT 0 CHECK (level_reached BETWEEN 0 AND 3),
    session_duration_ms INTEGER     NOT NULL DEFAULT 0,
    tickets_earned      SMALLINT    NOT NULL DEFAULT 0,
    is_personal_best    BOOLEAN     NOT NULL DEFAULT FALSE,
    idempotency_key     TEXT,
    played_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (played_at);

CREATE TABLE arcade_scores_2026_06 PARTITION OF arcade_scores
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE arcade_scores_2026_07 PARTITION OF arcade_scores
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE INDEX idx_arcade_scores_user ON arcade_scores(user_id, game_id, score DESC);
CREATE INDEX idx_arcade_scores_game ON arcade_scores(game_id, score DESC);
CREATE UNIQUE INDEX idx_arcade_idempotency ON arcade_scores(user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- ─────────────────────────────────────────
-- ARCADE WALLETS (ticket balances)
-- ─────────────────────────────────────────
CREATE TABLE arcade_wallets (
    user_id             TEXT        PRIMARY KEY,
    tickets             INTEGER     NOT NULL DEFAULT 0 CHECK (tickets >= 0),
    lifetime_earned     INTEGER     NOT NULL DEFAULT 0,
    lifetime_spent      INTEGER     NOT NULL DEFAULT 0,
    unlocked_rewards    TEXT[]      NOT NULL DEFAULT '{}',
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- IVS CHANNELS (per match stream)
-- ─────────────────────────────────────────
CREATE TABLE ivs_channels (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id        UUID        NOT NULL REFERENCES matches(id),
    channel_arn     TEXT        NOT NULL UNIQUE,
    ingest_endpoint TEXT        NOT NULL,
    stream_key      TEXT        NOT NULL,  -- stored encrypted
    playback_url    TEXT        NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'created'
                        CHECK (status IN ('created','live','idle','archived','deleted')),
    recording_enabled BOOLEAN   NOT NULL DEFAULT FALSE,
    recording_s3_url  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stream_started_at TIMESTAMPTZ,
    stream_ended_at   TIMESTAMPTZ,
    deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_ivs_channels_match ON ivs_channels(match_id);
CREATE INDEX idx_ivs_channels_status ON ivs_channels(status) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────
-- ARCADE P2P ROOMS (optional server-assisted matchmaking)
-- ─────────────────────────────────────────
CREATE TABLE arcade_rooms (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code       VARCHAR(6)  NOT NULL UNIQUE,
    game_id         VARCHAR(30) NOT NULL,
    host_user_id    TEXT        NOT NULL,
    host_username   TEXT        NOT NULL,
    offer_code      TEXT        NOT NULL,  -- base64url offer SDP
    room_name       TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'waiting'
                        CHECK (status IN ('waiting','connected','expired')),
    guest_joined_at TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_arcade_rooms_code ON arcade_rooms(room_code) WHERE status = 'waiting';
CREATE INDEX idx_arcade_rooms_expires ON arcade_rooms(expires_at) WHERE status = 'waiting';

-- ─────────────────────────────────────────
-- MATCHES TABLE: add IVS fields
-- ─────────────────────────────────────────
ALTER TABLE matches ADD COLUMN ivs_channel_id UUID REFERENCES ivs_channels(id);
ALTER TABLE matches ADD COLUMN ivs_playback_url TEXT;  -- denormalized for fast access
ALTER TABLE matches ADD COLUMN spectator_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE matches ADD COLUMN enable_recording BOOLEAN NOT NULL DEFAULT FALSE;

-- ─────────────────────────────────────────
-- TOURNAMENTS TABLE: add filter-support fields
-- ─────────────────────────────────────────
ALTER TABLE tournaments ADD COLUMN buy_in_amount NUMERIC(10,2) DEFAULT 0;  -- for future paid tournaments
-- Note: buy_in column already exists as VARCHAR, add buy_in_amount for future monetization
```

### 4.3 Database Constraints for 1v1 Immutability

```sql
-- Enforce that heads-up tournaments ALWAYS have exactly 2 max players
ALTER TABLE tournaments ADD CONSTRAINT check_heads_up_max_players
    CHECK (mode != 'heads-up' OR max_players = 2);

-- Enforce that heads-up matches have exactly 2 players
-- (handled at application layer, but the FK + participant count check enforces it)
```

---

## 5. Redis Data Structures and TTLs

*(All keys from v1.0 §5.1 remain unchanged. New keys below.)*

### 5.2 New Redis Keys (v2)

```
# Membership Cache
membership:status:{userId}           STRING  TTL: 300s   Full MembershipStatusResponse JSON
membership:card:{userId}             STRING  TTL: 3600s  MembershipCardResponse JSON

# Arcade Leaderboards
arcade:leaderboard:{gameId}          ZSET    NO TTL      user_id → high score
arcade:leaderboard:{gameId}:meta     STRING  TTL: 10s    { total_players, last_updated_at }

# Arcade P2P Room Registry
arcade:room:{roomCode}               HASH    TTL: 1800s  { game_id, host_user_id, offer_code, ... }
arcade:rooms:active                  SET     NO TTL      Set of active room codes

# Arcade Wallet Cache
arcade:wallet:{userId}               STRING  TTL: 300s   WalletResponse JSON

# IVS Channel Metadata
ivs:channel:{matchId}                HASH    TTL: 86400s { channel_arn, playback_url, status }
ivs:live_matches                     SET     TTL: 10s    Set of matchIds currently live on IVS

# Spectator Count
match:spectators:{matchId}           SET     TTL: 7200s  Set of user_ids (or session IDs for anon)
match:spectators:{matchId}:count     STRING  TTL: 60s    Cached count (SCARD is O(1) but we cache)

# TURN Credential Cache (prevent re-generation for same user within TTL)
turn:creds:{userId}                  HASH    TTL: 86400s { username, credential, expires_at }
```

### 5.3 Arcade Room Code Generation

```python
# services/arcade_service.py
import random, string

def generate_room_code() -> str:
    """Generate a 6-character alphanumeric room code (human-readable)."""
    # Exclude ambiguous chars: 0/O, 1/I/l
    chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    return "".join(random.choices(chars, k=6))

async def create_arcade_room(
    game_id: str, offer_code: str, host_user: UserClaims, 
    db: AsyncSession, redis: Redis
) -> dict:
    code = generate_room_code()
    # Ensure uniqueness (retry if collision)
    while await redis.exists(f"arcade:room:{code}"):
        code = generate_room_code()
    
    room_data = {
        "room_code": code, "game_id": game_id,
        "host_user_id": host_user.user_id, "host_username": host_user.name or host_user.email,
        "offer_code": offer_code, "created_at": datetime.now(UTC).isoformat(),
        "expires_at": (datetime.now(UTC) + timedelta(minutes=30)).isoformat(),
        "status": "waiting",
    }
    await redis.hset(f"arcade:room:{code}", mapping=room_data)
    await redis.expire(f"arcade:room:{code}", 1800)  # 30 minutes
    await redis.sadd("arcade:rooms:active", code)
    
    # Persist to PostgreSQL for historical analytics
    db.add(ArcadeRoom(**room_data))
    await db.commit()
    
    return room_data
```

---

## 6. Domain Events (SQS/SNS)

*(All events from v1.0 §6.1–6.4 remain unchanged. New events below.)*

### 6.5 New Domain Events (v2)

| Event Type | Trigger | Data Fields |
|---|---|---|
| `membership.enrolled` | POST /membership/enroll | `user_id`, `card_number`, `tier`, `club`, `enrolled_at` |
| `membership.renewed` | POST /membership/renew | `user_id`, `card_number`, `old_expires_at`, `new_expires_at` |
| `membership.expired` | Daily worker | `user_id`, `card_number`, `expired_at` |
| `membership.skipped` | POST /membership/skip | `user_id`, `skipped_at` |
| `membership.tier_changed` | Admin upgrade | `user_id`, `old_tier`, `new_tier`, `changed_by` |
| `arcade.high_score` | New personal best | `user_id`, `game_id`, `score`, `previous_best`, `global_rank` |
| `arcade.reward_unlocked` | Spend tickets | `user_id`, `reward_id`, `tickets_spent` |
| `stream.channel_created` | IVS CreateChannel | `match_id`, `channel_arn`, `playback_url` |
| `stream.channel_deleted` | Match end/cancel | `match_id`, `channel_arn`, `duration_seconds` |

### 6.6 SQS Queue Updates

| Queue | New Subscriptions |
|---|---|
| `tournament-notifications-queue` | + `membership.enrolled`, `membership.expired`, `membership.tier_changed` |
| `tournament-analytics-queue` | + All `arcade.*`, `membership.*`, `stream.*` events |

---

## 7. External Service Integrations

*(All integrations from v1.0 §7.1–7.3 remain unchanged. New integrations below.)*

### 7.4 AWS IVS (Interactive Video Service)

```python
# services/ivs_service.py
import aiobotocore.session
from typing import Optional

IVS_REGION = "eu-west-1"  # nearest EU region with IVS support

async def create_ivs_channel(match_id: str, enable_recording: bool = False) -> dict:
    """Create an IVS channel for a match. Returns channel config."""
    session = aiobotocore.session.get_session()
    async with session.create_client("ivs", region_name=IVS_REGION) as client:
        channel_resp = await client.create_channel(
            name=f"match-{match_id}",
            latencyMode="LOW",          # LL-HLS, ~3-5 second latency
            type="STANDARD",            # 1080p, 8.5 Mbps max
            recordingConfigurationArn=(
                settings.ivs_recording_config_arn if enable_recording else None
            ),
            tags={"match_id": match_id, "service": "tournament-service"},
        )
        channel = channel_resp["channel"]
        stream_key_resp = await client.create_stream_key(channelArn=channel["arn"])
        return {
            "channel_arn": channel["arn"],
            "ingest_endpoint": f"rtmps://{channel['ingestEndpoint']}:443/app/",
            "stream_key": stream_key_resp["streamKey"]["value"],
            "playback_url": channel["playbackUrl"],
        }

async def delete_ivs_channel(channel_arn: str) -> None:
    """Delete IVS channel after match ends."""
    session = aiobotocore.session.get_session()
    async with session.create_client("ivs", region_name=IVS_REGION) as client:
        # Delete stream keys first
        keys_resp = await client.list_stream_keys(channelArn=channel_arn)
        for key in keys_resp.get("streamKeys", []):
            await client.delete_stream_key(arn=key["arn"])
        await client.delete_channel(arn=channel_arn)

async def get_ivs_stream_state(channel_arn: str) -> dict:
    """Check if a channel is currently streaming."""
    session = aiobotocore.session.get_session()
    async with session.create_client("ivs", region_name=IVS_REGION) as client:
        try:
            resp = await client.get_stream(channelArn=channel_arn)
            return {"is_live": True, "viewer_count": resp["stream"].get("viewerCount", 0)}
        except client.exceptions.ChannelNotBroadcasting:
            return {"is_live": False, "viewer_count": 0}
```

### 7.5 TURN Server (coturn)

```python
# core/turn_credentials.py
import hmac, hashlib, base64, time

def generate_turn_credentials(user_id: str, turn_secret: str, ttl: int = 86400) -> dict:
    """
    Generate HMAC-SHA1 ephemeral credentials for coturn.
    Compatible with the coturn REST API authentication mechanism.
    """
    expires = int(time.time()) + ttl
    username = f"{expires}:{user_id}"
    credential = base64.b64encode(
        hmac.new(turn_secret.encode(), username.encode(), hashlib.sha1).digest()
    ).decode()
    
    turn_host = settings.turn_server_host  # "turn.ebartex.com"
    
    return {
        "ice_servers": [
            {"urls": "stun:stun.l.google.com:19302"},
            {"urls": "stun:stun1.l.google.com:19302"},
            {
                "urls": f"turn:{turn_host}:3478",
                "username": username,
                "credential": credential,
            },
            {
                "urls": f"turns:{turn_host}:5349",  # TLS TURN
                "username": username,
                "credential": credential,
            },
        ],
        "expires_at": datetime.fromtimestamp(expires, UTC).isoformat(),
    }
```

### 7.6 Membership Card Number Generator

```python
# services/membership_service.py
from datetime import datetime, timezone

async def generate_card_number(db: AsyncSession) -> str:
    """
    Generate a sequential card number in format EBX-YYYY-NNNNN.
    Uses PostgreSQL advisory lock to prevent duplicates under concurrent enrollment.
    """
    year = datetime.now(timezone.utc).year
    
    # Advisory lock on the year to prevent race conditions
    await db.execute(text("SELECT pg_advisory_xact_lock(:year)"), {"year": year})
    
    result = await db.execute(
        text("SELECT COALESCE(MAX(CAST(SPLIT_PART(card_number, '-', 3) AS INTEGER)), 0) + 1 "
             "FROM memberships WHERE card_number LIKE :pattern AND status != 'none'"),
        {"pattern": f"EBX-{year}-%"}
    )
    next_seq = result.scalar()
    return f"EBX-{year}-{next_seq:05d}"
```

---

## 8. Caching Strategy Details

*(All caching from v1.0 §8.1–8.2 remains unchanged. New caching below.)*

### 8.3 Membership Cache

```python
# Cache membership status for 5 minutes (300s)
# Invalidated on: enrollment, renewal, admin status change, expiry worker

async def get_membership_status(user_id: str, db: AsyncSession, redis: Redis) -> MembershipStatusResponse:
    cache_key = f"membership:status:{user_id}"
    cached = await redis.get(cache_key)
    if cached:
        return MembershipStatusResponse(**json.loads(cached))
    
    stmt = select(Membership).where(Membership.user_id == user_id)
    result = await db.execute(stmt)
    membership = result.scalar_one_or_none()
    
    if not membership:
        # Return "none" status without creating a DB record
        response = MembershipStatusResponse(status="none")
    else:
        days_until_expiry = None
        if membership.expires_at:
            delta = membership.expires_at - datetime.now(UTC)
            days_until_expiry = delta.days
        response = MembershipStatusResponse(
            status=membership.status,
            tier=membership.tier,
            card_number=membership.card_number,
            expires_at=membership.expires_at,
            days_until_expiry=days_until_expiry,
        )
    
    await redis.setex(cache_key, 300, response.model_dump_json())
    return response
```

### 8.4 Arcade Leaderboard Cache

```python
# Arcade leaderboard served from Redis sorted set — no DB query needed
async def get_arcade_leaderboard(game_id: str, limit: int, offset: int, redis: Redis) -> list:
    key = f"arcade:leaderboard:{game_id}"
    entries = await redis.zrevrange(key, offset, offset + limit - 1, withscores=True)
    total = await redis.zcard(key)
    
    result = []
    for rank_idx, (user_id_bytes, score) in enumerate(entries):
        user_id = user_id_bytes.decode() if isinstance(user_id_bytes, bytes) else user_id_bytes
        # Fetch username from user profile cache
        username = await get_cached_username(user_id, redis)
        result.append({
            "rank": offset + rank_idx + 1,
            "user_id": user_id,
            "username": username,
            "score": int(score),
        })
    return result, total
```

---

## 9. Rate Limiting Implementation

*(Unchanged from v1.0 §9. New limits below.)*

### 9.2 New Rate Limits (v2)

| Endpoint | Limit | Window |
|---|---|---|
| `POST /membership/enroll` | 3 per user | 60 minutes |
| `POST /membership/skip` | 1 per user | lifetime (enforced at DB level) |
| `POST /arcade/scores` | 10 per user per game | 60 minutes |
| `POST /arcade/rooms` | 5 per user | 60 minutes |
| `GET /signaling/ice-servers` | 100 per user | 60 minutes |
| `GET /membership/me` | 1000 per user | 60 minutes (high because of gate checking) |

---

## 10. Membership Schemas and Endpoints (NEW)

*(See §1.7 and §2.11 above for complete specs.)*

### 10.1 Membership Expiry Background Worker

```python
# workers/membership_expiry.py
import asyncio
from datetime import datetime, timezone, timedelta

async def check_membership_expirations(db: AsyncSession, redis: Redis) -> dict:
    """
    Daily worker that:
    1. Transitions expired memberships to 'expired' status
    2. Sends 30-day and 7-day renewal reminders
    Returns: { expired: N, reminded_30d: N, reminded_7d: N }
    """
    now = datetime.now(timezone.utc)
    stats = {"expired": 0, "reminded_30d": 0, "reminded_7d": 0}
    
    # 1. Expire overdue memberships
    stmt = select(Membership).where(
        Membership.status == "active",
        Membership.expires_at < now
    )
    result = await db.execute(stmt)
    expired = result.scalars().all()
    for m in expired:
        m.status = "expired"
        await redis.delete(f"membership:status:{m.user_id}")  # Invalidate cache
        await publish_event("membership.expired", {"user_id": m.user_id, "card_number": m.card_number})
        stats["expired"] += 1
    
    # 2. 30-day reminders
    reminder_30 = now + timedelta(days=30)
    stmt_30 = select(Membership).where(
        Membership.status == "active",
        Membership.expires_at.between(now, reminder_30),
    )
    result_30 = await db.execute(stmt_30)
    for m in result_30.scalars().all():
        days_left = (m.expires_at - now).days
        await create_notification(
            user_id=m.user_id,
            type_=NotificationType.membership_expiry_reminder,
            title="Tessera in scadenza",
            body=f"La tua tessera Ebartex scade tra {days_left} giorni. Rinnova ora!",
            metadata={"card_number": m.card_number, "expires_at": m.expires_at.isoformat()},
            db=db, redis=redis,
        )
        stats["reminded_30d"] += 1
    
    # 3. 7-day reminders (email)
    reminder_7 = now + timedelta(days=7)
    stmt_7 = select(Membership).where(
        Membership.status == "active",
        Membership.expires_at.between(now, reminder_7),
    )
    result_7 = await db.execute(stmt_7)
    for m in result_7.scalars().all():
        await publish_event("membership.expiry_urgent", {
            "user_id": m.user_id, "email": m.email, "card_number": m.card_number,
            "days_remaining": (m.expires_at - now).days
        })
        stats["reminded_7d"] += 1
    
    await db.commit()
    return stats
```

---

## 11. Arcade Room Schemas and Endpoints (NEW)

*(See §1.8 and §2.12 above for complete specs.)*

### 11.1 P2P vs Server-Assisted Signaling Comparison

| Aspect | Tournament Match (server-relayed) | Arcade Kakegurui (manual P2P) |
|---|---|---|
| Signaling method | Redis-backed HTTP polling | Manual base64url copy/paste |
| Server relay needed | ✅ Yes (TS signaling endpoint) | ❌ No (direct browser-to-browser) |
| Auth required | ✅ Host requires JWT | ❌ None |
| Session TTL | 600 seconds (Redis key) | None (no server state) |
| TURN support | ✅ Via /signaling/ice-servers | ❌ Uses Google STUN only |
| Room registry | ❌ N/A | Optional via /arcade/rooms |
| Latency | ~600ms polling interval | P2P direct after handshake |
| Purpose | Camera-based 1v1 match stream | Game state synchronization |

---

## 12. IVS Integration Spec (NEW)

### 12.1 Channel Naming Convention

```
Channel name format: match-{matchId}
  Example: match-550e8400-e29b-41d4-a716-446655440000

IVS ARN format: arn:aws:ivs:eu-west-1:{accountId}:channel/{channelId}
```

### 12.2 IVS → Tournament Service Event Integration

AWS IVS can send webhooks via Amazon EventBridge. Subscribe to IVS events:

```json
{
  "source": ["aws.ivs"],
  "detail-type": ["IVS Stream State Change"],
  "detail": {
    "event_name": ["Stream Start", "Stream End"]
  }
}
```

Route to SQS queue `tournament-ivs-events-queue` → Tournament Service consumer:
- `Stream Start` → Update `ivs_channels.status = 'live'`, publish `stream.started` event, notify spectators
- `Stream End` → Update `ivs_channels.status = 'idle'`, update match `is_live = false`

### 12.3 Recording Configuration

```python
# IVS Recording Configuration (created once via CDK, referenced by ARN)
# S3 destination: s3://ebartex-tournament-replays-{accountId}/ivs-recordings/

# Recording is optional per match:
# - enabled by organizer at tournament creation
# - requires Gold or Platinum membership tier
# - recordings retain for 30 days (S3 lifecycle)
```

### 12.4 IVS Cost Model

| Metric | Rate (2026) | Example |
|---|---|---|
| Input (RTMP ingest) | $0.20 / GB | 1h match at 3 Mbps = 1.35 GB = $0.27 |
| Output (HLS delivery) | $0.05 / GB | 10 spectators × 1h × 2 Mbps = 9 GB = $0.45 |
| Channel hours (live) | Free | N/A |
| Recording storage | $0.023 / GB / month | 1h recording ≈ 0.5 GB ≈ $0.01/month |
| **Total per 1h match with 10 spectators** | | **≈ $0.73** |

---

*End of Technical Specification v2.0*
