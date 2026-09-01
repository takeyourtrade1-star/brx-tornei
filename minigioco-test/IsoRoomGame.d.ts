import React from 'react';
import type { Tournament } from '@/types/tournament';

export interface IsoRoomGameProps {
  roomName?: string;
  username?: string;
  tournaments?: Tournament[];
  /** Apre il mirror ufficiale dei tavoli correnti. */
  onOpenTournaments?: () => void;
  /** Apre direttamente il flusso ufficiale di creazione tavolo. */
  onOpenCreateTournament?: () => void;
  /** Apre il gestore Mazzi ufficiale condiviso. */
  onOpenDecks?: () => void;
  /** Esce dal mini-gioco verso la lobby principale. */
  onExitToSimple?: () => void;
  /** Distingue l'integrazione autenticata dai minigiochi del prototipo. */
  integrationMode?: 'prototype' | 'site';
  __debug?: boolean;
}

export default function IsoRoomGame(props: IsoRoomGameProps): React.JSX.Element;
