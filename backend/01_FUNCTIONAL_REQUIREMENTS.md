# 01 — Functional Requirements

> **Document type**: Functional Requirements Specification  
> **Version**: 2.0  
> **Platform**: Ebartex Tournaments — `tournaments.ebartex.com`  
> **Backend service**: Tournament Service (Python FastAPI on ECS Fargate)  
> **Updated**: June 2026 — added Membership (FR-041–FR-055), Arcade Room (FR-056–FR-065), Spectator Broadcasting (FR-066–FR-070), 3-Role Infrastructure (FR-071–FR-075)

---

## Requirement Format

Each requirement follows:
- **ID**: `FR-NNN`
- **Title**: Short descriptor
- **Priority**: `P0` (launch-blocker), `P1` (important, Phase 1–2), `P2` (enhancements, Phase 3+)
- **User Story**: As a `<role>`, I want to `<action>`, so that `<outcome>`
- **Acceptance Criteria**: Numbered checklist, testable
- **Notes**: Implementation guidance, constraints, edge cases

---

## User Roles

| Role ID | Name | Description |
|---|---|---|
| `anonymous` | Anonymous | Unauthenticated visitor; can access webcam sender page only |
| `player` | Player | Authenticated Ebartex user; can create/join/spectate tournaments |
| `player_with_membership` | Member Player | Player with active tessera; full access to all features |
| `organizer` | Organizer (Host) | Player who created a tournament; has management rights + streams camera |
| `participant` | Participant | Player who joined a 1v1 match; streams camera bidirectionally |
| `spectator` | Spectator | Authenticated or anonymous user watching a live match; read-only |
| `admin` | Admin | Platform administrator; full management access |

A `player` automatically becomes `organizer` of tournaments they create. One user can be organizer of multiple tournaments simultaneously. **All tournament matches are 1v1 (exactly 2 players)** — this is a fundamental, non-negotiable constraint.

---

## FR-001: User Authentication via Ebartex SSO

**Priority**: P0  
**User Story**: As a player, I want to log in with my Ebartex account so that I can access the tournament platform without a separate registration.

**Acceptance Criteria**:
1. The Tournament Service validates the JWT `access_token` issued by the Ebartex Auth microservice (RS256 algorithm).
2. JWT claims `sub` (user_id), `email`, and `name` are extracted and available to all authenticated endpoints.
3. Requests with missing, malformed, expired, or invalid JWTs receive `401 Unauthorized` with `{ "detail": "Token non valido o scaduto.", "code": "INVALID_TOKEN" }`.
4. Requests with a valid token but insufficient role for the endpoint receive `403 Forbidden` with `{ "detail": "Accesso negato.", "code": "FORBIDDEN" }`.
5. The JWKS public keys are fetched from `{AUTH_API_URL}/.well-known/jwks.json` at startup and cached in-process for 12 hours.
6. On a JWKS cache miss (JWT `kid` not found in cache), the service re-fetches JWKS before rejecting the token.
7. Admin role (`"admin"` in JWT `roles` array) grants elevated access to all admin endpoints.

---

## FR-002: List Tournaments by Format and Mode

**Priority**: P0  
**User Story**: As a player, I want to see all tournaments for my selected game format and mode so that I can decide which to join or observe.

**Acceptance Criteria**:
1. `GET /api/v1/tournaments?format={formatId}&mode={modeId}` returns a JSON array of Tournament objects.
2. Valid `format` values: `old-school`, `premodern`, `pioneer`, `modern`, `standard`, `legacy`, `pauper`, `commander`.
3. Valid `mode` values: `heads-up`, `multiplayer`.
4. Optional filter: `buyIn` values: `for_fun`, `paid` (future).
5. Optional filter: `status` values: `in_registrazione`, `iniziata`, `terminata`, `all`.
6. Results are sorted by `created_at` descending (newest first).
7. Tournaments with `status = 'terminata'` older than 7 days are excluded from the default listing.
8. Each tournament object includes the `participants` array with `{id, username}` for each participant.
9. Response is cached in Redis for 3 seconds (cache-aside, invalidated on tournament mutation).
10. The endpoint requires authentication (P0 MVP); future P2: allow anonymous access for public spectating.
11. If `format` or `mode` is invalid, return `422 Unprocessable Entity` with validation details.
12. The response wraps results: `{ "data": [...tournaments], "meta": { "total": N } }`.

