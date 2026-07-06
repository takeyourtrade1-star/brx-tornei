import type { ScryfallLegalityStatus } from '@/types/card-legality';

export function legalityLabel(status: ScryfallLegalityStatus): string {
  switch (status) {
    case 'legal':
      return 'Legale';
    case 'restricted':
      return 'Ristretta';
    case 'banned':
      return 'Bandita';
    case 'not_legal':
      return 'Non legale';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function isLegalInFormatStatus(status: ScryfallLegalityStatus): boolean {
  return status === 'legal' || status === 'restricted';
}
