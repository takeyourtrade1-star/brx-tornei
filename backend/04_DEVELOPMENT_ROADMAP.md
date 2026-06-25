# 04 — Development Roadmap

> **Document type**: Development Roadmap  
> **Version**: 2.0  
> **Updated**: June 2026 — adds Membership (Phase 9), Arcade Backend (Phase 10), Spectator IVS (Phase 11)  
> **Service**: Ebartex Tournament Microservice  
> **Methodology**: Vertical slices, shipping value each phase

---

## Table of Contents

1. [Overview and Principles](#1-overview-and-principles)
2. [Completed Phases (v1.0)](#2-completed-phases-v10)
3. [Phase 8: Tournament Refactor & Filters](#3-phase-8-tournament-refactor--filters)
4. [Phase 9: Membership & Tessera System](#4-phase-9-membership--tessera-system)
5. [Phase 10: Arcade Room Backend](#5-phase-10-arcade-room-backend)
6. [Phase 11: Spectator Broadcast (IVS)](#6-phase-11-spectator-broadcast-ivs)
7. [Phase 12: Production Hardening & Scale](#7-phase-12-production-hardening--scale)
8. [Phase 13: Advanced Features](#8-phase-13-advanced-features)
9. [Gantt Timeline (Visual)](#9-gantt-timeline-visual)
10. [Technical Debt Register](#10-technical-debt-register)
11. [Team Structure & Ownership](#11-team-structure--ownership)
12. [Risk Register](#12-risk-register)
13. [Definition of Done](#13-definition-of-done)

---

## 1. Overview and Principles

### 1.1 Core Principles

1. **Ship value at every phase** — each phase must produce something usable in production
2. **Backend-first on new features** — API contract before frontend integration
3. **Test in production conditions** — staging mirrors production (same instance types, same data volumes)
4. **AI-accelerated development** — all backend code is AI-generated via Cursor agents using these docs as specifications
5. **Zero downtime deploys** — every deployment must be non-breaking with blue/green ECS rolling updates
6. **Observability first** — CloudWatch alarms and dashboards set up before a feature goes live

### 1.2 Phases Overview

| Phase | Name | Status | Backend Sprints | Priority |
|---|---|---|---|---|
| 1–7 | Core Tournament Platform | ✅ Completed | 28 days | P0 |
| 8 | Tournament Refactor & Filters | 🔄 In Progress | 5 days | P0 |
| 9 | Membership & Tessera System | ⏳ Next | 10 days | P0 |
| 10 | Arcade Room Backend | ⏳ Planned | 8 days | P1 |
| 11 | Spectator Broadcast (IVS) | ⏳ Planned | 7 days | P1 |
| 12 | Production Hardening | ⏳ Planned | 10 days | P0 (before launch) |
| 13 | Advanced Features | ⏳ Planned | 15+ days | P2 |

---

## 2. Completed Phases (v1.0)

### Phase 1: Project Foundation (Completed)
- ✅ AWS CDK infrastructure (VPC, ECS, RDS, ElastiCache, ALB, CloudFront)
- ✅ FastAPI skeleton, Docker multi-stage build
- ✅ SQLAlchemy async ORM + Alembic migration system
- ✅ JWT RS256 validation + JWKS caching
- ✅ Health checks, CI/CD pipeline

### Phase 2: Tournament CRUD (Completed)
- ✅ Create/update/delete tournaments
- ✅ Tournament list with pagination
- ✅ Tournament status state machine
- ✅ 1v1 constraint enforcement

### Phase 3: Match Management (Completed)
- ✅ Match creation on tournament start
- ✅ Join tournament flow
- ✅ Match status updates
- ✅ Life tracking (player_a_lives, player_b_lives)

### Phase 4: WebRTC Signaling (Completed)
- ✅ Redis-backed signaling message store
- ✅ HTTP polling endpoints for SDP exchange
- ✅ ICE candidate relay
- ✅ webcam_session_id assignment

### Phase 5: Game Results (Completed)
- ✅ POST /matches/{id}/games endpoint
- ✅ ELO rating calculation
- ✅ Conflict detection for disputed results
- ✅ Match winner determination logic

### Phase 6: Real-time Notifications (Completed)
- ✅ WebSocket connection management
- ✅ Match state push notifications
- ✅ Tournament join/leave events
- ✅ In-app notification storage

### Phase 7: Leaderboards & Search (Completed)
- ✅ ELO leaderboard (Redis sorted sets)
- ✅ Tournament search integration (Meilisearch)
- ✅ Player stats aggregation
- ✅ Match history queries

---

## 3. Phase 8: Tournament Refactor & Filters

**Goal**: Align backend APIs with the refactored frontend tournament views.

**Status**: 🔄 In Progress  
**Duration**: 5 days  
**Owner**: Backend agent + Frontend agent  

### 8.1 Backend Tasks

| Task | Endpoint/Change | Estimated Days | Acceptance Criteria |
|---|---|---|---|
| Add `buy_in_amount` column | ALTER TABLE tournaments | 0.5 | Alembic migration, field optional, index added |
| Filtering API | GET /tournaments with buyIn, status, isPrivate, createdBy filters | 1 | All 4 filters work independently and combined; cached at 60s in Redis |
| Compact view mode | GET /tournaments?view=compact | 0.5 | Returns subset of fields; Pydantic schema added |
| Format selector support | ADD COLUMN format to tournaments | 0.5 | Enum: 'single-elim', 'double-elim', 'swiss', 'round-robin', 'best-of-3', 'custom' |
| Filter cache keys | Redis key includes all filter params | 0.5 | cache:tournaments:{hash(params)} pattern |
| Test suite | pytest for new filter combinations | 0.5 | 95% coverage on filter logic |
| Sticky toolbar fields | API to return filter options (formats available) | 0.5 | GET /tournaments/meta returns available formats + buy-in ranges |

### 8.2 API Changes

```python
# Updated GET /tournaments query params (Phase 8)
class TournamentListParams(BaseModel):
    # Existing
    page: int = 1
    page_size: int = 20
    search: Optional[str] = None
    status: Optional[TournamentStatus] = None
    
    # New in Phase 8
    buy_in_min: Optional[Decimal] = None
    buy_in_max: Optional[Decimal] = None
    is_private: Optional[bool] = None
    created_by: Optional[UUID] = None
    format: Optional[TournamentFormat] = None
    view: Literal["full", "compact"] = "full"
```

### 8.3 Migration: 002_tournament_refactor.sql

```sql
ALTER TABLE tournaments
    ADD COLUMN IF NOT EXISTS buy_in_amount  NUMERIC(10,2)  DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS format         VARCHAR(20)    DEFAULT 'best-of-3';

CREATE INDEX idx_tournaments_buy_in ON tournaments (buy_in_amount) WHERE buy_in_amount > 0;
CREATE INDEX idx_tournaments_format ON tournaments (format);

ALTER TABLE tournaments
    ADD CONSTRAINT chk_format CHECK (format IN (
        'single-elim', 'double-elim', 'swiss', 'round-robin', 'best-of-3', 'custom'
    ));
```

### 8.4 Definition of Done — Phase 8

- [ ] Alembic migration deployed to staging
- [ ] GET /tournaments returns correct results for all filter combinations
- [ ] compact view returns ≤ 50% of fields vs full view
- [ ] Redis caching works with per-filter-combo cache keys
- [ ] Load test: 500 req/s on /tournaments with filters, p99 < 200ms

---

## 4. Phase 9: Membership & Tessera System

**Goal**: Full membership enrollment, card management, and API access gates.

**Status**: ⏳ Next  
**Duration**: 10 days  
**Owner**: Backend agent  
**Frontend dependency**: Membership components exist in frontend; needs backend endpoints to be live

### 9.1 Backend Tasks

| Day | Task | Deliverable |
|---|---|---|
| 1 | Database schema | Alembic migration: `memberships` table, `card_number_seq_2026` sequence |
| 1 | Pydantic schemas | `schemas/membership.py` with full validation logic |
| 2 | POST /membership/enroll | Full enrollment logic: age check, club validation, card number generation, Redis cache update, SNS event |
| 2 | POST /membership/skip | Mark membership as skipped in DB; no gate enforcement for skipped |
| 3 | GET /membership/me | Return full membership status with card info |
| 3 | GET /membership/card | Return card_number with optional reveal/masking logic |
| 4 | POST /membership/renew | Renewal flow: extend expiry by 1 year, update Redis |
| 4 | GET /membership/clubs | Return list of federated clubs |
| 5 | Membership access gate | FastAPI dependency `require_membership` for tournament creation |
| 5 | SQS consumer: membership events | Handle expiry notifications, tier changes |
| 6 | Background worker: check_expirations | Scan memberships expiring within 30 days; send SNS events |
| 6 | Membership Redis caching | `membership:status:{userId}` with 24h TTL; invalidate on update |
| 7 | Admin endpoints | GET /admin/memberships, POST /admin/memberships/{id}/approve |
| 7 | SES email integration | Send confirmation email on enrollment/renewal |
| 8 | Membership analytics | CloudWatch custom metrics: daily enrollments, active count, expiry count |
| 8 | Rate limiting | Redis-based rate limits on enroll endpoint |
| 9 | Integration tests | Full pytest suite covering all membership endpoints |
| 9 | Staging deploy & smoke test | Deploy + manual test of full enrollment flow |
| 10 | Frontend integration support | Fix any API contract issues found by frontend team |

### 9.2 Database Migration: 003_membership.sql

```sql
-- Sequence for card numbers: EBX-2026-NNNNN
CREATE SEQUENCE card_number_seq_2026
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    CACHE 20;

CREATE TABLE memberships (
    id              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID         NOT NULL UNIQUE,  -- FK to users (from Auth microservice)
    status          VARCHAR(20)  NOT NULL DEFAULT 'none',  -- none, skipped, pending, active, expired, suspended
    tier            VARCHAR(20)  NOT NULL DEFAULT 'standard',  -- standard, gold, platinum
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    birth_date      DATE         NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    city            VARCHAR(100),
    club            VARCHAR(100),
    card_number     VARCHAR(20)  UNIQUE,  -- Format: EBX-YYYY-NNNNN; NULL until enrolled
    enrolled_at     TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    renewed_at      TIMESTAMPTZ,
    consent_at      TIMESTAMPTZ NOT NULL,
    consent_version VARCHAR(20)  NOT NULL DEFAULT '1.0',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT chk_status CHECK (status IN ('none', 'skipped', 'pending', 'active', 'expired', 'suspended')),
    CONSTRAINT chk_tier    CHECK (tier IN ('standard', 'gold', 'platinum')),
    CONSTRAINT chk_card_format CHECK (card_number ~ '^EBX-[0-9]{4}-[0-9]{5}$')
);

CREATE INDEX idx_memberships_user_id  ON memberships (user_id);
CREATE INDEX idx_memberships_status   ON memberships (status);
CREATE INDEX idx_memberships_expires  ON memberships (expires_at) WHERE status = 'active';
CREATE INDEX idx_memberships_club     ON memberships (club);

-- Auto-update updated_at
CREATE TRIGGER trg_memberships_updated_at
    BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 9.3 Enrollment Flow

```
Frontend (membership-onboarding-form.tsx)
         │
         │ POST /membership/enroll
         │ {firstName, lastName, birthDate, email, phone, city, club, consent: true}
         ▼
API Handler
    ├── Validate JWT → get user_id
    ├── Check: membership not already active
    ├── Validate age ≥ 16 (from birthDate)
    ├── Validate club in CLUBS list
    ├── BEGIN TRANSACTION
    │     ├── SELECT pg_advisory_xact_lock(hash(user_id))  [prevent race condition]
    │     ├── SELECT nextval('card_number_seq_2026')  → N
    │     ├── card_number = f"EBX-{year}-{N:05d}"
    │     ├── INSERT INTO memberships (...) 
    │     └── COMMIT
    ├── Update Redis: membership:status:{userId} = {status: 'active', tier: 'standard', ...}
    ├── Publish SNS: membership.enrolled event
    ├── SQS consumer sends SES confirmation email
    └── Return 201 MembershipStatusResponse
```

### 9.4 Membership Access Gate

```python
# dependencies/membership.py

async def require_membership(
    current_user: UserClaims = Depends(require_auth),
    redis: Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
) -> MembershipStatus:
    """
    FastAPI dependency that enforces active membership.
    Returns 403 MEMBERSHIP_REQUIRED if user does not have active membership.
    Returns 403 MEMBERSHIP_SKIPPED if user explicitly skipped (for features that require it).
    """
    # Check Redis cache first (24h TTL)
    cached = await redis.get(f"membership:status:{current_user.user_id}")
    if cached:
        status_data = json.loads(cached)
        if status_data["status"] != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "MEMBERSHIP_REQUIRED", "message": "Tessera associativa richiesta."},
            )
        return MembershipStatus(**status_data)
    
    # Cache miss: query DB
    membership = await db.execute(
        select(Membership).where(Membership.user_id == current_user.user_id)
    )
    m = membership.scalar_one_or_none()
    
    if not m or m.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "MEMBERSHIP_REQUIRED", "message": "Tessera associativa richiesta."},
        )
    
    # Refresh Redis cache
    await redis.setex(
        f"membership:status:{current_user.user_id}",
        86400,
        json.dumps({"status": m.status, "tier": m.tier, "card_number": m.card_number}),
    )
    
    return MembershipStatus(status=m.status, tier=m.tier, card_number=m.card_number)
```

### 9.5 Definition of Done — Phase 9

- [ ] All 6 membership endpoints pass integration tests
- [ ] Enrollment creates card number in EBX-YYYY-NNNNN format
- [ ] POST /tournaments returns 403 MEMBERSHIP_REQUIRED without active membership
- [ ] Background worker detects memberships expiring in 30 days and sends SNS event
- [ ] Redis caching reduces DB reads by >80% for /membership/me
- [ ] SES confirmation email delivered within 30 seconds of enrollment
- [ ] Staging end-to-end test with real user accounts

---

## 5. Phase 10: Arcade Room Backend

**Goal**: Backend support for arcade leaderboards, score persistence, and optional P2P room registry.

**Status**: ⏳ Planned  
**Duration**: 8 days  
**Owner**: Backend agent  
**Key insight**: Arcade P2P WebRTC requires NO backend signaling. Backend only handles scores, leaderboards, and an optional room-code registry.

### 10.1 Backend Tasks

| Day | Task | Deliverable |
|---|---|---|
| 1 | Database schema | arcade_scores (partitioned), arcade_wallets tables |
| 1 | Pydantic schemas | schemas/arcade.py — all request/response schemas |
| 2 | POST /arcade/scores | Submit score with idempotency key; rate limited |
| 2 | GET /arcade/leaderboard/{game_id} | Top 100 scores from Redis sorted set; 5m cache |
| 3 | GET /arcade/me/scores | Player's personal score history |
| 3 | GET /arcade/me/wallet | Ticket balance from DB + Redis |
| 4 | POST /arcade/rooms | Create P2P room registry entry (Kakegurui only) |
| 4 | GET /arcade/rooms/{code} | Retrieve room offer SDP for joining |
| 5 | POST /arcade/me/wallet/spend | Spend tickets on rewards |
| 5 | Background worker: sync leaderboard | Periodically sync Redis leaderboard to Aurora for persistence |
| 6 | Rate limiting | Score submission: 10/hour/user per game |
| 6 | Ticket earning logic | Award tickets based on TICKET_THRESHOLDS per game |
| 7 | Integration tests | Full pytest suite |
| 8 | Staging deploy | Smoke test all arcade endpoints |

### 10.2 Database Migration: 004_arcade.sql

```sql
-- Partitioned scores table (monthly partitions for performance)
CREATE TABLE arcade_scores (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL,
    game_id     VARCHAR(20)  NOT NULL,  -- stackAttack, tcgJump, cardMemory, kakegurui
    score       INTEGER      NOT NULL,
    is_personal_best BOOLEAN NOT NULL DEFAULT false,
    tickets_earned   INTEGER NOT NULL DEFAULT 0,
    metadata    JSONB,                  -- game-specific metadata
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for current year
CREATE TABLE arcade_scores_2026_q1 PARTITION OF arcade_scores
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE arcade_scores_2026_q2 PARTITION OF arcade_scores
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE arcade_scores_2026_q3 PARTITION OF arcade_scores
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE arcade_scores_2026_q4 PARTITION OF arcade_scores
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

CREATE INDEX idx_arcade_scores_user_game ON arcade_scores (user_id, game_id, created_at DESC);
CREATE INDEX idx_arcade_scores_game_score ON arcade_scores (game_id, score DESC);

-- Score limits constraint
ALTER TABLE arcade_scores
    ADD CONSTRAINT chk_game_id CHECK (game_id IN ('stackAttack', 'tcgJump', 'cardMemory', 'kakegurui'));
ALTER TABLE arcade_scores
    ADD CONSTRAINT chk_score_positive CHECK (score >= 0);

-- Wallet table (tickets balance)
CREATE TABLE arcade_wallets (
    id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID        NOT NULL UNIQUE,
    balance         INTEGER     NOT NULL DEFAULT 0,
    total_earned    INTEGER     NOT NULL DEFAULT 0,
    total_spent     INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)
);

CREATE TRIGGER trg_wallets_updated_at
    BEFORE UPDATE ON arcade_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 10.3 Score Submission Flow

```python
@router.post("/arcade/scores", response_model=ArcadeScoreResponse, status_code=201)
async def submit_score(
    payload: SubmitScoreRequest,
    current_user: UserClaims = Depends(require_auth),
    redis: Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
) -> ArcadeScoreResponse:
    # 1. Validate score within allowed range for game
    max_score = GAME_SCORE_LIMITS.get(payload.game_id)
    if payload.score > max_score:
        raise HTTPException(400, detail=f"Score exceeds maximum for {payload.game_id}")
    
    # 2. Check idempotency (prevent duplicate submissions)
    idempotency_key = f"arcade:submit:{current_user.user_id}:{payload.idempotency_key}"
    if await redis.exists(idempotency_key):
        raise HTTPException(409, detail="Score already submitted (duplicate idempotency key)")
    
    # 3. Rate limit: 10 submissions per hour per user per game
    rate_key = f"ratelimit:arcade_score:{current_user.user_id}:{payload.game_id}:{hour()}"
    count = await redis.incr(rate_key)
    await redis.expire(rate_key, 3600)
    if count > 10:
        raise HTTPException(429, detail="Score submission rate limit exceeded")
    
    # 4. Calculate tickets earned
    thresholds = TICKET_THRESHOLDS.get(payload.game_id, [])
    tickets = sum(t.tickets for t in thresholds if payload.score >= t.min_score)
    
    # 5. Check personal best
    current_best = await redis.zscore(
        f"arcade:leaderboard:{payload.game_id}", str(current_user.user_id)
    )
    is_personal_best = current_best is None or payload.score > float(current_best)
    
    async with db.begin():
        # 6. Insert score record
        score_record = ArcadeScore(
            user_id=current_user.user_id,
            game_id=payload.game_id,
            score=payload.score,
            is_personal_best=is_personal_best,
            tickets_earned=tickets,
        )
        db.add(score_record)
        
        # 7. Update wallet if tickets earned
        if tickets > 0:
            await db.execute(
                insert(ArcadeWallet)
                .values(user_id=current_user.user_id, balance=tickets, total_earned=tickets)
                .on_conflict_do_update(
                    index_elements=['user_id'],
                    set_={'balance': ArcadeWallet.balance + tickets, 
                          'total_earned': ArcadeWallet.total_earned + tickets}
                )
            )
    
    # 8. Update Redis leaderboard (if personal best)
    if is_personal_best:
        await redis.zadd(
            f"arcade:leaderboard:{payload.game_id}",
            {str(current_user.user_id): payload.score},
        )
    
    # 9. Set idempotency key (expire after 24h)
    await redis.setex(idempotency_key, 86400, "1")
    
    return ArcadeScoreResponse(
        score_id=str(score_record.id),
        score=payload.score,
        is_personal_best=is_personal_best,
        tickets_earned=tickets,
        new_wallet_balance=await get_wallet_balance(current_user.user_id, redis, db),
    )
```

### 10.4 P2P Room Registry (Kakegurui Matchmaking)

```python
@router.post("/arcade/rooms", response_model=ArcadeRoomResponse, status_code=201)
async def create_arcade_room(
    payload: CreateArcadeRoomRequest,
    current_user: UserClaims = Depends(require_auth),
    redis: Redis = Depends(get_redis),
) -> ArcadeRoomResponse:
    """
    Register a P2P room code with the server.
    The actual WebRTC signaling is done client-to-client (no relay).
    This endpoint just helps with discoverability.
    """
    # Generate 6-char alphanumeric room code
    room_code = generate_room_code()  # e.g., "AK3F9Z"
    
    room_data = {
        "host_user_id": str(current_user.user_id),
        "game_id": payload.game_id,
        "created_at": datetime.now(UTC).isoformat(),
        "status": "waiting",
    }
    
    # Store in Redis with 30-minute TTL
    await redis.setex(
        f"arcade:room:{room_code}",
        1800,  # 30 minutes
        json.dumps(room_data),
    )
    
    return ArcadeRoomResponse(
        room_code=room_code,
        game_id=payload.game_id,
        expires_in=1800,
    )
```

### 10.5 Definition of Done — Phase 10

- [ ] All arcade endpoints pass integration tests
- [ ] Score submission with invalid game_id returns 400
- [ ] Leaderboard returns top 100 in < 50ms (from Redis)
- [ ] Ticket earning logic matches TICKET_THRESHOLDS config
- [ ] Wallet balance cannot go negative
- [ ] P2P room codes expire after 30 minutes
- [ ] Rate limiting prevents > 10 score submissions/hour/user/game

---

## 6. Phase 11: Spectator Broadcast (IVS)

**Goal**: Live spectator broadcasting for tournament matches via AWS IVS.

**Status**: ⏳ Planned  
**Duration**: 7 days  
**Owner**: Backend agent  

### 11.1 Backend Tasks

| Day | Task | Deliverable |
|---|---|---|
| 1 | Database migration | ivs_channels table, add ivs_channel_id to matches |
| 1 | AWS IVS client service | Python boto3 wrapper for IVS operations |
| 2 | IVS channel lifecycle hooks | Create channel on match start; delete on match end |
| 2 | Stream key delivery via WebSocket | Send stream key ONLY to host via authenticated WS |
| 3 | GET /matches/{id}/stream | Public endpoint returning playback URL for spectators |
| 3 | POST /matches/{id}/stream/reset-key | Generate new stream key if current one is compromised |
| 4 | Spectator count tracking | Redis counter + WebSocket broadcast |
| 4 | WebSocket event: match.stream_ready | Push to all participants when IVS channel is live |
| 5 | IVS EventBridge integration | Consume stream state change events |
| 5 | Recording opt-in | Boolean flag on tournament creation; IVS recording config |
| 6 | Integration tests | Full pytest suite for stream endpoints |
| 7 | Staging deploy + end-to-end test | Full spectator flow from host stream to viewer |

### 11.2 IVS Channel Lifecycle

```python
# services/ivs_service.py

class IVSService:
    def __init__(self) -> None:
        self.client = boto3.client('ivs', region_name='eu-west-1')
    
    async def create_channel_for_match(
        self, match_id: UUID, tournament_name: str, recording: bool = False
    ) -> IVSChannelConfig:
        """
        Creates an IVS channel when a match transitions to 'in_corso'.
        Called from the match state machine (background task).
        """
        params: dict = {
            'name': f"match-{match_id}",
            'type': 'BASIC',       # Use STANDARD for Gold/Platinum tier
            'latencyMode': 'LOW',  # 3–5s latency to spectators
            'tags': {
                'match_id': str(match_id),
                'service': 'ebartex-tournaments',
            },
        }
        
        if recording:
            params['recordingConfigurationArn'] = settings.ivs_recording_config_arn
        
        # Run in executor since boto3 is synchronous
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: self.client.create_channel(**params))
        
        channel = response['channel']
        stream_key = response['streamKey']
        
        return IVSChannelConfig(
            channel_arn=channel['arn'],
            playback_url=channel['playbackUrl'],
            ingest_endpoint=channel['ingestEndpoint'],
            stream_key=stream_key['value'],  # Will be encrypted before DB storage
        )
    
    async def delete_channel(self, channel_arn: str) -> None:
        """Called when match ends (any terminal state)."""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None, 
            lambda: self.client.delete_channel(arn=channel_arn)
        )
```

### 11.3 Stream Key Delivery Flow

```
Match transitions to 'in_corso'
         │
         │ match state machine
         ▼
IVSService.create_channel_for_match(match_id, recording=tournament.enable_recording)
         │
         ├── channel_arn, playback_url → saved to ivs_channels table (playback_url unencrypted)
         ├── ingest_endpoint → saved to ivs_channels table
         └── stream_key → NEVER stored in DB (ephemeral delivery only)
                  │
                  │ WebSocket notification (to HOST's authenticated WS connection only)
                  ▼
         {
           "event": "match.stream_ready",
           "data": {
             "stream_key": "sk_eu-west-1_xxxxx",
             "ingest_endpoint": "rtmps://xxxxxxxxx.global-contribute.live-video.net:443/app/",
             "playback_url": "https://xxxxx.live-video.net/api/video/v1/eu-west-1.xxxxx.channel.xxx.m3u8",
             "instructions": "Configura OBS: Server + Stream Key. Avvia lo streaming per iniziare la partita."
           }
         }
         │
         │ HOST sets up OBS/browser streaming
         ▼
RTMPS stream → IVS Ingest → CDN → Spectator <video> tags
```

### 11.4 Spectator Count Management

```python
# Real-time spectator count via WebSocket + Redis

async def on_spectator_connect(match_id: str, user_id: str, redis: Redis) -> int:
    """Increment spectator count when WS connection opens."""
    count = await redis.incr(f"match:spectators:{match_id}")
    await redis.expire(f"match:spectators:{match_id}", 86400)
    
    # Broadcast count to all match participants
    await ws_manager.broadcast_to_match(match_id, {
        "event": "match.spectator_count",
        "data": {"count": count},
    })
    return count

async def on_spectator_disconnect(match_id: str, user_id: str, redis: Redis) -> int:
    """Decrement spectator count when WS connection closes."""
    count = await redis.decr(f"match:spectators:{match_id}")
    # Prevent going below 0
    if count < 0:
        await redis.set(f"match:spectators:{match_id}", 0)
        count = 0
    
    await ws_manager.broadcast_to_match(match_id, {
        "event": "match.spectator_count",
        "data": {"count": count},
    })
    return count
```

### 11.5 Definition of Done — Phase 11

- [ ] IVS channel created within 3 seconds of match start
- [ ] Stream key delivered only to HOST via WebSocket (never in HTTP response body)
- [ ] GET /matches/{id}/stream returns playback URL without auth for spectators
- [ ] Spectator count updates in real-time via WebSocket
- [ ] IVS channel deleted within 10 seconds of match end
- [ ] Staging end-to-end: host streams with OBS → spectator watches in browser
- [ ] Cost alert if IVS charges exceed $50/day (CloudWatch alarm)

---

## 7. Phase 12: Production Hardening & Scale

**Goal**: Prepare for real user traffic before public launch.

**Status**: ⏳ Planned  
**Duration**: 10 days  
**Owner**: Backend agent + DevOps

### 12.1 Tasks

| Area | Task | Priority |
|---|---|---|
| Performance | Load test: 1,000 concurrent WS connections | P0 |
| Performance | DB query optimization: add missing indexes | P0 |
| Reliability | Circuit breakers for external services (IVS, SES) | P0 |
| Reliability | Match expiry worker (matches older than 24h without result) | P0 |
| Reliability | Automated backups verification | P0 |
| Security | Penetration test on auth + membership endpoints | P0 |
| Security | WAF rules for rate limiting at CDN level | P0 |
| Observability | Full CloudWatch dashboard with all v2 metrics | P1 |
| Observability | PagerDuty/Opsgenie integration for critical alarms | P1 |
| TURN | Load test TURN server under 50 concurrent relays | P1 |
| GDPR | Data retention policies + automated deletion | P1 |
| DRP | Disaster recovery runbook | P2 |

---

## 8. Phase 13: Advanced Features

**Goal**: Post-launch feature expansion.

**Status**: ⏳ Planned  
**Duration**: 15+ days (iterative)

### 13.1 Feature Backlog

| Feature | Business Value | Complexity | Phase |
|---|---|---|---|
| Multi-round tournaments (brackets) | High | High | 13.1 |
| Spectator chat via WebSocket | Medium | Low | 13.1 |
| Membership tier upgrade flow | High | Medium | 13.2 |
| Arcade Tavolo Duello 1v1 matchmaking | High | Medium | 13.2 |
| Match recording playback (S3 VOD) | Medium | Medium | 13.3 |
| ELO rank history + charts | Medium | Low | 13.3 |
| Tournament brackets visualization API | High | High | 13.4 |
| Arcade ticket rewards catalog | Medium | Medium | 13.4 |
| Cross-service membership check (Sync Service) | High | High | 13.5 |
| Mobile app WebRTC support | High | Very High | 14.x |

---

## 9. Gantt Timeline (Visual)

```
WEEK    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16
        │────────────────────────────────────────────────────────────────────────────│

Phase 8 ████ ████
(Filters/Refactor)

Phase 9      ████ ████ ████ ████ ████
(Membership)

Phase 10               ████ ████ ████ ████
(Arcade Backend)

Phase 11                         ████ ████ ████
(IVS Spectator)

Phase 12                                   ████ ████ ████ ████ ████
(Hardening)

Phase 13                                                  ████ ████ ████ ████ ████ ████
(Advanced Features)

KEY:
████ = 1 week of backend agent development
Phases 9-11 can run in parallel if multiple agents available
Phase 12 must follow 9-11 completion
```

### 9.1 Milestones

| Milestone | Date (Relative) | Criteria |
|---|---|---|
| **M1: Filters MVP** | Week 2 | Phase 8 complete, tournament filtering works end-to-end |
| **M2: Membership Live** | Week 6 | Phase 9 complete, users can enroll in production |
| **M3: Arcade Backend** | Week 9 | Phase 10 complete, scores and leaderboards work |
| **M4: Spectator Live** | Week 11 | Phase 11 complete, IVS streaming works end-to-end |
| **M5: Production Ready** | Week 15 | Phase 12 complete, load tests pass, security review done |
| **M6: Public Launch** | Week 16+ | All P0 features live, support plan in place |

---

## 10. Technical Debt Register

| ID | Description | Impact | Effort | Target Phase |
|---|---|---|---|---|
| TD-001 | HTTP polling for WebRTC signaling (should be pure WS) | Medium | Medium | 13.x |
| TD-002 | No WebSocket auth refresh (JWT expiry during long sessions) | High | Medium | 12 |
| TD-003 | Arcade leaderboard not backed by Aurora periodically | Medium | Low | 10 (planned) |
| TD-004 | IVS available only in eu-west-1 (not eu-south-1) | Low | None (by design) | — |
| TD-005 | coturn single-node SPOF (no HA for TURN) | Medium | High | 12 |
| TD-006 | Match expiry worker not implemented | High | Low | 12 |
| TD-007 | No circuit breaker for IVS API calls | High | Low | 12 |
| TD-008 | GDPR data export not implemented | High | Medium | 12 |
| TD-009 | Tournament format field is string, not proper enum in DB | Low | Low | 8 (planned) |
| TD-010 | Arcade P2P room code not tied to user account on client side | Low | Low | 13.x |

---

## 11. Team Structure & Ownership

### 11.1 Roles

| Role | Responsibilities | Tools Used |
|---|---|---|
| **Backend Agent** (AI) | All FastAPI code, migrations, tests | Cursor + these docs as spec |
| **Frontend Agent** (AI) | React components, API integration | Cursor + component specs |
| **Tech Lead** (Human) | Architecture decisions, PR review, unblocking | All |
| **DevOps** (Human or AI) | CDK infrastructure, deployments, monitoring | CDK + AWS Console |
| **Product Owner** | Business requirements, prioritization | Stakeholder brief |

### 11.2 File Ownership

| Path | Owner | Review Required |
|---|---|---|
| `backend/app/routers/` | Backend Agent | Tech Lead |
| `backend/app/models/` | Backend Agent | Tech Lead |
| `backend/migrations/` | Backend Agent | Tech Lead |
| `infrastructure/stacks/` | DevOps | Tech Lead |
| `frontend/` | Frontend Agent | Tech Lead |
| `backend/docs/` | Tech Lead | Product Owner |

---

## 12. Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R-001 | IVS not available in eu-south-1 (Milan) | High | Medium | Use eu-west-1 for IVS; GDPR compliant within EU |
| R-002 | TURN server single point of failure | Low | High | Phase 12: add TURN replica; use Cloudflare TURN as fallback |
| R-003 | WebRTC fails in corporate firewalls | Medium | Medium | TURN TCP 443 fallback; document known issues |
| R-004 | Aurora Serverless cold start (first query takes 3s) | Medium | Low | Set min ACUs ≥ 1; keep-warm cron every 5 min |
| R-005 | IVS stream key leaked via HTTP log | Low | Very High | Enforce WS-only delivery; log scrubbing in CloudWatch |
| R-006 | Membership card number sequence collision | Very Low | High | PostgreSQL advisory lock prevents race; sequence is atomic |
| R-007 | Arcade score cheating (client-side scoring) | Medium | Medium | Server validates max score bounds; ELO-like score anomaly detection in Phase 13 |
| R-008 | Spectator traffic spike (viral match) | Low | High | IVS CDN absorbs any viewer count; ECS unaffected |
| R-009 | GDPR data deletion request | Low | High | Data retention policy in Phase 12; documented deletion procedure |
| R-010 | Agent misinterprets spec during AI coding | Medium | Medium | Agents must read full relevant doc sections before implementing |

---

## 13. Definition of Done

### 13.1 Per Feature

```
A backend feature is DONE when:
  ✓ All acceptance criteria in its Phase section are met
  ✓ pytest integration tests exist (>80% coverage)
  ✓ API contract matches Pydantic schemas in 02_TECHNICAL_SPEC.md
  ✓ Alembic migration is reversible (has both upgrade() and downgrade())
  ✓ CloudWatch custom metrics are published
  ✓ Redis caching is in place for read-heavy endpoints
  ✓ Rate limiting is applied to mutation endpoints
  ✓ Error responses include machine-readable error codes
  ✓ Endpoint is documented in 02_TECHNICAL_SPEC.md
  ✓ No plaintext secrets in logs or HTTP responses
```

### 13.2 Per Deployment

```
A deployment is DONE when:
  ✓ Blue/green ECS rolling update completes without errors
  ✓ Health check endpoint returns 200 within 60 seconds
  ✓ No error spike in CloudWatch in the first 5 minutes
  ✓ Alembic migration applied successfully
  ✓ At least 1 smoke test passes against staging
  ✓ Deployment engineer has checked the dashboard
```

---

*End of Development Roadmap v2.0*