---

## FR-003: Create Tournament

**Priority**: P0  
**User Story**: As a player with active membership, I want to create a new tournament with my chosen format, mode, and best-of setting so that others can join and play me.

**Acceptance Criteria**:
1. `POST /api/v1/tournaments` with body `{ format, mode, bestOf, isPrivate? }` creates a tournament.
2. `bestOf` must be one of `"BO1"`, `"BO3"`, `"BO5"`.
3. `buyIn` is always `"for_fun"` (hardcoded in backend — not user-configurable in MVP).
4. `maxPlayers` is derived from `mode`: `heads-up` → **2** (immutable — ALL matches are 1v1).
5. `status` is set to `"in_registrazione"` automatically.
6. The authenticated user is added as the first participant (with `games: 0`).
7. The tournament `id` is a UUID v4.
8. `created_at` is set to the current UTC timestamp.
9. Response: `201 Created` with the full Tournament object.
10. A `tournament.created` domain event is published to the SNS topic.
11. Rate limit: max 5 tournament creations per user per 60 seconds. Excess: `429 Too Many Requests`.
12. Validation errors return `422` with per-field error details.
13. Users with `membership.status == 'none'` receive `403 MEMBERSHIP_REQUIRED`.

---

## FR-004: Join Tournament (Public)

**Priority**: P0  
*(unchanged from v1 — see original spec)*

---

## FR-005 through FR-040

*(All requirements from v1 remain valid and unchanged — see original 01_FUNCTIONAL_REQUIREMENTS.md v1.0)*

---

## FR-041: Membership Enrollment

**Priority**: P0  
**User Story**: As a new user, I want to fill out a membership form to receive my tessera (membership card) so that I can access the full tournament platform.

**Acceptance Criteria**:
1. `POST /api/v1/membership/enroll` with body `{ firstName, lastName, birthDate, email, phone, city, club }` creates a membership record.
2. `firstName` and `lastName` are required, max 100 chars each.
3. `birthDate` is required; user must be ≥ 16 years old (GDPR: under-16 requires parental consent).
4. `email` is optional (defaults to the JWT email claim if not provided).
5. `club` must be one of the registered Ebartex clubs returned by `GET /api/v1/membership/clubs`, or the special value `"Online / Nessun circolo"`.
6. On success: generates `card_number` in format `EBX-{YYYY}-{NNNNN:05d}` (sequential within year).
7. Response: `201 Created` with `{ "data": { "card_number": "EBX-2026-00042", "status": "active", "tier": "standard", "expires_at": "2027-06-25T00:00:00Z" } }`.
8. Membership expires exactly 1 year from enrollment date.
9. Publishes `membership.enrolled` event to SNS.
10. Sets `membership:status:{userId}` in Redis (TTL 300s) → `{ "status": "active" }`.
11. A user can only have one active membership at a time. Duplicate enrollment returns `409 Conflict`.
12. Rate limit: max 3 enrollment attempts per user per hour.

---

## FR-042: Membership Skip

**Priority**: P0  
**User Story**: As a new user, I want to skip the membership onboarding so that I can browse the platform without full registration, understanding I have limited access.

**Acceptance Criteria**:
1. `POST /api/v1/membership/skip` creates a membership record with `status = 'skipped'`.
2. Skipped users can view tournaments and use the arcade room (single-player only).
3. Skipped users cannot create tournaments, join matches, or view their ELO.
4. Response: `200 OK` with `{ "data": { "status": "skipped", "message": "Puoi partecipare ai tornei dopo aver completato l'iscrizione." } }`.
5. Frontend `MembershipGate` reads this status and does NOT redirect again if `status !== 'none'`.

---

## FR-043: Get Membership Status

**Priority**: P0  
**User Story**: As a user, I want to check my current membership status so that the frontend can make routing decisions.

