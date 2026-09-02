'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { submitMatchReportAction } from '@/actions/reports';
import { matchReportSchema } from '@/lib/validations/match-report';
import { OffensiveBadgeIcon } from './honor-badge-icons-negative';
import { ReportStampIcon } from './match-feedback-icons';

const MAX_MESSAGE_LENGTH = 500;
const MIN_MESSAGE_LENGTH = 5;

/**
 * Modal "Segnala" durante una partita: testo libero con contatore,
 * inviato alla moderazione. Una segnalazione per giocatore per match.
 */
export function MatchReportModal({
  matchId,
  opponentName,
  onClose,
}: {
  matchId: string | null;
  opponentName: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [status, setStatus] = useState<'ok' | 'already_submitted' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canSubmit =
    message.trim().length >= MIN_MESSAGE_LENGTH &&
    message.trim().length <= MAX_MESSAGE_LENGTH &&
    phase !== 'submitting' &&
    phase !== 'done';

  const submit = async () => {
    if (!matchId) return;
    const parsed = matchReportSchema.safeParse({ message });
    if (!parsed.success) return;
    setPhase('submitting');
    setError(null);
    const result = await submitMatchReportAction(matchId, parsed.data.message);
    if (result.error) {
      setPhase('error');
      setError(result.error);
      return;
    }
    setStatus(result.status ?? 'ok');
    setPhase('done');
  };

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Segnala ${opponentName}`}
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-rose-400/25 bg-gradient-to-b from-[#151d38] via-[#0c1226] to-[#070a16] px-6 py-7 text-white shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-rose-400/30 bg-rose-400/10 text-rose-300">
            <OffensiveBadgeIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-black uppercase tracking-wide">
              Segnala {opponentName}
            </h2>
            <p className="mt-0.5 text-xs font-semibold leading-relaxed text-white/55">
              La segnalazione è privata: la esamina solo lo staff.
            </p>
          </div>
        </div>

        {phase === 'done' ? (
          <div className="mt-6 flex flex-col items-center gap-2.5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-6 text-center">
            <ReportStampIcon className="text-emerald-300" />
            <p className="font-display text-sm font-black text-white">Segnalazione inviata!</p>
            <p className="max-w-xs text-xs font-semibold leading-relaxed text-white/55">
              {status === 'already_submitted'
                ? 'Avevi già inviato una segnalazione per questa partita.'
                : 'Grazie: lo staff esaminerà quanto accaduto.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-1 inline-flex h-9 items-center rounded-xl border border-white/15 bg-white/10 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/15 active:scale-95"
            >
              Chiudi
            </button>
          </div>
        ) : (
          <>
            <label className="mt-5 block">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
                Cosa è successo?
              </span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                rows={4}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Racconta cosa è successo: linguaggio, comportamenti, problemi tecnici…"
                className="mt-2 w-full resize-none rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-rose-400/50 focus:bg-white/[0.08]"
              />
              <span className="mt-1 block text-right text-[10px] font-bold tabular-nums text-white/35">
                {message.length} / {MAX_MESSAGE_LENGTH}
              </span>
            </label>

            {error && (
              <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/15 px-3.5 py-2.5 text-xs font-semibold text-red-200">
                {error}
              </p>
            )}

            <p className="mt-4 text-[10px] font-semibold leading-relaxed text-white/40">
              Le segnalazioni false possono comportare sanzioni sul tuo account.
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-white/70"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void submit()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-5 text-[11px] font-black uppercase tracking-wider text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-40"
              >
                {phase === 'submitting' ? 'Invio…' : 'Invia segnalazione'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
