'use client';

import { usePostMatchFeedback } from '@/hooks/use-post-match-feedback';
import { MATCH_BADGES } from '@/lib/data/match-badge-catalog';
import { WinEmblem } from '../partite/partite-outcome-icons';
import { ReportStampIcon } from './match-feedback-icons';
import { HonorBadgeCard } from './honor-badge-card';

/**
 * Consegna di un titolo all'avversario a partita conclusa.
 * Card ricche in stile gaming con icone animate a tutto schermo e spazio arioso.
 */
export function OpponentHonorPicker({
  matchId,
  opponentName,
}: {
  matchId: string | null;
  opponentName: string;
}) {
  const feedback = usePostMatchFeedback('honor', matchId);
  if (feedback.skipped) return null;

  const positives = MATCH_BADGES.filter((badge) => badge.kind === 'positive');
  const negatives = MATCH_BADGES.filter((badge) => badge.kind === 'negative');

  return (
    <section className="pt-row-in relative mx-auto mt-6 w-full max-w-3xl sm:max-w-4xl rounded-3xl border border-marquee/30 bg-header-bg/95 p-5 text-white shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-7">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-marquee/60 to-transparent"
      />
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-marquee/35 bg-marquee/10 text-marquee shadow-[0_0_20px_rgba(243,199,106,0.2)]">
          <WinEmblem className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-black uppercase tracking-tight text-white sm:text-xl">
            Titolo del duellante
          </h3>
          <p className="mt-1 text-xs font-medium leading-relaxed text-white/65 sm:text-sm">
            Come valuti <span className="font-black text-white">{opponentName}</span> in questa
            battaglia? Scegli un titolo da assegnare (facoltativo).
          </p>
        </div>
      </div>

      {feedback.phase === 'done' ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-marquee/30 bg-marquee/10 px-6 py-8 text-center">
          <ReportStampIcon className="h-8 w-8 text-marquee" />
          <p className="font-display text-base font-black text-white">Titolo consegnato!</p>
          <p className="max-w-md text-xs font-semibold leading-relaxed text-white/60 sm:text-sm">
            {feedback.status === 'already_submitted'
              ? 'Avevi già consegnato un titolo per questa battaglia.'
              : `Il titolo è stato registrato per ${opponentName}.`}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-marquee/90">
              Titoli d&rsquo;onore
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 sm:gap-3">
              {positives.map((badge, index) => (
                <HonorBadgeCard
                  key={badge.id}
                  badge={badge}
                  index={index}
                  selected={feedback.badge === badge.id}
                  onSelect={() => feedback.setBadge(badge.id)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-red-400/30" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-300/85">
                Valuta negativamente
              </p>
              <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-red-400/30" />
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 sm:gap-3">
              {negatives.map((badge, index) => (
                <HonorBadgeCard
                  key={badge.id}
                  badge={badge}
                  index={positives.length + index}
                  selected={feedback.badge === badge.id}
                  onSelect={() => feedback.setBadge(badge.id)}
                />
              ))}
            </div>
          </div>

          {feedback.error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-xs font-semibold text-red-200">
              {feedback.error}{' '}
              <button type="button" onClick={feedback.retry} className="font-black underline">
                Riprova
              </button>
            </p>
          )}

          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={feedback.skip}
              className="text-xs font-black uppercase tracking-[0.16em] text-white/40 transition hover:text-white/75"
            >
              Salta valutazione
            </button>
            <button
              type="button"
              disabled={!feedback.canSubmit || feedback.phase === 'submitting'}
              onClick={() => void feedback.submit()}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-6 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 transition hover:brightness-110 active:scale-95 disabled:opacity-40 sm:text-sm"
            >
              {feedback.phase === 'submitting' ? 'Consegna…' : 'Consegna il titolo'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