**Acceptance Criteria**:
1. `GET /api/v1/membership/me` returns the current user's membership state.
2. Response includes: `status`, `tier`, `card_number` (if active), `expires_at`, `first_name`, `last_name`, `club`.
3. If no membership record exists: returns `{ "data": { "status": "none" } }` (200, not 404).
4. Response is cached in Redis for 300 seconds (`membership:status:{userId}`).
5. No auth → 401.

---

## FR-044: Membership Card Reveal

**Priority**: P1  
**User Story**: As a newly enrolled member, I want to see my membership card reveal animation with my card number so that I feel the moment of membership confirmation.

**Acceptance Criteria**:
1. `GET /api/v1/membership/card` returns card data for the reveal animation.
2. Response: `{ "data": { "card_number": "EBX-2026-00042", "tier": "standard", "member_name": "Marco Rossi", "enrolled_at": "2026-06-25", "club": "Ebartex Milano Centro", "reveal_animation": "card_flip_reveal" } }`.
3. The `reveal_animation` field tells the frontend which animation to play (for future tier-specific animations).
4. Returns `404` if user has no active membership.
5. No caching (always fresh).

---

## FR-045: List Membership Clubs

**Priority**: P0  
**User Story**: As the membership onboarding form, I want to fetch the list of registered Ebartex clubs so that the dropdown is populated from the server.

**Acceptance Criteria**:
1. `GET /api/v1/membership/clubs` returns an array of club names.
2. Default list (configurable):
   - `"Ebartex Digital"`
   - `"Ebartex Milano Centro"`
   - `"Ebartex Roma Tuscolana"`
   - `"Ebartex Torino Lingotto"`
   - `"Ebartex Napoli Vomero"`
   - `"Ebartex Bologna Fiera"`
   - `"Online / Nessun circolo"`
3. Response cached 1 hour. No auth required.

---

## FR-046: Membership Renewal

**Priority**: P1  
**User Story**: As a member, I want to renew my membership before it expires so that I maintain uninterrupted access.

**Acceptance Criteria**:
1. `POST /api/v1/membership/renew` renews the membership for another 12 months.
2. Only allowed when `expires_at` is within 30 days of current date, or already expired.
3. Sets new `expires_at = MAX(current expires_at, NOW()) + 1 year`.
4. Sets `renewed_at = NOW()`.
5. Publishes `membership.renewed` event.
6. Response: `200 OK` with updated MembershipResponse.

---

## FR-047: Membership Expiry Notification

**Priority**: P1  
**User Story**: As the system, I want to notify members when their tessera is about to expire so that they renew before losing access.

**Acceptance Criteria**:
1. Background worker runs daily.
2. Members with `expires_at` within 30 days receive an in-app notification: "La tua tessera Ebartex scade tra X giorni. Rinnova ora per mantenere l'accesso ai tornei."
3. Members with `expires_at` within 7 days receive an email notification (if `email_notifications` preference is true).
4. Members with `expires_at` in the past are transitioned to `status = 'expired'`.
5. Expired members lose tournament creation/joining rights but can still view tournaments (read-only).

---

## FR-048: Membership Gate Enforcement (API Level)

**Priority**: P0  
**User Story**: As the system, I want to enforce membership requirements at the API level so that even if the frontend gate is bypassed, the backend enforces the rules.

**Acceptance Criteria**:
1. `POST /api/v1/tournaments` returns `403 MEMBERSHIP_REQUIRED` if user has `status == 'none'`.
2. `POST /api/v1/tournaments/{id}/join` returns `403 MEMBERSHIP_REQUIRED` if user has `status == 'none'`.
3. `POST /api/v1/matches/{id}/games` returns `403 MEMBERSHIP_REQUIRED` if user has `status == 'none'`.
4. Skipped users (`status == 'skipped'`) receive `403 MEMBERSHIP_SKIPPED` for the above endpoints.
5. The error response includes: `{ "detail": "Tessera Ebartex richiesta per partecipare ai tornei.", "code": "MEMBERSHIP_REQUIRED", "action_url": "/associazione" }`.

---

## FR-049: Membership Tier Upgrade

