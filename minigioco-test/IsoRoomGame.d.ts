import React from 'react';
import type { Tournament } from '@/types/tournament';

export interface IsoRoomGameProps {
  roomName?: string;
  username?: string;
  formatName?: string;
  modeName?: string;
  tournaments?: Tournament[];
  decks?: any[];
  cards?: any[];
  onCreateTournament?: (tournament: any) => void;
  onJoinTournament?: (id: string) => void;
  onCreateDeck?: (deck: any) => void;
  __debug?: boolean;
}

export default function IsoRoomGame(props: IsoRoomGameProps): React.JSX.Element;
