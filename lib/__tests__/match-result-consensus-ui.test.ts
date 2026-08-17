import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('match result consensus UI contract', () => {
  it('keeps the table active for a pending declaration or local peer loss', () => {
    const view = readFileSync(
      new URL('../../components/feature/tornei/match/match-live-view.tsx', import.meta.url),
      'utf8',
    );
    const content = readFileSync(
      new URL('../../components/feature/tornei/match/match-live-content.tsx', import.meta.url),
      'utf8',
    );
    const notices = readFileSync(
      new URL('../../components/feature/tornei/match/match-live-notices.tsx', import.meta.url),
      'utf8',
    );
    const resultPending = readFileSync(
      new URL('../../components/feature/tornei/match/match-result-pending.tsx', import.meta.url),
      'utf8',
    );

    expect(view).toContain("const resultClaimPending = tournament.resultStatus === 'claimed'");
    expect(view).not.toContain(
      "(!resultClaimPending && isPlayer && (peerState === 'peer-left' || peerState === 'session-ended'))",
    );
    expect(content).toContain('open={fullscreenOpen && !matchEnded}');
    expect(content).toContain('!reconnectGraceActive');
    expect(view).toContain("chat.opponentPresence === 'offline'");
    expect(notices).toContain('il risultato è bloccato');
    expect(notices).toContain('La partita resta aperta');
    expect(resultPending).toContain('Risposta sospesa durante la riconnessione');
    expect(notices).not.toContain('persa a tavolino');
    expect(notices).not.toContain('vincerai la partita a tavolino');
  });
});

describe('authoritative WebSocket presence handshake', () => {
  it('waits for an authenticated application acknowledgement', () => {
    const chat = readFileSync(
      new URL('../../hooks/use-match-chat.ts', import.meta.url),
      'utf8',
    );
    expect(chat).toContain("data.event === 'authenticated'");
    expect(chat).toContain('AUTH_ACK_TIMEOUT_MS');
    expect(chat).toContain('MAX_RECONNECT_ATTEMPTS = 14');
  });
});