**Priority**: P2  
**User Story**: As a standard member, I want to upgrade to Gold or Platinum tier so that I can access premium tournament features.

**Acceptance Criteria**:
1. `POST /api/v1/membership/upgrade` with `{ tier: "gold" | "platinum" }` initiates upgrade.
2. Upgrade eligibility: `gold` requires verified club membership; `platinum` requires ≥ 50 completed matches.
3. In MVP: upgrade is manual (admin-initiated); future: online payment flow.
4. Admin endpoint: `POST /api/v1/admin/memberships/{userId}/upgrade` with `{ tier, reason }`.

---

## FR-050: Membership Admin Dashboard

**Priority**: P1  
**User Story**: As an admin, I want to see all memberships, filter by status and club, and manage individual memberships.

**Acceptance Criteria**:
1. `GET /api/v1/admin/memberships?status=&club=&tier=&limit=&offset=` returns paginated membership list.
2. `PATCH /api/v1/admin/memberships/{userId}` allows admin to update: `status`, `tier`, `club`.
3. `DELETE /api/v1/admin/memberships/{userId}` (soft delete — sets `status = 'suspended'`).
4. All admin operations are logged to `audit_events`.
5. `GET /api/v1/admin/memberships/stats` returns: `{ total: N, active: N, expired: N, by_tier: {...}, by_club: {...} }`.

---

## FR-051: Membership Analytics

**Priority**: P2  
**User Story**: As the platform operator, I want to track membership growth and churn so that I can make business decisions.

**Acceptance Criteria**:
1. `GET /api/v1/admin/memberships/analytics?period=30d` returns:
   - `new_enrollments_this_period`: N
   - `renewals_this_period`: N
   - `expirations_this_period`: N
   - `churn_rate`: float (expirations / active at period start)
   - `active_by_club`: `[{ club, count }]`
2. Response cached 5 minutes.

---

## FR-052: Arcade Score Submission

**Priority**: P1  
**User Story**: As a player who just completed a mini-game, I want to submit my score so that it appears on the leaderboard.

**Acceptance Criteria**:
1. `POST /api/v1/arcade/scores` with body `{ game_id, score, level_reached, session_duration_ms }`.
2. `game_id` must be one of: `stack_attack`, `tcg_jump`, `card_memory`, `kakegurui`.
3. `score` must be ≥ 0 and ≤ 9,999,999.
4. `level_reached` must be 1–3 for single-player games; 0 for P2P games.
5. Score is saved to `arcade_scores` table.
6. If `score > current_high_score` for this user+game, update `arcade:leaderboard:{gameId}` Redis sorted set.
7. Response: `200 OK` with `{ "data": { "score": N, "is_high_score": bool, "rank": N, "tickets_earned": N } }`.
8. Tickets earned: based on score thresholds defined in game config.
9. Rate limit: max 10 score submissions per user per game per hour (prevents farming).
10. Requires authentication.

---

## FR-053: Arcade Leaderboard

**Priority**: P1  
**User Story**: As a player, I want to see the global leaderboard for each mini-game so that I know where I rank.

**Acceptance Criteria**:
1. `GET /api/v1/arcade/leaderboard/{gameId}?limit=50` returns top scores.
2. Each entry: `{ rank, user_id, username, score, level_reached, achieved_at }`.
3. `GET /api/v1/arcade/leaderboard/{gameId}/me` returns the current user's best score and rank.
4. Leaderboard data served from Redis sorted set (`arcade:leaderboard:{gameId}`), updated on each score submission.
5. Response cached 10 seconds.
6. Returns `404` if `gameId` is not valid.

---

## FR-054: Arcade Score History

**Priority**: P2  
**User Story**: As a player, I want to see my past arcade scores for each game so that I can track my improvement.

**Acceptance Criteria**:
1. `GET /api/v1/arcade/me/scores?gameId=&limit=20` returns paginated score history.
2. Includes: `game_id`, `score`, `level_reached`, `session_duration_ms`, `tickets_earned`, `played_at`.
3. Sorted by `played_at` descending.
4. Requires authentication.

---

