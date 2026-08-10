import { z } from 'zod';

export const connectionQualitySchema = z.object({
  level: z.enum(['good', 'fair', 'poor']),
  rttMs: z.number().int().min(0).max(10_000).optional(),
  packetLossPct: z.number().min(0).max(100).optional(),
  jitterMs: z.number().int().min(0).max(10_000).optional(),
  transport: z.enum(['server', 'direct', 'relay', 'unknown']),
});

export type ConnectionQualityInput = z.infer<typeof connectionQualitySchema>;
