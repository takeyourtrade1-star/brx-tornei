import type { ReactNode } from 'react';

export const WORLD_ROOMS = ['tournament', 'arcade', 'piazza'] as const;
export type WorldRoom = (typeof WORLD_ROOMS)[number];

export type WorldQuality = 'high' | 'low';

export type WorldActionId =
  | 'pc'
  | 'decks'
  | 'board'
  | 'photo'
  | 'arcade1'
  | 'arcade2'
  | 'arcade3'
  | 'kakegurui'
  | 'piazzaCab1'
  | 'piazzaCab2'
  | 'piazzaCab3'
  | 'piazzaTable1'
  | 'piazzaTable2';

export type WorldIconName =
  | 'arcade'
  | 'arrow-right'
  | 'board'
  | 'cards'
  | 'chevron-right'
  | 'close'
  | 'music'
  | 'photo'
  | 'play'
  | 'settings'
  | 'shirt'
  | 'spark'
  | 'trophy'
  | 'users';

export type WorldActionState = 'idle' | 'moving' | 'interacting' | 'blocked';

export interface WorldRoomDestination {
  readonly room: WorldRoom;
  readonly label: string;
  readonly shortLabel: string;
  readonly hint: string;
  readonly icon: WorldIconName;
}

export interface WorldActionDescriptor {
  readonly id: WorldActionId;
  readonly label: string;
  readonly shortLabel: string;
  readonly hint: string;
  readonly icon: WorldIconName;
}

export interface WorldNearbyState {
  readonly label: string;
  readonly hint?: string;
  readonly actionId?: WorldActionId;
  readonly state?: WorldActionState;
}

export interface WorldHudProps {
  readonly room: WorldRoom;
  readonly roomLabel?: string;
  readonly username: string;
  readonly onlineLabel?: string;
  readonly avatar?: ReactNode;
  readonly nearby?: WorldNearbyState | null;
  readonly quality?: WorldQuality;
  readonly muted?: boolean;
  readonly tutorialAvailable?: boolean;
  readonly onNavigate: (room: WorldRoom) => void;
  readonly onAction: (id: WorldActionId) => void;
  readonly onWardrobe: () => void;
  readonly onQualityChange?: (quality: WorldQuality) => void;
  readonly onMusicToggle?: () => void;
  readonly onTutorial?: () => void;
  readonly onOverlayChange?: (open: boolean) => void;
  readonly actionDisabled?: boolean;
  readonly className?: string;
}

export type TutorialHotspotSide = 'top' | 'right' | 'bottom' | 'left';

export interface TutorialHotspotSpec {
  readonly sel?: string;
  readonly label: string;
  readonly side?: TutorialHotspotSide;
}

export type TutorialHotspotsMap = Readonly<Record<string, readonly TutorialHotspotSpec[]>>;