## FR-055: Arcade P2P Room Registry

**Priority**: P2  
**User Story**: As a player wanting to invite a friend to a Kakegurui duel, I want to optionally register my room so that my friend can find it more easily than copy-pasting a 500-character offer code.

**Acceptance Criteria**:
1. `POST /api/v1/arcade/rooms` with body `{ game_id: "kakegurui", offer_code: "{base64url_offer}", room_name?: "string" }`.
2. Generates a short 6-character room code (alphanumeric, case-insensitive).
3. Stores: `{ room_code, host_user_id, game_id, offer_code, created_at, TTL: 30 minutes }` in Redis.
4. Response: `201 Created` with `{ "data": { "room_code": "ABC123", "expires_at": "..." } }`.
5. `GET /api/v1/arcade/rooms/{roomCode}` returns the `offer_code` for the guest to use.
6. Room auto-expires after 30 minutes of inactivity.
7. This is **optional** — the base P2P flow (copy/paste offer/answer) still works without this endpoint.

---

## FR-056: Live Spectator Support (IVS Broadcasting)

**Priority**: P1  
**User Story**: As a spectator, I want to watch a live 1v1 tournament match with low latency so that I can enjoy the match without being a participant.

**Acceptance Criteria**:
1. When a match starts (`status → 'iniziata'`), the Tournament Service automatically creates an IVS channel.
2. The HOST player receives the IVS `streamKey` via WebSocket notification (`match.started` event).
3. `GET /api/v1/matches/{matchId}/stream` returns:
   ```json
   { "data": { "playback_url": "https://...", "is_live": true, "spectator_count": 12 } }
   ```
4. The playback URL is a valid LL-HLS URL that video players (HTML5 `<video>`) can use.
5. If the host is not currently streaming, `is_live: false` but the playback URL is still returned.
6. When the match ends, the IVS channel is deleted (or archived to S3 if recording enabled).
7. Spectators do NOT send any video. This is a one-way broadcast.

---

## FR-057: Spectator Count Tracking

**Priority**: P1  
**User Story**: As a match participant, I want to see how many people are watching my match live so that I feel the energy of the audience.

**Acceptance Criteria**:
1. `GET /api/v1/matches/{matchId}/spectators` returns `{ count: N }`.
2. Spectator count is tracked via Redis: `SADD match:spectators:{matchId} {userId}` on WebSocket connect, `SREM` on disconnect.
3. Spectator count is broadcast to both players via `spectator.count` WebSocket event every 10 seconds.
4. Anonymous spectators are counted but with ephemeral session IDs.

---

## FR-058: Spectator WebRTC Viewer (Phase 2)

**Priority**: P2  
**User Story**: As a spectator, I want to optionally view the direct P2P WebRTC stream (lower latency than IVS) if the participants consent.

**Acceptance Criteria**:
1. If both match participants enable "allow direct spectator access" (opt-in, default OFF):
   - Spectators can receive a one-way WebRTC stream from the HOST's PC camera.
   - This uses a separate WHIP/WHEP endpoint, NOT the tournament signaling relay.
2. This is a Phase 2 feature; IVS (FR-056) is the Phase 1 solution.

---

## FR-059: Match Stream Recording

**Priority**: P2  
**User Story**: As a player, I want my match to be recorded (optional) so that I can review it later or share it.

**Acceptance Criteria**:
1. When a match is created, the organizer can opt-in to recording: `POST /tournaments` with `{ ...body, enable_recording: true }`.
2. IVS recording is configured to write MP4 segments to an S3 bucket.
3. After the match ends, the recording URL is available: `GET /api/v1/matches/{matchId}/recording`.
4. Recordings are retained for 30 days, then automatically deleted (S3 lifecycle rule).
5. Recording requires `enable_recording: true` and active membership (`tier: 'gold'` or `'platinum'`).

---

## FR-060: Host Infrastructure Management

**Priority**: P1  
**User Story**: As the system, I want to provision WebRTC signaling infrastructure specifically for the HOST role when a tournament is created, so that the host's bidirectional video stream is ready.

