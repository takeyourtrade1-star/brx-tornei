/** Fasce buy-in (stile poker): quota per entrare nel torneo. */
export const BUY_IN_TIERS = [
  { id: 'for_fun', label: 'For Fun' },
  { id: 'micro', label: '€5' },
  { id: 'low', label: '€25' },
  { id: 'mid', label: '€100' },
  { id: 'high', label: '€500+' },
] as const;

export type BuyIn = (typeof BUY_IN_TIERS)[number]['id'];

const BUY_IN_LABEL: Record<BuyIn, string> = Object.fromEntries(
  BUY_IN_TIERS.map((t) => [t.id, t.label]),
) as Record<BuyIn, string>;

export function getBuyInLabel(buyIn: BuyIn): string {
  return BUY_IN_LABEL[buyIn];
}

export function isBuyIn(value: string): value is BuyIn {
  return BUY_IN_TIERS.some((t) => t.id === value);
}
