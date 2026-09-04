import type { Tournament } from '@/types/tournament';

/** Il mondo mostra soltanto risultati e scadenze presenti nello snapshot ufficiale. */
export function getWorldActivity(tournaments: Tournament[], username: string) {
  const mine = tournaments.filter((tournament) =>
    tournament.participants.some((participant) => participant.username === username));
  const settled = mine.filter((tournament) =>
    tournament.status === 'terminata' && Boolean(tournament.winnerUserId));
  const won = settled.filter((tournament) => tournament.participants.some((participant) =>
    participant.username === username && participant.id === tournament.winnerUserId));
  const paired = mine.find((tournament) =>
    tournament.status !== 'terminata' && tournament.participants.length > 1);
  const upcoming = mine.flatMap((tournament) => {
    const deadline = tournament.startsAt ? Date.parse(tournament.startsAt) : NaN;
    return tournament.status !== 'terminata' && Number.isFinite(deadline) ? [deadline] : [];
  });
  return {
    stats: { giocati: settled.length, vinti: won.length },
    opponent: paired?.participants.find((participant) => participant.username !== username)?.username ?? null,
    countdown: upcoming.length ? Math.min(...upcoming) : null,
    bracket: mine.some((tournament) => tournament.status === 'iniziata'),
  };
}