**Acceptance Criteria**:
1. When `POST /api/v1/tournaments` is called, the service pre-initializes a Redis signaling session keyed to the tournament ID.
2. A `webcam_session_id` is assigned to the tournament immediately (not waiting for match start).
3. This allows the HOST to pre-connect their dual camera (face + hands) BEFORE the participant joins.
4. The signaling session TTL starts at creation and resets when the match starts.

---

## FR-061: TURN Server Configuration (NAT Traversal)

**Priority**: P1  
**User Story**: As a player in a restrictive network environment, I want the platform to provide TURN server credentials so that my WebRTC connection succeeds even behind strict NAT/firewalls.

**Acceptance Criteria**:
1. `GET /api/v1/signaling/ice-servers` returns ICE server configuration including TURN credentials.
2. Response:
   ```json
   { "data": { "ice_servers": [
     { "urls": "stun:stun.l.google.com:19302" },
     { "urls": "turn:turn.ebartex.com:3478", "username": "{time_limited_user}", "credential": "{hmac_credential}" }
   ] } }
   ```
3. TURN credentials are time-limited (TTL: 24h) using HMAC-based ephemeral credentials.
4. Requires authentication (prevents TURN server abuse).
5. TURN server is provisioned on a separate EC2 instance (not ECS) — see `03_AWS_INFRASTRUCTURE.md`.

---

## FR-062: Arcade Room Access Gate

**Priority**: P1  
**User Story**: As a player, I want to access the Arcade Room without needing a full membership so that casual visitors can enjoy mini-games.

**Acceptance Criteria**:
1. Arcade leaderboard endpoints (`GET /api/v1/arcade/leaderboard/{gameId}`) require no auth.
2. Score submission (`POST /api/v1/arcade/scores`) requires authentication but NOT active membership.
3. The Kakegurui P2P mode (`POST /api/v1/arcade/rooms`) requires authentication.
4. Skipped users can play single-player arcade games and appear on leaderboards.
5. Only fully enrolled members can earn arcade tickets towards premium card packs (future).

---

## FR-063: Tournament Filter API (Advanced Filters)

**Priority**: P0  
**User Story**: As the frontend tournament list with its advanced filter UI (sticky toolbar, format grid, mode selector, buy-in filter), I need the API to support all these filter combinations efficiently.

**Acceptance Criteria**:
1. `GET /api/v1/tournaments` accepts all of: `format`, `mode`, `buyIn`, `status`, `isPrivate`, `createdBy`.
2. All filter parameters are optional (omitting returns all non-archived tournaments).
3. Combining filters uses AND logic (e.g., `format=modern&mode=heads-up&status=in_registrazione`).
4. Response includes `meta.filters_applied` object echoing the active filters for frontend state reconciliation.
5. Cache key includes all active filter combinations: `tournament:list:{format}:{mode}:{buyIn}:{status}`.
6. Cache TTL: 3 seconds for active tournaments, 60 seconds for `terminata` results.

---

## FR-064: Tournament Mobile View API Support

**Priority**: P0  
**User Story**: As the frontend with separate desktop/mobile views, I want the API to support a `view` parameter that controls response field inclusion for bandwidth optimization.

**Acceptance Criteria**:
1. `GET /api/v1/tournaments?view=compact` returns a smaller payload (only: `id`, `format`, `mode`, `status`, `participants_count`, `max_players`, `is_private`, `created_at`).
2. `GET /api/v1/tournaments?view=full` (default) returns the complete `TournamentListItem` including participant details.
3. This reduces payload size by ~60% for mobile views which show less data.

---

## FR-065: Dual Camera Pre-Connection Flow

**Priority**: P0  
**User Story**: As a tournament host, I want to connect my phone camera via QR code before the match starts so that when the participant joins, the stream is immediately ready.

**Acceptance Criteria**:
1. After creating a tournament, the HOST receives a `webcam_session_id` in the tournament creation response.
2. The HOST generates a QR code containing `https://tournaments.ebartex.com/tornei/webcam/{webcam_session_id}`.
3. The phone scans the QR → navigates to the public webcam sender page → starts WebRTC signaling.
4. This flow works with the existing signaling relay (FR-013, FR-014).
5. The `webcam_session_id` for the HOST is different from the `webcam_session_id` assigned to the MATCH (when a participant joins, a new session is created for the P2P match stream).

