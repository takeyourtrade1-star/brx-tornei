'use client';

import { useCallback, useState } from 'react';
import {
  submitEndFeedbackAction,
  submitOpponentBadgeAction,
} from '@/actions/feedback';
import type {
  MatchBadgeId,
  MatchConnectionLevel,
} from '@/lib/validations/match-feedback';

type FeedbackPhase = 'idle' | 'submitting' | 'done' | 'error';

/**
 * Stato del questionario post-partita: risposte, invio e salto.
 * L'idempotenza (una submission per giocatore per match) è garantita
 * dal backend; `already_submitted` porta comunque allo stato "done".
 */
export function usePostMatchFeedback(kind: 'abandonment' | 'honor', matchId: string | null) {
  const [phase, setPhase] = useState<FeedbackPhase>('idle');
  const [status, setStatus] = useState<'ok' | 'already_submitted' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [disconnectConfirmed, setDisconnectConfirmed] = useState<boolean | null>(null);
  const [connection, setConnection] = useState<MatchConnectionLevel | null>(null);
  const [badge, setBadge] = useState<MatchBadgeId | null>(null);

  const canSubmit =
    kind === 'abandonment'
      ? disconnectConfirmed !== null && connection !== null
      : badge !== null;

  const submit = useCallback(async () => {
    if (!matchId || phase === 'submitting' || phase === 'done') return;
    if (kind === 'abandonment') {
      if (disconnectConfirmed === null || connection === null) return;
    } else if (badge === null) {
      return;
    }
    setPhase('submitting');
    setError(null);
    const result =
      kind === 'abandonment'
        ? await submitEndFeedbackAction(matchId, {
            disconnectConfirmed: disconnectConfirmed as boolean,
            connection: connection as MatchConnectionLevel,
          })
        : await submitOpponentBadgeAction(matchId, badge);
    if (result.error) {
      setPhase('error');
      setError(result.error);
      return;
    }
    setStatus(result.status ?? 'ok');
    setPhase('done');
  }, [badge, connection, disconnectConfirmed, kind, matchId, phase]);

  const skip = useCallback(() => setSkipped(true), []);

  const retry = useCallback(() => {
    setPhase('idle');
    setError(null);
  }, []);

  return {
    phase,
    status,
    error,
    skipped,
    disconnectConfirmed,
    setDisconnectConfirmed,
    connection,
    setConnection,
    badge,
    setBadge,
    canSubmit,
    submit,
    skip,
    retry,
  };
}
