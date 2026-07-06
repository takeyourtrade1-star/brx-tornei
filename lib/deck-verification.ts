import type { DeckCard } from '@/types/deck';

export interface ScannedCardEntry {
  blueprintId: number;
  cardName: string;
  quantity: number;
}

export interface DeckDiffIssue {
  blueprintId: number;
  cardName: string;
  declared: number;
  scanned: number;
  kind: 'missing' | 'extra' | 'quantity';
}

/** Aggrega scansioni multiple della stessa carta. */
export function mergeScanResults(entries: ScannedCardEntry[]): ScannedCardEntry[] {
  const map = new Map<number, ScannedCardEntry>();
  for (const entry of entries) {
    const existing = map.get(entry.blueprintId);
    if (existing) {
      existing.quantity += entry.quantity;
    } else {
      map.set(entry.blueprintId, { ...entry });
    }
  }
  return [...map.values()];
}

function countDeckCards(cards: DeckCard[]): Map<number, { name: string; qty: number }> {
  const map = new Map<number, { name: string; qty: number }>();
  for (const card of cards) {
    const bp = Number(card.id);
    const prev = map.get(bp);
    map.set(bp, {
      name: card.name,
      qty: (prev?.qty ?? 0) + card.quantity,
    });
  }
  return map;
}

/** Confronta mazzo dichiarato (main+side) vs carte scansionate. */
export function diffDeckVsScanned(
  main: DeckCard[],
  side: DeckCard[],
  scanned: ScannedCardEntry[]
): DeckDiffIssue[] {
  const declared = countDeckCards([...main, ...side]);
  const scannedMap = new Map<number, ScannedCardEntry>();
  for (const s of mergeScanResults(scanned)) {
    scannedMap.set(s.blueprintId, s);
  }

  const issues: DeckDiffIssue[] = [];
  const allIds = new Set([...declared.keys(), ...scannedMap.keys()]);

  for (const bp of allIds) {
    const dec = declared.get(bp);
    const sc = scannedMap.get(bp);
    const declaredQty = dec?.qty ?? 0;
    const scannedQty = sc?.quantity ?? 0;
    const name = dec?.name ?? sc?.cardName ?? `#${bp}`;

    if (declaredQty === 0 && scannedQty > 0) {
      issues.push({ blueprintId: bp, cardName: name, declared: 0, scanned: scannedQty, kind: 'extra' });
    } else if (declaredQty > 0 && scannedQty === 0) {
      issues.push({ blueprintId: bp, cardName: name, declared: declaredQty, scanned: 0, kind: 'missing' });
    } else if (declaredQty !== scannedQty) {
      issues.push({
        blueprintId: bp,
        cardName: name,
        declared: declaredQty,
        scanned: scannedQty,
        kind: 'quantity',
      });
    }
  }

  return issues;
}

export function deckDiffIsClean(issues: DeckDiffIssue[]): boolean {
  return issues.length === 0;
}