---

## FR-066: Three-Role Access Control for Match Endpoints

**Priority**: P0  
**User Story**: As the system, I want to enforce the HOST/PARTICIPANT/SPECTATOR role distinction at the API level so that each user type gets exactly the capabilities they need.

**Acceptance Criteria**:
1. `POST /api/v1/matches/{matchId}/games` (submit result) → only PARTICIPANTS (player1 or player2) can call this.
2. `PATCH /api/v1/matches/{matchId}/life` → only the player updating THEIR OWN life total.
3. `GET /api/v1/matches/{matchId}/stream` → SPECTATORS can call this; participants receive the IVS info via WebSocket.
4. `POST /api/v1/signaling/{sessionId}/messages` with `from: "host"` → only ORGANIZER can use this role.
5. `GET /ws/match/{matchId}` → all three roles can connect; but different data is injected:
   - PARTICIPANTS receive `role: "player"` in the snapshot
   - SPECTATORS receive `role: "observer"` (no match management events)

---

## FR-067: Spectator IVS Channel Lifecycle

**Priority**: P1  
**User Story**: As the system, I want to automatically manage IVS channel creation and deletion in sync with match lifecycle so that resources are not wasted.

**Acceptance Criteria**:
1. IVS channel is created when tournament transitions to `iniziata` (match starts).
2. IVS channel is deleted when:
   - Match transitions to `terminata`
   - Match is `expired` (abandoned after 4 hours)
   - Admin cancels the tournament
3. IVS channel creation is async (queued to SQS, not blocking the join response).
4. If IVS channel creation fails, the match still proceeds (IVS is optional infrastructure).
5. All IVS channel IDs are stored in the `matches` table for cleanup tracking.

---

## FR-068: Spectator Lobby (Discover Live Matches)

**Priority**: P1  
**User Story**: As a spectator, I want to browse currently live matches so that I can choose which match to watch.

**Acceptance Criteria**:
1. `GET /api/v1/matches?status=in_corso&format=&spectator_mode=true` returns live matches available for spectating.
2. Each entry includes: `match_id`, `tournament_id`, `format`, `player1_username`, `player2_username`, `spectator_count`, `is_live` (IVS streaming), `started_at`.
3. Results sorted by `spectator_count` descending (most popular first).
4. Response cached 10 seconds.
5. No auth required for anonymous spectators (public matches only).

---

## FR-069: IVS Stream Key Security

**Priority**: P0  
**User Story**: As the system, I want the IVS stream key to be delivered securely only to the match host so that the host stream cannot be hijacked.

**Acceptance Criteria**:
1. The IVS `streamKey` is NEVER returned in any REST API response.
2. It is delivered ONLY via the WebSocket notification channel (`match.started` event) to the authenticated HOST user.
3. The WebSocket channel is authenticated (JWT required) — spectators and participants on the lobby WS do NOT receive the stream key.
4. If the stream key is compromised, the HOST can request a reset: `POST /api/v1/matches/{matchId}/stream/reset-key` (generates new IVS channel).

---

## FR-070: Spectator WebSocket Events

**Priority**: P1  
**User Story**: As a spectator connected via WebSocket, I want to receive all match state events so that I can follow the match without video.

**Acceptance Criteria**:
1. Spectators connecting to `/ws/match/{matchId}` receive all events from §3.2 of the technical spec EXCEPT:
   - `match.started` (only sent to participants)
   - IVS stream key events
2. Spectators additionally receive:
   - `spectator.count` updates (every 10 seconds)
   - `match.commentary` (future: AI-generated commentary events)
3. Spectators can send only: `pong`, `spectator.join`, `spectator.leave`.
4. Max 1000 spectators per match via WebSocket; additional spectators use long-polling fallback.

---

## FR-071: Tournament 1v1 Immutability Constraint

