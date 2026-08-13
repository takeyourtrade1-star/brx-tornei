'use client';

import { useState } from 'react';
import { Eye, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useMatchGapPeerReview } from '@/hooks/use-match-gap-peer-review';
import type { GapPeerRecording } from '@/lib/validations/gap-recording';
import { MatchGapVideoPlaylist } from './match-gap-video-playlist';
import { MatchGapStaffEscalation } from './match-gap-staff-escalation';

function OwnRecording({ recording, opponentName }: { recording: GapPeerRecording; opponentName: string }) {
  const copy = recording.status === 'ready'
    ? `${opponentName} non ha ancora visto la tua registrazione.`
    : recording.status === 'verified'
      ? `Registrazione verificata da ${opponentName} e già cancellata.`
      : `Registrazione contestata da ${opponentName}; verrà cancellata alla scadenza indicata.`;
  return <p className="rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2.5 text-xs text-slate-300">{copy}</p>;
}

export function MatchGapPeerReview({ matchId, opponentName }: { matchId: string | null; opponentName: string }) {
  const review = useMatchGapPeerReview(matchId, Boolean(matchId));
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, 'gap_incomplete' | 'gap_unusable' | 'gap_unexpected_content'>>({});
  if (review.recordings.length === 0 && !review.error) return null;

  const ownRecording = review.recordings.find((recording) => recording.relationship === 'own');
  const opponentRecording = review.recordings.find((recording) => recording.relationship === 'opponent');

  return (
    <>
      <MatchGapStaffEscalation
        own={ownRecording}
        opponent={opponentRecording}
        busy={ownRecording ? review.busyId === ownRecording.recording_id : false}
        onConsent={review.consentStaffEscalation}
      />
      <section className="mb-4 space-y-3.5 rounded-2xl border border-primary/35 bg-header-bg/95 p-[18px] text-sm text-white shadow-xl backdrop-blur-md">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
          <Eye className="h-5 w-5 text-primary" aria-hidden="true" />
        </span>
        <div>
          <p className="font-sans text-sm font-black text-white">Verifica video della disconnessione</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-300">
            Non salviamo la partita completa. Qui puoi vedere solo il video registrato
            durante la disconnessione, inviato col consenso dell’avversario.
            Viene cancellato dopo la verifica (o al massimo entro 3 giorni).
          </p>
        </div>
      </div>
      {review.error && (
        <p className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/15 px-3.5 py-2.5 text-xs text-red-200">
          <TriangleAlert className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" /> {review.error}
        </p>
      )}
      {review.recordings.map((recording) => {
        if (recording.relationship === 'own') {
          return <OwnRecording key={recording.recording_id} recording={recording} opponentName={opponentName} />;
        }
        const loaded = review.clips[recording.recording_id];
        const busy = review.busyId === recording.recording_id;
        return (
          <article key={recording.recording_id} className="space-y-3 rounded-xl border border-white/15 bg-white/[0.05] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <strong className="font-black text-white">Video di {opponentName} · {recording.clip_count} frammenti</strong>
              <span className="text-slate-400">Scadenza {new Date(recording.expires_at).toLocaleString('it-IT')}</span>
            </div>
            {recording.status === 'verified' ? (
              <p className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Verificato e cancellato.
              </p>
            ) : (
              <>
                {!loaded && (
                  <div className="space-y-2.5">
                    <label className="flex items-start gap-2.5 text-xs font-semibold leading-relaxed text-slate-300">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded accent-[#FF7300]"
                        checked={acknowledged[recording.recording_id] ?? recording.viewer_notice_acknowledged}
                        onChange={(event) => setAcknowledged((current) => ({
                          ...current,
                          [recording.recording_id]: event.target.checked,
                        }))}
                        disabled={busy}
                      />
                      <span>
                        Ho capito che vedrò solo il video senza audio dei 10 secondi precedenti e
                        dei 5 successivi alla disconnessione, inviato col consenso di {opponentName},
                        e che non è la partita intera.
                      </span>
                    </label>
                    <button
                      type="button"
                      className="rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:brightness-110 disabled:opacity-45"
                      disabled={busy || !(acknowledged[recording.recording_id] ?? recording.viewer_notice_acknowledged)}
                      onClick={() => void review.open(recording.recording_id)}
                    >
                      {busy ? 'Apertura…' : recording.status === 'rejected' ? 'Rivedi il video' : 'Apri il video'}
                    </button>
                  </div>
                )}
                {loaded && (
                  <MatchGapVideoPlaylist
                    recordingId={recording.recording_id}
                    clips={loaded}
                    onRenewTickets={() => review.reload(recording.recording_id)}
                  />
                )}
                {loaded && recording.status === 'ready' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-xs font-black uppercase text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-45"
                      disabled={busy}
                      onClick={() => void review.review(recording.recording_id, 'verified', 'gap_consistent')}
                    >
                      Conferma e cancella
                    </button>
                    <select
                      className="rounded-xl border border-white/20 bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                      value={rejectReason[recording.recording_id] ?? 'gap_incomplete'}
                      onChange={(event) => setRejectReason((current) => ({
                        ...current,
                        [recording.recording_id]: event.target.value as 'gap_incomplete' | 'gap_unusable' | 'gap_unexpected_content',
                      }))}
                    >
                      <option value="gap_incomplete">Video incompleto</option>
                      <option value="gap_unusable">Video non utilizzabile</option>
                      <option value="gap_unexpected_content">Contenuto non pertinente</option>
                    </select>
                    <button
                      type="button"
                      className="rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-2 text-xs font-black uppercase text-red-200 hover:bg-red-500/25 disabled:opacity-45"
                      disabled={busy}
                      onClick={() => void review.review(
                        recording.recording_id,
                        'rejected',
                        rejectReason[recording.recording_id] ?? 'gap_incomplete',
                      )}
                    >
                      Contesta
                    </button>
                  </div>
                )}
                {recording.status === 'rejected' && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-amber-200">
                    <p>Contestazione registrata. Il video resterà privato fino alla scadenza.</p>
                    {loaded && (
                      <button
                        type="button"
                        className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-xs font-black uppercase text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-45"
                        disabled={busy}
                        onClick={() => void review.review(
                          recording.recording_id,
                          'verified',
                          'dispute_resolved',
                        )}
                      >
                        Disputa risolta, cancella ora
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </article>
        );
      })}
    </section>
    </>
  );
}
