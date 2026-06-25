# 03 — AWS Infrastructure Specification

> **Document type**: AWS Infrastructure Specification  
> **Version**: 2.0  
> **IaC Tool**: AWS CDK (TypeScript)  
> **Primary Region**: `eu-south-1` (Milan)  
> **Secondary Region**: `eu-west-1` (Ireland) — IVS, SES  
> **Service**: Ebartex Tournament Microservice  
> **Updated**: June 2026 — adds IVS spectator broadcast, TURN server, membership infra, 3-role model

---

## Table of Contents

1. [VPC and Networking](#1-vpc-and-networking)
2. [ECS Fargate Service](#2-ecs-fargate-service)
3. [RDS Aurora PostgreSQL](#3-rds-aurora-postgresql)
4. [ElastiCache Redis](#4-elasticache-redis)
5. [Application Load Balancer and CloudFront](#5-application-load-balancer-and-cloudfront)
6. [SQS and SNS](#6-sqs-and-sns)
7. [S3 Buckets](#7-s3-buckets)
8. [Secrets Manager and Parameter Store](#8-secrets-manager-and-parameter-store)
9. [IAM Roles and Policies](#9-iam-roles-and-policies)
10. [CloudWatch Alarms and Dashboards](#10-cloudwatch-alarms-and-dashboards)
11. [ECR Container Registry](#11-ecr-container-registry)
12. [Route 53 and ACM](#12-route-53-and-acm)
13. [Cost Estimation (Updated v2)](#13-cost-estimation-updated-v2)
14. [CDK Stack Structure](#14-cdk-stack-structure)
15. [AWS IVS (Spectator Broadcast) — NEW](#15-aws-ivs-spectator-broadcast--new)
16. [TURN Server (EC2 + coturn) — NEW](#16-turn-server-ec2--coturn--new)
17. [Three-Role Infrastructure Summary — NEW](#17-three-role-infrastructure-summary--new)

---

## 1. VPC and Networking

*(Sections 1.1–1.3 unchanged from v1.0 — VPC, Security Groups, VPC Endpoints)*

### 1.1 VPC Configuration (unchanged)

```typescript
const vpc = new ec2.Vpc(this, 'TournamentsVpc', {
  vpcName: 'ebartex-tournaments-vpc',
  cidr: '10.0.0.0/16',
  maxAzs: 2,
  natGateways: 1,
  subnetConfiguration: [
    { name: 'Public',   subnetType: ec2.SubnetType.PUBLIC,                cidrMask: 24 },
    { name: 'Private',  subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,  cidrMask: 24 },
    { name: 'Database', subnetType: ec2.SubnetType.PRIVATE_ISOLATED,     cidrMask: 24 },
  ],
});
```

### 1.2 Security Groups (updated with TURN server SG)

*(All existing SGs from v1.0 unchanged. New TURN server SG:)*

```typescript
// TURN Server Security Group (EC2 in Public subnet)
const turnSg = new ec2.SecurityGroup(this, 'TurnSg', {
  vpc,
  description: 'coturn TURN server',
  securityGroupName: 'tournaments-turn-sg',
});
// TURN/STUN UDP (for WebRTC NAT traversal)
turnSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(3478), 'TURN UDP');
turnSg.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.udp(3478), 'TURN UDP IPv6');
// TURN TCP (fallback)
turnSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3478), 'TURN TCP');
// TURNS (TLS TURN)
turnSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5349), 'TURNS TLS');
// WebRTC relay port range
turnSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udpRange(49152, 65535), 'WebRTC relay ports');
// SSH for maintenance (restrict to specific IPs in production)
turnSg.addIngressRule(ec2.Peer.ipv4('10.0.0.0/16'), ec2.Port.tcp(22), 'SSH from VPC only');
```

### 1.3 VPC Endpoints (updated)

```typescript
// Add IVS endpoint (if available in eu-south-1; otherwise traffic goes via NAT GW to eu-west-1)
// Note: IVS uses HTTPS calls from ECS tasks → billed through NAT Gateway if no VPC endpoint
// IVS endpoint is not available in all regions; use Interface VPC Endpoint if available:
// ec2.InterfaceVpcEndpointAwsService.IVS  (check availability before deployment)
```

---

## 2. ECS Fargate Service

*(Sections 2.1–2.4 unchanged from v1.0. Updates to task definition below.)*

### 2.2 Task Definition (updated for v2)

New environment variables and secrets for membership + IVS:

```typescript
const appContainer = taskDef.addContainer('tournament-api', {
  // ... existing config unchanged ...
  environment: {
    // ... existing env vars ...
    IVS_REGION: 'eu-west-1',           // IVS runs in Ireland (nearest EU)
    TURN_SERVER_HOST: 'turn.ebartex.com',
    MEMBERSHIP_EXPIRY_CHECK_INTERVAL: '86400',  // Daily in seconds
  },
  secrets: {
    // ... existing secrets ...
    TURN_SERVER_SECRET: ecs.Secret.fromSecretsManager(appSecret, 'TURN_SERVER_SECRET'),
    IVS_RECORDING_CONFIG_ARN: ecs.Secret.fromSecretsManager(appSecret, 'IVS_RECORDING_CONFIG_ARN'),
    STREAM_KEY_ENCRYPTION_KEY: ecs.Secret.fromSecretsManager(appSecret, 'STREAM_KEY_ENCRYPTION_KEY'),
  },
  // ... rest unchanged ...
});
```

---

## 3. RDS Aurora PostgreSQL

*(Unchanged from v1.0. New tables will be added via Alembic migrations.)*

---

## 4. ElastiCache Redis

*(Unchanged from v1.0.)*

---

## 5. Application Load Balancer and CloudFront

*(Unchanged from v1.0.)*

---

## 6. SQS and SNS

*(Section 6.1–6.2 unchanged. New queues and subscriptions:)*

### 6.3 New SQS Queues (v2)

```typescript
// IVS Events Queue (receives EventBridge events from IVS)
const ivsEventsQueue = new sqs.Queue(this, 'IvsEventsQueue', {
  queueName: 'tournament-ivs-events',
  visibilityTimeout: cdk.Duration.seconds(60),
  retentionPeriod: cdk.Duration.days(1),
  deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
});

// Membership Events Queue
const membershipQueue = new sqs.Queue(this, 'MembershipQueue', {
  queueName: 'tournament-membership-events',
  visibilityTimeout: cdk.Duration.seconds(60),
  retentionPeriod: cdk.Duration.days(7),
  deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
});

// Subscribe membership events to main topic
eventsTopic.addSubscription(new sns_subs.SqsSubscription(membershipQueue, {
  filterPolicy: {
    event_type: sns.SubscriptionFilter.stringFilter({
      allowlist: [
        'membership.enrolled', 'membership.renewed', 
        'membership.expired', 'membership.expiry_urgent',
        'membership.tier_changed',
      ],
    }),
  },
}));
```

### 6.4 EventBridge Rule for IVS Events

```typescript
// EventBridge rule to capture IVS stream state changes
const ivsEventRule = new events.Rule(this, 'IvsStreamRule', {
  eventPattern: {
    source: ['aws.ivs'],
    detailType: ['IVS Stream State Change'],
  },
  // Route to SQS via EventBridge → SNS → SQS or directly to SQS
  targets: [new events_targets.SqsQueue(ivsEventsQueue)],
});
```

---

## 7. S3 Buckets

*(Section 7.1 unchanged. New bucket for IVS recordings:)*

```typescript
// IVS Recordings bucket (match replays via IVS recording config)
const ivs_recordingsBucket = new s3.Bucket(this, 'IvsRecordingsBucket', {
  bucketName: `ebartex-ivs-recordings-${this.account}`,
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  versioned: false,
  lifecycleRules: [
    {
      id: 'expire-recordings',
      enabled: true,
      expiration: cdk.Duration.days(30),  // Keep recordings 30 days
    },
  ],
  cors: [
    {
      allowedMethods: [s3.HttpMethods.GET],
      allowedOrigins: ['https://tournaments.ebartex.com'],
      allowedHeaders: ['*'],
      maxAge: 3600,
    },
  ],
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

// IVS Recording Configuration (references S3 bucket)
// Note: This must be created in eu-west-1 (IVS region), not eu-south-1
// Created via custom CloudFormation resource or manually via console
```

---

## 8. Secrets Manager and Parameter Store

*(Section 8.1 updated with new secrets:)*

```typescript
// Application secrets (updated)
const appSecret = new secretsmanager.Secret(this, 'AppSecret', {
  secretName: '/ebartex/tournaments/production/app',
  secretStringValue: cdk.SecretValue.unsafePlainText(JSON.stringify({
    // ... existing secrets ...
    TURN_SERVER_SECRET: '',         // Must be set manually — shared with coturn
    IVS_RECORDING_CONFIG_ARN: '',  // IVS recording configuration ARN
    STREAM_KEY_ENCRYPTION_KEY: '', // AES-256 key for encrypting IVS stream keys in DB
  })),
});

// TURN server credentials (separate secret, also deployed to EC2)
const turnSecret = new secretsmanager.Secret(this, 'TurnSecret', {
  secretName: '/ebartex/tournaments/production/turn-server',
  description: 'coturn shared secret for HMAC-SHA1 ephemeral credentials',
  generateSecretString: {
    secretStringTemplate: JSON.stringify({ TURN_SHARED_SECRET: '', TURN_REALM: 'turn.ebartex.com' }),
    generateStringKey: '_unused',
    passwordLength: 32,
    excludeCharacters: '"@/\\',
  },
});
```

### 8.3 New Parameter Store Values (v2)

```
/ebartex/tournaments/production/ivs-region = "eu-west-1"
/ebartex/tournaments/production/turn-server-host = "turn.ebartex.com"
/ebartex/tournaments/production/turn-credential-ttl = "86400"
/ebartex/tournaments/production/membership-expiry-check-hour = "3"
/ebartex/tournaments/production/arcade-room-ttl-minutes = "30"
/ebartex/tournaments/production/ivs-recording-enabled-default = "false"
```

---

## 9. IAM Roles and Policies

*(Section 9.1 updated with new permissions:)*

```typescript
// Additional IAM permissions for ECS Task Role (v2)

// IVS permissions
ecsTaskRole.addToPolicy(new iam.PolicyStatement({
  sid: 'AllowIvs',
  effect: iam.Effect.ALLOW,
  actions: [
    'ivs:CreateChannel',
    'ivs:DeleteChannel',
    'ivs:GetStream',
    'ivs:ListStreamKeys',
    'ivs:CreateStreamKey',
    'ivs:DeleteStreamKey',
    'ivs:ListChannels',
    'ivs:TagResource',
  ],
  resources: ['*'],
  conditions: {
    StringEquals: { 'aws:RequestedRegion': 'eu-west-1' }
  },
}));

// IVS Recordings S3 permissions
ecsTaskRole.addToPolicy(new iam.PolicyStatement({
  sid: 'AllowIvsRecordings',
  effect: iam.Effect.ALLOW,
  actions: ['s3:GetObject', 's3:ListBucket'],
  resources: [
    ivs_recordingsBucket.bucketArn,
    `${ivs_recordingsBucket.bucketArn}/*`,
  ],
}));

// Membership analytics (CloudWatch custom metrics)
// Already covered by existing AllowCloudWatchMetrics policy
```

---

## 10. CloudWatch Alarms and Dashboards

*(Section 10.1 updated with new alarms:)*

### 10.1 Additional Critical Alarms (v2)

```typescript
// IVS channel creation failure rate
new cloudwatch.Alarm(this, 'IvsCreationFailures', {
  alarmName: 'tournaments-ivs-channel-creation-failures',
  metric: new cloudwatch.Metric({
    namespace: 'EbartexTournaments',
    metricName: 'IvsChannelCreationFailures',
    period: cdk.Duration.minutes(5),
    statistic: 'Sum',
  }),
  threshold: 5,
  evaluationPeriods: 1,
  alarmDescription: 'IVS channel creation failing — spectator streaming broken',
}).addAlarmAction(new cw_actions.SnsAction(alertsTopic));

// Membership enrollment errors
new cloudwatch.Alarm(this, 'MembershipEnrollmentErrors', {
  alarmName: 'tournaments-membership-enrollment-errors',
  metric: new cloudwatch.Metric({
    namespace: 'EbartexTournaments',
    metricName: 'MembershipEnrollmentErrors',
    period: cdk.Duration.minutes(10),
    statistic: 'Sum',
  }),
  threshold: 10,
  evaluationPeriods: 2,
  alarmDescription: 'High membership enrollment error rate — onboarding broken',
}).addAlarmAction(new cw_actions.SnsAction(alertsTopic));

// TURN server connectivity (custom metric from coturn stats)
new cloudwatch.Alarm(this, 'TurnServerDown', {
  alarmName: 'tournaments-turn-server-unreachable',
  metric: new cloudwatch.Metric({
    namespace: 'EbartexTournaments',
    metricName: 'TurnServerReachable',
    period: cdk.Duration.minutes(5),
    statistic: 'Average',
  }),
  threshold: 1,
  comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
  evaluationPeriods: 2,
  alarmDescription: 'TURN server is unreachable — WebRTC fallback broken',
}).addAlarmAction(new cw_actions.SnsAction(alertsTopic));
```

### 10.2 Updated CloudWatch Dashboard (v2)

Additional rows added to the dashboard:

```typescript
// Row 6: Membership Metrics
[
  new cloudwatch.GraphWidget({ title: 'New Enrollments Today', ... }),
  new cloudwatch.GraphWidget({ title: 'Active Memberships', ... }),
  new cloudwatch.GraphWidget({ title: 'Enrollment Errors', ... }),
],
// Row 7: Arcade Room Metrics  
[
  new cloudwatch.GraphWidget({ title: 'Arcade Scores Submitted', ... }),
  new cloudwatch.GraphWidget({ title: 'Active P2P Rooms', ... }),
  new cloudwatch.GraphWidget({ title: 'Tickets Earned/Spent', ... }),
],
// Row 8: Spectator / IVS Metrics
[
  new cloudwatch.GraphWidget({ title: 'Live Matches (IVS)', ... }),
  new cloudwatch.GraphWidget({ title: 'Total Spectators (WebSocket)', ... }),
  new cloudwatch.GraphWidget({ title: 'IVS Data Transfer', ... }),
],
```

---

## 11. ECR Container Registry

*(Unchanged from v1.0.)*

---

## 12. Route 53 and ACM

*(Updated with TURN server DNS:)*

```typescript
// DNS: turn.ebartex.com → TURN server EC2 Elastic IP
new route53.ARecord(this, 'TurnARecord', {
  zone: hostedZone,
  recordName: 'turn',
  target: route53.RecordTarget.fromIpAddresses(turnServerEip.ref),
  ttl: cdk.Duration.seconds(300),
});
```

---

## 13. Cost Estimation (Updated v2)

### 13.1 Development Environment

| Resource | Spec | Monthly Cost (USD) |
|---|---|---|
| ECS Fargate | 1 task × 0.25 vCPU × 0.5 GB RAM | ~$7 |
| RDS Aurora Serverless v2 | 0.5 ACU minimum, ~2 ACU average | ~$40 |
| ElastiCache Redis | cache.t4g.small, 1 shard no replica | ~$25 |
| ALB | 1 LB, ~100k requests/month | ~$17 |
| NAT Gateway | 1 NAT, ~5 GB/month | ~$5 |
| S3 | 10 GB storage | ~$2 |
| CloudFront | 50 GB transfer | ~$5 |
| Secrets Manager | 7 secrets × $0.40 | ~$3 |
| **IVS (dev — minimal)** | **~10 test streams, 5 GB** | **~$1** |
| **TURN server (t3.small)** | **Dev/testing only** | **~$15** |
| **TOTAL DEV** | | **~$120/month** |

### 13.2 Staging Environment

| Resource | Spec | Monthly Cost (USD) |
|---|---|---|
| ECS Fargate | 1 task × 1 vCPU × 2 GB (Spot) | ~$20 |
| RDS Aurora Serverless v2 | 1 ACU min, 4 ACU avg | ~$70 |
| ElastiCache Redis | cache.t4g.medium, 1 shard | ~$50 |
| ALB + CloudFront | Moderate traffic | ~$25 |
| Other services | SQS, SNS, S3, etc. | ~$15 |
| **IVS (staging)** | **~50 test streams/month** | **~$10** |
| **TURN server (t3.medium)** | **Staging load** | **~$30** |
| **TOTAL STAGING** | | **~$220/month** |

### 13.3 Production Environment

| Resource | Spec | Monthly Cost (USD) |
|---|---|---|
| ECS Fargate | 2 base On-Demand + up to 18 Spot, avg 3 tasks × 2 vCPU × 4 GB | ~$200 |
| RDS Aurora Serverless v2 | 2 ACU min, 8 ACU avg peak, 1 reader | ~$350 |
| ElastiCache Redis | cache.r7g.large × 2 shards + 1 replica each | ~$450 |
| ALB | Production traffic, ~5M requests/month | ~$30 |
| CloudFront | 500 GB transfer/month | ~$45 |
| NAT Gateway | 2 NAT, ~50 GB/month | ~$50 |
| S3 | 100 GB assets + 200 GB IVS recordings | ~$25 |
| SQS/SNS | ~10M events/month | ~$5 |
| Secrets Manager | 12 secrets + rotations | ~$6 |
| CloudWatch | Logs, metrics, alarms | ~$30 |
| ECR | Image storage + transfer | ~$10 |
| Route 53 | 1 hosted zone + queries | ~$5 |
| SES | 10k emails/month | ~$1 |
| **AWS IVS** | **200 matches/month × 1h × ingest+delivery (10 spectators avg)** | **~$145** |
| **TURN Server** | **c5.large EC2 + Elastic IP + data transfer** | **~$85** |
| **TOTAL PROD (1k concurrent users)** | | **~$1,437/month** |

*Estimates based on AWS pricing as of 2026. Spot pricing reduces ECS cost by ~70%.*

### 13.4 Cost Scaling Projections

| User Load | ECS Tasks | Aurora ACU | Redis | IVS | TURN | **Total/month** |
|---|---|---|---|---|---|---|
| 100 concurrent | 2 on-demand | 2–4 ACU | t4g.medium | ~$30 | t3.small ~$15 | **~$650** |
| 1,000 concurrent | 4–6 tasks | 4–8 ACU | r7g.large | ~$145 | c5.large ~$85 | **~$1,437** |
| 5,000 concurrent | 10–20 tasks | 8–32 ACU | r7g.xlarge | ~$720 | c5.4xlarge ~$400 | **~$4,800** |

---

## 14. CDK Stack Structure

*(Sections 14.1–14.2 unchanged from v1.0. Updated stack list:)*

```
infrastructure/
├── bin/
│   └── app.ts
├── stacks/
│   ├── network-stack.ts    # VPC, subnets, SGs (updated with TURN SG)
│   ├── data-stack.ts       # RDS Aurora, ElastiCache
│   ├── ecs-stack.ts        # ECS cluster, service, task def (updated)
│   ├── cdn-stack.ts        # CloudFront, ALB, S3 (updated with IVS recordings bucket)
│   ├── messaging-stack.ts  # SNS, SQS (updated with new queues + EventBridge)
│   ├── security-stack.ts   # IAM, Secrets Manager, WAF (updated with IVS + TURN perms)
│   ├── monitoring-stack.ts # CloudWatch alarms, dashboards (updated)
│   ├── ivs-stack.ts        # NEW: IVS recording config (eu-west-1)
│   └── turn-stack.ts       # NEW: coturn EC2 instance
├── constructs/
│   ├── tournament-api-service.ts
│   ├── aurora-serverless-v2.ts
│   └── turn-server.ts              # NEW: coturn EC2 construct
├── config/
│   ├── dev.ts
│   ├── staging.ts
│   └── production.ts
└── package.json
```

---

## 15. AWS IVS (Spectator Broadcast) — NEW

### 15.1 Overview

AWS IVS (Interactive Video Service) handles the one-to-many spectator broadcast use case. The key advantage: IVS CDN delivery scales to unlimited viewers without any load on the ECS service.

### 15.2 IVS Architecture

```
HOST's Browser/OBS
    │
    │ RTMPS stream (video + audio)
    │ to: rtmps://{ingestEndpoint}:443/app/{streamKey}
    ▼
┌─────────────────────────────────────────────────────────────┐
│ AWS IVS                                                     │
│  ┌──────────────┐   ┌──────────────────┐                   │
│  │ Ingest Node  │──►│ Transcoding      │                   │
│  │ (eu-west-1)  │   │ 1080p/720p/480p  │                   │
│  └──────────────┘   └────────┬─────────┘                   │
│                               │                             │
│  ┌────────────────────────────▼────────────────────────┐   │
│  │ IVS CDN (powered by CloudFront Points of Presence)  │   │
│  │ Italy: Milan PoP (≤ 5ms to Italian viewers)         │   │
│  └────────────────────────────┬────────────────────────┘   │
└────────────────────────────────│────────────────────────────┘
                                 │ LL-HLS playback URL
                                 │ https://{uuid}.live-video.net/api/video/v1/...
                                 ▼
                        N Spectators (browser <video> tag)
                        Latency: 3–5 seconds from host
```

### 15.3 IVS Channel Types

| Type | Max Resolution | Max Bitrate | Use Case |
|---|---|---|---|
| `STANDARD` | 1080p @ 60fps | 8.5 Mbps | Production matches (Gold/Platinum hosts) |
| `BASIC` | 480p @ 30fps | 1.5 Mbps | Standard tier matches, reduces cost |
| `ADVANCED_SD` | 480p, multiple qualities | 1.5 Mbps + adv | Multi-rendition streaming |
| `ADVANCED_HD` | 1080p, multiple qualities | 8.5 Mbps + adv | Premium spectator experience |

**Decision for Ebartex**: Use `BASIC` for all matches in Phase 1 (cost optimization). Upgrade to `STANDARD` for Gold/Platinum tier hosts in Phase 2.

### 15.4 Stream Key Security

The IVS stream key is a sensitive credential — it must be delivered **only to the authenticated HOST** via WebSocket:

```python
# NEVER return stream_key in HTTP responses
# ALWAYS deliver via WebSocket notification to authenticated host only

async def deliver_stream_key_to_host(
    match_id: str, host_user_id: str, stream_key: str, 
    ingest_endpoint: str, ws_manager: WebSocketManager, redis: Redis
) -> None:
    """
    Encrypt the stream key before storing, deliver via WS to host only.
    """
    # Encrypt stream key in DB
    encrypted_key = encrypt_aes256(stream_key, settings.stream_key_encryption_key)
    
    # Deliver via WebSocket to host only
    await ws_manager.send_to_user(host_user_id, {
        "event": "match.stream_key",
        "data": {
            "stream_key": stream_key,  # Plaintext only in WS message
            "ingest_endpoint": ingest_endpoint,
            "instructions": "Configura OBS con questi parametri per iniziare lo streaming.",
        },
        "timestamp": datetime.now(UTC).isoformat(),
    })
    
    # The stream key is NOT stored in plaintext anywhere after this point
```

### 15.5 IVS CDK Stack (eu-west-1)

```typescript
// stacks/ivs-stack.ts — must be deployed to eu-west-1 (IVS is not in eu-south-1)
export class IvsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, { ...props, env: { region: 'eu-west-1' } });
    
    // Recording configuration (optional per match)
    const recordingConfig = new ivs.CfnRecordingConfiguration(this, 'RecordingConfig', {
      name: 'ebartex-match-recordings',
      destinationConfiguration: {
        s3: {
          bucketName: `ebartex-ivs-recordings-${this.account}`,
        },
      },
      thumbnailConfiguration: {
        recordingMode: 'INTERVAL',
        targetIntervalSeconds: 60,  // Thumbnail every 60 seconds
      },
    });
    
    // Export ARN for use by main stack
    new cdk.CfnOutput(this, 'RecordingConfigArn', {
      value: recordingConfig.attrArn,
      exportName: 'IvsRecordingConfigArn',
    });
  }
}
```

---

## 16. TURN Server (EC2 + coturn) — NEW

### 16.1 Purpose

A TURN (Traversal Using Relays around NAT) server is needed when WebRTC participants are behind restrictive NAT or firewalls. The TURN server relays WebRTC media when direct P2P is impossible. This is used for **TOURNAMENT MATCHES** (not arcade rooms, which use Google STUN only).

Expected usage: ~5% of connections require TURN relay. The remaining 95% establish P2P directly via STUN.

### 16.2 CDK Construct

```typescript
// constructs/turn-server.ts
export class TurnServer extends Construct {
  public readonly instance: ec2.Instance;
  public readonly elasticIp: ec2.CfnEIP;
  
  constructor(scope: Construct, id: string, props: TurnServerProps) {
    super(scope, id);
    
    // EC2 instance (c5.large for production — handles ~50 concurrent relays)
    this.instance = new ec2.Instance(this, 'TurnInstance', {
      vpc: props.vpc,
      instanceType: props.environment === 'production'
        ? ec2.InstanceType.of(ec2.InstanceClass.C5, ec2.InstanceSize.LARGE)
        : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: props.turnSg,
      keyPair: ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'ebartex-infra-key'),
      userData: this.buildUserData(props),
    });
    
    // Elastic IP (stable DNS A record)
    this.elasticIp = new ec2.CfnEIP(this, 'TurnEip', {
      instanceId: this.instance.instanceId,
      tags: [{ key: 'Name', value: 'tournaments-turn-server' }],
    });
  }
  
  private buildUserData(props: TurnServerProps): ec2.UserData {
    const ud = ec2.UserData.forLinux();
    ud.addCommands(
      // Install coturn
      'dnf install -y coturn',
      'systemctl enable coturn',
      
      // Write coturn config
      `cat > /etc/coturn/turnserver.conf << 'EOF'
# coturn configuration for Ebartex Tournaments
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
relay-ip=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
external-ip=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
realm=turn.ebartex.com
server-name=turn.ebartex.com
log-file=/var/log/coturn/turnserver.log
pidfile=/var/run/coturn/turnserver.pid

# HMAC-SHA1 ephemeral credentials
use-auth-secret
static-auth-secret=TURN_SECRET_PLACEHOLDER

# TLS certificates (Let's Encrypt via certbot)
cert=/etc/letsencrypt/live/turn.ebartex.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.ebartex.com/privkey.pem

# Port ranges for relay
min-port=49152
max-port=65535

# Bandwidth limits per connection
total-quota=300          # max 300 simultaneous allocations
bps-capacity=100000000   # 100 Mbps total
user-quota=20            # max 20 allocations per user

# Security
no-multicast-peers
denied-peer-ip=10.0.0.0-10.255.255.255  # Block VPC internal access
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255

# Logging
verbose
stale-nonce=600
EOF`,
      
      // Replace placeholder with real secret from Secrets Manager
      `SECRET=$(aws secretsmanager get-secret-value --secret-id /ebartex/tournaments/production/turn-server --query 'SecretString' --output text | python3 -c "import sys,json; print(json.load(sys.stdin)['TURN_SHARED_SECRET'])")`,
      `sed -i "s/TURN_SECRET_PLACEHOLDER/$SECRET/" /etc/coturn/turnserver.conf`,
      
      // Install certbot and get TLS cert
      'dnf install -y certbot',
      'certbot certonly --standalone -d turn.ebartex.com --non-interactive --agree-tos -m admin@ebartex.com',
      
      // Start coturn
      'systemctl start coturn',
      
      // CloudWatch agent for monitoring
      'dnf install -y amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',
    );
    return ud;
  }
}
```

### 16.3 coturn Monitoring

Custom CloudWatch metrics pushed by a cron job on the TURN server:

```bash
# /etc/cron.d/coturn-metrics (runs every 60 seconds)
* * * * * root /opt/coturn-metrics.sh

# /opt/coturn-metrics.sh
#!/bin/bash
ACTIVE=$(turnstats -d 2>/dev/null | grep "active-allocations" | awk '{print $2}' || echo 0)
aws cloudwatch put-metric-data \
  --namespace EbartexTournaments \
  --metric-name TurnActiveAllocations \
  --value "$ACTIVE" \
  --unit Count \
  --region eu-south-1
```

### 16.4 TURN Server Scaling

| Load | Server Size | Concurrent Relays | Cost/month |
|---|---|---|---|
| Development | t3.small | ~10 | ~$15 |
| Staging | t3.medium | ~25 | ~$30 |
| Production (1k users) | c5.large (2 vCPU, 4 GB) | ~50–100 | ~$85 |
| Production (5k users) | c5.4xlarge (16 vCPU, 32 GB) | ~500 | ~$400 |

At 1,000 concurrent users with 50% in active matches = 500 matches = 1,000 streams. With ~5% needing TURN relay = ~50 concurrent TURN allocations. A `c5.large` handles this comfortably.

---

## 17. Three-Role Infrastructure Summary — NEW

This section documents the complete infrastructure path for each of the three user roles.

### 17.1 HOST (Tournament Organizer)

```
HOST's journey through infrastructure:
1. Creates tournament       → ECS (POST /tournaments) → Aurora
2. Gets webcam_session_id   → ECS → Redis
3. Scans phone camera       → Phone sends WebRTC offer → ECS (POST /signaling) → Redis
4. PC receives answer       → ECS (GET /signaling) → Redis → PC
5. P2P stream established   → Direct WebRTC P2P (not through AWS)
6. Match starts             → ECS → IVS CreateChannel (in eu-west-1)
7. Receives stream_key      → ECS → WebSocket → HOST's browser
8. Starts OBS streaming     → HOST → RTMPS → IVS Ingest
9. Submits game results     → ECS (POST /matches/{id}/games) → Aurora
10. Match ends              → ECS → IVS DeleteChannel → Aurora update

Infrastructure touched: ECS (API) + Redis (signaling) + Aurora (data) + IVS (video out)
WebRTC through ECS: NO (only signaling messages, not media)
```

### 17.2 PARTICIPANT (Player)

```
PARTICIPANT's journey:
1. Views tournaments        → ECS (GET /tournaments) → Redis → Aurora
2. Joins tournament         → ECS (POST /tournaments/{id}/join) → Aurora
3. Match starts notification → ECS → WebSocket → PARTICIPANT's browser
4. Gets webcam_session_id   → ECS → Aurora
5. Phone camera connection  → Same as HOST steps 3-4 above
6. WebRTC P2P established   → Direct P2P with HOST (STUN via Google, TURN as fallback)
7. Submits game results     → ECS → Aurora
8. Match ends               → ECS → Aurora → WebSocket notification

Infrastructure touched: ECS (API) + Redis (signaling + WebSocket) + Aurora + STUN/TURN
WebRTC through ECS: NO
```

### 17.3 SPECTATOR (Live Viewer)

```
SPECTATOR's journey:
1. Browses live matches     → ECS (GET /matches?status=in_corso) → Aurora
2. Gets playback URL        → ECS (GET /matches/{id}/stream) → Aurora
3. Opens video player       → Browser <video> tag with LL-HLS URL
4. Watches live stream      → IVS CDN (NOT ECS) → Spectator's browser

Infrastructure touched: ECS (discovery only) + IVS CDN (all video)
ECS load per spectator: ~2 API calls total (negligible)
Video delivery: 100% via IVS CDN — ECS has ZERO load from spectator video
This means 10,000 spectators = same ECS load as 10 spectators
```

### 17.4 Infrastructure Load Matrix

| Component | HOST | PARTICIPANT | SPECTATOR (per viewer) |
|---|---|---|---|
| ECS Fargate | Medium | Medium | Negligible (~2 reqs) |
| Aurora | High (writes) | High (writes) | Low (1 read) |
| Redis | High (signaling) | High (signaling) | Low (WebSocket only) |
| CloudFront | Low | Low | None (goes to IVS CDN) |
| IVS | Video out | None | Video in (via CDN) |
| TURN Server | Possible | Possible | None |
| Bandwidth | ↑↓ WebRTC P2P | ↑↓ WebRTC P2P | ↓ IVS CDN |

### 17.5 Why This Architecture Wins

- **ECS does NOT handle any video** — it only manages signaling text messages (tiny bandwidth)
- **IVS CDN handles spectator scale** — adding 1,000 spectators costs ~$0.05 in IVS fees, adds zero ECS load
- **WebRTC P2P for players** — video goes directly between HOST and PARTICIPANT after signaling, not through servers
- **TURN relay is the exception** — ~95% of connections use P2P directly; TURN only needed for restrictive NATs

---

*End of AWS Infrastructure Specification v2.0*
