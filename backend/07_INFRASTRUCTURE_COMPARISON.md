# 07 — Multi-Provider Infrastructure Comparison

> **Document type**: Infrastructure Decision Analysis  
> **Version**: 1.0  
> **Date**: June 2026  
> **Purpose**: Evaluate infrastructure providers for 3 distinct workloads across the platform  
> **Audience**: Tech Lead, CTO, Product Owners making infrastructure investment decisions

---

## Table of Contents

1. [Introduction and Workload Definition](#1-introduction-and-workload-definition)
2. [Workload A: Tournament Room Server (WebRTC 1v1)](#2-workload-a-tournament-room-server-webrtc-1v1)
3. [Workload B: Spectator Broadcasting (One-to-Many)](#3-workload-b-spectator-broadcasting-one-to-many)
4. [Workload C: Backend API + Database + Cache](#4-workload-c-backend-api--database--cache)
5. [Decision Matrix and Scoring](#5-decision-matrix-and-scoring)
6. [Recommended Stack: AWS-Native](#6-recommended-stack-aws-native)
7. [Alternative Budget Stack: Hybrid](#7-alternative-budget-stack-hybrid)
8. [Total Cost of Ownership by User Load](#8-total-cost-of-ownership-by-user-load)
9. [Migration Risk Assessment](#9-migration-risk-assessment)
10. [Final Decision Summary](#10-final-decision-summary)

---

## 1. Introduction and Workload Definition

The Ebartex Tournament Platform has three architecturally distinct workloads with very different infrastructure requirements. These cannot be evaluated as a single workload — cost, scalability, and latency profiles are fundamentally different for each.

### 1.1 The Three Workloads

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ WORKLOAD A: Tournament Room (WebRTC 1v1)                                        │
│ Traffic: Always exactly 2 users (host + participant)                            │
│ Media: Bidirectional video + audio between 2 peers                              │
│ Duration: 20–90 minutes per match                                               │
│ Signaling: Server-relayed (Redis HTTP polling)                                  │
│ Scale factor: Number of simultaneous active matches                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ WORKLOAD B: Spectator Broadcasting (One-to-Many)                                │
│ Traffic: 1 host streaming → N spectators watching                               │
│ Media: One-way video from host (IVS RTMPS → CDN → viewers)                     │
│ Latency: 3–5 seconds acceptable (LL-HLS)                                        │
│ Scale factor: Number of spectators per match (potentially 0 → 1,000+)          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ WORKLOAD C: Backend API + Database + Cache                                      │
│ Traffic: HTTP REST API + WebSocket connections                                  │
│ Data: PostgreSQL (tournaments, matches, memberships, scores)                    │
│ Cache: Redis (leaderboards, sessions, signaling messages)                       │
│ Scale factor: Total concurrent connected users                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Insight

```
The critical insight: VIDEO NEVER GOES THROUGH THE BACKEND API SERVER.

Workload A: WebRTC P2P — video flows directly between the 2 players' browsers
            after signaling. The backend only relays small SDP/ICE text messages.

Workload B: IVS CDN — video from host goes to IVS ingest (external service),
            then CDN delivers to spectators. ECS has zero video load.

This means Workload C (API + DB) scales with the number of USERS,
not with the amount of VIDEO DATA transferred.
```

### 1.3 Pricing Methodology

All prices are as of **June 2026**. All USD. Where providers offer free tiers, they are noted but not counted in production cost estimates.

---

## 2. Workload A: Tournament Room Server (WebRTC 1v1)

The key question for Workload A is: **who manages WebRTC signaling and TURN relay?**

Options evaluated:
1. **Self-hosted coturn + custom signaling** (current plan)
2. **AWS Chime SDK** — managed WebRTC via AWS
3. **Cloudflare Calls API** — edge-native WebRTC signaling
4. **LiveKit Cloud** — open-source WebRTC SFU/MCU managed cloud
5. **Daily.co** — managed WebRTC platform
6. **Agora.io** — global WebRTC SaaS
7. **Twilio Video** — enterprise WebRTC platform
8. **100ms.live** — developer-friendly WebRTC

### 2.1 Option A1: Self-Hosted coturn + Custom Redis Signaling

**Architecture**:
```
Browser A (Host)                    Browser B (Participant)
    │                                       │
    │── WebRTC SDP offer ──────────────────►│
    │              ↓ HTTP POST /signaling    │
    │         ECS FastAPI → Redis           │
    │              ↓ HTTP GET /signaling    │
    │◄────────────── SDP answer ────────────│
    │                                       │
    │◄══════════════════════════════════════│
    │  Direct WebRTC P2P (video/audio)      │
    │  TURN relay via coturn (if needed)    │
```

| Metric | Value |
|---|---|
| Signaling server | ECS FastAPI + Redis (already in stack) |
| TURN server | EC2 c5.large in public subnet |
| ICE servers | `stun:stun.l.google.com:19302` + `turn:turn.ebartex.com:3478` |
| Media relay cost | ~$0.02/hour/match (TURN relays ~5% of connections) |
| Signaling cost | Included in ECS cost (negligible) |
| Latency (TURN relay) | +10–30ms round trip via Milan-region EC2 |
| Concurrent rooms | Limited by TURN server capacity (c5.large = ~100) |
| Python integration | Native (FastAPI handles signaling) |
| Vendor lock-in | None |
| EU data residency | ✅ Full (EC2 eu-south-1) |
| Setup complexity | Medium |
| Cost per 1,000 matches/month | ~$0.50 (TURN amortized) |

**Monthly cost at scale**:
- 100 concurrent matches: ~$20 (TURN t3.small)
- 1,000 concurrent matches: ~$85 (TURN c5.large)
- 5,000 concurrent matches: ~$400 (TURN c5.4xlarge × 2)

**Pros**: Zero variable cost for signaling; full control; lowest cost at scale; EU data  
**Cons**: Must maintain TURN server; potential SPOF; requires DevOps expertise

### 2.2 Option A2: AWS Chime SDK

**Architecture**: AWS Chime SDK Media Pipelines handle WebRTC sessions. Applications call Chime API to create "meetings" with attendees.

| Metric | Value |
|---|---|
| Model | Per-minute per-attendee pricing |
| Cost | $0.0017/attendee-minute (media) + $0.0001/minute/attendee (data) |
| Per 1v1 match (2 players × 60 min) | $0.204/match |
| 1,000 matches/month (avg 60 min) | $204/month (video media only) |
| TURN | Included (managed by AWS Chime) |
| Latency | ~30–50ms in EU (Chime has EU regions) |
| SDK quality | Excellent JavaScript SDK; Python SDK for server-side meeting management |
| Python integration | boto3 `chime-sdk-meetings` for creating/managing meetings |
| Max attendees | 250 per meeting (overkill for 1v1) |
| EU data residency | ✅ AWS regions EU |
| Vendor lock-in | High (Chime-specific SDK) |

**Cost breakdown at scale**:
- 100 concurrent matches (6,000 match-min/day): ~$183/month
- 1,000 concurrent matches: ~$1,830/month
- 5,000 concurrent matches: ~$9,150/month

**Pros**: Fully managed, no TURN maintenance, scales infinitely, AWS-native integration  
**Cons**: Very high cost at scale; vendor lock-in; overkill for simple 1v1 signaling; Chime in some EU regions may have latency vs Milan

### 2.3 Option A3: Cloudflare Calls API

**Architecture**: Cloudflare Calls is a WebRTC SFU running on Cloudflare's edge network. No servers to maintain; calls handled at nearest PoP.

| Metric | Value |
|---|---|
| Pricing model | $0.05/GB of real-time media (2026 pricing) |
| 1v1 match (720p, 30fps, ~1 Mbps per participant × 60 min) | ~0.45 GB × $0.05 = $0.023/match |
| 1,000 matches/month | ~$23/month |
| TURN | Included (Cloudflare edge handles NAT traversal) |
| Latency | ~5–15ms to nearest Cloudflare PoP (excellent for Italy — Milan PoP) |
| SDK quality | JavaScript SDK; Python REST API for room management |
| Python integration | HTTP REST API for creating/joining Calls sessions |
| EU data residency | ✅ GDPR compliant; data processed at EU edge nodes |
| Vendor lock-in | Medium (proprietary but REST-based) |

**Cost breakdown at scale**:
- 100 concurrent matches: ~$2.30/month
- 1,000 concurrent matches: ~$23/month
- 5,000 concurrent matches: ~$115/month

**Pros**: Extremely cheap for media; lowest latency (edge); no server to maintain; excellent EU coverage  
**Cons**: Newer product (less battle-tested for production); Python SDK limited (REST only); requires Cloudflare dependency

### 2.4 Option A4: LiveKit Cloud

**Architecture**: Open-source WebRTC SFU (LiveKit) hosted on LiveKit Cloud. Can self-host open-source version too.

| Metric | Value |
|---|---|
| Pricing model | $0.003/participant-minute for standard HD |
| Per 1v1 match (2 participants × 60 min) | $0.36/match |
| 1,000 matches/month | ~$360/month |
| TURN | Included in LiveKit Cloud |
| Latency | ~20–40ms EU (LiveKit has EU servers) |
| SDK quality | Excellent; React, iOS, Android SDKs |
| Python integration | Official Python SDK (`livekit-api`) for server-side room management |
| EU data residency | ✅ EU region available |
| Vendor lock-in | Low (open-source core; can self-host) |

**Self-hosted LiveKit alternative**:
- EC2 c5.xlarge: ~$140/month handles ~200 concurrent participants
- Eliminates per-minute cost entirely
- Requires infrastructure maintenance

**Pros**: Great DX; Python SDK; can escape to self-host; EU region; open-source core  
**Cons**: More expensive than Cloudflare Calls; for simple 1v1, it's an SFU (adds a media server hop)

### 2.5 Option A5: Daily.co

| Metric | Value |
|---|---|
| Pricing model | $0.004/participant-minute (video) + $0.00075/participant-minute (audio only) |
| Per 1v1 match (60 min video) | $0.48/match |
| 1,000 matches/month | ~$480/month |
| TURN | Included |
| Latency | ~25–45ms EU |
| SDK quality | Very good JavaScript SDK; Python REST API |
| Python integration | REST API for room creation/management |
| EU data residency | ✅ |
| Vendor lock-in | High (proprietary) |

**Pros**: Polished SDK; good support; built-in recording option  
**Cons**: Most expensive option; pure SaaS lock-in; no cost advantage

### 2.6 Option A6: Agora.io

| Metric | Value |
|---|---|
| Pricing model | $1.99/1,000 minutes per HD participant (video); $0.59/1,000 minutes (audio only) |
| Per 1v1 match (60 min HD) | 2 × 60 × $0.00199 = $0.239/match |
| 1,000 matches/month | ~$239/month |
| TURN | Included (global Agora SD-RTN network) |
| Latency | ~15–30ms EU (Agora has Frankfurt PoP) |
| SDK quality | Excellent; mature; React SDK |
| Python integration | REST API + Python token generation library |
| EU data residency | ⚠️ Partial — Agora routes via global network; not guaranteed EU-only |
| Vendor lock-in | High |

**Free tier**: 10,000 minutes/month free (useful for dev/staging)  
**Pros**: Mature platform; excellent latency; free tier generous  
**Cons**: GDPR concerns (non-EU routing possible); vendor lock-in; pricing can be unpredictable

### 2.7 Option A7: Twilio Video

| Metric | Value |
|---|---|
| Pricing model | $0.0015/participant-minute (peer-to-peer); $0.004/participant-minute (group SFU) |
| Per 1v1 P2P match (60 min) | 2 × 60 × $0.0015 = $0.18/match |
| 1,000 matches/month | ~$180/month |
| TURN | Included via Twilio NAT traversal |
| Latency | ~30–50ms EU |
| SDK quality | Excellent; mature; well-documented |
| Python integration | `twilio` Python library; REST API for room management |
| EU data residency | ✅ EU region available |
| Vendor lock-in | High |

**Pros**: Most stable/mature platform; reliable EU data; P2P tier is cheaper  
**Cons**: Expensive for scale; Twilio has had reliability issues historically; dependency risk

### 2.8 Option A8: 100ms.live

| Metric | Value |
|---|---|
| Pricing model | $0.00195/participant-minute (100ms terms: minutes-on-platform) |
| Per 1v1 match (60 min) | 2 × 60 × $0.00195 = $0.234/match |
| 1,000 matches/month | ~$234/month |
| TURN | Included |
| Latency | ~20–40ms EU |
| SDK quality | Very good; React SDK; developer-friendly |
| Python integration | REST API for room management; Python token generation |
| EU data residency | ✅ EU region available |
| Vendor lock-in | High |

**Pros**: Modern, developer-friendly DX; good pricing  
**Cons**: Newer company; smaller community; limited Python SDK

### 2.9 Workload A Comparison Table

| Provider | Cost/Match (60min) | 1k Matches/month | TURN Included | Python SDK | EU Data | Latency (EU) | Complexity |
|---|---|---|---|---|---|---|---|
| **Self-hosted coturn** | **~$0.0005** | **~$1** | ✅ | Native | ✅ | 10–30ms | Medium |
| Cloudflare Calls | ~$0.023 | ~$23 | ✅ | REST | ✅ | 5–15ms | Low |
| AWS Chime SDK | ~$0.204 | ~$204 | ✅ | boto3 | ✅ | 30–50ms | Low |
| Agora.io | ~$0.239 | ~$239 | ✅ | REST | ⚠️ | 15–30ms | Low |
| 100ms.live | ~$0.234 | ~$234 | ✅ | REST | ✅ | 20–40ms | Low |
| Twilio Video | ~$0.18 | ~$180 | ✅ | Python lib | ✅ | 30–50ms | Low |
| LiveKit Cloud | ~$0.36 | ~$360 | ✅ | Python SDK | ✅ | 20–40ms | Low |
| Daily.co | ~$0.48 | ~$480 | ✅ | REST | ✅ | 25–45ms | Low |

**Winner for Workload A**: Self-hosted coturn (cost) or Cloudflare Calls (latency + simplicity)

---

## 3. Workload B: Spectator Broadcasting (One-to-Many)

The key question: **what protocol and CDN deliver live video to hundreds of spectators with < 5 seconds latency?**

Options evaluated:
1. **AWS IVS** (current plan) — managed LL-HLS
2. **Cloudflare Stream** — managed video via Cloudflare CDN
3. **Mux** — developer video platform
4. **Bunny.net Stream** — European CDN-first video
5. **LiveKit Egress** — re-stream from LiveKit SFU to CDN
6. **Agora CDN Streaming** — Agora's CDN integration
7. **Dolby.io** — ultra-low-latency (WHIP/WHEP)

### 3.1 Protocol Comparison

| Protocol | Latency | Scalability | Browser Support | Use Case |
|---|---|---|---|---|
| WebRTC (P2P/SFU) | ~50–300ms | Poor (N peers) | ✅ Native | 1v1 gaming, calls |
| WHIP/WHEP (WebRTC HTTP) | ~200–500ms | Good | Chrome only (2026) | Sub-second broadcast |
| LL-HLS (Low-Latency HLS) | 2–5 seconds | Excellent (CDN) | ✅ All | Sports, gaming spectating |
| HLS (regular) | 6–30 seconds | Excellent | ✅ All | VOD, large events |
| RTMP/RTMPS | N/A (ingest only) | N/A | N/A | OBS/software ingest |
| DASH (MPEG-DASH) | 5–20 seconds | Excellent | ✅ | Video streaming |

**Recommendation for Ebartex**: LL-HLS is ideal — 3–5s latency is acceptable for TCG spectating (not reaction-critical), and it scales to any number of viewers via CDN.

### 3.2 Option B1: AWS IVS (Interactive Video Service)

**Architecture**:
```
Host OBS/Browser
    │
    │ RTMPS ingest to IVS
    ▼
AWS IVS Ingest (eu-west-1)
    │
    │ Transcoding + LL-HLS packaging
    ▼
IVS CDN (CloudFront-backed, Milan PoP available)
    │
    │ LL-HLS stream (HTTPS)
    ▼
N Spectator Browsers (native <video> tag with HLS.js)
```

| Metric | Value |
|---|---|
| Ingest cost | $2.00/streaming-hour (BASIC channel type) or $4.00 (STANDARD) |
| Delivery cost | $0.025/viewer-hour (first 1k viewers) |
| Recording cost | $0.085/GB recorded (S3 backend) |
| Max input resolution | 480p (BASIC), 1080p (STANDARD) |
| Latency | 3–5 seconds (LL-HLS) |
| CDN coverage | Global (CloudFront PoPs, including Milan) |
| Thumbnail support | ✅ (interval thumbnails, configurable) |
| Recording | ✅ (S3 recording configuration) |
| Python integration | boto3 `ivs` client |
| EU data residency | ✅ eu-west-1 (Ireland) |
| API availability | Available in eu-west-1 (not eu-south-1) |
| Vendor lock-in | High (AWS-specific) |

**Monthly cost scenarios (BASIC channel)**:
- 50 matches/month × 1h avg × 10 spectators/match:
  - Ingest: 50 × $2.00 = $100
  - Delivery: 50 × 10 × 1h × $0.025 = $12.50
  - **Total: $112.50/month**
- 200 matches/month × 1h × 30 spectators/match:
  - Ingest: 200 × $2.00 = $400
  - Delivery: 200 × 30 × 1h × $0.025 = $150
  - **Total: $550/month**

**Pros**: Integrated with AWS ecosystem; boto3 integration; EventBridge events for stream state; reliable CDN; easy recording  
**Cons**: Available only in eu-west-1 (not Milan); expensive ingest cost per channel; not ultra-low-latency

### 3.3 Option B2: Cloudflare Stream

**Architecture**: Host pushes RTMPS → Cloudflare edge → global CDN → viewers

| Metric | Value |
|---|---|
| Storage cost | $5/1,000 stored minutes |
| Delivery cost | $1.00/1,000 viewer-minutes |
| Creator minutes cost | $5/1,000 input-minutes recorded |
| Latency | 2–4 seconds (LL-HLS) + WHIP/WHEP for sub-second (beta) |
| CDN coverage | Cloudflare global (excellent Milan coverage) |
| Thumbnail support | ✅ |
| Recording | ✅ |
| Python integration | REST API |
| EU data residency | ✅ GDPR compliant (EU edge) |
| Vendor lock-in | Medium |

**Monthly cost scenarios**:
- 50 matches/month × 60 min × 10 spectators:
  - Input minutes: 50 × 60 × $0.005 = $15
  - Viewer minutes: 50 × 10 × 60 × $0.001 = $30
  - **Total: ~$45/month**
- 200 matches/month × 60 min × 30 spectators:
  - Input minutes: 200 × 60 × $0.005 = $60
  - Viewer minutes: 200 × 30 × 60 × $0.001 = $360
  - **Total: ~$420/month**

**Pros**: Cheaper than IVS; Cloudflare CDN (Milan PoP); WHIP/WHEP for future sub-second; REST API  
**Cons**: Less AWS-integrated; WHIP/WHEP still beta; no boto3 equivalent

### 3.4 Option B3: Mux

**Architecture**: Professional developer video platform. RTMPS → Mux ingest → transcoding → HLS/LL-HLS → global CDN

| Metric | Value |
|---|---|
| Delivery cost | $0.0060/GB delivered (~$0.006 per viewer-hour at 720p) |
| Encoding cost | $0.015/minute encoded |
| Storage cost | $0.008/GB-month |
| Latency | 3–5s (HLS) or <2s (Mux Low Latency Stream, LLHLS) |
| CDN coverage | Global (Fastly-backed) |
| Thumbnail support | ✅ (on-demand thumbnails + storyboards) |
| Recording | ✅ |
| Python integration | REST API + official Python SDK (`mux-python`) |
| EU data residency | ⚠️ US-based company; data may leave EU |
| Vendor lock-in | Medium |

**Monthly cost scenarios**:
- 50 matches × 60 min × 10 spectators (720p ~1.5 GB/viewer-hour):
  - Encoding: 50 × 60 × $0.015 = $45
  - Delivery: 50 × 10 × 1.5 GB × $0.006 = $4.50
  - **Total: ~$49.50/month**
- 200 matches × 60 min × 30 spectators:
  - Encoding: 200 × 60 × $0.015 = $180
  - Delivery: 200 × 30 × 1.5 GB × $0.006 = $54
  - **Total: ~$234/month**

**Pros**: Great Python SDK; excellent DX; good pricing; storyboard thumbnails  
**Cons**: US-based; potential GDPR complications; Fastly CDN less dominant than Cloudflare/AWS in EU

### 3.5 Option B4: Bunny.net Stream

**Architecture**: EU-headquartered CDN. RTMPS or file upload → Bunny transcoding → Bunny CDN delivery

| Metric | Value |
|---|---|
| Encoding cost | €0.005/minute encoded |
| Delivery cost | €0.005–0.01/GB delivered (depends on region) |
| Storage cost | €0.011/GB-month |
| Latency | 3–6s (HLS; no dedicated LL-HLS as of 2026) |
| CDN coverage | Good EU coverage; less global |
| Thumbnail support | ✅ |
| Recording | ✅ |
| Python integration | REST API |
| EU data residency | ✅ Excellent (HQ in Slovenia, EU-first) |
| Vendor lock-in | Low |

**Monthly cost scenarios**:
- 50 matches × 60 min × 10 spectators:
  - Encoding: 50 × 60 × €0.005 = €15
  - Delivery: 50 × 10 × 1.5 GB × €0.01 = €7.50
  - **Total: ~€22.50/month** (cheapest option)
- 200 matches × 60 min × 30 spectators:
  - Encoding: 200 × 60 × €0.005 = €60
  - Delivery: 200 × 30 × 1.5 GB × €0.01 = €90
  - **Total: ~€150/month**

**Pros**: Cheapest option; EU-HQ (strong GDPR position); good Italian audience latency  
**Cons**: No LL-HLS; lacks AWS integration; smaller ecosystem; less battle-tested at high scale

### 3.6 Option B5: LiveKit Egress

**Architecture**: If already using LiveKit for Workload A, LiveKit Egress can re-stream to an RTMP endpoint (e.g., Cloudflare Stream or Bunny.net).

| Metric | Value |
|---|---|
| Model | Egress is a LiveKit feature (add-on cost on top of LiveKit Cloud) |
| Cost | $0.002/participant-minute for egress recording/streaming |
| Combined with LiveKit A | Adds ~$0.12/match-hour for 1 egress stream |
| Latency | Depends on downstream CDN (~3–5s) |
| CDN coverage | None native — must combine with Cloudflare/Bunny/Mux |
| Python integration | LiveKit Python SDK |
| EU data residency | ✅ |
| Vendor lock-in | Medium (LiveKit + CDN) |

**Pros**: One SDK for both P2P and broadcast; native recording  
**Cons**: Only useful if already on LiveKit for Workload A; adds cost; complexity of two services

### 3.7 Option B6: Agora CDN Push

| Metric | Value |
|---|---|
| Model | Agora can push live streams to CDN (RTMP re-stream) |
| Cost | Additional $0.00099/participant-minute for CDN push |
| Latency | ~4–6 seconds (HLS delivery) |
| Only if using Agora for Workload A | Yes |
| Python integration | REST API |
| EU data residency | ⚠️ |

**Not recommended independently** — only makes sense if already on Agora for WebRTC.

### 3.8 Option B7: Dolby.io

**Architecture**: Dolby.io uses WHIP/WHEP (WebRTC-based ingest and playback) for ultra-low-latency broadcast.

| Metric | Value |
|---|---|
| Model | $0.04/hour per concurrent viewer |
| Latency | < 500ms (WHEP WebRTC delivery) |
| Protocol | WHIP (browser → Dolby) / WHEP (Dolby → viewer browser) |
| CDN coverage | Global |
| Python integration | REST API |
| EU data residency | ✅ |
| Maturity | Beta WHIP/WHEP support; less battle-tested |

**Monthly cost scenarios**:
- 200 matches × 30 spectators × 1h:
  - 200 × 30 × $0.04 = **$240/month**
- Browser compatibility: WHEP requires up-to-date Chrome/Edge (2026); mobile Safari compatibility limited

**Pros**: Sub-second latency (< 500ms vs 3–5s); game-changing for interactive spectating  
**Cons**: Higher cost than CDN-based; newer technology; mobile browser support incomplete; risk for production use

### 3.9 Workload B Comparison Table

| Provider | Latency | Cost (200 matches, 30 spec) | CDN Coverage | EU Data | Thumbnails | Recording | Python |
|---|---|---|---|---|---|---|---|
| **AWS IVS (BASIC)** | **3–5s** | **$550/mo** | Excellent | ✅ | ✅ | ✅ | boto3 |
| Bunny.net Stream | 3–6s | ~€150/mo | Good EU | ✅ | ✅ | ✅ | REST |
| Cloudflare Stream | 2–4s | ~$420/mo | Excellent | ✅ | ✅ | ✅ | REST |
| Mux | 2–5s | ~$234/mo | Good | ⚠️ | ✅✅ | ✅ | Python SDK |
| Dolby.io (WHEP) | <500ms | ~$240/mo | Good | ✅ | ❌ | ❌ | REST |
| LiveKit Egress | 3–5s | Add-on | None native | ✅ | ❌ | ✅ | Python SDK |
| Agora CDN | 4–6s | Add-on | Good | ⚠️ | ❌ | ✅ | REST |

**Winner for Workload B**: AWS IVS (AWS-native integration) or Bunny.net (EU-first, cheapest)

---

## 4. Workload C: Backend API + Database + Cache

The backend handles REST API, WebSocket connections, PostgreSQL (tournaments/memberships/scores), and Redis (caching/leaderboards/signaling).

Providers evaluated:
1. **AWS (ECS Fargate + Aurora Serverless v2 + ElastiCache)** — current plan
2. **Railway.app** — modern PaaS
3. **Render.com** — Heroku alternative
4. **Fly.io** — edge-native containers
5. **Hetzner + Managed Postgres** — EU dedicated
6. **Supabase** — PostgreSQL BaaS + Realtime
7. **PlanetScale** — MySQL-compatible serverless DB (note: MySQL, not PostgreSQL)

### 4.1 Option C1: AWS (ECS Fargate + Aurora Serverless v2 + ElastiCache)

| Tier | ECS Fargate | Aurora Serverless v2 | ElastiCache Redis | ALB/CF/NAT | Total/month |
|---|---|---|---|---|---|
| Dev | 0.25 vCPU/0.5GB × 1 | 0.5–2 ACU | t4g.small | ~$20 | **~$120** |
| Staging | 1 vCPU/2GB × 1 (Spot) | 1–4 ACU | t4g.medium | ~$30 | **~$220** |
| Prod (1k users) | 2 vCPU/4GB × 3 avg | 2–8 ACU | r7g.large × 2 | ~$130 | **~$1,200** |

**Key characteristics**:
- Cold start: Aurora Serverless can take 3–15s to scale from 0 (mitigate with minimum ACU ≥ 1)
- WebSocket: Full support via ALB + sticky sessions
- Python/FastAPI: First-class (Docker container on Fargate)
- Vertical scaling: Aurora auto-scales 0.5 → 128 ACU in seconds
- Horizontal scaling: ECS auto-scaling on CPU/memory
- Multi-AZ: Aurora has native multi-AZ failover; Redis replica support

**Pros**: Most flexible; unlimited scale; best-in-class managed services; full control; comprehensive monitoring  
**Cons**: Highest complexity; highest base cost; requires AWS/CDK expertise; many services to manage

### 4.2 Option C2: Railway.app

Railway is a modern PaaS that supports Docker containers, managed PostgreSQL, and managed Redis.

| Tier | App Service | PostgreSQL | Redis | Total/month |
|---|---|---|---|---|
| Dev | Starter ($5 credit) | 0.5 GB RAM | 0.5 GB | **~$10** |
| Staging | 4 GB RAM, 2 vCPU | 8 GB storage | 1 GB | **~$80** |
| Prod (1k users) | 8 GB RAM, 4 vCPU | 32 GB storage, 16 GB RAM | 4 GB | **~$350** |

**Key characteristics**:
- Cold start: Containers are always on (no cold start); 0→1 deploys in ~30s
- WebSocket: ✅ Supported
- Python/FastAPI: ✅ Docker or Nixpacks detection
- Vertical scaling: Manual via Railway dashboard
- Horizontal scaling: Multiple replicas supported
- PostgreSQL: Standard Postgres 16; no Aurora-equivalent auto-scaling
- Region: US East/West/EU (Frankfurt); no Milan
- Latency to Italy: ~15–25ms from Frankfurt (acceptable)

**Pros**: Extremely simple; great DX; low cost; auto-deploy from GitHub; Postgres + Redis managed  
**Cons**: No auto-scaling database; Frankfurt region (not Milan); smaller SLA guarantees; limited to 1TB DB; no Aurora equivalent

### 4.3 Option C3: Render.com

| Tier | Web Service | PostgreSQL | Redis | Total/month |
|---|---|---|---|---|
| Dev | Free tier (750h/month) | Free (90-day retention) | Free | **~$0** |
| Staging | Standard ($25/month, 2 CPU/2GB) | Starter ($7/month) | $10/month | **~$42** |
| Prod (1k users) | Pro ($85/month, 4 CPU/8GB) × 2 | Pro ($97/month, 4 CPU) | Standard ($30) | **~$297** |

**Key characteristics**:
- Cold start: Free tier has cold starts (50s); paid tiers are always-on
- WebSocket: ✅ Supported
- Python/FastAPI: ✅ Docker or buildpack
- PostgreSQL: Managed Postgres; no Aurora equivalent; daily backups
- Region: US/EU (Frankfurt); no Milan specifically
- Horizontal scaling: Not automatic; must configure multiple services

**Pros**: Cheapest managed option at staging scale; free tier generous; good DX; no infra expertise needed  
**Cons**: Production scaling limited; no auto-scaling DB; US company (GDPR considerations); Frankfurt only

### 4.4 Option C4: Fly.io

Fly.io runs containers at the edge, close to users. Has Postgres add-on (Fly Postgres, actually a managed Postgres cluster they run for you).

| Tier | App (Fly Machines) | PostgreSQL (Fly Postgres) | Redis (Upstash) | Total/month |
|---|---|---|---|---|
| Dev | shared-cpu-1x, 256MB | 1 CPU, 256 MB | Free 10k/day | **~$5** |
| Staging | dedicated-cpu-2x, 4GB | 2 CPU, 8 GB | Pay-as-you-go | **~$100** |
| Prod (1k users) | dedicated-cpu-4x × 3, 8GB | 4 CPU, 32 GB, HA | Pro $280/month | **~$540** |

**Key characteristics**:
- Cold start: Fast (< 1s with Fly Machines fly-start); Machines auto-stop when idle
- WebSocket: ✅ Native support via anycast
- Python/FastAPI: ✅ Docker
- Region: Fly has an EU region (Amsterdam); can deploy to `ams` or `fra`; NOT Milan but low latency
- PostgreSQL: Fly Postgres is self-managed Postgres (not fully managed — you handle backups, upgrades)
- Redis: Must use Upstash Redis (serverless, pay-per-request); or run Redis on Fly Machines

**Pros**: Very low latency (edge deploys); decent cost; good Python support; quick deploys  
**Cons**: Fly Postgres is NOT a managed service (manual backups, upgrades, HA); Upstash Redis is per-request pricing (can spike); less battle-tested for production DBs

### 4.5 Option C5: Hetzner (Dedicated/VPS + Managed Services)

Hetzner is a German cloud provider (EU-headquartered) offering VPS and dedicated servers with excellent price/performance.

| Tier | Hetzner VPS (CX) | Managed Postgres | Redis | Load Balancer | Total/month |
|---|---|---|---|---|---|
| Dev | CX22 (2 vCPU, 4GB, €5) | Addon (~€10) | Addon (~€5) | None | **~€20** |
| Staging | CX32 (4 vCPU, 8GB, €13) | Managed DB M (~€50) | Redis M (~€30) | LB (~€6) | **~€99** |
| Prod (1k users) | CX52 × 3 (16 vCPU, 32GB each, €€) | Managed DB XL (16 vCPU, 64GB, ~€180) | Redis L (~€100) | LB + CF ~€30 | **~€630** |

*(Note: Hetzner pricing as of 2026; euro-denominated)*

**Key characteristics**:
- Cold start: None (always-on VMs)
- WebSocket: ✅ TCP load balancer supported
- Python/FastAPI: ✅ Docker or systemd
- Region: Falkenstein/Nuremberg (Germany), Helsinki, Ashburn (US). No Italy — but Germany latency to Italy ~15ms
- PostgreSQL: Hetzner Managed Database (real managed Postgres with backups, failover)
- Redis: Hetzner Managed Database Redis add-on
- Auto-scaling: NOT supported; must manually provision

**Pros**: Cheapest infrastructure; EU-HQ (strong GDPR); excellent price/performance; Nuremberg → Milan < 15ms  
**Cons**: No auto-scaling; manual horizontal scaling; less managed services than AWS; no serverless components; requires DevOps expertise

### 4.6 Option C6: Supabase (Postgres + Realtime)

Supabase is a Firebase alternative built on PostgreSQL with built-in Realtime (based on Postgres Logical Replication + WebSockets).

| Tier | Pro Plan | Enterprise | Total/month |
|---|---|---|---|
| Dev | Free (500MB DB, 2GB bandwidth) | N/A | **$0** |
| Staging | Pro ($25/month, 8GB DB, 250GB bandwidth) | N/A | **~$40** |
| Prod (1k users) | Pro compute add-on + dedicated (4 CPU, 16GB) | ~$600+ | **~$600+** |

**Key characteristics**:
- Cold start: Pro plan always-on; Free plan pauses after 1 week inactivity
- WebSocket: ✅ Via Supabase Realtime (Postgres → WebSocket broadcasting)
- Python/FastAPI: Supabase provides a Python client `supabase-py`; FastAPI can use it
- PostgreSQL: Standard Postgres 15/16; full SQL support; Row Level Security
- Redis equivalent: Supabase has NO Redis equivalent; need separate Redis service
- Region: `eu-central-1` (Frankfurt) on Pro plan
- Supabase Realtime: Can subscribe to Postgres changes via WebSocket (replaces custom WebSocket in some cases)

**Important limitation**: Supabase is primarily a BaaS — it includes Auth, Storage, Edge Functions, and Realtime. For Ebartex, these overlap with the existing ebartex.com microservices (Auth already exists). Using Supabase mainly for Postgres would underutilize the platform and still require external Redis.

**Pros**: Excellent Postgres management; Realtime subscriptions can simplify some WebSocket code; great DX; no DevOps needed  
**Cons**: No Redis equivalent; Auth/Realtime overlaps with existing services; Pro tier limited; EU region = Frankfurt (not Milan)

### 4.7 Option C7: PlanetScale

| Note | Value |
|---|---|
| Database engine | **MySQL** (Vitess), NOT PostgreSQL |
| Compatibility | Incompatible with project's SQLAlchemy/PostgreSQL schemas |
| Migration effort | Full ORM rewrite required |

**Verdict**: **Not recommended.** The project is PostgreSQL-first (UUID primary keys, JSONB columns, Postgres-specific features like `gen_random_uuid()`, `LISTEN/NOTIFY`). PlanetScale migration would require a full rewrite.

### 4.8 Workload C Comparison Table

| Provider | Dev Cost | Staging Cost | Prod (1k users) | Cold Start | WS Support | EU Data | Auto-Scale | Python |
|---|---|---|---|---|---|---|---|---|
| **AWS (ECS+Aurora+Redis)** | ~$120 | ~$220 | **~$1,200** | ⚠️ Aurora | ✅ | ✅ | ✅✅ | ✅ |
| Hetzner + Managed | ~€20 | ~€99 | **~€630** | ✅ None | ✅ | ✅✅ | ❌ | ✅ |
| Railway.app | ~$10 | ~$80 | **~$350** | ✅ None | ✅ | ✅ | ⚠️ | ✅ |
| Fly.io | ~$5 | ~$100 | **~$540** | ✅ Fast | ✅ | ✅ | ⚠️ | ✅ |
| Render.com | $0 | ~$42 | **~$297** | ⚠️ Free | ✅ | ⚠️ | ❌ | ✅ |
| Supabase | $0 | ~$40 | **~$600+** | ✅ (Pro) | ✅ | ✅ | ❌ | ✅ |
| PlanetScale | — | — | — | — | N/A | ⚠️ | — | ❌ (MySQL) |

---

## 5. Decision Matrix and Scoring

Scores are 1–5 (higher = better) for each criterion.

### 5.1 Workload A Scoring Matrix

| Provider | Cost | Latency | Scalability | DX | Lock-in | EU Data | **Total** |
|---|---|---|---|---|---|---|---|
| Self-hosted coturn | 5 | 4 | 3 | 2 | 5 | 5 | **24** |
| Cloudflare Calls | 5 | 5 | 5 | 4 | 3 | 4 | **26** |
| AWS Chime SDK | 1 | 3 | 5 | 4 | 1 | 5 | **19** |
| Agora.io | 2 | 4 | 5 | 4 | 1 | 2 | **18** |
| Twilio Video | 2 | 3 | 4 | 4 | 1 | 4 | **18** |
| LiveKit Cloud | 2 | 3 | 4 | 5 | 4 | 4 | **22** |
| Daily.co | 1 | 3 | 4 | 4 | 1 | 4 | **17** |
| 100ms.live | 2 | 3 | 4 | 4 | 2 | 4 | **19** |

**Winner**: Cloudflare Calls (26) or Self-hosted coturn (24)  
**Recommendation**: Self-hosted coturn for Phase 1 (cost). Cloudflare Calls in Phase 2 if TURN maintenance becomes a burden.

### 5.2 Workload B Scoring Matrix

| Provider | Cost | Latency | Scalability | DX | Lock-in | EU Data | **Total** |
|---|---|---|---|---|---|---|---|
| AWS IVS | 3 | 4 | 5 | 5 | 2 | 5 | **24** |
| Bunny.net | 5 | 3 | 4 | 3 | 4 | 5 | **24** |
| Cloudflare Stream | 4 | 4 | 5 | 4 | 3 | 4 | **24** |
| Mux | 4 | 4 | 5 | 5 | 3 | 3 | **24** |
| Dolby.io WHEP | 3 | 5 | 4 | 3 | 3 | 4 | **22** |
| LiveKit Egress | 3 | 3 | 3 | 4 | 3 | 4 | **20** |
| Agora CDN | 3 | 3 | 4 | 3 | 2 | 2 | **17** |

**Winner**: 4-way tie (AWS IVS, Bunny.net, Cloudflare Stream, Mux all score 24)  
**Tiebreaker**: AWS IVS wins for AWS-native shops (boto3 integration, EventBridge events, same AWS bill). Bunny.net wins for pure cost optimization.

### 5.3 Workload C Scoring Matrix

| Provider | Cost | Latency | Scalability | DX | Lock-in | EU Data | **Total** |
|---|---|---|---|---|---|---|---|
| AWS (Fargate+Aurora+Redis) | 2 | 4 | 5 | 4 | 2 | 5 | **22** |
| Hetzner | 5 | 4 | 3 | 3 | 5 | 5 | **25** |
| Railway.app | 4 | 3 | 3 | 5 | 3 | 4 | **22** |
| Fly.io | 4 | 5 | 4 | 4 | 3 | 4 | **24** |
| Render.com | 4 | 3 | 3 | 4 | 3 | 3 | **20** |
| Supabase | 3 | 3 | 3 | 5 | 3 | 4 | **21** |
| PlanetScale | 0 | 0 | 0 | 0 | 0 | 0 | **0 (disqualified)** |

**Winner**: Hetzner (25) for cost-optimized teams; Fly.io (24) for modern DX; AWS (22) for enterprise features

---

## 6. Recommended Stack: AWS-Native

**Rationale**: The Ebartex platform is already designed for AWS (CDK, boto3, IAM roles, CloudWatch). Migrating Workloads B and C to non-AWS providers would fragment the operational model, split billing, and require maintaining two credential systems. The cost premium of AWS is justified by:

1. **Operational simplicity**: One AWS bill, one IAM system, one monitoring platform
2. **Integration depth**: IVS EventBridge events, boto3 for IVS, Secrets Manager for TURN credentials
3. **Reliability**: Aurora Serverless auto-scaling is a production-grade capability not available on Railway/Render
4. **GDPR**: All AWS regions used are EU (eu-south-1 + eu-west-1); no data leaves the EU
5. **Developer velocity**: The CDK IaC in `infrastructure/` already defines all resources; adding new services follows existing patterns

### 6.1 Recommended Stack Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RECOMMENDED STACK                                                           │
│                                                                             │
│ Workload A (WebRTC Signaling):                                              │
│   Signaling: ECS FastAPI + Redis (already in stack; zero added cost)       │
│   TURN: EC2 coturn (c5.large in eu-south-1)                                │
│   STUN: Google (stun.l.google.com) — free, public                          │
│                                                                             │
│ Workload B (Spectator Broadcasting):                                        │
│   Live video: AWS IVS (BASIC channel type, eu-west-1)                      │
│   Ingest: Host OBS → RTMPS to IVS                                          │
│   Delivery: IVS CDN (CloudFront-backed LL-HLS to spectator browsers)       │
│   Recording: Optional IVS recording → S3 (eu-west-1)                       │
│                                                                             │
│ Workload C (Backend):                                                       │
│   Compute: AWS ECS Fargate (eu-south-1, On-Demand + Spot mix)              │
│   Database: Aurora Serverless v2 (PostgreSQL 16, eu-south-1)               │
│   Cache: ElastiCache Redis 7 (r7g.large, cluster mode, eu-south-1)         │
│   API Gateway: ALB + CloudFront                                             │
│   Messaging: SQS + SNS                                                     │
│   Secrets: AWS Secrets Manager                                              │
│   Monitoring: CloudWatch + X-Ray                                           │
│   IaC: AWS CDK (TypeScript)                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Cost at Different Scales (Recommended Stack)

| Load | Fargate+ALB | Aurora+Redis | IVS | TURN | Other | **Total/month** |
|---|---|---|---|---|---|---|
| 100 concurrent users | ~$150 | ~$250 | ~$112 | ~$20 | ~$60 | **~$592** |
| 1,000 concurrent users | ~$350 | ~$800 | ~$550 | ~$85 | ~$100 | **~$1,885** |
| 5,000 concurrent users | ~$900 | ~$2,200 | ~$2,750 | ~$400 | ~$200 | **~$6,450** |

---

## 7. Alternative Budget Stack: Hybrid

For teams prioritizing cost over operational simplicity, especially during MVP/early-growth phase:

### 7.1 Budget Stack Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BUDGET STACK (MVP Phase)                                                    │
│                                                                             │
│ Workload A (WebRTC Signaling):                                              │
│   Signaling: Same as recommended (ECS + Redis)                              │
│   TURN: Hetzner VPS CPX21 (3 vCPU, 4GB, €7/month) running coturn          │
│   STUN: Google (free)                                                      │
│                                                                             │
│ Workload B (Spectator Broadcasting):                                        │
│   Live video: Bunny.net Stream (€0.005/min encoding + €0.01/GB delivery)   │
│   Ingest: Host OBS → RTMPS to Bunny ingest                                 │
│   Delivery: Bunny CDN (HLS, ~4–6s latency; not LL-HLS)                    │
│   Recording: Bunny Storage (€0.011/GB)                                     │
│                                                                             │
│ Workload C (Backend):                                                       │
│   Compute: Railway.app (Docker container, auto-deploy)                     │
│   Database: Railway Managed PostgreSQL 16                                   │
│   Cache: Railway Managed Redis 7                                           │
│   API Gateway: Railway built-in (Cloudflare proxy)                         │
│   Messaging: Manual webhooks (Phase 1) or Upstash Queue                    │
│   IaC: Railway.json + manual                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Budget Stack Cost

| Load | Railway (App+DB+Redis) | Bunny.net Stream | Hetzner TURN | **Total/month** |
|---|---|---|---|---|
| 100 concurrent users | ~$80 | ~€22 | ~€7 | **~$115** |
| 1,000 concurrent users | ~$350 | ~€150 | ~€25 | **~$550** |
| 5,000 concurrent users | ~$800 | ~€750 | ~€60 | **~$1,650** |

**Savings vs Recommended**: 3–4× cheaper at all scales  
**Trade-offs**: No auto-scaling database; no AWS integration; 4–6s spectator latency (vs 3–5s); LL-HLS not available on Bunny; less monitoring; no GDPR-certified EU region for Railway

### 7.3 When to Use Budget Stack

- MVP phase (< 100 concurrent users)
- Pre-revenue development
- Testing product-market fit before investing in AWS
- Annual AWS cost > 10% of revenue threshold

### 7.4 Migration Path from Budget to Recommended

```
Budget Stack → Recommended Stack Migration:
1. Railway Postgres → Aurora: Use pg_dump/restore; minimal downtime with RDS DMS
2. Railway Redis → ElastiCache: Redis protocol compatible; update connection strings
3. Railway app → ECS Fargate: Same Docker container; deploy to ECR + ECS
4. Bunny.net → IVS: Update ingest endpoint in match state machine; redeploy ECS
5. Hetzner TURN → AWS EC2 TURN: Same coturn config; update DNS
Estimated migration time: 2–4 days of DevOps work
```

---

## 8. Total Cost of Ownership by User Load

### 8.1 Assumptions

- "Concurrent users" = users with an active WebSocket connection
- Match ratio: 20% of active users are in active matches (1v1)
- Spectator ratio: Each active match has an average of 5 spectators
- Match duration: Average 45 minutes
- Matches per month: 30 × (concurrent users × match ratio / 2) = 3 × concurrent users
- DB size growth: ~10 MB per match (game results, ELO, events)

### 8.2 100 Concurrent Users (Recommended Stack)

```
Active matches: 100 × 20% / 2 = 10 concurrent matches
Matches/month: 300 matches
Spectators: 10 matches × 5 viewers avg = 50 simultaneous spectator WS connections

ECS Fargate (2 tasks × 1 vCPU/2GB):                  $80
Aurora Serverless v2 (1–4 ACU):                       $120
ElastiCache t4g.medium:                                $65
ALB + CloudFront:                                      $25
NAT Gateway:                                           $20
S3 + CloudWatch + Secrets Manager:                     $20
IVS (300 matches × 45min × BASIC $2/h):               $450 × ... 
  = 300 × 0.75h × $2 ingest = $450
  + 300 × 5 spectators × 0.75h × $0.025 = $28
  IVS Total: $478
TURN (t3.small):                                       $15
SQS/SNS/SES:                                           $5
─────────────────────────────────────────────────────────
TOTAL:                                                 ~$828/month

Note: IVS ingest is the dominant cost at this scale.
If matches average 30 min: IVS = ~$300, Total ~$650.
```

### 8.3 1,000 Concurrent Users (Recommended Stack)

```
Active matches: 100 concurrent matches
Matches/month: 3,000 matches
Spectators: 100 simultaneous × 10 avg viewers = 1,000 spectator connections

ECS Fargate (4 tasks avg × 2 vCPU/4GB, mixed Spot):  $280
Aurora Serverless v2 (4–10 ACU):                      $420
ElastiCache r7g.large (2 shards + 1 replica each):    $480
ALB + CloudFront:                                      $55
NAT Gateway + VPC:                                     $60
S3 + CloudWatch + X-Ray + Secrets Manager:             $65
IVS BASIC (3,000 × 0.75h × $2 ingest):                $4,500
  + 3,000 × 10 spec × 0.75h × $0.025 = $562
  IVS Total: $5,062  ← THIS IS THE DOMINANT COST
TURN (c5.large):                                       $85
SQS/SNS/SES:                                           $25
─────────────────────────────────────────────────────────
TOTAL:                                                 ~$6,532/month

IMPORTANT: IVS represents 77% of cost at 1k users!
Cost optimization: Enable IVS only for matches with active spectators (lazy creation).
With selective IVS (50% of matches have spectators):
  IVS = ~$2,531, Total = ~$3,981/month
```

### 8.4 5,000 Concurrent Users (Recommended Stack)

```
Active matches: 500 concurrent matches
Matches/month: 15,000 matches

ECS Fargate (10–18 tasks, Spot-heavy):                $800
Aurora Serverless v2 (8–32 ACU, 1 reader):            $1,800
ElastiCache r7g.xlarge (4 shards + replicas):         $1,200
ALB + CloudFront:                                      $200
NAT Gateway + VPC:                                     $200
S3 + CloudWatch + X-Ray + Secrets Manager:             $200
IVS (15,000 × 0.75h × $2 ingest, selective):          $11,250
  + delivery (selective, 50% with spectators, 15 avg):
  7,500 × 15 × 0.75h × $0.025 = $2,109
  IVS Total: $13,359
TURN (c5.4xlarge × 2):                                $800
─────────────────────────────────────────────────────────
TOTAL:                                                 ~$18,559/month

IVS Cost Optimization for scale:
Switch to Bunny.net Stream at 5k users:
  15,000 × 45min encoding × €0.005 = €3,375
  7,500 × 15 spec × 45min × 1.5GB/h × €0.01 = €1,266
  Bunny Total: ~€4,641 vs $13,359 IVS → saves ~$8,700/month
```

### 8.5 IVS Cost Optimization Strategy

IVS ingest is $2/streaming-hour regardless of whether anyone is watching. Strategy:

```python
# Lazy IVS Channel Creation
# Only create IVS channel when first spectator requests the stream endpoint
# (not on match start)

@router.get("/matches/{match_id}/stream")
async def get_match_stream(match_id: UUID, ...):
    existing_channel = await get_ivs_channel(match_id)
    
    if not existing_channel:
        # First spectator request — create channel now
        channel = await ivs_service.create_channel_for_match(match_id, ...)
        # Notify host to start streaming
        await ws_manager.send_to_host(match_id, {"event": "match.spectator_requested_stream"})
    
    return MatchStreamResponse(playback_url=existing_channel.playback_url)

# This means: matches with zero spectators have ZERO IVS cost
# At 1k users, if only 30% of matches attract spectators:
# IVS cost = $5,062 × 30% ≈ $1,519/month (vs $5,062 always-on)
```

### 8.6 Summary Cost Table

| User Load | Recommended (AWS) | Budget (Railway+Bunny) | Recommended (IVS optimized) |
|---|---|---|---|
| 100 concurrent | ~$828/month | ~$115/month | ~$550/month |
| 1,000 concurrent | ~$6,532/month | ~$550/month | ~$2,500/month |
| 5,000 concurrent | ~$18,559/month | ~$1,650/month | ~$8,000/month |

---

## 9. Migration Risk Assessment

### 9.1 Risk Matrix for Provider Changes

| Migration | Risk | Effort | Trigger |
|---|---|---|---|
| Self-hosted TURN → Cloudflare Calls | Low | Medium | TURN maintenance burden, > 200 concurrent matches |
| IVS → Bunny.net | Medium | Low | IVS cost > 15% of total revenue |
| AWS ECS → Railway | High | High | AWS cost crisis; not recommended post-launch |
| IVS (Standard) upgrade | Low | None | Gold/Platinum members need 1080p |
| Add Dolby.io WHEP | Low | Medium | Spectator latency is a competitive complaint |

### 9.2 Vendor Lock-in Mitigation

The recommended stack has these vendor lock-in points with mitigation strategies:

| Lock-in Point | Severity | Mitigation |
|---|---|---|
| AWS IVS channel API | Medium | Abstract behind `IVSService` class; swap to Cloudflare/Mux by changing 1 service file |
| Aurora PostgreSQL | Low | Standard PostgreSQL; runs anywhere with pg_dump |
| AWS ElastiCache | Low | Standard Redis protocol; runs on any Redis instance |
| AWS CDK (IaC) | Medium | CDK generates CloudFormation; migrate by rewriting CDK stacks |
| ECS Fargate | Low | Standard Docker containers; run on Fly.io/Railway/Kubernetes with same image |

---

## 10. Final Decision Summary

### Recommended Decision

**Use the full AWS-native stack** with IVS lazy-creation optimization:

| Workload | Decision | Cost Driver | Optimization |
|---|---|---|---|
| A (WebRTC) | Self-hosted coturn on EC2 | Fixed EC2 cost | Acceptable; migrate to Cloudflare Calls if > 500 concurrent matches |
| B (Broadcast) | AWS IVS BASIC | Per-match ingest | Lazy creation; only enable for matches with spectators |
| C (Backend) | ECS Fargate + Aurora + ElastiCache | Aurora ACU + Fargate tasks | Spot tasks for non-critical workloads; minimum ACU ≥ 1 |

**Total monthly cost estimates (optimized)**:
- 100 concurrent users: **~$550/month**
- 1,000 concurrent users: **~$2,500/month** (with lazy IVS)
- 5,000 concurrent users: **~$8,000/month** (with lazy IVS + Bunny migration)

The recommended stack is the right choice because:
1. All infrastructure is already defined in CDK (`infrastructure/stacks/`)
2. IVS boto3 integration is already specced in `02_TECHNICAL_SPEC.md`
3. TURN coturn CDK construct is ready to deploy
4. Switching providers later is possible (all external services are behind service classes)
5. EU data residency is guaranteed (eu-south-1 + eu-west-1)
6. CloudWatch observability is already configured

---

*End of Infrastructure Comparison v1.0*
