import exec from 'k6/execution';
import {
  PLANNED_STOP_WINDOWS,
  RESULT_TRIGGER_SECONDS,
  SCENARIO_DURATION_SECONDS,
} from '../config.js';

function progressFraction() {
  const progress = Number(exec.scenario.progress);
  if (!Number.isFinite(progress)) return null;
  return progress > 1 ? progress / 100 : progress;
}

// Tempo trascorso nello scenario corrente: per i ramping-vus il progresso e
// lineare sul tempo totale degli stage, quindi elapsed = progresso * durata.
// Non si usa exec.scenario.startTime perche la sua semantica (assoluto o
// relativo) dipende dalla versione di k6 e renderebbe il confronto ambiguo.
export function scenarioElapsedSeconds() {
  const progress = progressFraction();
  return progress === null ? null : progress * SCENARIO_DURATION_SECONDS;
}

export function resultTriggerReached() {
  const elapsed = scenarioElapsedSeconds();
  if (elapsed === null) return SCENARIO_DURATION_SECONDS <= RESULT_TRIGGER_SECONDS;
  return elapsed >= RESULT_TRIGGER_SECONDS;
}

// Finestre in cui e k6 a ridurre o spegnere i VU (discese di profilo e fine
// test): le chiusure WebSocket in questi intervalli sono pianificate dal test,
// non dal servizio, e non vanno conteggiate come inattese.
export function scenarioInPlannedStop() {
  const elapsed = scenarioElapsedSeconds();
  if (elapsed === null) return true;
  return PLANNED_STOP_WINDOWS.some(
    ({ start, end }) => elapsed >= start - 1 && elapsed <= end,
  );
}
