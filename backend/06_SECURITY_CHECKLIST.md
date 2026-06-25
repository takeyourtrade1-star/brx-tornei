# 06 — Security Checklist

> **Document type**: Security Controls and Compliance  
> **Version**: 2.0  
> **Updated**: June 2026 — adds IVS stream key security, membership GDPR, TURN credentials  
> **Service**: Ebartex Tournament Microservice  
> **Standards**: OWASP Top 10, GDPR (EU 2016/679), AWS Security Best Practices

---

## Table of Contents

1. [Authentication and Authorization](#1-authentication-and-authorization)
2. [API Security](#2-api-security)
3. [WebSocket Security](#3-websocket-security)
4. [Data Security at Rest](#4-data-security-at-rest)
5. [Data Security in Transit](#5-data-security-in-transit)
6. [IVS Stream Key Security — NEW](#6-ivs-stream-key-security--new)
7. [TURN Server Security — NEW](#7-turn-server-security--new)
8. [Membership Data Security — NEW](#8-membership-data-security--new)
9. [Arcade Room Security — NEW](#9-arcade-room-security--new)
10. [Infrastructure Security](#10-infrastructure-security)
11. [GDPR Compliance](#11-gdpr-compliance)
12. [Incident Response](#12-incident-response)
13. [Security Testing Checklist](#13-security-testing-checklist)
14. [Dependency and Supply Chain Security](#14-dependency-and-supply-chain-security)
15. [Security Review Sign-off Matrix](#15-security-review-sign-off-matrix)

---

## 1. Authentication and Authorization

### 1.1 JWT Validation

| Control | Requirement | Status |
|---|---|---|
| Algorithm | RS256 only — reject HS256 or `alg: none` | ✅ Implemented |
| JWKS Cache | Cache public keys from Auth service JWKS endpoint; TTL 1 hour | ✅ Implemented |
| JWKS Rotation | Re-fetch JWKS on first 401 with cached keys | ✅ Implemented |
| Expiry Check | Reject tokens with `exp` in the past | ✅ Implemented |
| Issuer Check | Validate `iss` matches `https://auth.ebartex.com` | ✅ Implemented |
| Audience Check | Validate `aud` includes `tournament-service` | ✅ Implemented |
| Algorithm Confusion | Never trust `alg` header from untrusted input | ✅ Implemented |
| Clock Skew | Allow max 30 seconds clock skew | ✅ Implemented (nbf tolerance) |

```python
# JWT validation settings (never relax these):
JWT_ALGORITHMS = ["RS256"]  # Only RS256; NEVER add HS256 or "none"
JWT_LEEWAY = 30             # 30 seconds clock skew tolerance

# Validate on every request — no session state
```

### 1.2 Role-Based Access Control (RBAC)

| Role | Tournament Creation | Match Result Submit | Stream Key Access | Membership Admin |
|---|---|---|---|---|
| `anonymous` | ❌ | ❌ | ❌ (playback URL only) | ❌ |
| `authenticated_no_membership` | ❌ (403 MEMBERSHIP_REQUIRED) | ❌ | ❌ | ❌ |
| `authenticated_skipped` | ❌ (403 MEMBERSHIP_SKIPPED) | ❌ | ❌ | ❌ |
| `active_member` | ✅ | ✅ (own matches only) | ❌ (host check required) | ❌ |
| `match_host` | ✅ | ✅ | ✅ (via WS only) | ❌ |
| `admin` | ✅ | ✅ (any match) | ✅ | ✅ |

### 1.3 Object-Level Authorization

All endpoints must verify that the requesting user owns or has permission for the specific object:

```python
# Example: Only the match host or participant may submit results
async def verify_match_participant(
    match_id: UUID,
    current_user: UserClaims,
    db: AsyncSession,
) -> Match:
    match = await get_match_or_404(match_id, db)
    
    if current_user.user_id not in (str(match.player_a_id), str(match.player_b_id)):
        raise HTTPException(
            status_code=403,
            detail={"code": "FORBIDDEN", "message": "Non sei un partecipante di questa partita."},
        )
    return match

# SECURITY: Do NOT expose matches that belong to another tournament
# SECURITY: Do NOT allow user A to update user B's ELO
```

---

## 2. API Security

### 2.1 Rate Limiting

All endpoints have rate limits enforced via Redis counters. Limits per endpoint:

| Endpoint | Limit | Window | Redis Key Pattern |
|---|---|---|---|
| `POST /membership/enroll` | 3 requests | 24 hours | `ratelimit:enroll:{userId}:{date}` |
| `POST /membership/renew` | 5 requests | 24 hours | `ratelimit:renew:{userId}:{date}` |
| `POST /arcade/scores` | 10 requests per game | 1 hour | `ratelimit:arcade_score:{userId}:{game}:{hour}` |
| `POST /arcade/rooms` | 5 requests | 1 hour | `ratelimit:arcade_rooms:{userId}:{hour}` |
| `POST /signaling` (offer/answer) | 30 requests | 1 minute | `ratelimit:signaling:{userId}:{minute}` |
| `GET /signaling/ice-servers` | 10 requests | 1 minute | `ratelimit:ice_servers:{userId}:{minute}` |
| `POST /tournaments` | 20 requests | 1 hour | `ratelimit:create_tournament:{userId}:{hour}` |
| `GET /tournaments` | 100 requests | 1 minute | `ratelimit:list_tournaments:{ip}:{minute}` |
| `POST /matches/{id}/stream/reset-key` | 3 requests | 1 hour | `ratelimit:reset_stream_key:{matchId}:{hour}` |
| `POST /membership/me` (anonymous probe) | N/A | N/A | Requires auth |

```python
async def check_rate_limit(
    key: str, limit: int, window_seconds: int, redis: Redis
) -> None:
    current = await redis.incr(key)
    if current == 1:
        await redis.expire(key, window_seconds)
    if current > limit:
        raise HTTPException(
            status_code=429,
            detail={"code": "RATE_LIMIT_EXCEEDED", "message": "Troppe richieste. Riprova più tardi."},
            headers={"Retry-After": str(window_seconds)},
        )
```

### 2.2 Input Validation

| Control | Implementation |
|---|---|
| All request bodies | Validated by Pydantic models before handler runs |
| UUID parameters | FastAPI/Pydantic auto-coerces; invalid UUIDs → 422 |
| Enum fields | Pydantic Literal or Python enum; invalid values → 422 |
| String lengths | Max lengths on all text fields (100–500 chars depending on field) |
| Numeric ranges | Pydantic `Field(ge=0, le=...)` constraints |
| Date validation | Custom Pydantic validators for age, future dates |
| HTML/XSS | All string fields are stored and returned as-is (no rendering); frontend escapes on display |
| SQL Injection | SQLAlchemy ORM parameterizes all queries; raw SQL prohibited |
| Score manipulation | Backend validates `score <= GAME_SCORE_LIMITS[game_id]` |

### 2.3 Request Size Limits

```python
# FastAPI app config
app = FastAPI(...)

# Set body size limit to prevent DoS
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

# Max request body: 1 MB (sufficient for all API payloads)
# Configured at ALB level (8 MB) and uvicorn level (1 MB)
```

### 2.4 CORS Configuration

```python
origins = [
    "https://tournaments.ebartex.com",
    "https://ebartex.com",
    "https://www.ebartex.com",
]

# NEVER use origins=["*"] in production
# NEVER allow credentials with wildcard origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)
```

### 2.5 Security Headers

Enforced at CloudFront level (response headers policy):

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.live-video.net wss://...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=(self), geolocation=()
```

---

## 3. WebSocket Security

### 3.1 WebSocket Authentication

```python
@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(...),  # JWT passed as query param (unavoidable for WS)
) -> None:
    # Validate token immediately on connection
    try:
        claims = validate_jwt(token)
    except JWTError:
        await websocket.close(code=4001, reason="Unauthorized")
        return
    
    # Accept only after auth
    await websocket.accept()
    ...
```

### 3.2 WebSocket Security Controls

| Control | Requirement |
|---|---|
| Authentication | JWT validated on every WS connection; invalid → close code 4001 |
| Token expiry in session | Check JWT `exp` on each received message; expired → close code 4002 |
| Room isolation | Users can only receive messages for rooms they have access to |
| Stream key isolation | Stream key ONLY sent to the match host's WS connection; verified by `match.player_a_id` check |
| Message rate limit | Max 60 messages/minute per connection; excess → close 4008 |
| Payload size | Max 10 KB per WS message; larger → ignore + log |
| Origin header | Validate `Origin` header matches allowed origins |
| Ping/pong timeout | Close connection if no pong received within 30 seconds |

### 3.3 Stream Key WebSocket Isolation

```python
async def deliver_stream_key_to_host(
    match: Match, channel_config: IVSChannelConfig, ws_manager: WebSocketManager
) -> None:
    """
    SECURITY CRITICAL: Stream key MUST only be delivered to the tournament host.
    Never broadcast to all match participants.
    """
    host_id = str(match.player_a_id)  # player_a is always the host/creator
    
    # Verify host has an active WS connection
    if not ws_manager.has_connection(host_id):
        # Log warning but don't fail the match
        logger.warning(f"Host {host_id} has no active WS connection for match {match.id}")
        # Queue for delivery when host reconnects
        await ws_manager.queue_for_user(host_id, stream_key_message)
        return
    
    # Send ONLY to host, not to participant or spectators
    await ws_manager.send_to_user(host_id, {
        "event": "match.stream_ready",
        "data": {
            "stream_key": channel_config.stream_key,
            "ingest_endpoint": channel_config.ingest_endpoint,
            "playback_url": channel_config.playback_url,
        },
    })
    
    logger.info(f"Stream key delivered to host {host_id} for match {match.id}")
```

---

## 4. Data Security at Rest

### 4.1 Database Encryption

| Layer | Encryption |
|---|---|
| Aurora storage | AES-256 encryption at rest (RDS Encryption enabled in CDK) |
| Aurora backups | Encrypted with same KMS key |
| ElastiCache | Encryption at rest enabled |
| S3 buckets (recordings) | SSE-S3 (AES-256) |
| Secrets Manager | AWS KMS-managed keys |

### 4.2 Sensitive Data Classification

| Data | Classification | Storage | Notes |
|---|---|---|---|
| User JWT | Confidential | Client only (never server) | — |
| IVS stream key | Secret | WS only, never persisted | Delete from memory after delivery |
| IVS channel ARN | Internal | DB (encrypted at rest) | Not sensitive but internal |
| IVS playback URL | Public | DB, Redis | Can be public |
| Membership card number | Personal Data (GDPR) | DB (encrypted col) | EBX-YYYY-NNNNN format |
| Birth date | Special Personal Data | DB | Minimum required; access-logged |
| Email/phone | Personal Data | DB | Used for notifications only |
| TURN shared secret | Secret | AWS Secrets Manager | Never in code or logs |
| Match game results | Internal | DB | Not personally sensitive |
| Arcade scores | Semi-public | DB + Redis | Publicly visible on leaderboard |
| ELO rating | Public | DB + Redis | Displayed on profile |

### 4.3 Column-Level Encryption (Membership)

Membership `birth_date`, `phone`, and `email` should be encrypted at the application level using `pgcrypto` in Phase 12:

```sql
-- Phase 12: Encrypt sensitive columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Before Phase 12, data is protected by disk-level RDS encryption
-- Column-level encryption adds defense in depth
```

---

## 5. Data Security in Transit

### 5.1 TLS Requirements

| Connection | Minimum TLS | Certificate |
|---|---|---|
| Browser → CloudFront | TLS 1.2 | ACM (auto-renewed) |
| CloudFront → ALB | TLS 1.2 | ACM internal |
| ALB → ECS (HTTP internal) | HTTP (VPC private subnet) | N/A (VPC-internal only) |
| ECS → RDS | TLS 1.3 | RDS CA certificate |
| ECS → ElastiCache | TLS 1.2 | ElastiCache CA |
| ECS → IVS API | HTTPS 1.3 | AWS SDK managed |
| ECS → SES/SQS/SNS | HTTPS 1.3 | AWS SDK managed |
| Browser → TURN (TURNS) | TLS 1.2 | Let's Encrypt (certbot) |
| OBS/Browser → IVS Ingest | RTMPS (TLS 1.2) | IVS managed |
| Spectator → IVS CDN | HTTPS (LL-HLS) | IVS CDN managed |

### 5.2 Certificate Management

- CloudFront/ALB certificates: AWS Certificate Manager (auto-renewed 60 days before expiry)
- TURN server certificate: Let's Encrypt via certbot with cron-based auto-renewal (`certbot renew --pre-hook "systemctl stop coturn" --post-hook "systemctl start coturn"`)
- Alert: CloudWatch alarm fires 30 days before TURN cert expiry

---

## 6. IVS Stream Key Security — NEW

### 6.1 Threat Model for Stream Keys

| Threat | Risk Level | Mitigation |
|---|---|---|
| Stream key leaked in HTTP response | Critical | Never return key in HTTP body; WS-only delivery |
| Stream key in CloudWatch logs | Critical | Log scrubbing; never log `stream_key` field |
| Stream key in DB plaintext | High | Not stored in DB at all; ephemeral WS delivery |
| Unauthorized host streaming (key theft) | High | Stream key reset endpoint; match status validation |
| Stream key stored in browser localStorage | Medium | Frontend must store only in memory (not persisted) |
| Replay of old stream key | Low | IVS stream keys are single-channel; old channels deleted on match end |

### 6.2 Stream Key Audit Trail

```python
# Every stream key operation is logged (without the key itself)
logger.info(json.dumps({
    "event": "ivs_stream_key_operation",
    "operation": "delivered",  # created | delivered | reset | deleted
    "match_id": str(match.id),
    "host_user_id": str(host_id),
    "timestamp": datetime.now(UTC).isoformat(),
    "channel_arn": channel_arn,
    # NEVER log the key itself
}))
```

### 6.3 Stream Key Reset Procedure

If the host suspects their stream key is compromised:

```
1. Host calls POST /matches/{match_id}/stream/reset-key (rate limited: 3/hour)
2. Backend calls IVS API: DeleteStreamKey(streamKeyArn)
3. Backend calls IVS API: CreateStreamKey(channelArn) → new stream key
4. Backend delivers new stream key via WebSocket to host
5. Host reconfigures OBS with new stream key
6. Old key is immediately invalidated by IVS
```

### 6.4 CloudWatch Log Filter for Key Leak Detection

```python
# CloudWatch Insights query for detecting accidental key logging:
# Run daily as a CloudWatch scheduled query
"""
fields @timestamp, @message
| filter @message like /sk_eu-west-1/  # IVS stream key format prefix
| stats count(*) as occurrences by bin(1h)
"""
# Alert if any occurrences found — stream key should NEVER appear in logs
```

---

## 7. TURN Server Security — NEW

### 7.1 TURN Server Hardening Checklist

```
□ Use HMAC-SHA1 ephemeral credentials (not long-lived username/password)
□ Credentials expire after 24 hours (configurable via turn-credential-ttl)
□ Shared secret stored ONLY in AWS Secrets Manager (never in code or env vars)
□ Deny peer connections to RFC 1918 addresses (VPC internal)
□ Set allocation quota per user (user-quota=20 concurrent TURN allocations)
□ Set total allocation quota (total-quota=300)
□ Enable TLS for TURNS (port 5349) with Let's Encrypt certificate
□ SSH access restricted to VPC IP range (no public SSH)
□ CloudWatch agent installed for monitoring and alerting
□ Log rotation enabled (coturn logs can be large)
□ TURN server does NOT relay to VPC internal addresses (blocked by config)
```

### 7.2 HMAC Credential Generation

```python
import hmac
import hashlib
import time
import base64

def generate_turn_credentials(
    user_id: str,
    shared_secret: str,
    ttl_seconds: int = 86400,
) -> dict:
    """
    Generate time-limited TURN credentials using HMAC-SHA1.
    Compliant with RFC 5766 TURN authentication.
    
    SECURITY: These credentials are ONLY valid for the duration specified.
    If user_id is compromised, the credentials expire on their own.
    """
    expiry = int(time.time()) + ttl_seconds
    username = f"{expiry}:{user_id}"
    
    hmac_key = hmac.new(
        shared_secret.encode("utf-8"),
        username.encode("utf-8"),
        hashlib.sha1,
    )
    password = base64.b64encode(hmac_key.digest()).decode("utf-8")
    
    return {
        "urls": [
            f"stun:stun.l.google.com:19302",  # Public STUN (no auth needed)
            f"turn:turn.ebartex.com:3478",
            f"turns:turn.ebartex.com:5349",
        ],
        "username": username,
        "credential": password,
    }
```

### 7.3 TURN Security Monitoring

| Alert | Threshold | Action |
|---|---|---|
| TurnActiveAllocations > 250 | > 250 concurrent relays | Scale up EC2 or investigate DDoS |
| Unauthorized TURN connection attempts | > 1000/hour | WAF block + alert |
| TURN server unreachable | 2 consecutive health checks | PagerDuty page |
| TURN certificate expiry | < 30 days | Auto-renewal + alert |

---

## 8. Membership Data Security — NEW

### 8.1 Personal Data Inventory

Under GDPR, the following data is classified as Personal Data (PD):

| Field | Classification | Legal Basis | Retention |
|---|---|---|---|
| `email` | PD | Contractual (membership) | Until membership cancelled + 1 year |
| `first_name`, `last_name` | PD | Contractual | Same as email |
| `birth_date` | PD | Contractual (age verification) | Same as email |
| `phone` | PD | Legitimate interest (notifications) | Until membership cancelled |
| `city` | PD | Contractual | Same as email |
| `card_number` | PD (unique identifier) | Contractual | Same as email |
| `consent_at` | Required record | Legal obligation (GDPR Art. 7) | 5 years (legal basis record) |

### 8.2 Membership Data Access Controls

```python
# Only the member themselves can read their own membership data
# Admin can read any membership (requires admin JWT claim)

@router.get("/membership/me")
async def get_my_membership(current_user: UserClaims = Depends(require_auth), ...):
    # Only own data — no user_id parameter
    ...

@router.get("/admin/memberships/{user_id}")
async def get_membership_admin(
    user_id: UUID,
    current_user: UserClaims = Depends(require_admin),  # require_admin checks JWT claim
    ...
):
    ...
```

### 8.3 Consent Management

```python
# Consent must be explicit, granular, and recorded
class ConsentRecord(TypedDict):
    consented: bool                # True = explicit consent given
    timestamp: str                 # ISO 8601 timestamp
    version: str                   # Privacy policy version
    ip_address_hash: str           # SHA-256 of IP (not stored as PD)
    user_agent_hash: str           # SHA-256 of user agent

# Store in memberships.consent_at (timestamp) + memberships.consent_version (version)
# IP hash is derived but NOT stored (privacy by design)
```

### 8.4 Right to Erasure (GDPR Art. 17)

When a user requests data deletion:

```python
async def handle_gdpr_erasure(user_id: UUID, db: AsyncSession, redis: Redis) -> None:
    """
    GDPR Art. 17: Right to Erasure.
    Anonymizes membership data while retaining statistical/financial records.
    """
    membership = await get_membership_for_user(user_id, db)
    
    if membership:
        # Anonymize (not delete — retain card_number sequence for audit)
        membership.first_name  = "DELETED"
        membership.last_name   = "DELETED"
        membership.email       = f"deleted_{user_id}@deleted.invalid"
        membership.phone       = None
        membership.city        = None
        membership.birth_date  = None
        membership.status      = "deleted"
        
        # Invalidate Redis cache
        await redis.delete(f"membership:status:{user_id}")
        await redis.delete(f"membership:card:{user_id}")
    
    # Anonymize arcade scores (retain scores for leaderboard integrity, remove user linkage)
    await db.execute(
        update(ArcadeScore)
        .where(ArcadeScore.user_id == user_id)
        .values(user_id=ANONYMOUS_USER_UUID)  # Sentinel value
    )
    
    await db.commit()
    await publish_event('membership.gdpr_erased', {"user_id": str(user_id)}, sns_client)
```

---

## 9. Arcade Room Security — NEW

### 9.1 Score Integrity Controls

| Control | Implementation |
|---|---|
| Server-side score validation | `score <= GAME_SCORE_LIMITS[game_id]` check |
| Rate limiting | Max 10 submissions/hour/user/game |
| Idempotency key | Prevents double-submission of same game session |
| Statistical anomaly detection | Phase 13: flag unusually high scores for review |
| Leaderboard entries | Redis ZADD (only updates if new score is higher — cannot fake lower) |

### 9.2 P2P Room Code Security

```python
# Room codes are:
# - 6 characters, uppercase alphanumeric
# - Cryptographically random (secrets.choice, not random.choice)
# - Server does NOT store WebRTC SDP offers/answers (client-to-client)
# - Server only stores: {host_user_id, game_id, status, created_at}
# - TTL: 30 minutes (auto-expires in Redis)

# SECURITY: Room codes are not secret — they're shared peer-to-peer
# The SDP offer/answer exchange happens client-to-client
# No sensitive data passes through the server for arcade P2P
```

### 9.3 Wallet Security

```python
# Wallet operations:
# - Credits: only the server can add tickets (from score submission handler)
# - Debits: atomic Redis + DB transaction; balance cannot go below 0
# - No external value: tickets have no monetary value (no payment card needed)
# - Audit log: all wallet operations recorded in a transactions log (Phase 13)

# SECURITY: ticket economy is internal only; no real money involved
# If implementing purchase-based tickets in future, full PCI-DSS audit required
```

---

## 10. Infrastructure Security

### 10.1 AWS Security Controls

| Control | Implementation | Status |
|---|---|---|
| VPC isolation | All compute in private subnets; public subnet for ALB and TURN only | ✅ |
| Security groups | Principle of least privilege; source SGs not IP ranges where possible | ✅ |
| IAM roles | Task execution role ≠ task role; minimal permissions per role | ✅ |
| Secrets Manager | All secrets in Secrets Manager; no env var secrets | ✅ |
| KMS encryption | Aurora, ElastiCache, S3 encrypted at rest | ✅ |
| CloudTrail | All API calls logged in CloudTrail | ✅ (account-level) |
| GuardDuty | Threat detection enabled | ⏳ Phase 12 |
| AWS Config | Resource compliance rules | ⏳ Phase 12 |
| WAF | Rate limiting, IP blocking, OWASP ruleset at CloudFront | ⏳ Phase 12 |
| VPC Flow Logs | Network traffic logging | ⏳ Phase 12 |
| IMDSv2 | TURN EC2 uses IMDSv2 only (prevents SSRF metadata attacks) | ✅ |

### 10.2 Container Security

```dockerfile
# Security requirements in Dockerfile:
FROM python:3.12-slim AS runtime

# Create non-root user
RUN addgroup --gid 1001 appgroup && \
    adduser --uid 1001 --gid 1001 --disabled-password --gecos "" appuser

# Copy app with limited permissions
COPY --chown=appuser:appgroup ./app /app/app

# Run as non-root
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health')"
```

### 10.3 Secrets Rotation

| Secret | Rotation Frequency | Method |
|---|---|---|
| DB password | 30 days | Secrets Manager auto-rotation with Lambda |
| TURN shared secret | 90 days | Manual rotation (requires coturn restart) |
| IVS stream keys | Per-match | Auto (new key per channel creation) |
| JWT JWKS | On Auth service key rotation | JWKS re-fetch on 401 |
| SES SMTP credentials | 90 days | Secrets Manager rotation |

---

## 11. GDPR Compliance

### 11.1 Lawful Bases for Processing

| Processing Activity | Lawful Basis | Article |
|---|---|---|
| Match participation | Contract performance | Art. 6(1)(b) |
| Membership enrollment | Contract + Consent | Art. 6(1)(a)(b) |
| ELO leaderboard (public) | Legitimate interest | Art. 6(1)(f) |
| Email notifications | Legitimate interest | Art. 6(1)(f) |
| Match recordings (IVS) | Consent (opt-in per match) | Art. 6(1)(a) |
| Analytics/metrics | Legitimate interest (aggregated) | Art. 6(1)(f) |
| Audit logs | Legal obligation | Art. 6(1)(c) |

### 11.2 Data Subject Rights Implementation

| Right | Endpoint | Implementation |
|---|---|---|
| Access (Art. 15) | `GET /gdpr/export` | Returns all user data as JSON (Phase 12) |
| Rectification (Art. 16) | `PUT /membership/me` | Update name, email, city (not birth_date post-enrollment) |
| Erasure (Art. 17) | `DELETE /gdpr/me` | Anonymization per section 8.4 above |
| Portability (Art. 20) | `GET /gdpr/export?format=json` | Machine-readable export (Phase 12) |
| Objection (Art. 21) | Contact form | Manual process until Phase 12 |
| Withdraw consent | `POST /membership/skip` | Skips membership; does not delete |

### 11.3 Data Residency

| Data | Location | GDPR Compliant |
|---|---|---|
| Aurora RDS | `eu-south-1` (Milan) | ✅ EU |
| ElastiCache | `eu-south-1` (Milan) | ✅ EU |
| S3 buckets | `eu-south-1` (Milan) | ✅ EU |
| IVS | `eu-west-1` (Ireland) | ✅ EU |
| IVS Recordings S3 | `eu-west-1` (Ireland) | ✅ EU |
| CloudWatch Logs | `eu-south-1` (Milan) | ✅ EU |
| SES | `eu-west-1` (Ireland) | ✅ EU |
| CloudFront (CDN) | Global PoPs | ✅ (edge caching only, data at origin) |

**Note**: IVS is not available in `eu-south-1`. Using `eu-west-1` (Ireland) keeps all data within the EU. This is GDPR-compliant but must be documented in the privacy policy.

### 11.4 Privacy by Design Principles Applied

```
✓ Data minimization: Only collect birth_date (not full ID document)
✓ Purpose limitation: Birth date used ONLY for age verification at enrollment
✓ Storage limitation: Membership data deleted on erasure request + 1 year retention for legal
✓ Pseudonymization: ELO leaderboard uses username/display name, not real name
✓ Consent records: consent_at and consent_version stored permanently (legal obligation)
✓ Breach notification: Incident response plan covers Art. 33/34 notifications (Section 12)
```

---

## 12. Incident Response

### 12.1 Security Incident Classification

| Severity | Description | Response Time | Notification |
|---|---|---|---|
| P0 — Critical | Data breach, stream key leak, auth bypass | 15 minutes | Immediate PagerDuty + legal |
| P1 — High | Rate limit bypass, DoS, IVS manipulation | 1 hour | PagerDuty |
| P2 — Medium | Score cheating, wallet manipulation | 4 hours | Slack #security |
| P3 — Low | Minor config issue, log exposure | 24 hours | GitHub issue |

### 12.2 Data Breach Response (GDPR Art. 33)

If a personal data breach is detected:

```
1. CONTAIN (0-2 hours):
   - Identify scope of breach (which data, which users)
   - Revoke compromised credentials (rotate secrets, invalidate tokens)
   - Block attack vector (WAF rule, IP block, etc.)
   - Preserve evidence (CloudTrail, VPC Flow Logs)

2. ASSESS (2-24 hours):
   - Determine if personal data was exposed (membership, email, birth_date)
   - Count affected users
   - Assess risk to rights and freedoms of affected persons

3. NOTIFY (within 72 hours of discovery if high risk):
   - Notify Italian DPA (Garante per la protezione dei dati personali)
   - Notify affected users if high risk to their rights (Art. 34)
   - Document in internal breach register

4. REMEDIATE (1-7 days):
   - Fix root cause
   - Update security controls
   - Post-mortem document
```

### 12.3 Stream Key Compromise Response

```
1. Host reports streaming from unauthorized OBS instance
2. Immediately call POST /matches/{match_id}/stream/reset-key
3. Old stream key invalidated by IVS within 10 seconds
4. New stream key delivered to host via WebSocket
5. Investigate source of key leak (WS logs, browser storage)
6. If breach was through logs: P0 incident (data breach potential)
```

---

## 13. Security Testing Checklist

### 13.1 Pre-Deployment Security Tests

```
Authentication:
□ JWT with alg=none is rejected (401)
□ JWT with HS256 algorithm is rejected (401)
□ Expired JWT is rejected (401)
□ JWT with wrong issuer is rejected (401)
□ JWT with wrong audience is rejected (401)

Authorization:
□ User A cannot read User B's membership data (403)
□ Non-host cannot receive stream key via WebSocket
□ Non-member cannot create tournament (403 MEMBERSHIP_REQUIRED)
□ Anonymous user cannot access /membership/me (401)
□ Admin endpoints require admin JWT claim

Input Validation:
□ Score > GAME_SCORE_LIMITS is rejected (400)
□ Birth date making user under 16 is rejected (422)
□ Invalid club name is rejected (422)
□ SQL injection in tournament search returns 422 or empty results
□ Very long string fields (>1000 chars) return 422

Rate Limiting:
□ > 3 enrollment attempts in 24h returns 429
□ > 10 arcade score submissions/hour returns 429
□ > 30 signaling requests/minute returns 429

IVS Security:
□ GET /matches/{id}/stream never returns stream_key
□ POST /matches/{id}/stream/reset-key is host-only (403 for non-host)
□ Stream key is not present in any CloudWatch log
□ Playback URL is accessible without authentication

WebSocket:
□ WS connection with invalid token is closed (4001)
□ User A cannot receive User B's match events
□ Stream key message arrives only at host WS, not at participant WS

TURN:
□ TURN credentials expire after TTL
□ TURN server denies connections to VPC internal IPs
□ TURNS (TLS) works correctly
□ HMAC credentials cannot be forged without shared secret
```

---

## 14. Dependency and Supply Chain Security

### 14.1 Python Dependencies

```bash
# Regular security audit
pip audit

# Pin all dependencies with exact versions in requirements.txt
# Use pip-compile (pip-tools) to generate locked requirements

# Example requirements.txt structure:
fastapi==0.115.x
sqlalchemy==2.0.x
boto3==1.34.x
redis==5.0.x
python-jose[cryptography]==3.3.x
```

### 14.2 Container Image Security

```dockerfile
# Use official slim images only (no full images)
FROM python:3.12-slim

# NEVER use :latest tags in production
# Scan images with Amazon ECR scanning or Snyk in CI/CD pipeline
```

### 14.3 CI/CD Security Gates

```yaml
# Required security checks in GitHub Actions / CI:
security-checks:
  steps:
    - name: Dependency audit
      run: pip audit --fail-on vulnerability
    
    - name: SAST scan
      run: bandit -r app/ -ll  # Fail on medium+ severity
    
    - name: Container scan
      run: aws ecr start-image-scan --repository-name tournament-api --image-id imageTag=$COMMIT_SHA
    
    - name: Secrets scan
      run: detect-secrets scan --all-files  # Fail if any secrets found
```

---

## 15. Security Review Sign-off Matrix

| Phase | Component | Security Review | GDPR Review | Pen Test |
|---|---|---|---|---|
| Phase 8 | Tournament Filters | ⬜ Pending | N/A | N/A |
| Phase 9 | Membership System | ⬜ Pending | ⬜ Pending | ⬜ Pending |
| Phase 10 | Arcade Backend | ⬜ Pending | ⬜ Pending | N/A |
| Phase 11 | IVS + Stream Key | ⬜ Pending | ⬜ Pending | ⬜ Pending |
| Phase 12 | Production Hardening | ⬜ Pending | ⬜ Pending | ⬜ Pending |

**Sign-off Required By**: Tech Lead + external security consultant (before public launch)

---

*End of Security Checklist v2.0*
