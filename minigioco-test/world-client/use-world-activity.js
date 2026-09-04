import { useEffect, useMemo, useRef } from 'react';
import { getWorldActivity } from './world-activity';

export function useWorldActivity(tournaments, username, gameRef, room, generation) {
  const activity = useMemo(() => getWorldActivity(tournaments, username), [tournaments, username]);
  const previous = useRef(null);
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    const before = previous.current;
    if (before) {
      const added = tournaments.filter((tournament) => !before.some((old) => old.id === tournament.id));
      const started = tournaments.some((tournament) => tournament.status === 'iniziata'
        && before.some((old) => old.id === tournament.id && old.status !== 'iniziata'));
      if (added.length) game.ring(added.length === 1 ? 'Nuovo torneo in bacheca!' : `${added.length} nuovi tornei in bacheca!`);
      else if (started) game.notify();
    }
    previous.current = tournaments;
  }, [tournaments, gameRef]);
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    game.setGhost(activity.opponent);
    game.setCountdown(activity.countdown);
    game.setBracket(activity.bracket);
    game.setStats?.(activity.stats);
  }, [activity, gameRef, room, generation]);
  return activity;
}
