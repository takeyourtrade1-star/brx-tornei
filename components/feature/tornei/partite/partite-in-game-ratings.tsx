import type { MatchFeedbackSummary } from '@/lib/data/match-feedback';
import { MATCH_BADGE_BY_ID } from '@/lib/data/match-badge-catalog';
import type { MatchBadgeId } from '@/lib/validations/match-feedback';
import { cn } from '@/lib/utils';
import { BADGE_ICONS, BADGE_TONES } from '@/components/feature/tornei/match/honor-badge-icons';
import { ConnectionBarsIcon } from '@/components/feature/tornei/match/match-feedback-icons';

/**
 * Sezione "Valutazioni In-Game" (pagina /partite): i titoli ricevuti dagli
 * avversari, le segnalazioni (visibili solo a te) e la distribuzione dei
 * rapporti di connessione che hai inviato.
 */
export function PartiteInGameRatings({ feedback }: { feedback: MatchFeedbackSummary | null }) {
  if (!feedback) return null;

  const positive = feedback.badges.filter((entry) => MATCH_BADGE_BY_ID.get(entry.badge)?.kind === 'positive');
  const negative = feedback.badges.filter((entry) => MATCH_BADGE_BY_ID.get(entry.badge)?.kind === 'negative');
  const reportCount =
    feedback.connectionReports.smooth +
    feedback.connectionReports.some_issues +
    feedback.connectionReports.poor;
  const hasData = positive.length > 0 || negative.length > 0 || reportCount > 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-header-bg/95 shadow-xl shadow-black/50 backdrop-blur-md">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
          Valutazioni In-Game
        </h2>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white/60">
          {positive.length + negative.length + reportCount}
        </span>
      </div>

      {!hasData ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-bold text-white/70">Nessuna valutazione ancora</p>
          <p className="mt-1 text-xs font-semibold text-white/45">
            Al termine delle prossime battaglie, titoli e segnalazioni compariranno qui.
          </p>
        </div>
      ) : (
        <div className="space-y-5 p-4 sm:p-5">
          {positive.length > 0 && (
            <div>
              <p className="mb-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-marquee/80">
                Titoli ricevuti
              </p>
              <ul className="flex flex-wrap gap-2">
                {positive.map((entry) => (
                  <RatingMedal key={entry.badge} badge={entry.badge} count={entry.count} />
                ))}
              </ul>
            </div>
          )}

          {negative.length > 0 && (
            <div>
              <p className="mb-2.5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-red-300/70">
                Segnalazioni ricevute
                <span className="rounded-full border border-red-400/20 bg-red-400/10 px-1.5 py-px text-[8px] font-bold tracking-[0.12em] text-red-300/60">
                  solo per te
                </span>
              </p>
              <ul className="flex flex-wrap gap-2">
                {negative.map((entry) => (
                  <RatingMedal key={entry.badge} badge={entry.badge} count={entry.count} dim />
                ))}
              </ul>
            </div>
          )}

          {reportCount > 0 && (
            <div>
              <p className="mb-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                Connessioni da te segnalate
              </p>
              <ul className="flex flex-wrap gap-2">
                <ConnectionMedal level="smooth" count={feedback.connectionReports.smooth} label="Fluide" />
                <ConnectionMedal level="some_issues" count={feedback.connectionReports.some_issues} label="Con strappi" />
                <ConnectionMedal level="poor" count={feedback.connectionReports.poor} label="Con lag" />
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function RatingMedal({ badge, count, dim }: { badge: MatchBadgeId; count: number; dim?: boolean }) {
  const def = MATCH_BADGE_BY_ID.get(badge);
  if (!def) return null;
  const Icon = BADGE_ICONS[badge];
  const tone = BADGE_TONES[badge];
  return (
    <li
      title={def.description}
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors hover:bg-white/[0.05]',
        tone.medal,
      )}
    >
      <Icon className={cn('h-5 w-5', dim ? 'text-white/45' : tone.icon)} />
      <span className="text-[11px] font-bold text-white/85">{def.label}</span>
      <span
        className={cn(
          'rounded-full bg-white/10 px-1.5 py-px text-[10px] font-black tabular-nums',
          dim ? 'text-white/40' : 'text-white/70',
        )}
      >
        ×{count}
      </span>
    </li>
  );
}

function ConnectionMedal({
  level,
  count,
  label,
}: {
  level: 'smooth' | 'some_issues' | 'poor';
  count: number;
  label: string;
}) {
  if (count <= 0) return null;
  const iconTone =
    level === 'smooth' ? 'text-emerald-400' : level === 'some_issues' ? 'text-amber-300' : 'text-rose-400';
  return (
    <li className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <ConnectionBarsIcon level={level} className={cn('h-5 w-5', iconTone)} />
      <span className="text-[11px] font-bold text-white/85">{label}</span>
      <span className="rounded-full bg-white/10 px-1.5 py-px text-[10px] font-black tabular-nums text-white/70">
        {count}
      </span>
    </li>
  );
}
