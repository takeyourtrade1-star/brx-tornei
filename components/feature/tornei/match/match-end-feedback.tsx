'use client';

import { cn } from '@/lib/utils';
import { usePostMatchFeedback } from '@/hooks/use-post-match-feedback';
import { AbandonedEmblem, DisputedEmblem } from '../partite/partite-outcome-icons';
import { ConnectionBarsIcon, ReportStampIcon } from './match-feedback-icons';
import { OpponentHonorPicker } from './opponent-honor-picker';

interface MatchEndFeedbackProps {
  matchId: string | null;
  endReason?: string;
  didIWin?: boolean;
  opponentName: string;
}

/**
 * Debriefing post-partita, in stile gaming e volutamente leggero:
 * - fine per abbandono/disconnessione → rapporto di battaglia (due
 *   domande rapide: esito + connessione);
 * - fine regolare → titolo (badge) da consegnare all'avversario.
 * Il rapporto compare solo a chi è rimasto al tavolo.
 */
export function MatchEndFeedback({ matchId, endReason, didIWin, opponentName }: MatchEndFeedbackProps) {
  if (endReason === 'leave' && didIWin === true) {
    return <AbandonmentDebrief matchId={matchId} />;
  }
  if (endReason === 'reported') {
    return <OpponentHonorPicker matchId={matchId} opponentName={opponentName} />;
  }
  return null;
}

/** Due risposte rapide per capire come si è chiusa una battaglia interrotta. */
function AbandonmentDebrief({ matchId }: { matchId: string | null }) {
  const feedback = usePostMatchFeedback('abandonment', matchId);

  if (feedback.skipped) return null;

  return (
    <section className="pt-row-in relative mx-auto mt-5 w-full max-w-xl rounded-3xl border border-amber-400/30 bg-header-bg/95 p-5 text-white shadow-2xl shadow-black/50 backdrop-blur-md sm:p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
      />
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
          <AbandonedEmblem className="h-[22px] w-[22px]" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-black text-white">Rapporto di battaglia</h3>
          <p className="mt-0.5 text-xs font-semibold leading-relaxed text-white/55">
            Ci aiuti a capire com&rsquo;è andata? Due risposte rapide, niente di più.
          </p>
        </div>
      </div>

      {feedback.phase === 'done' ? (
        <div className="mt-5 flex flex-col items-center gap-2.5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-6 text-center">
          <ReportStampIcon className="text-emerald-300" />
          <p className="font-display text-sm font-black text-white">Rapporto inviato!</p>
          <p className="max-w-xs text-xs font-semibold leading-relaxed text-white/55">
            {feedback.status === 'already_submitted'
              ? 'Avevi già registrato il rapporto per questa battaglia.'
              : 'Grazie: il tuo feedback aiuta a tenere pulita la fucina.'}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
              Come si è chiusa la battaglia?
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <DebriefChip
                selected={feedback.disconnectConfirmed === true}
                icon={<AbandonedEmblem className="h-5 w-5" />}
                label="Confermo l'abbandono"
                onClick={() => feedback.setDisconnectConfirmed(true)}
              />
              <DebriefChip
                selected={feedback.disconnectConfirmed === false}
                icon={<DisputedEmblem className="h-5 w-5" />}
                label="Non è andata così"
                onClick={() => feedback.setDisconnectConfirmed(false)}
              />
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
              Com&rsquo;era la connessione durante la partita?
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <DebriefChip
                selected={feedback.connection === 'smooth'}
                icon={<ConnectionBarsIcon level="smooth" className="text-emerald-400" />}
                label="Fluida"
                onClick={() => feedback.setConnection('smooth')}
              />
              <DebriefChip
                selected={feedback.connection === 'some_issues'}
                icon={<ConnectionBarsIcon level="some_issues" className="text-amber-300" />}
                label="Qualche strappo"
                onClick={() => feedback.setConnection('some_issues')}
              />
              <DebriefChip
                selected={feedback.connection === 'poor'}
                icon={<ConnectionBarsIcon level="poor" className="text-rose-400" />}
                label="Tanti lag"
                onClick={() => feedback.setConnection('poor')}
              />
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
              {feedback.phase === 'submitting' ? 'Invio…' : 'Invia rapporto'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function DebriefChip({
  selected,
  icon,
  label,
  onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex items-center justify-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all duration-150 active:scale-95',
        selected
          ? 'border-marquee/70 bg-marquee/15 text-white shadow-[0_0_18px_rgba(243,199,106,0.25)]'
          : 'border-white/15 bg-white/[0.05] text-white/65 hover:border-white/30 hover:bg-white/10 hover:text-white',
      )}
    >
      <span className={cn('shrink-0 transition-colors', selected ? 'text-marquee' : 'text-white/55')}>
        {icon}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
