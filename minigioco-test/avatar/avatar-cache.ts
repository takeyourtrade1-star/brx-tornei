import type { AvatarLook, AvatarRenderSet, AvatarSpriteCache } from './avatar-types';

/** Otto look completi: limite esplicito per non trattenere centinaia di canvas. */
export const DEFAULT_AVATAR_CACHE_LIMIT = 8;

export function avatarLookKey(look: AvatarLook): string {
  return `look:${look.hair}:${look.outfit}`;
}

/** Cache LRU bounded; il get aggiorna l'ordine e il set espelle il più vecchio. */
export function createAvatarCache(limit = DEFAULT_AVATAR_CACHE_LIMIT): AvatarSpriteCache {
  const boundedLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : DEFAULT_AVATAR_CACHE_LIMIT;
  const entries = new Map<string, AvatarRenderSet>();
  return {
    limit: boundedLimit,
    get size() {
      return entries.size;
    },
    get(key) {
      const value = entries.get(key);
      if (!value) return undefined;
      entries.delete(key);
      entries.set(key, value);
      return value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, value);
      while (entries.size > boundedLimit) {
        const oldest = entries.keys().next().value as string | undefined;
        if (oldest === undefined) break;
        entries.delete(oldest);
      }
    },
    invalidate(key) {
      return entries.delete(key);
    },
    clear() {
      entries.clear();
    },
  };
}

export function invalidateAvatarLook(cache: AvatarSpriteCache, look: AvatarLook): boolean {
  return cache.invalidate(avatarLookKey(look));
}
