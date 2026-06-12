import type { Tournament } from '@/types/tournament';
import { STATUS_ACCENT, TOURNAMENT_FORM_LABEL } from '@/lib/tournaments/display';
import { cn } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { ParticipateButton } from './participate-button';
import { RegistrationMeter } from './registration-meter';
import { ParticipantChip } from './participant-chip';
import { Eye, Lock } from 'lucide-react';

/** Card torneo per layout mobile — gerarchia visiva e CTA in evidenza. */
export function TournamentMobileCard({
  tournament: t,
  isLoggedIn,
}: {
  tournament: Tournament;
  isLoggedIn: boolean;
}) {
  const accent = STATUS_ACCENT[t.status];
  const isOpen = t.status === 'in_registrazione';
  const spotsLeft = t.maxPlayers - t.participants.length;

  return (
    <article
      className={cn(
        'brx-glass overflow-hidden rounded-2xl border border-white/15 border-l-4',
        accent.border,
        accent.glow,
        accent.cardOpacity
      )}
    >
      <div className="space-y-4 p-4 sm:p-5">
        {/* Intestazione: stato + meta */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusBadge status={t.status} />
            {t.isPrivate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300 ring-1 ring-amber-400/30">
                <Lock className="h-3 w-3" aria-hidden />
                Privato
              </span>
            )}
            {t.status === 'iniziata' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-300/90">
                <Eye className="h-3.5 w-3.5" aria-hidden />
                Live
              </span>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-marquee ring-1 ring-marquee/25">
            For Fun
          </span>
        </div>

        {/* Metriche principali */}
        <dl className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/10">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-white/45">Forma</dt>
            <dd className="mt-1 font-display text-2xl font-black tabular-nums text-white">
              {TOURNAMENT_FORM_LABEL[t.bestOf]}
            </dd>
          </div>
          <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/10">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-white/45">Registrati</dt>
            <dd className="mt-1 font-display text-2xl font-black tabular-nums text-white">
              {t.participants.length}
              <span className="text-lg font-bold text-white/45">/{t.maxPlayers}</span>
            </dd>
          </div>
        </dl>

        {isOpen && (
          <div>
            <RegistrationMeter current={t.participants.length} max={t.maxPlayers} />
            <p className="mt-1.5 text-[11px] font-medium text-white/50">
              {spotsLeft > 0
                ? `${spotsLeft} ${spotsLeft === 1 ? 'posto libero' : 'posti liberi'}`
                : 'Torneo al completo'}
            </p>
          </div>
        )}

        {/* Partecipanti */}
        {t.participants.length > 0 && (
          <div className="border-t border-white/10 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">Partecipanti</p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {t.participants.map((p) => (
                <li key={p.id}>
                  <ParticipantChip participant={p} format={t.format} compact />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        {isOpen && (
          <div className="border-t border-white/10 pt-4">
            <ParticipateButton
              tournamentId={t.id}
              isLoggedIn={isLoggedIn}
              isPrivate={!!t.isPrivate}
              variant="prominent"
            />
          </div>
        )}

        {t.status === 'iniziata' && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-red-200">
            <Eye className="h-4 w-4" aria-hidden />
            Guarda partita live
          </div>
        )}
      </div>
    </article>
  );
}
