import { Gavel } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatMatchDateTime } from '@/lib/matches/format-datetime';
import type { JudgeCall } from '@/types/match';

const STATUS_LABEL: Record<JudgeCall['status'], string> = {
  in_attesa: 'In attesa',
  risolta: 'Risolta',
  annullata: 'Annullata',
};

const STATUS_VARIANT: Record<JudgeCall['status'], 'warning' | 'success' | 'muted'> = {
  in_attesa: 'warning',
  risolta: 'success',
  annullata: 'muted',
};

interface JudgeCallsPanelProps {
  calls: JudgeCall[];
}

/** Lista chiamate al giudice (mock) con badge per nuove richieste. */
export function JudgeCallsPanel({ calls }: JudgeCallsPanelProps) {
  return (
    <section className="brx-glass rounded-2xl border border-white/15 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-widest text-marquee">
          <Gavel className="h-4 w-4" />
          Chiamate al giudice
        </h2>
        <Badge variant="warning">Presto in arrivo</Badge>
      </div>

      {calls.length === 0 ? (
        <p className="mt-4 text-sm text-white/50">Nessuna chiamata registrata per questa partita.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {calls.map((call) => (
            <li
              key={call.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <time className="text-xs text-white/45">{formatMatchDateTime(call.timestamp)}</time>
                <Badge variant={STATUS_VARIANT[call.status]}>{STATUS_LABEL[call.status]}</Badge>
              </div>
              <p className="mt-1 text-sm text-white/85">{call.reason}</p>
              {call.resolvedAt && (
                <p className="mt-1 text-xs text-white/40">
                  Risolta: {formatMatchDateTime(call.resolvedAt)}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled
        className="mt-4 w-full rounded-xl border border-dashed border-white/20 px-4 py-2.5 text-sm font-semibold text-white/40"
      >
        Nuova chiamata — presto in arrivo
      </button>
    </section>
  );
}
