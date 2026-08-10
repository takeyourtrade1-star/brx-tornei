import type {
  ConnectionQuality,
  ConnectionQualityLevel,
  ConnectionTransport,
} from '@/types/tournament';

export interface QualityMetrics {
  rttMs?: number;
  packetLossPct?: number;
  jitterMs?: number;
  effectiveType?: string;
  online?: boolean;
  transport: ConnectionTransport;
}

export function classifyConnectionQuality(metrics: QualityMetrics): ConnectionQualityLevel {
  if (metrics.online === false) return 'poor';
  if (
    metrics.effectiveType === 'slow-2g' ||
    (metrics.rttMs !== undefined && metrics.rttMs >= 350) ||
    (metrics.packetLossPct !== undefined && metrics.packetLossPct >= 5) ||
    (metrics.jitterMs !== undefined && metrics.jitterMs >= 80)
  ) {
    return 'poor';
  }
  if (
    metrics.effectiveType === '2g' ||
    (metrics.rttMs !== undefined && metrics.rttMs >= 160) ||
    (metrics.packetLossPct !== undefined && metrics.packetLossPct >= 1.5) ||
    (metrics.jitterMs !== undefined && metrics.jitterMs >= 35)
  ) {
    return 'fair';
  }
  return 'good';
}

export function connectionQualityLabel(connection?: ConnectionQuality): string {
  if (!connection) return 'Verifica in corso';
  const label = connection.level === 'good' ? 'Buona' : connection.level === 'fair' ? 'Media' : 'Scarsa';
  return connection.rttMs !== undefined ? `${label} · ${connection.rttMs} ms` : label;
}
