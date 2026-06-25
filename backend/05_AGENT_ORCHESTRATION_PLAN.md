# 05 — Agent Orchestration Plan

> **Document type**: AI Agent Coding Instructions  
> **Version**: 2.0  
> **Updated**: June 2026 — adds Phase 9/10/11 agent tasks for Membership, Arcade, IVS  
> **Purpose**: Instructions for AI coding agents implementing this codebase  
> **Critical**: Agents must read this document BEFORE writing any code

---

## Table of Contents

1. [Purpose and Conventions](#1-purpose-and-conventions)
2. [Agent Pre-Flight Checklist](#2-agent-pre-flight-checklist)
3. [Phase 8 Agent Tasks: Tournament Filters](#3-phase-8-agent-tasks-tournament-filters)
4. [Phase 9 Agent Tasks: Membership System](#4-phase-9-agent-tasks-membership-system)
5. [Phase 10 Agent Tasks: Arcade Room Backend](#5-phase-10-agent-tasks-arcade-room-backend)
6. [Phase 11 Agent Tasks: Spectator Broadcast](#6-phase-11-agent-tasks-spectator-broadcast)
7. [Phase 12 Agent Tasks: Hardening](#7-phase-12-agent-tasks-hardening)
8. [Code Conventions and Patterns](#8-code-conventions-and-patterns)
9. [Testing Conventions](#9-testing-conventions)
10. [Common Pitfalls](#10-common-pitfalls)
11. [Agent Collaboration Protocol](#11-agent-collaboration-protocol)

---

## 1. Purpose and Conventions

### 1.1 What Is This Document?

This document contains the precise task specifications for AI coding agents (Cursor agents) implementing the Ebartex Tournament Platform backend. It complements `02_TECHNICAL_SPEC.md` (which specifies WHAT to build) by specifying HOW to build it — file locations, patterns, dependencies, and sequencing.

### 1.2 How Agents Should Use This Document

1. **Always read this document fully** before starting any backend task
2. **Cross-reference `02_TECHNICAL_SPEC.md`** for Pydantic schemas, API contracts, and data models
3. **Cross-reference `00_MASTER_BLUEPRINT.md`** for architectural decisions
4. **Reference `04_DEVELOPMENT_ROADMAP.md`** for phase sequencing and acceptance criteria
5. **Never make architectural decisions not covered in these docs** — ask the Tech Lead

### 1.3 Project Structure (for agent reference)

```
backend/
├── app/
│   ├── main.py                  # FastAPI app initialization
│   ├── config.py                # Settings (Pydantic BaseSettings)
│   ├── dependencies/
│   │   ├── auth.py              # JWT validation, require_auth dependency
│   │   ├── db.py                # Async DB session dependency
│   │   ├── redis.py             # Redis connection pool
│   │   └── membership.py        # NEW (Phase 9): require_membership dependency
│   ├── models/
│   │   ├── base.py              # Base SQLAlchemy model (timestamped)
│   │   ├── tournament.py        # Tournament, Match, Game models
│   │   ├── user.py              # User model (sync from Auth service)
│   │   ├── membership.py        # NEW (Phase 9): Membership model
│   │   ├── arcade.py            # NEW (Phase 10): ArcadeScore, ArcadeWallet models
│   │   └── ivs.py               # NEW (Phase 11): IvsChannel model
│   ├── routers/
│   │   ├── tournaments.py       # /tournaments endpoints
│   │   ├── matches.py           # /matches endpoints
│   │   ├── signaling.py         # /signaling endpoints
│   │   ├── notifications.py     # /notifications endpoints
│   │   ├── leaderboard.py       # /leaderboard endpoints
│   │   ├── membership.py        # NEW (Phase 9): /membership endpoints
│   │   ├── arcade.py            # NEW (Phase 10): /arcade endpoints
│   │   └── stream.py            # NEW (Phase 11): /matches/{id}/stream endpoints
│   ├── schemas/
│   │   ├── tournament.py        # Tournament Pydantic schemas
│   │   ├── match.py             # Match Pydantic schemas
│   │   ├── signaling.py         # Signaling schemas
│   │   ├── membership.py        # NEW (Phase 9)
│   │   ├── arcade.py            # NEW (Phase 10)
│   │   └── stream.py            # NEW (Phase 11)
│   ├── services/
│   │   ├── elo.py               # ELO calculation
│   │   ├── notifications.py     # WebSocket + SES notifications
│   │   ├── events.py            # SNS event publishing
│   │   ├── membership.py        # NEW (Phase 9): membership business logic
│   │   ├── arcade.py            # NEW (Phase 10): arcade business logic
│   │   └── ivs.py               # NEW (Phase 11): AWS IVS boto3 wrapper
│   ├── workers/
│   │   ├── match_expiry.py      # Background: expire abandoned matches
│   │   ├── membership_expiry.py # NEW (Phase 9): check expiring memberships
│   │   └── leaderboard_sync.py  # NEW (Phase 10): sync arcade leaderboard to DB
│   └── websocket/
│       ├── manager.py           # WebSocket connection manager
│       └── events.py            # WebSocket event handlers
├── migrations/
│   ├── env.py
│   └── versions/
│       ├── 001_initial.py
│       ├── 002_tournament_refactor.py  # Phase 8
│       ├── 003_membership.py           # Phase 9
│       ├── 004_arcade.py               # Phase 10
│       └── 005_ivs_channels.py        # Phase 11
└── tests/
    ├── conftest.py              # Shared fixtures (test DB, Redis mock, etc.)
    ├── test_tournaments.py
    ├── test_matches.py
    ├── test_membership.py       # NEW (Phase 9)
    ├── test_arcade.py           # NEW (Phase 10)
    └── test_stream.py           # NEW (Phase 11)
```

---

## 2. Agent Pre-Flight Checklist

Before implementing ANY task, the agent MUST verify:

```
□ Read this document (05_AGENT_ORCHESTRATION_PLAN.md)
□ Read 02_TECHNICAL_SPEC.md sections relevant to the task
□ Read the relevant Phase section in 04_DEVELOPMENT_ROADMAP.md
□ Understand the data model for the task (models/ and schemas/)
□ Understand which dependencies (auth, db, redis, membership) are needed
□ Check if there are existing patterns (copy, don't reinvent)
□ Identify which Redis keys will be read/written
□ Identify which SNS events will be published
□ Understand the testing expectations
□ Have a clear plan before writing the first line of code
```

---

## 3. Phase 8 Agent Tasks: Tournament Filters

### 3.1 Task: Update Tournament Router

**File**: `app/routers/tournaments.py`  
**Operation**: Modify `GET /tournaments` handler  

**Step-by-step**:
1. Read current `tournaments.py` router
2. Import `TournamentListParams` from updated schemas
3. Add query parameter binding for: `buy_in_min`, `buy_in_max`, `is_private`, `created_by`, `format`, `view`
4. Build SQLAlchemy dynamic query using `and_()` filters
5. Construct cache key as `cache:tournaments:{sha256(sorted_params)}`
6. Check Redis cache first; if miss, run query and cache result for 60 seconds
7. If `view=compact`, use `TournamentCompact` Pydantic schema instead of `TournamentFull`

**Key SQLAlchemy pattern for dynamic filters**:

```python
filters = [Tournament.deleted_at.is_(None)]

if params.status:
    filters.append(Tournament.status == params.status)
if params.buy_in_min is not None:
    filters.append(Tournament.buy_in_amount >= params.buy_in_min)
if params.buy_in_max is not None:
    filters.append(Tournament.buy_in_amount <= params.buy_in_max)
if params.is_private is not None:
    filters.append(Tournament.is_private == params.is_private)
if params.created_by:
    filters.append(Tournament.created_by == params.created_by)
if params.format:
    filters.append(Tournament.format == params.format)

stmt = (
    select(Tournament)
    .where(and_(*filters))
    .order_by(Tournament.created_at.desc())
    .offset((params.page - 1) * params.page_size)
    .limit(params.page_size)
)
```

### 3.2 Task: Add buy_in_amount and format columns

**File**: `migrations/versions/002_tournament_refactor.py`  
**Operation**: Create Alembic migration  

```python
def upgrade() -> None:
    op.add_column('tournaments', sa.Column('buy_in_amount', sa.Numeric(10, 2), nullable=True, default=0))
    op.add_column('tournaments', sa.Column('format', sa.String(20), nullable=False, server_default='best-of-3'))
    op.create_index('idx_tournaments_buy_in', 'tournaments', ['buy_in_amount'],
                    postgresql_where=sa.text("buy_in_amount > 0"))
    op.create_index('idx_tournaments_format', 'tournaments', ['format'])
    op.create_check_constraint(
        'chk_format',
        'tournaments',
        "format IN ('single-elim', 'double-elim', 'swiss', 'round-robin', 'best-of-3', 'custom')"
    )

def downgrade() -> None:
    op.drop_constraint('chk_format', 'tournaments')
    op.drop_index('idx_tournaments_format', 'tournaments')
    op.drop_index('idx_tournaments_buy_in', 'tournaments')
    op.drop_column('tournaments', 'format')
    op.drop_column('tournaments', 'buy_in_amount')
```

---

## 4. Phase 9 Agent Tasks: Membership System

### 4.1 Task: Create Membership Model

**File**: `app/models/membership.py`  
**Operation**: Create new file  

Critical constraints:
- `status` must use `VARCHAR(20)` with CHECK constraint (not Python enum, to allow DB queries without ORM)
- `card_number` is UNIQUE and follows `EBX-YYYY-NNNNN` format
- `user_id` is UNIQUE (one membership per user)
- Include `__tablename__ = "memberships"` and proper indexing hints

### 4.2 Task: Create Membership Schemas

**File**: `app/schemas/membership.py`  
**Operation**: Create new file using `02_TECHNICAL_SPEC.md` schema definitions as exact specification  

Key validators:
```python
@field_validator('birth_date')
@classmethod
def validate_age(cls, v: date) -> date:
    age = (date.today() - v).days // 365
    if age < 16:
        raise ValueError('Minimum age is 16 years')
    if age > 120:
        raise ValueError('Invalid birth date')
    return v
```

### 4.3 Task: Create Membership Router

**File**: `app/routers/membership.py`  
**Operation**: Create new file with all 6 membership endpoints  

**Endpoints to implement** (see `02_TECHNICAL_SPEC.md` for full spec):
- `POST /membership/enroll` — requires `require_auth`; NOT `require_membership` (bootstrapping)
- `POST /membership/skip` — requires `require_auth`
- `GET /membership/me` — requires `require_auth`; reads from Redis first
- `GET /membership/card` — requires `require_auth` + `require_membership`
- `POST /membership/renew` — requires `require_auth` + `require_membership`
- `GET /membership/clubs` — public (no auth required)

**Critical**: Register this router in `main.py`:
```python
from app.routers import membership as membership_router
app.include_router(membership_router.router, prefix="/membership", tags=["membership"])
```

### 4.4 Task: Create require_membership Dependency

**File**: `app/dependencies/membership.py`  
**Operation**: Create new file  

See `04_DEVELOPMENT_ROADMAP.md` Phase 9 section for the complete implementation pattern. Key behavior:
- Check Redis cache (`membership:status:{userId}`) first
- Cache miss: query DB
- If status != 'active': raise 403 with `MEMBERSHIP_REQUIRED` code
- Refresh Redis cache on cache miss

### 4.5 Task: Update tournaments.py to enforce membership

**File**: `app/routers/tournaments.py`  
**Operation**: Add `require_membership` dependency to `POST /tournaments`  

```python
@router.post("/tournaments", response_model=TournamentResponse, status_code=201)
async def create_tournament(
    payload: CreateTournamentRequest,
    current_user: UserClaims = Depends(require_auth),
    membership: MembershipStatus = Depends(require_membership),  # ADD THIS
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> TournamentResponse:
    ...
```

### 4.6 Task: Create Membership Worker

**File**: `app/workers/membership_expiry.py`  
**Operation**: Create new file  

This is a background asyncio task started in `main.py` via `lifespan`:
```python
async def check_membership_expirations(db: AsyncSession, redis: Redis, sns_client) -> None:
    """
    Runs daily at 03:00 UTC.
    Finds memberships expiring in 1–30 days, publishes SNS events for each.
    Finds memberships already expired, updates status to 'expired', invalidates Redis cache.
    """
    # Query: active memberships expiring within 30 days
    threshold = datetime.now(UTC) + timedelta(days=30)
    
    stmt = select(Membership).where(
        and_(
            Membership.status == 'active',
            Membership.expires_at <= threshold,
        )
    )
    
    result = await db.execute(stmt)
    expiring = result.scalars().all()
    
    for m in expiring:
        days_left = (m.expires_at - datetime.now(UTC)).days
        
        if days_left <= 0:
            # Already expired
            m.status = 'expired'
            await redis.delete(f"membership:status:{m.user_id}")
            event_type = 'membership.expired'
        elif days_left <= 7:
            event_type = 'membership.expiry_urgent'
        else:
            event_type = 'membership.expiry_reminder'
        
        await publish_sns_event(sns_client, event_type, {
            "user_id": str(m.user_id),
            "card_number": m.card_number,
            "expires_at": m.expires_at.isoformat(),
            "days_left": days_left,
        })
    
    await db.commit()
```

### 4.7 Register router and worker in main.py

```python
# In lifespan context manager, add:
background_tasks = set()
task = asyncio.create_task(run_daily_at_hour(check_membership_expirations, hour=3))
background_tasks.add(task)
task.add_done_callback(background_tasks.discard)
```

---

## 5. Phase 10 Agent Tasks: Arcade Room Backend

### 5.1 Task: Create Arcade Models

**File**: `app/models/arcade.py`  
**Operation**: Create new file  

Key notes:
- `ArcadeScore` maps to partitioned table `arcade_scores` — the ORM maps to the parent table
- `ArcadeWallet` maps to `arcade_wallets`
- Both models inherit from `Base` (SQLAlchemy declarative base)

### 5.2 Task: Create Arcade Schemas

**File**: `app/schemas/arcade.py`  
**Operation**: Create new file per `02_TECHNICAL_SPEC.md` spec  

Include:
- `GAME_SCORE_LIMITS: dict[str, int]` constant
- `TICKET_THRESHOLDS: dict[str, list[TicketThreshold]]` constant
- All request/response schemas

### 5.3 Task: Create Arcade Router

**File**: `app/routers/arcade.py`  
**Operation**: Create new file with 8 arcade endpoints  

**Endpoints** (see `02_TECHNICAL_SPEC.md` Section 10 for full spec):
- `POST /arcade/scores` — `require_auth`; rate limited; idempotent
- `GET /arcade/leaderboard/{game_id}` — public (no auth); Redis sorted set
- `GET /arcade/me/scores` — `require_auth`
- `GET /arcade/me/wallet` — `require_auth`
- `POST /arcade/rooms` — `require_auth`; Redis-only room registry
- `GET /arcade/rooms/{code}` — `require_auth`
- `POST /arcade/me/wallet/spend` — `require_auth`; idempotent

**Critical for leaderboard performance**:
```python
@router.get("/arcade/leaderboard/{game_id}", response_model=list[ArcadeLeaderboardEntry])
async def get_leaderboard(
    game_id: ArcadeGameId,
    limit: int = Query(default=100, le=100),
    redis: Redis = Depends(get_redis),
) -> list[ArcadeLeaderboardEntry]:
    # Get from Redis sorted set (score DESC = ZREVRANGEBYSCORE)
    entries = await redis.zrevrange(
        f"arcade:leaderboard:{game_id}",
        0, limit - 1,
        withscores=True,
    )
    return [
        ArcadeLeaderboardEntry(rank=i+1, user_id=uid, score=int(score))
        for i, (uid, score) in enumerate(entries)
    ]
```

### 5.4 Task: Create P2P Room Registry Logic

The arcade room code generation must be:
- 6 characters
- Alphanumeric uppercase only
- Cryptographically random (not sequential — prevents enumeration)

```python
import secrets
import string

def generate_room_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(6))
```

### 5.5 Task: Leaderboard Sync Worker

**File**: `app/workers/leaderboard_sync.py`  
**Operation**: Create new file  

```python
async def sync_arcade_leaderboards(db: AsyncSession, redis: Redis) -> None:
    """
    Runs every 15 minutes. Ensures Redis leaderboard reflects DB personal bests.
    Recovery mechanism in case Redis is flushed.
    """
    game_ids = ['stackAttack', 'tcgJump', 'cardMemory', 'kakegurui']
    
    for game_id in game_ids:
        # Get all personal bests from DB
        stmt = (
            select(ArcadeScore.user_id, func.max(ArcadeScore.score).label('best_score'))
            .where(ArcadeScore.game_id == game_id)
            .group_by(ArcadeScore.user_id)
        )
        result = await db.execute(stmt)
        scores = result.all()
        
        if not scores:
            continue
        
        # Bulk update Redis sorted set
        mapping = {str(row.user_id): row.best_score for row in scores}
        await redis.zadd(f"arcade:leaderboard:{game_id}", mapping)
```

---

## 6. Phase 11 Agent Tasks: Spectator Broadcast

### 6.1 Task: Create IVS Model

**File**: `app/models/ivs.py`  
**Operation**: Create new file  

```python
class IvsChannel(Base):
    __tablename__ = "ivs_channels"
    
    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    match_id              = Column(UUID(as_uuid=True), ForeignKey("matches.id"), unique=True, nullable=False)
    channel_arn           = Column(String(256), nullable=False)
    playback_url          = Column(String(512), nullable=False)
    ingest_endpoint       = Column(String(256), nullable=False)
    status                = Column(String(20), nullable=False, default='creating')
    recording_enabled     = Column(Boolean, nullable=False, default=False)
    created_at            = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.now)
    deleted_at            = Column(TIMESTAMP(timezone=True), nullable=True)
    
    match = relationship("Match", back_populates="ivs_channel")
```

### 6.2 Task: Create IVS Service

**File**: `app/services/ivs.py`  
**Operation**: Create new file  

See `04_DEVELOPMENT_ROADMAP.md` Phase 11 for complete `IVSService` implementation. Key points:
- Must use `asyncio.run_in_executor(None, ...)` for all boto3 calls (they are synchronous)
- Region MUST be `eu-west-1` (IVS is not in `eu-south-1`)
- `create_channel` is called from the match state machine, NOT from a user request
- `delete_channel` is called on any terminal match state transition (completed, cancelled, expired)

### 6.3 Task: Create Stream Router

**File**: `app/routers/stream.py`  
**Operation**: Create new file  

**Endpoints**:
- `GET /matches/{match_id}/stream` — **PUBLIC** (no auth required for spectators)
  - Returns `MatchStreamResponse` with `playback_url` from `ivs_channels` table
  - Returns 404 if no IVS channel exists for match
  - Returns 404 if channel is not in 'live' state (stream not started yet)
  - Cache in Redis for 30 seconds (`ivs:channel:{matchId}`)
  
- `POST /matches/{match_id}/stream/reset-key` — requires `require_auth` + host-only check
  - Calls IVS API to delete + recreate stream key
  - Delivers new key via WebSocket to host
  - Returns 200 with no body (key in WS only)
  
- `GET /matches/{match_id}/spectators` — requires `require_auth`
  - Returns current spectator count from Redis
  - Returns 0 if no counter exists

**CRITICAL SECURITY**: `GET /matches/{match_id}/stream` returns the `playback_url` (public CDN URL) — this is fine to be public. It MUST NOT return the `stream_key` or `ingest_endpoint`.

### 6.4 Task: Integrate IVS into Match State Machine

**File**: `app/routers/matches.py` (or wherever match status transitions happen)  
**Operation**: Modify match status transition logic  

When match transitions to `in_corso`:
```python
# Trigger IVS channel creation (non-blocking background task)
asyncio.create_task(
    handle_match_live(match_id=match.id, tournament=tournament, db=db, redis=redis, ws_manager=ws_manager)
)

async def handle_match_live(match_id, tournament, db, redis, ws_manager) -> None:
    ivs_service = IVSService()
    try:
        channel_config = await ivs_service.create_channel_for_match(
            match_id=match_id,
            tournament_name=tournament.name,
            recording=tournament.enable_recording,
        )
        
        # Save to DB
        async with AsyncSession(engine) as session:
            ivs_channel = IvsChannel(
                match_id=match_id,
                channel_arn=channel_config.channel_arn,
                playback_url=channel_config.playback_url,
                ingest_endpoint=channel_config.ingest_endpoint,
                status='ready',
                recording_enabled=tournament.enable_recording,
            )
            session.add(ivs_channel)
            await session.commit()
        
        # Cache playback URL in Redis
        await redis.setex(
            f"ivs:channel:{match_id}",
            1800,  # 30 min
            json.dumps({
                "playback_url": channel_config.playback_url,
                "status": "ready",
            }),
        )
        
        # Deliver stream key to HOST ONLY via WebSocket
        await ws_manager.send_to_user(tournament.created_by, {
            "event": "match.stream_ready",
            "data": {
                "stream_key": channel_config.stream_key,
                "ingest_endpoint": channel_config.ingest_endpoint,
                "playback_url": channel_config.playback_url,
            },
        })
        
    except Exception as e:
        logger.error(f"IVS channel creation failed for match {match_id}: {e}")
        # Do NOT fail the match — IVS is optional spectator feature
        # Report to CloudWatch custom metric
        cloudwatch.put_metric_data(
            Namespace='EbartexTournaments',
            MetricData=[{'MetricName': 'IvsChannelCreationFailures', 'Value': 1}]
        )
```

When match transitions to any terminal state (completed, abandoned, cancelled, expired):
```python
asyncio.create_task(cleanup_ivs_channel(match_id=match.id, db=db, redis=redis))

async def cleanup_ivs_channel(match_id, db, redis) -> None:
    ivs_channel = await get_ivs_channel_for_match(match_id, db)
    if not ivs_channel:
        return
    
    ivs_service = IVSService()
    try:
        await ivs_service.delete_channel(ivs_channel.channel_arn)
        ivs_channel.deleted_at = datetime.now(UTC)
        await db.commit()
        await redis.delete(f"ivs:channel:{match_id}")
    except Exception as e:
        logger.error(f"IVS channel deletion failed for match {match_id}: {e}")
```

---

## 7. Phase 12 Agent Tasks: Hardening

### 7.1 Circuit Breakers

Use `tenacity` library for retry logic on external service calls:

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import botocore.exceptions

@retry(
    retry=retry_if_exception_type(botocore.exceptions.EndpointConnectionError),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
)
async def create_ivs_channel_with_retry(self, *args, **kwargs):
    return await self.create_channel_for_match(*args, **kwargs)
```

### 7.2 WebSocket JWT Refresh

Agents implementing WebSocket handlers must handle token expiry:

```python
# On WS connection, schedule JWT re-validation every 10 minutes
# If token is expired, send WS message: {"event": "auth.token_expired"}
# Client must reconnect with fresh token
```

### 7.3 Match Expiry Worker

**File**: `app/workers/match_expiry.py`  
**Operation**: Create worker that runs every 5 minutes  

```python
async def expire_abandoned_matches(db, redis) -> None:
    """
    Finds matches in 'aperta' or 'in_corso' state older than 24 hours.
    Transitions them to 'abbandonata'.
    """
    threshold = datetime.now(UTC) - timedelta(hours=24)
    
    stmt = select(Match).where(
        and_(
            Match.status.in_(['aperta', 'in_corso']),
            Match.created_at < threshold,
        )
    )
    result = await db.execute(stmt)
    expired_matches = result.scalars().all()
    
    for match in expired_matches:
        match.status = 'abbandonata'
        match.updated_at = datetime.now(UTC)
        
        await publish_sns_event(sns_client, 'match.expired', {
            "match_id": str(match.id),
            "tournament_id": str(match.tournament_id),
        })
    
    if expired_matches:
        await db.commit()
        logger.info(f"Expired {len(expired_matches)} abandoned matches")
```

---

## 8. Code Conventions and Patterns

### 8.1 Imports (MUST follow no-inline-imports rule)

```python
# CORRECT: All imports at top of file
from typing import Optional, Annotated
from uuid import UUID
from datetime import datetime, timedelta
import asyncio
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from redis.asyncio import Redis

from app.dependencies.auth import require_auth, UserClaims
from app.dependencies.db import get_db
from app.dependencies.redis import get_redis
from app.models.membership import Membership
from app.schemas.membership import (
    EnrollMembershipRequest,
    MembershipStatusResponse,
    MembershipCardResponse,
)

# WRONG: Never do this
async def some_function():
    from app.models.membership import Membership  # NEVER import inside function
```

### 8.2 Error Response Pattern

```python
# Always use machine-readable error codes alongside human-readable messages
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail={
        "code": "MEMBERSHIP_REQUIRED",
        "message": "Tessera associativa richiesta per creare un torneo.",
        "action": "Vai su /associazione per iscriverti.",
    },
)

# Validation errors: let Pydantic's 422 handler run automatically
# Do NOT manually raise 422 — let Pydantic handle it
```

### 8.3 Redis Pattern (Cache-Aside)

```python
async def get_with_cache(
    key: str, ttl: int, fetch_fn, redis: Redis
):
    """Standard cache-aside pattern."""
    cached = await redis.get(key)
    if cached:
        return json.loads(cached)
    
    data = await fetch_fn()
    await redis.setex(key, ttl, json.dumps(data, default=str))
    return data
```

### 8.4 Async SQLAlchemy Pattern

```python
# ALWAYS use async context and execute() for queries
async def get_membership(user_id: UUID, db: AsyncSession) -> Optional[Membership]:
    result = await db.execute(
        select(Membership).where(Membership.user_id == user_id)
    )
    return result.scalar_one_or_none()

# For insertions, use db.add() + await db.commit()
# For updates, load the model, modify, await db.commit()
# NEVER use db.query() (synchronous ORM pattern)
```

### 8.5 SNS Event Publishing Pattern

```python
async def publish_event(event_type: str, payload: dict, sns_client) -> None:
    message = {
        "event_type": event_type,
        "service": "tournament-service",
        "timestamp": datetime.now(UTC).isoformat(),
        "payload": payload,
    }
    
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: sns_client.publish(
            TopicArn=settings.sns_events_topic_arn,
            Message=json.dumps(message),
            MessageAttributes={
                "event_type": {
                    "DataType": "String",
                    "StringValue": event_type,
                },
            },
        ),
    )
```

### 8.6 Exhaustive Switch/Match Pattern (TypeScript rule, Python equivalent)

```python
# For Python match statements on enums/literals, always include a default that asserts:
match membership.status:
    case "active":
        return handle_active(membership)
    case "expired":
        return handle_expired(membership)
    case "skipped":
        return handle_skipped(membership)
    case _:
        raise ValueError(f"Unhandled membership status: {membership.status}")
```

---

## 9. Testing Conventions

### 9.1 Test File Structure

```python
# tests/test_membership.py

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch


class TestMembershipEnroll:
    """Tests for POST /membership/enroll"""
    
    @pytest.mark.asyncio
    async def test_enroll_success(self, client: AsyncClient, auth_headers: dict) -> None:
        payload = {
            "firstName": "Mario",
            "lastName": "Rossi",
            "birthDate": "1990-01-15",
            "email": "mario@test.com",
            "phone": "+39 345 1234567",
            "city": "Roma",
            "club": "Club TCG Roma",
            "consent": True,
        }
        response = await client.post("/membership/enroll", json=payload, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "active"
        assert data["card_number"].startswith("EBX-")
        assert len(data["card_number"]) == 14  # EBX-2026-00001
    
    @pytest.mark.asyncio
    async def test_enroll_underage(self, client: AsyncClient, auth_headers: dict) -> None:
        payload = {
            "birthDate": "2015-01-15",  # 11 years old
            "consent": True,
            # ... other fields
        }
        response = await client.post("/membership/enroll", json=payload, headers=auth_headers)
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_create_tournament_without_membership_returns_403(
        self, client: AsyncClient, auth_headers_no_membership: dict
    ) -> None:
        response = await client.post("/tournaments", json={...}, headers=auth_headers_no_membership)
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "MEMBERSHIP_REQUIRED"
```

### 9.2 Test Fixtures

All shared fixtures must be in `tests/conftest.py`. Key fixtures:
- `async_db_session` — test database session with rollback
- `redis_mock` — mock Redis instance (use `fakeredis`)
- `auth_headers` — JWT token headers for authenticated user
- `auth_headers_no_membership` — authenticated user without membership
- `auth_headers_with_membership` — authenticated user with active membership

### 9.3 Test Coverage Requirements

| Module | Minimum Coverage |
|---|---|
| `routers/membership.py` | 90% |
| `routers/arcade.py` | 85% |
| `routers/stream.py` | 85% |
| `services/ivs.py` | 70% (mock boto3) |
| `workers/membership_expiry.py` | 80% |
| `dependencies/membership.py` | 95% |

---

## 10. Common Pitfalls

### 10.1 DO NOT make these mistakes

```
❌ Store IVS stream key in plaintext in the database
❌ Return stream key in HTTP response body (even to the host)
❌ Skip the PostgreSQL advisory lock in generate_card_number
❌ Use synchronous boto3 calls directly in async handlers (use run_in_executor)
❌ Forget to invalidate Redis cache on membership status change
❌ Allow arcade leaderboard to be written without user authentication
❌ Allow tournament creation without membership check
❌ Use inline imports (violates no-inline-imports rule)
❌ Use db.query() instead of await db.execute(select(...))
❌ Forget to handle IVS creation failure gracefully (should not fail the match)
❌ Deliver stream key via HTTP instead of WebSocket
```

### 10.2 ALWAYS do these things

```
✓ Wrap all external service calls in try/except with logging
✓ Use HMAC-SHA1 for TURN credential generation (see 02_TECHNICAL_SPEC.md)
✓ Publish SNS events for all significant state changes
✓ Cache read-heavy endpoints in Redis
✓ Include machine-readable error codes in all 4xx responses
✓ Log structured JSON (not plain strings) for CloudWatch
✓ Use asyncio.create_task for fire-and-forget work (IVS, emails, metrics)
✓ Use idempotency keys for score submission and wallet operations
✓ Test against the acceptance criteria in 04_DEVELOPMENT_ROADMAP.md
```

---

## 11. Agent Collaboration Protocol

### 11.1 Multiple Agents Scenario

When both a Backend Agent and Frontend Agent are working simultaneously:

1. **API Contract First**: Backend agent defines Pydantic schemas BEFORE frontend agent integrates. The frontend agent may not modify backend schemas.
2. **Shared State**: Both agents share the docs in `backend/docs/` as the single source of truth. Neither agent modifies these docs without Tech Lead approval.
3. **No Breaking Changes**: If the backend agent needs to change an existing API contract, they must notify the Frontend Agent via a note in the PR description.
4. **Redis Key Conflicts**: Each agent uses distinct Redis key namespaces: `membership:*`, `arcade:*`, `ivs:*`, `match:*`, `tournament:*`, `turn:*`

### 11.2 Agent Handoff Protocol

When an agent completes a task and passes it to another:

```markdown
## Handoff Summary
- Completed: POST /membership/enroll
- Files changed: app/routers/membership.py, app/models/membership.py, migrations/003_membership.py
- Breaking changes: None (new router)
- Dependencies added: None (all already installed)
- Tests passing: ✅ pytest tests/test_membership.py — 12/12 passed
- Known issues: None
- Next task for Backend Agent: POST /membership/skip (Section 4.2 of this doc)
```

---

*End of Agent Orchestration Plan v2.0*
