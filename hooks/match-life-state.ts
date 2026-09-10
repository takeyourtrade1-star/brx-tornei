import type { MutableRefObject } from 'react';
import type { MatchLifeCommand } from '@/lib/match-life-protocol';

export function isCompleteLifeSnapshot(
  command: MatchLifeCommand | null, playerIds: string[], authorityPlayerId: string,
): command is Extract<MatchLifeCommand, { type: 'snapshot' }> {
  return command?.type === 'snapshot' && command.senderId === authorityPlayerId &&
    Object.keys(command.lifeByPlayerId).length === playerIds.length &&
    playerIds.every((id) => Object.hasOwn(command.lifeByPlayerId, id));
}

export function createLifeMap(playerIds: string[], startingLife: number): Record<string, number> {
  return Object.fromEntries(playerIds.map((playerId) => [playerId, startingLife]));
}

export function nextLifeCommandId(sequence: MutableRefObject<number>, userId: string): string {
  return `${userId}:${Date.now()}:${++sequence.current}`;
}

export function rememberLifeCommand(commands: Set<string>, commandId: string): boolean {
  if (commands.has(commandId)) return true;
  commands.add(commandId);
  if (commands.size > 250) commands.delete(commands.values().next().value as string);
  return false;
}
