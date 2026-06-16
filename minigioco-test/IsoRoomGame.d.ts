import React from 'react';
import type { Tournament } from '@/types/tournament';
import type { InventoryItem } from '@/types/inventory';

export interface IsoRoomGameProps {
  roomName?: string;
  username?: string;
  formatName?: string;
  modeName?: string;
  tournaments?: Tournament[];
  /** Inventario reale dell'utente, usato per costruire i mazzi. */
  inventory?: InventoryItem[];
  onCreateTournament?: (tournament: any) => void;
  onJoinTournament?: (id: string) => void;
  /** Apre la vista match come osservatore di una partita live. */
  onObserveTournament?: (id: string) => void;
  /** Esce dal mini-gioco verso la "vista semplice" (pagina classica). */
  onExitToSimple?: () => void;
  __debug?: boolean;
}

export default function IsoRoomGame(props: IsoRoomGameProps): React.JSX.Element;
