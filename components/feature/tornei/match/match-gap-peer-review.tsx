'use client';

import { useState } from 'react';
import { Eye, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useMatchGapPeerReview } from '@/hooks/use-match-gap-peer-review';
import type { GapPeerRecording } from '@/lib/validations/gap-recording';

function OwnRecording({ recording, opponentName }: { recording: GapPeerRecording; opponentName: string }) {
  const copy = recording.status === 'ready'
    ? `${opponentName} deve ancora verificare i tuoi frammenti.`
    : recording.status === 'verified'
      ? `Frammenti verificati da ${opponentName} e già eliminati.`
      : `Frammenti contestati da ${opponentName}; restano protetti solo fino alla scadenza indicata.`;
  return <p className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-xs text-white/70">{copy}</p>;
}

export function MatchGapPeerReview({ matchId, opponentName }: { matchId: string | null; opponentName: string }) {
  const review = useMatchGapPeerReview(matchId, Boolean(matchId));
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, 'gap_incomplete' | 'gap_unusable' | 'gap_unexpected_content'>>({});
  if (review.recordings.length === 0 && !review.error) return null;

  return (
    <section className="mb-4 space-y-3 rounded-2xl border border-sky-400/20 bg-sky-500/[0.07] p-4 text-sm text-sky-50">
      <div className="flex items-start gap-3">
        <Eye className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-bold">Verifica reciproca delle disconnessioni</p>
          <p className="mt-1 text-xs leading-5 text-sky-100/75">
            La partita completa non viene salvata. Solo i frammenti autorizzati sono temporaneamente
            disponibili ai due giocatori e vengono cancellati alla chiusura; se contestati,
            scadono comunque entro 3 giorni.
          </p>
        </div>
      </div>
      {review.error && (
        <p className="flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-100">
          <TriangleAlert className="h-4 w-4" aria-hidden="true" /> {review.error}
        </p>
      )}
      {review.recordings.map((recording) => {
        if (recording.relationship === 'own') {
          return <OwnRecording key={recording.recording_id} recording={recording} opponentName={opponentName} />;
        }
        const loaded = review.clips[recording.recording_id];
        const busy = review.busyId === recording.recording_id;
        return (
          <article key={recording.recording_id} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <strong>{recording.clip_count} framment{recording.clip_count === 1 ? 'o' : 'i'} di {opponentName}</strong>
              <span className="text-white/55">Scadenza {new Date(recording.expires_at).toLocaleString('it-IT')}</span>
            </div>
            {recording.status === 'verified' ? (
              <p className="flex items-center gap-2 text-xs text-emerald-200">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Verificati e cancellati.
              </p>
            ) : (
              <>
                {!loaded && (
                  <div className="space-y-2">
                    <label className="flex items-start gap-2 text-xs leading-5 text-white/75">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-sky-500"
                        checked={acknowledged[recording.recording_id] ?? recording.viewer_notice_acknowledged}
                        onChange={(event) => setAcknowledged((current) => ({
                          ...current,
                          [recording.recording_id]: event.target.checked,
                        }))}
                        disabled={busy}
                      />
                      <span>
                        Ho letto che vedrò solo i frammenti mancanti, caricati col consenso di {opponentName},
                        conservati temporaneamente e non l’intera partita.
                      </span>
                    </label>
                    <button
                      type="button"
                      className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-45"
                      disabled={busy || !(acknowledged[recording.recording_id] ?? recording.viewer_notice_acknowledged)}
                      onClick={() => void review.open(recording.recording_id)}
                    >
                      {busy ? 'Apertura…' : recording.status === 'rejected' ? 'Rivedi i frammenti' : 'Prendi visione e apri'}
                    </button>
                  </div>
                )}
                {loaded?.map((clip) => (
                  <video
                    key={clip.clipId}
                    className="aspect-video w-full rounded-xl bg-black"
                    src={clip.url}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ))}
                {loaded && recording.status === 'ready' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-emerald-950 disabled:opacity-45"
                      disabled={busy}
                      onClick={() => void review.review(recording.recording_id, 'verified', 'gap_consistent')}
                    >
                      Conferma e cancella
                    </button>
                    <select
                      className="rounded-xl border border-white/15 bg-slate-950 px-2 py-2 text-xs"
                      value={rejectReason[recording.recording_id] ?? 'gap_incomplete'}
                      onChange={(event) => setRejectReason((current) => ({
                        ...current,
                        [recording.recording_id]: event.target.value as 'gap_incomplete' | 'gap_unusable' | 'gap_unexpected_content',
                      }))}
                    >
                      <option value="gap_incomplete">Frammenti incompleti</option>
                      <option value="gap_unusable">Video non utilizzabile</option>
                      <option value="gap_unexpected_content">Contenuto inatteso</option>
                    </select>
                    <button
                      type="button"
                      className="rounded-xl border border-red-400/35 px-3 py-2 text-xs font-bold text-red-100 disabled:opacity-45"
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
                    <p>Contestazione registrata. I frammenti resteranno privati fino alla scadenza.</p>
                    {loaded && (
                      <button
                        type="button"
                        className="rounded-xl bg-emerald-500 px-3 py-2 font-bold text-emerald-950 disabled:opacity-45"
                        disabled={busy}
                        onClick={() => void review.review(
                          recording.recording_id,
                          'verified',
                          'dispute_resolved',
                        )}
                      >
                        Disputa risolta: cancella ora
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
  );
}
