import { describe, expect, it } from 'vitest';
import { parseLobbyFocus } from '@/lib/validations/selection';

describe('parseLobbyFocus', () => {
  it('accetta i rientri validi dalla Sala Arcade', () => {
    expect(parseLobbyFocus({ focusTable: 'table-123' })).toEqual({ tableId: 'table-123' });
    expect(parseLobbyFocus({ focusCreate: '1' })).toEqual({ create: '1' });
  });

  it('ignora valori non validi senza far fallire la pagina Tornei', () => {
    expect(parseLobbyFocus({ focusTable: ['table-123'], focusCreate: 'true' })).toEqual({});
    expect(parseLobbyFocus({ focusTable: ' ' })).toEqual({});
    expect(parseLobbyFocus({ focusTable: 'x'.repeat(129) })).toEqual({});
  });
});
