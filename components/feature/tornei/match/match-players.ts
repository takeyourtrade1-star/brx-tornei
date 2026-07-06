import type { Participant, Tournament } from '@/types/tournament';

const WAITING: Participant = { id: '__waiting__', username: 'In attesa…' };

/** Due giocatori del match (con placeholder se il torneo non è ancora pieno). */
export function matchPlayers(tournament: Tournament): [Participant, Participant] {
  const list = [...tournament.participants];
  while (list.length < 2) list.push(WAITING);
  return [list[0]!, list[1]!];
}

/** Giocatore locale e avversario rispetto all'utente corrente. */
export function resolveMatchSides(
  tournament: Tournament,
  me: string,
  userId: string,
): { local: Participant; remote: Participant; players: [Participant, Participant] } {
  const players = matchPlayers(tournament);
  const selfIndex = players.findIndex((p) => p.id === userId || p.username === me);
  const local = selfIndex >= 0 ? players[selfIndex]! : players[0]!;
  const remote = selfIndex === 0 ? players[1]! : players[0]!;
  return { local, remote, players };
}