**Priority**: P0  
**User Story**: As the system, I want to enforce that heads-up tournaments are ALWAYS exactly 1v1 (max 2 players) so that infrastructure assumptions are never violated.

**Acceptance Criteria**:
1. `maxPlayers` for `mode: "heads-up"` is always `2`, regardless of what the request body contains.
2. `POST /api/v1/tournaments` with `mode: "heads-up"` and `maxPlayers: 3` → silently overrides to `2`, does NOT return an error.
3. `POST /api/v1/tournaments/{id}/join` when `participants.length == 2` returns `409 TOURNAMENT_FULL`.
4. The database has a CHECK constraint: `CHECK (mode != 'heads-up' OR max_players = 2)`.
5. This constraint is documented in all schemas and enforced at every layer (frontend, API, database).

---

## FR-072: WebRTC STUN/TURN Infrastructure

**Priority**: P1  
**User Story**: As the WebRTC infrastructure, I want dedicated STUN and TURN servers so that match participants can establish P2P connections regardless of NAT type.

**Acceptance Criteria**:
1. STUN servers: Google's public STUN servers are used as fallback (`stun.l.google.com:19302`).
2. TURN server: Deployed as an EC2 instance running `coturn` in the eu-south-1 (Milan) region.
3. TURN credentials are rotated every 24 hours using HMAC-SHA1 ephemeral credentials.
4. TURN server handles relay for ≤5% of connections (most connections succeed with STUN).
5. TURN server bandwidth: provisioned for 50 concurrent relayed streams at 2 Mbps each = ~100 Mbps NIC.

---

## FR-073: P2P Connection Health Monitoring

**Priority**: P1  
**User Story**: As a match participant, I want to know if my P2P connection quality is poor so that I can take action before it disrupts the match.

**Acceptance Criteria**:
1. The frontend's WebRTC implementation reports connection stats every 5 seconds.
2. `POST /api/v1/matches/{matchId}/connection-stats` with `{ player_user_id, rtt_ms, packet_loss_pct, bitrate_kbps }`.
3. If `rtt_ms > 500` or `packet_loss_pct > 10` for 3 consecutive reports, the server publishes a `match.connection_warning` WebSocket event to both players.
4. Stats are stored in Redis for 1 hour (not PostgreSQL — ephemeral).
5. Stats are exposed for admin monitoring: `GET /api/v1/admin/matches/{matchId}/connection-stats`.

---

## FR-074: Arcade Room Ticket Persistence

**Priority**: P1  
**User Story**: As an arcade player, I want my earned tickets to persist across sessions so that I can accumulate them over time and spend them on rewards.

**Acceptance Criteria**:
1. `GET /api/v1/arcade/me/wallet` returns `{ tickets: N, lifetime_earned: N, lifetime_spent: N }`.
2. Tickets are earned via score submission (FR-052, `tickets_earned` in response).
3. `POST /api/v1/arcade/me/wallet/spend` with `{ amount: N, reward_id: "arcade_pack" }` deducts tickets.
4. Valid `reward_id` values: `arcade_pack` (5 tickets), `gamer_retro_skin` (20 tickets), `high_score_king_card` (50 tickets).
5. Insufficient tickets → `400 INSUFFICIENT_TICKETS`.
6. Transactions are idempotent (include `idempotency_key` in request body).

---

## FR-075: Cross-System Membership Check for Arcade Rewards

**Priority**: P2  
**User Story**: As the system, I want arcade card rewards to integrate with the deck builder so that earned cards appear in the user's card collection.

**Acceptance Criteria**:
1. When a user spends tickets to unlock a card reward, the Tournament Service calls the Sync Service: `POST /api/v1/sync/inventory/{userId}/cards` with `{ card_id, source: "arcade_reward" }`.
2. The card appears in the user's deck builder on `ebartex.com`.
3. If the Sync Service call fails, the ticket spend is NOT deducted (atomic transaction).
4. This is a P2 feature; in Phase 1, arcade rewards are tracked only within the Tournament Service.

---

*End of Functional Requirements v2.0 — 75 requirements (40 original P0–P2 + 35 new for Membership, Arcade, Spectator, 3-Role Infrastructure)*
