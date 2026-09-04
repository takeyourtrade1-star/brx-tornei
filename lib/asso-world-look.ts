import {
  ASSO_WORLD_HAIRS,
  ASSO_WORLD_OUTFITS,
  DEFAULT_ASSO_WORLD_LOOK,
  type AssoWorldHair,
  type AssoWorldLook,
  type AssoWorldOutfit,
} from '@/types/asso-world';

const ASSO_WORLD_LOOK_PATTERN = /^look:([^:]+):([^:]+)$/u;

function isValueIn<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

export function isAssoWorldHair(value: unknown): value is AssoWorldHair {
  return isValueIn(value, ASSO_WORLD_HAIRS);
}

export function isAssoWorldOutfit(value: unknown): value is AssoWorldOutfit {
  return isValueIn(value, ASSO_WORLD_OUTFITS);
}

export function isAssoWorldLook(value: unknown): value is AssoWorldLook {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate);
  return keys.length === 2
    && keys.includes('hair')
    && keys.includes('outfit')
    && isAssoWorldHair(candidate.hair)
    && isAssoWorldOutfit(candidate.outfit);
}

/**
 * Legge soltanto la forma canonica `look:<hair>:<outfit>`.
 * Restituisce null per valori esterni non validi, senza correggerli in modo
 * implicito: il confine API può così distinguere una risposta corrotta.
 */
export function tryParseAssoWorldLook(value: unknown): AssoWorldLook | null {
  if (typeof value !== 'string') return null;
  const match = ASSO_WORLD_LOOK_PATTERN.exec(value);
  if (!match || !isAssoWorldHair(match[1]) || !isAssoWorldOutfit(match[2])) return null;
  return { hair: match[1], outfit: match[2] };
}

/** Parser tollerante per i consumer UI: il default è l'unico fallback ammesso. */
export function parseAssoWorldLook(value: unknown): AssoWorldLook {
  return isAssoWorldLook(value)
    ? { hair: value.hair, outfit: value.outfit }
    : tryParseAssoWorldLook(value) ?? DEFAULT_ASSO_WORLD_LOOK;
}

/**
 * Serializza solo look già appartenenti al contratto canonico.
 * Un input manipolato a runtime genera errore invece di finire nel payload.
 */
export function serializeAssoWorldLook(value: unknown): string {
  if (!isAssoWorldLook(value)) {
    throw new TypeError('Personalizzazione Asso World non valida.');
  }
  return `look:${value.hair}:${value.outfit}`;
}

export { DEFAULT_ASSO_WORLD_LOOK } from '@/types/asso-world';
export type { AssoWorldHair, AssoWorldLook, AssoWorldOutfit } from '@/types/asso-world';
