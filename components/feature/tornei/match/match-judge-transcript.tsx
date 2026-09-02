import { BookOpen, CheckCircle2, HelpCircle, LoaderCircle, Scale, ShieldAlert } from 'lucide-react';
import type { MatchJudgeTurn } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchJudgeTranscriptProps {
  turns: MatchJudgeTurn[];
  acceptedTurn?: MatchJudgeTurn | null;
  userId: string;
  participantNames: Record<string, string>;
  onSelectPrompt?: (prompt: string) => void;
}

function getFailedExplanation(turn: MatchJudgeTurn): string {
  if (turn.reply && turn.reply.trim().length > 0) {
    return turn.reply.trim();
  }
  if (turn.errorCode === 'TIMEOUT') {
    return 'La verifica ha impiegato troppo tempo per elaborare la risposta. Prova a semplificare la domanda.';
  }
  if (turn.errorCode === 'TOKEN_LIMIT' || turn.errorCode === 'PROMPT_TOO_LONG') {
    return 'La domanda è troppo lunga o contiene troppi dettagli per l’arbitro. Prova a ridurla.';
  }
  return 'Asso non è riuscito a verificare questa situazione specifica. Riprova con una domanda più breve o diretta.';
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
  const isMine = turn.askedByUserId === userId;
  const pending = turn.status === 'processing';
  const failed = turn.status === 'failed';
  const askerName = isMine ? 'Tu' : participantNames[turn.askedByUserId] ?? 'Avversario';

  return (
    <li className="space-y-2.5 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-3.5 shadow-md">
      {/* Intestazione della domanda */}
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary border border-primary/30">
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : failed ? (
            <ShieldAlert className="h-4 w-4 text-red-400" />
          ) : (
            <Scale className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider',
                isMine ? 'bg-primary/25 text-primary border border-primary/30' : 'bg-white/10 text-white/75',
              )}
            >
              {askerName}
            </span>
            <span className="text-[10px] text-white/35">Turno #{turn.sequence}</span>
          </div>
          <p className="text-xs font-semibold leading-relaxed text-white/95">{turn.question}</p>
        </div>
      </div>

      {/* Corpo della risposta o stato */}
      {pending ? (
        <div className="ml-9 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-amber-200">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
          <span>Asso sta consultando le regole ufficiali…</span>
        </div>
      ) : failed ? (
        <div className="ml-9 space-y-1.5 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-[11px] text-red-100">
          <div className="flex items-center gap-1.5 font-bold text-red-200">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-400" />
            <span>Verifica non completata</span>
          </div>
          <p className="leading-relaxed text-red-200/90">{getFailedExplanation(turn)}</p>
          <p className="text-[10px] text-red-200/60 pt-0.5">
            💡 Suggerimento: le domande brevi e concise (2-3 frasi chiare) evitano timeout e garantiscono risposte rapide.
          </p>
        </div>
      ) : (
        <div className="ml-9 space-y-2.5">
          {turn.kind === 'clarification' ? (
            <p className="text-xs leading-relaxed text-white/85">
              {turn.reply ?? 'Serve un dettaglio in più per rispondere.'}
            </p>
          ) : (
            <>
              {turn.verdict && (
                <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/15 p-2.5 text-xs font-bold text-amber-200">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="leading-snug text-white">{turn.verdict}</span>
                </div>
              )}
              {turn.steps && turn.steps.length > 0 && (
                <ol className="space-y-1.5 border-l border-white/15 pl-3 text-[11px] leading-relaxed text-white/80">
                  {turn.steps.map((step, index) => (
                    <li key={`${turn.id}-step-${index}`} className="relative">
                      <span className="font-bold text-primary mr-1.5">{index + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
              {turn.ruleRefs && turn.ruleRefs.length > 0 && (
                <details className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px] text-white/70">
                  <summary className="cursor-pointer select-none font-bold text-amber-300 flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" />
                    Riferimenti alle regole ufficiali
                  </summary>
                  <ul className="mt-2 space-y-1 pl-4 list-disc text-white/60">
                    {turn.ruleRefs.map((reference) => (
                      <li key={`${turn.id}-${reference}`}>{reference}</li>
                    ))}
                  </ul>
                </details>
              )}
              {!turn.verdict && !turn.steps?.length && !turn.ruleRefs?.length && turn.reply && (
                <p className="text-xs leading-relaxed text-white/85">{turn.reply}</p>
              )}
            </>
          )}
          {turn.rulesVersion && (
            <p className="text-[9px] text-white/35">Regolamento {turn.rulesVersion}</p>
          )}
        </div>
      )}
    </li>
  );
}

const SAMPLE_PROMPTS = [
  'Posso lanciare una magia con lampo durante il turno avversario?',
  'Come si risolve questa abilità se la carta lascia il campo?',
  'Chi ha priorità all’inizio della fase di combattimento?',
];

export function MatchJudgeTranscript({
  turns,
  acceptedTurn,
  userId,
  participantNames,
  onSelectPrompt,
}: MatchJudgeTranscriptProps) {
  const visibleTurns =
    acceptedTurn && !turns.some((turn) => turn.id === acceptedTurn.id)
      ? [...turns, acceptedTurn]
      : turns;

  if (visibleTurns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white">Chiedi al Judge Asso</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-white/50 max-w-[280px]">
            Dubbi su un&apos;interazione o sulla priorità? Fai domande brevi e chiare per una risposta immediata.
          </p>
        </div>
        {onSelectPrompt && (
          <div className="mt-1 w-full space-y-1.5 text-left">
            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-200/70">
              Esempi frequenti:
            </p>
            {SAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onSelectPrompt(prompt)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-white/75 transition hover:border-primary/40 hover:bg-primary/10 hover:text-white"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <ol className="space-y-2.5" aria-label="Cronologia delle risposte del Judge">
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
