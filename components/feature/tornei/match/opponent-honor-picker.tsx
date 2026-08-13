'use client';

import { cn } from '@/lib/utils';
import { usePostMatchFeedback } from '@/hooks/use-post-match-feedback';
import { MATCH_BADGES } from '@/lib/data/match-badge-catalog';
import type { MatchBadgeDef } from '@/lib/data/match-badge-catalog';
import { BADGE_ICONS, BADGE_TONES } from './honor-badge-icons';
import { WinEmblem } from '../partite/partite-outcome-icons';
import { ReportStampIcon } from './match-feedback-icons';

/**
 * Consegna di un titolo all'avversario a partita conclusa, stile honor
 * di League of Legends: dieci gemme positive e cinque segnalazioni,
 * un'unica scelta, mai obbligatoria.
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
    <section className="pt-row-in relative mx-auto mt-5 w-full max-w-xl rounded-3xl border border-marquee/30 bg-header-bg/95 p-5 text-white shadow-2xl shadow-black/50 backdrop-blur-md sm:p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-marquee/50 to-transparent"
      />
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-marquee/35 bg-marquee/10 text-marquee">
          <WinEmblem className="h-[22px] w-[22px]" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-black text-white">Titolo del duellante</h3>
          <p className="mt-0.5 text-xs font-semibold leading-relaxed text-white/55">
            Come valuti <span className="font-black text-white/85">{opponentName}</span> in
            questa battaglia? Un solo titolo, mai obbligatorio.
          </p>
        </div>
      </div>

      {feedback.phase === 'done' ? (
        <div className="mt-5 flex flex-col items-center gap-2.5 rounded-2xl border border-marquee/30 bg-marquee/10 px-4 py-6 text-center">
          <ReportStampIcon className="text-marquee" />
          <p className="font-display text-sm font-black text-white">Titolo consegnato!</p>
          <p className="max-w-xs text-xs font-semibold leading-relaxed text-white/55">
            {feedback.status === 'already_submitted'
              ? 'Avevi già consegnato un titolo per questa battaglia.'
              : `Il titolo è stato registrato per ${opponentName}.`}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {positives.map((badge, index) => (
              <BadgeChip
                key={badge.id}
                badge={badge}
                index={index}
                selected={feedback.badge === badge.id}
                onSelect={() => feedback.setBadge(badge.id)}
              />
            ))}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-red-400/30" />
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-300/80">
                Segnala
              </p>
              <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-red-400/30" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {negatives.map((badge, index) => (
                <BadgeChip
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
            <p className="rounded-xl border border-red-500/30 bg-red-500/15 px-3.5 py-2.5 text-xs font-semibold text-red-200">
              {feedback.error}{' '}
              <button type="button" onClick={feedback.retry} className="font-black underline">
                Riprova
              </button>
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={feedback.skip}
              className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-white/70"
            >
              Salta
            </button>
            <button
              type="button"
              disabled={!feedback.canSubmit || feedback.phase === 'submitting'}
              onClick={() => void feedback.submit()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-5 text-[11px] font-black uppercase tracking-wider text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-40"
            >
              {feedback.phase === 'submitting' ? 'Consegna…' : 'Consegna il titolo'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function BadgeChip({
  badge,
  index,
  selected,
  onSelect,
}: {
  badge: MatchBadgeDef;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = BADGE_ICONS[badge.id];
  const tone = BADGE_TONES[badge.id];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={badge.description}
      style={{ animationDelay: `${Math.min(index, 14) * 35}ms` }}
      className={cn(
        'pt-row-in group flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all duration-150 active:scale-95',
        selected
          ? cn(tone.ring, 'scale-[1.03] shadow-lg shadow-black/50')
          : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]',
      )}
    >
      <Icon
        className={cn(
          'h-6 w-6 transition-colors duration-150',
          selected ? tone.icon : 'text-white/50 group-hover:text-white/75',
        )}
      />
      <span
        className={cn(
          'text-center text-[9px] font-bold leading-tight transition-colors duration-150',
          selected ? 'text-white' : 'text-white/50 group-hover:text-white/75',
        )}
      >
        {badge.label}
      </span>
    </button>
  );
}
