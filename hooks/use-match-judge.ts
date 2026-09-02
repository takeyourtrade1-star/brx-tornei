'use client';

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { askMatchJudgeAction } from '@/actions/match-judge';
import type { MatchJudgeState, MatchJudgeStatus, MatchJudgeTurn } from '@/types/tournament';

const JUDGE_REFRESH_WINDOW_MS = 11 * 60 * 1_000;

export interface MatchJudgeController {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  pending: boolean;
  error: string | null;
  acceptedTurn: MatchJudgeTurn | null;
  syncJudge: (judge?: MatchJudgeState) => void;
  submit: (question: string) => Promise<boolean>;
}

/** Stato locale minimo: nessuna coda ottimistica, il transcript resta autorevole. */
export function useMatchJudge(
  matchId?: string,
  judgeStatus?: MatchJudgeStatus,
): MatchJudgeController {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTurn, setAcceptedTurn] = useState<MatchJudgeTurn | null>(null);

  useEffect(() => {
    setAcceptedTurn(null);
    setError(null);
  }, [matchId]);

  // Dopo il 202 il backend completa il turno asincrono. Questo refresh
  // limitato copre anche la chiusura del match, quando il poll live si ferma;
  // realtime e router.refresh restano comunque la sorgente dello snapshot.
  useEffect(() => {
    if (judgeStatus !== 'processing' && acceptedTurn?.status !== 'processing') return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt >= JUDGE_REFRESH_WINDOW_MS) {
        window.clearInterval(timer);
        return;
      }
      if (document.visibilityState === 'visible') router.refresh();
    }, 4_000);
    return () => window.clearInterval(timer);
  }, [acceptedTurn?.status, judgeStatus, router]);

  const submit = useCallback(async (question: string): Promise<boolean> => {
    const cleanQuestion = question.trim();
    if (pending || !matchId || !cleanQuestion) return false;
    setPending(true);
    setError(null);
    setAcceptedTurn(null);
    try {
      const clientRequestId = globalThis.crypto?.randomUUID?.();
      if (!clientRequestId) {
        setError('Impossibile creare la richiesta. Riprova.');
        return false;
      }
      const result = await askMatchJudgeAction(matchId, {
        client_request_id: clientRequestId,
        question: cleanQuestion,
      });
      router.refresh();
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setDraft('');
      setAcceptedTurn(result.turn);
      return true;
    } catch {
      setError('Impossibile consultare il Judge. Riprova tra poco.');
      return false;
    } finally {
      setPending(false);
    }
  }, [matchId, pending, router]);

  const syncJudge = useCallback((judge?: MatchJudgeState) => {
    if (acceptedTurn && judge?.turns.some((turn) => turn.id === acceptedTurn.id)) {
      setAcceptedTurn(null);
    }
  }, [acceptedTurn]);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    draft,
    setDraft,
    pending,
    error,
    acceptedTurn,
    syncJudge,
    submit,
  };
}
