import { LoaderCircle, Scale, ShieldAlert } from 'lucide-react';
import type { MatchJudgeTurn } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchJudgeTranscriptProps {
  turns: MatchJudgeTurn[];
  acceptedTurn?: MatchJudgeTurn | null;
  userId: string;
  participantNames: Record<string, string>;
}

function TurnCard({
  turn,
  userId,
  participantNames,
}: {
  turn: MatchJudgeTurn;
  userId: string;
  participantNames: Record<string, string>;
}) {
  const pending = turn.status === 'processing';
  const failed = turn.status === 'failed';
  return (
    <li className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Scale className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[9px] font-black uppercase tracking-wider text-white/40">
            {turn.askedByUserId === userId
              ? 'Tu'
              : participantNames[turn.askedByUserId] ?? 'Avversario'}
          </p>
          <p className="text-xs font-semibold leading-relaxed text-white/90">{turn.question}</p>
        </div>
      </div>
      {pending ? (
        <p className="pl-8 text-[11px] text-amber-200/80">Asso sta controllando le regole…</p>
      ) : failed ? (
        <p className="flex items-center gap-1.5 pl-8 text-[11px] text-red-200/85">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          Verifica non completata. Puoi riprovare.
        </p>
      ) : (
        <div className="space-y-2 pl-8">
          {turn.kind === 'clarification' ? (
            <p className="text-xs leading-relaxed text-white/80">{turn.reply ?? 'Serve un dettaglio in più per rispondere.'}</p>
          ) : (
            <>
              {turn.verdict && <p className="text-xs font-black text-primary">{turn.verdict}</p>}
              {turn.steps && turn.steps.length > 0 && (
                <ol className="list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-white/70">
                  {turn.steps.map((step, index) => <li key={`${turn.id}-step-${index}`}>{step}</li>)}
                </ol>
              )}
              {turn.ruleRefs && turn.ruleRefs.length > 0 && (
                <details className="rounded-xl border border-white/10 bg-black/10 px-2.5 py-1.5 text-[10px] text-white/60">
                  <summary className="cursor-pointer select-none font-bold text-white/70">Riferimenti alle regole</summary>
                  <ul className="mt-1.5 space-y-0.5 pl-3">
                    {turn.ruleRefs.map((reference) => <li key={`${turn.id}-${reference}`}>{reference}</li>)}
                  </ul>
                </details>
              )}
              {!turn.verdict && !turn.steps?.length && !turn.ruleRefs?.length && turn.reply && (
                <p className="text-xs leading-relaxed text-white/80">{turn.reply}</p>
              )}
            </>
          )}
          {turn.rulesVersion && <p className="text-[9px] text-white/35">Regole {turn.rulesVersion}</p>}
        </div>
      )}
    </li>
  );
}

export function MatchJudgeTranscript({
  turns,
  acceptedTurn,
  userId,
  participantNames,
}: MatchJudgeTranscriptProps) {
  const visibleTurns = acceptedTurn && !turns.some((turn) => turn.id === acceptedTurn.id)
    ? [...turns, acceptedTurn]
    : turns;
  if (visibleTurns.length === 0) {
    return (
      <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-white/10 px-6 text-center text-xs leading-relaxed text-white/40">
        Chiedi una regola o descrivi la situazione al tavolo. Le risposte restano qui.
      </div>
    );
  }
  return (
    <ol className={cn('space-y-2')} aria-label="Cronologia delle risposte del Judge">
      {visibleTurns.map((turn) => (
        <TurnCard
          key={turn.id}
          turn={turn}
          userId={userId}
          participantNames={participantNames}
        />
      ))}
    </ol>
  );
}
