import { describe, expect, it } from 'vitest';
import { synchronizedRemainingMs } from '@/lib/synchronized-deadline';

describe('deadline sincronizzate dal Tournament Service', () => {
  it('deriva la durata senza dipendere dall’orologio del PC', () => {
    expect(
      synchronizedRemainingMs(
        '2026-08-17T10:00:30.000Z',
        '2026-08-17T10:00:07.250Z',
      ),
    ).toBe(22_750);
  });

  it('non restituisce durate negative e mantiene il fallback per payload legacy', () => {
    expect(
      synchronizedRemainingMs(
        '2026-08-17T10:00:00.000Z',
        '2026-08-17T10:00:01.000Z',
      ),
    ).toBe(0);
    expect(synchronizedRemainingMs(undefined, undefined)).toBeNull();
    expect(synchronizedRemainingMs('invalid', 'also-invalid')).toBeNull();
  });

  it('non regala un nuovo countdown al secondo PC che riceve lo stato più tardi', () => {
    const deadline = '2026-08-17T10:00:30.000Z';
    const firstPc = synchronizedRemainingMs(deadline, '2026-08-17T10:00:00.000Z');
    const latePc = synchronizedRemainingMs(deadline, '2026-08-17T10:00:12.500Z');

    expect(firstPc).toBe(30_000);
    expect(latePc).toBe(17_500);
  });
});
