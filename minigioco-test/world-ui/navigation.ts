import type {
  WorldActionDescriptor,
  WorldActionId,
  WorldIconName,
  WorldRoom,
  WorldRoomDestination,
} from './types';
import { WORLD_ROOMS } from './types';

export interface WorldRoomInfo {
  readonly label: string;
  readonly kicker: string;
  readonly description: string;
  readonly icon: WorldIconName;
}

const ROOM_INFO: Readonly<Record<WorldRoom, WorldRoomInfo>> = {
  tournament: {
    label: 'Sala Tornei',
    kicker: 'Asso World / live',
    description: 'Il punto di partenza per tavoli e sfide ufficiali.',
    icon: 'trophy',
  },
  arcade: {
    label: 'Sala Arcade',
    kicker: 'Asso World / arcade',
    description: 'Cabinati, record e partite lampo.',
    icon: 'arcade',
  },
  piazza: {
    label: 'Sala Piazza',
    kicker: 'Asso World / amici',
    description: 'Un luogo per incontrare gli amici connessi.',
    icon: 'users',
  },
};

const DESTINATIONS: Readonly<Record<WorldRoom, readonly WorldRoomDestination[]>> = {
  tournament: [
    { room: 'arcade', label: 'Sala Arcade', shortLabel: 'Arcade', hint: 'Raggiungi i cabinati', icon: 'arcade' },
    { room: 'piazza', label: 'Sala Piazza', shortLabel: 'Piazza', hint: 'Vai a trovare gli amici', icon: 'users' },
  ],
  arcade: [
    { room: 'tournament', label: 'Sala Tornei', shortLabel: 'Tornei', hint: 'Torna ai tavoli ufficiali', icon: 'trophy' },
    { room: 'piazza', label: 'Sala Piazza', shortLabel: 'Piazza', hint: 'Vai a trovare gli amici', icon: 'users' },
  ],
  piazza: [
    { room: 'tournament', label: 'Sala Tornei', shortLabel: 'Tornei', hint: 'Torna ai tavoli ufficiali', icon: 'trophy' },
    { room: 'arcade', label: 'Sala Arcade', shortLabel: 'Arcade', hint: 'Raggiungi i cabinati', icon: 'arcade' },
  ],
};

const ACTIONS: Readonly<Record<WorldRoom, readonly WorldActionDescriptor[]>> = {
  tournament: [
    { id: 'pc', label: 'PC', shortLabel: 'Tornei', hint: 'Apri i tavoli ufficiali', icon: 'trophy' },
    { id: 'decks', label: 'Mazzi', shortLabel: 'Mazzi', hint: 'Apri il gestore mazzi', icon: 'cards' },
    { id: 'board', label: 'Bacheca', shortLabel: 'Crea', hint: 'Crea un nuovo tavolo', icon: 'board' },
    { id: 'photo', label: 'Foto', shortLabel: 'Scatta', hint: 'Salva una foto della stanza', icon: 'photo' },
  ],
  arcade: [
    { id: 'arcade1', label: 'Stack Attack', shortLabel: 'Stack', hint: 'Apri il primo cabinato', icon: 'arcade' },
    { id: 'arcade2', label: 'TCG Jump', shortLabel: 'Jump', hint: 'Apri il secondo cabinato', icon: 'arcade' },
    { id: 'arcade3', label: 'Card Memory', shortLabel: 'Memory', hint: 'Apri il terzo cabinato', icon: 'cards' },
    { id: 'kakegurui', label: 'Tavolo duelli', shortLabel: 'Duelli', hint: 'Apri il tavolo arcade', icon: 'board' },
  ],
  piazza: [
    { id: 'piazzaCab1', label: 'Stack Attack', shortLabel: 'Stack', hint: 'Apri il cabinato della piazza', icon: 'arcade' },
    { id: 'piazzaCab2', label: 'TCG Jump', shortLabel: 'Jump', hint: 'Apri il cabinato della piazza', icon: 'arcade' },
    { id: 'piazzaCab3', label: 'Card Memory', shortLabel: 'Memory', hint: 'Apri il cabinato della piazza', icon: 'cards' },
    { id: 'piazzaTable1', label: 'Tavoli degli amici', shortLabel: 'Tavoli', hint: 'Apri i tavoli ufficiali', icon: 'trophy' },
    { id: 'piazzaTable2', label: 'Crea tavolo', shortLabel: 'Crea', hint: 'Crea una nuova sfida ufficiale', icon: 'board' },
  ],
};

export function isWorldRoom(value: unknown): value is WorldRoom {
  return typeof value === 'string' && WORLD_ROOMS.includes(value as WorldRoom);
}

export function getWorldRoomInfo(room: WorldRoom): WorldRoomInfo {
  return ROOM_INFO[room];
}

export function getWorldDestinations(room: WorldRoom): readonly WorldRoomDestination[] {
  return DESTINATIONS[room];
}

export function getWorldActions(room: WorldRoom): readonly WorldActionDescriptor[] {
  return ACTIONS[room];
}

export function isWorldActionId(value: unknown): value is WorldActionId {
  return Object.values(ACTIONS).some((actions) => actions.some((action) => action.id === value));
}
