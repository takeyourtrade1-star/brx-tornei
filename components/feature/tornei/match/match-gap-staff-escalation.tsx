'use client';

import { Eye, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { GapPeerRecording } from '@/lib/validations/gap-recording';

/**
 * Escalation allo staff delle registrazioni gap contestate: soltanto col
 * consenso di entrambi i giocatori i video della partita vengono inviati
 * allo staff per la verifica manuale (sezione Tornei del back office).
 */
export function MatchGapStaffEscalation({
  own,
  opponent,
  busy,
  onConsent,
}: {
  own: GapPeerRecording | undefined;
  opponent: GapPeerRecording | undefined;
  busy: boolean;
  onConsent: (recordingId: string) => void;
}) {
  if (!own) return null;
  const anyRejected =
    own.status === 'rejected' || opponent?.status === 'rejected';

  if (own.staff_escalation_complete) {
    return (
      <section className="mb-3.5 rounded-2xl border border-violet-400/30 bg-header-bg/95 p-4 text-sm text-white shadow-xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-400/30 bg-violet-400/15 text-violet-300">
            <Eye className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-sans text-sm font-black text-white">
              Verifica dello staff in corso
            </p>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-300">
              Entrambi i giocatori hanno acconsentito: i frammenti sono stati
              inviati allo staff per la verifica manuale.
            </p>
            {own.staff_resolution && (
              <p className="mt-2 flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-xs font-bold text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                Verifica conclusa: {own.staff_resolution.decision === 'upheld'
                  ? 'contestazione confermata.'
                  : 'contestazione rigettata.'}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (!anyRejected) return null;

  const opponentGranted = opponent?.staff_consent_status === 'granted';
  const opponentPending = opponent?.status === 'rejected' && !opponentGranted;

  return (
    <section className="mb-3.5 rounded-2xl border border-amber-400/30 bg-header-bg/95 p-4 text-sm text-white shadow-xl backdrop-blur-md">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-400/30 bg-amber-400/15 text-amber-300">
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm font-black text-white">
            Verifica manuale dello staff
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-300">
            Un frammento è stato contestato. I video della partita possono essere
            inviati allo staff per una verifica manuale solo con il consenso di
            entrambi i giocatori.
          </p>

          {own.staff_consent_status === 'granted' ? (
            <p className="mt-2.5 flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-2.5 text-xs font-bold text-emerald-200">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Hai acconsentito all&rsquo;invio dei tuoi frammenti.
              {opponentPending
                ? ' In attesa del consenso dell’avversario.'
                : opponentGranted
                  ? ' In attesa della presa in carico.'
                  : ' In attesa del consenso dell’avversario.'}
            </p>
          ) : (
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => onConsent(own.recording_id)}
                className="rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:brightness-110 disabled:opacity-45"
              >
                {busy ? 'Invio…' : 'Acconsenti all’invio allo staff'}
              </button>
              <span className="text-[10px] font-semibold leading-snug text-slate-400">
                Anche {opponentPending ? 'l’avversario' : 'il tuo avversario'} deve
                acconsentire per l&rsquo;invio.
              </span>
            </div>
          )}

          {opponent && (
            <p
              className={`mt-2 text-[10px] font-black uppercase tracking-[0.14em] ${
                opponentGranted ? 'text-emerald-300/80' : 'text-slate-400'
              }`}
            >
              Avversario: {opponentGranted ? 'ha acconsentito' : 'in attesa'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
