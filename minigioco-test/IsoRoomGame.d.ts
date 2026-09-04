import React from 'react';
import type { Tournament } from '@/types/tournament';
import type { AssoWorldLook } from '@/types/asso-world';

export interface IsoRoomGameProps {
  roomName?: string;
  username?: string;
  initialRoom?: 'tournament' | 'arcade' | 'piazza';
  tournaments?: Tournament[];
  initialLook?: AssoWorldLook;
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
  /** Sospende il motore quando una superficie ufficiale copre la stanza. */
  paused?: boolean;
  quality?: 'auto' | 'high' | 'low';
  __debug?: boolean | ((state: unknown) => void);
}

export default function IsoRoomGame(props: IsoRoomGameProps): React.JSX.Element;
