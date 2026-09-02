// Parsing degli stage di carico e timeline condivisa dagli scenari ramping.

export function durationToSeconds(duration) {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/.exec(duration);
  if (!match) throw new Error(`Durata stage non valida: ${duration}`);
  const factors = { ms: 0.001, s: 1, m: 60, h: 3600, d: 86400 };
  const seconds = Number(match[1]) * factors[match[2]];
  if (!Number.isFinite(seconds)) throw new Error(`Durata stage non valida: ${duration}`);
  return seconds;
}

export function parseStages(raw) {
  const stages = raw.split(',').map((item) => {
    const [duration, rawTarget, extra] = item.trim().split(':');
    const target = Number(rawTarget);
    if (
      !duration ||
      !/^\d+(?:\.\d+)?(?:ms|s|m|h|d)$/.test(duration) ||
      extra !== undefined ||
      !Number.isInteger(target) ||
      target < 0
    ) {
      throw new Error(`Stage non valido: ${item}. Usa durata:giocatori`);
    }
    if (target % 2 !== 0) throw new Error(`Lo stage ${item} deve avere giocatori pari`);
    return { duration, target, seconds: durationToSeconds(duration) };
  });
  if (!stages.length || !stages.some(({ target }) => target > 0)) {
    throw new Error('Serve almeno uno stage con giocatori > 0');
  }
  return stages;
}

export function localPlayers(globalPlayers, generatorCount, generatorIndex) {
  let pairs = 0;
  for (let pair = 0; pair < globalPlayers / 2; pair += 1) {
    if (pair % generatorCount === generatorIndex) pairs += 1;
  }
  return pairs * 2;
}

// Costruisce la timeline in secondi e individua il plateau al picco, l'inizio
// della discesa finale e la sua finestra. La discesa inizia dove finisce
// l'ultimo stage consecutivo al target massimo.
export function buildTimeline(stages) {
  let elapsedSeconds = 0;
  const timeline = stages.map(({ duration, target, seconds }) => {
    const startSeconds = elapsedSeconds;
    elapsedSeconds += seconds;
    return { duration, target, seconds, startSeconds, endSeconds: elapsedSeconds };
  });
  const scenarioDurationSeconds = timeline[timeline.length - 1].endSeconds;
  const maxPlayers = Math.max(...stages.map(({ target }) => target));
  const peakEndIndex = stages.reduce(
    (last, stage, index) => (stage.target === maxPlayers ? index : last),
    -1,
  );
  let peakStartIndex = peakEndIndex;
  while (peakStartIndex > 0 && stages[peakStartIndex - 1].target === maxPlayers) {
    peakStartIndex -= 1;
  }
  const peakStartSeconds = timeline[peakStartIndex].startSeconds;
  const descentStartSeconds = timeline[peakEndIndex].endSeconds;
  const peakPlateauSeconds = descentStartSeconds - peakStartSeconds;
  const hasFinalRampDown =
    peakEndIndex >= 0 &&
    peakEndIndex < stages.length - 1 &&
    stages[stages.length - 1].target === 0 &&
    stages.slice(peakEndIndex + 1).every(({ target }) => target < maxPlayers);
  return {
    timeline,
    scenarioDurationSeconds,
    peakStartSeconds,
    descentStartSeconds,
    peakPlateauSeconds,
    hasFinalRampDown,
  };
}
