/** Descriptor compatto da aggiungere al registry della stanza Arcade. */
export const SOCIAL_ROOM_DOOR = {
  id: "social-room-door",
  name: "Porta Sala Piazza",
  icon: "💬",
  desc: "Incontra gli amici online nella stanza condivisa",
  action: "openSocialRoom",
  target: "social-room",
} as const;

export const SOCIAL_ROOM_ENTRY = {
  id: "social-room",
  name: "Sala Piazza",
  component: "SocialRoom",
  transport: "authenticated-websocket",
  door: SOCIAL_ROOM_DOOR,
} as const;
