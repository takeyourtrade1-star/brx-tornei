import React from 'react';
import type { ModeId } from '@/lib/data/catalog';
import type { Tournament } from '@/types/tournament';
import type { InventoryItem } from '@/types/inventory';
import type { FormatFilter } from '@/lib/validations/selection';

export interface IsoRoomGameProps {
  roomName?: string;
  username?: string;
  formatId?: FormatFilter;
  modeId?: ModeId;
  formatName?: string;
  modeName?: string;
  tournaments?: Tournament[];
  /** Inventario reale dell'utente, usato per costruire i mazzi. */
  inventory?: InventoryItem[];
  onCreateTournament?: (tournament: unknown) => void;
  onJoinTournament?: (id: string) => void;
  /** Apre la vista match come osservatore di una partita live. */
  onObserveTournament?: (id: string) => void;
  /** Apre la pagina Mazzi attuale invece del vecchio editor incorporato. */
  onOpenDecks?: () => void;
  /** Esce dal mini-gioco verso la lobby principale. */
  onExitToSimple?: () => void;
  /** Collega le azioni della stanza ai flussi correnti del sito. */
  integrationMode?: 'prototype' | 'site';
  __debug?: boolean;
}

export default function IsoRoomGame(props: IsoRoomGameProps): React.JSX.Element;
