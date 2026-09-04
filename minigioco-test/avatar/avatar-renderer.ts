/**
 * Barrel storico per i consumer che importavano il renderer avatar dal nome
 * precedente. Le implementazioni vivono nei moduli con una sola responsabilità.
 */
export {
  avatarCache,
  avatarLookKey,
  buildAvatar,
  DEFAULT_LOOK,
  normalizeAvatarLook,
} from './avatar-sprite-renderer';

export type {
  AvatarDirection,
  AvatarLook,
  AvatarRenderSet,
  AvatarSprite,
} from './avatar-types';

export {
  AVATAR_DIRECTION_LABELS,
  DEFAULT_AVATAR_PREVIEW_FRAME,
  drawAssoWorldAvatarPreview,
  nextAvatarPreviewFrame,
  staticAvatarPreviewFrame,
} from './avatar-preview';

export type {
  AvatarPreviewFrame,
  AvatarPreviewMotion,
  AvatarPreviewRenderer,
} from './avatar-preview';
