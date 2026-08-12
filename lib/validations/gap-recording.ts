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
  upload_consented_at: z.string().datetime({ offset: true }),
  upload_consent_version: z.literal('peer-gap-review-v1'),
  temporary_storage_acknowledged: z.literal(true),
  opponent_review_acknowledged: z.literal(true),
  clips: z.array(gapClipManifestSchema).min(1).max(32),
}).superRefine((value, context) => {
  const start = Date.parse(value.capture_started_at);
  const detected = Date.parse(value.detected_at);
  const end = Date.parse(value.capture_ended_at);
  const consented = Date.parse(value.upload_consented_at);
  if (end <= start || end - start > 120_000 || detected < start || detected > end) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Intervallo non valido' });
  }
  if (consented < detected) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Consenso non valido' });
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

export const gapPeerRecordingSchema = z.object({
  recording_id: z.string().uuid(),
  match_id: z.string().uuid(),
  uploader_user_id: z.string().uuid(),
  relationship: z.enum(['own', 'opponent']),
  status: z.enum(['ready', 'verified', 'rejected']),
  detected_at: z.string().datetime({ offset: true }),
  capture_started_at: z.string().datetime({ offset: true }),
  capture_ended_at: z.string().datetime({ offset: true }),
  clip_count: z.number().int().min(1).max(32),
  byte_length: z.number().int().nonnegative().max(MAX_INCIDENT_BYTES),
  capture_capped: z.boolean(),
  interrupted: z.boolean(),
  expires_at: z.string().datetime({ offset: true }),
  uploader_consented_at: z.string().datetime({ offset: true }),
  uploader_consent_version: z.string().max(64),
  viewer_notice_acknowledged: z.boolean(),
  reviewed_at: z.string().datetime({ offset: true }).nullable(),
  review_reason_code: z.string().max(64).nullable(),
  media_deleted: z.boolean(),
});

export const gapPeerListResponseSchema = z.object({
  data: z.array(gapPeerRecordingSchema).max(50),
});

export const gapPeerRecordingResponseSchema = z.object({
  data: gapPeerRecordingSchema,
});

export const gapPeerDetailResponseSchema = z.object({
  data: gapPeerRecordingSchema.extend({
    clips: z.array(z.object({
      clip_id: z.string().uuid(),
      sequence: z.number().int().min(0).max(31),
      started_at: z.string().datetime({ offset: true }),
      ended_at: z.string().datetime({ offset: true }),
      content_type: contentTypeSchema,
      byte_length: z.number().int().positive().max(4 * 1024 * 1024),
    })).max(32),
  }),
});

export const gapViewTicketResponseSchema = z.object({
  data: z.object({
    url: z.string().url().max(2_048),
    content_type: contentTypeSchema,
    byte_length: z.number().int().positive().max(4 * 1024 * 1024),
    expires_at: z.string().datetime({ offset: true }),
  }),
});

export const gapViewTicketsResponseSchema = z.object({
  data: z.object({
    tickets: z.array(gapViewTicketResponseSchema.shape.data.extend({
      clip_id: z.string().uuid(),
    })).min(1).max(32),
  }),
});

export const gapPeerReviewInputSchema = z.object({
  decision: z.enum(['verified', 'rejected']),
  reason_code: z.enum([
    'gap_consistent',
    'dispute_resolved',
    'gap_incomplete',
    'gap_unusable',
    'gap_unexpected_content',
  ]),
  notice_version: z.literal('peer-gap-review-v1'),
  notice_acknowledged: z.literal(true),
});

export type GapPeerRecording = z.infer<typeof gapPeerRecordingSchema>;
export type GapPeerDetail = z.infer<typeof gapPeerDetailResponseSchema>['data'];
