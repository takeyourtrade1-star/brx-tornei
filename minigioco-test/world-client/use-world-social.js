import { useEffect, useRef } from 'react';
import { serializeAssoWorldLook } from '@/lib/asso-world-look';
import { useSocialRoomPresence } from '../social-room/use-social-room-presence';
import { PIAZZA_ENTRY_TILE } from '../social-room/piazza-config';

/** Il look pubblico è sempre l'ultimo confermato, non quello ancora in salvataggio. */
export function useWorldSocial({ room, username, syncedLook, gameRef, generation }) {
  const social = useSocialRoomPresence({
    roomId: 'piazza', gamertag: username,
    avatarId: serializeAssoWorldLook(syncedLook),
    initialPosition: { x: PIAZZA_ENTRY_TILE.cx, y: PIAZZA_ENTRY_TILE.cy },
    enabled: room === 'piazza',
  });
  const shownBubble = useRef(null);
  useEffect(() => {
    const bubble = social.self.bubble;
    if (!bubble || bubble.id === shownBubble.current) return;
    shownBubble.current = bubble.id;
    gameRef.current?.showBubble(bubble.text, 4.5);
  }, [social.self.bubble, gameRef, generation]);
  useEffect(() => { gameRef.current?.setRemotePlayers(social.players); }, [social.players, gameRef, generation]);
  useEffect(() => { gameRef.current?.setLocalPosition(social.self.position); }, [social.self.position, gameRef, generation]);
  return social;
}
