import { z } from 'zod';

const MAX_INCIDENT_BYTES = 32 * 1024 * 1024;
const contentTypeSchema = z.enum([
  'video/webm',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9,opus',
  'video/mp4',
  'video/mp4;codecs=avc1.42e01e,mp4a.40.2',
]);

export const gapClipManifestSchema = z.object({
  client_clip_id: z.string().uuid(),
  sequence: z.number().int().min(0).max(31),
  started_at: z.string().datetime({ offset: true }),
  ended_at: z.string().datetime({ offset: true }),
  content_type: contentTypeSchema,
  byte_length: z.number().int().positive().max(4 * 1024 * 1024),
  sha256: z.string().regex(/^[A-Za-z0-9+/]{43}=$/),
});

export const createGapRecordingSchema = z.object({
  client_incident_id: z.string().uuid(),
  webcam_session_id: z.string().uuid(),
  detected_at: z.string().datetime({ offset: true }),
  capture_started_at: z.string().datetime({ offset: true }),
  capture_ended_at: z.string().datetime({ offset: true }),
  capture_capped: z.boolean(),
  interrupted: z.boolean(),
  clips: z.array(gapClipManifestSchema).min(1).max(32),
}).superRefine((value, context) => {
  const start = Date.parse(value.capture_started_at);
  const detected = Date.parse(value.detected_at);
  const end = Date.parse(value.capture_ended_at);
  if (end <= start || end - start > 120_000 || detected < start || detected > end) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Intervallo non valido' });
  }
  const ids = new Set(value.clips.map((clip) => clip.client_clip_id));
  const sequences = new Set(value.clips.map((clip) => clip.sequence));
  if (ids.size !== value.clips.length || sequences.size !== value.clips.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Clip duplicate' });
  }
  const bytes = value.clips.reduce((total, clip) => total + clip.byte_length, 0);
  if (bytes > MAX_INCIDENT_BYTES) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Incidente troppo grande' });
  }
});

export type CreateGapRecordingInput = z.infer<typeof createGapRecordingSchema>;

export const gapUploadInitResponseSchema = z.object({
  data: z.object({
    incident_id: z.string().uuid(),
    status: z.enum(['awaiting_upload', 'ready']),
    expires_at: z.string().datetime({ offset: true }),
    uploads: z.array(z.object({
      client_clip_id: z.string().uuid(),
      url: z.string().url().max(2_048),
      fields: z.record(z.string(), z.string()),
      transport: z.enum(['multipart', 'raw']).default('multipart'),
    })).max(32),
  }),
});

export const gapUploadCompleteResponseSchema = z.object({
  data: z.object({
    incident_id: z.string().uuid(),
    status: z.literal('ready'),
    expires_at: z.string().datetime({ offset: true }),
  }),
});
