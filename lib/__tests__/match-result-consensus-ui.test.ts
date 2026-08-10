import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('match result consensus UI contract', () => {
  it('keeps the table active for a pending declaration or local peer loss', () => {
    const view = readFileSync(
      new URL('../../components/feature/tornei/match/match-live-view.tsx', import.meta.url),
      'utf8',
    );
    const notices = readFileSync(
      new URL('../../components/feature/tornei/match/match-live-notices.tsx', import.meta.url),
      'utf8',
    );

    expect(view).toContain("const resultClaimPending = tournament.resultStatus === 'claimed'");
    expect(view).not.toContain(
      "(!resultClaimPending && isPlayer && (peerState === 'peer-left' || peerState === 'session-ended'))",
    );
    expect(view).toContain('open={fullscreenOpen && !matchEnded}');
    expect(view).toContain('!reconnectGraceActive');
    expect(view).toContain("chat.opponentPresence === 'offline'");
    expect(notices).toContain('Nessun risultato viene assegnato automaticamente');
    expect(notices).toContain('Risposta sospesa durante la riconnessione');
    expect(notices).not.toContain('persa a tavolino');
    expect(notices).not.toContain('vincerai la partita a tavolino');
  });
});
