import type { SocialRoomEvent } from "./social-room-protocol";

export type SocialRoomClientFrame =
  | { readonly type: "join"; readonly client_sequence: number; readonly position: { x: number; y: number }; readonly request: boolean }
  | { readonly type: "move"; readonly client_sequence: number; readonly position: { x: number; y: number } }
  | { readonly type: "chat"; readonly client_sequence: number; readonly text: string }
  | { readonly type: "leave"; readonly client_sequence: number };

/** Elimina identità e timestamp client: sarà il backend autenticato a firmarli. */
export function toSocialRoomClientFrame(event: SocialRoomEvent): SocialRoomClientFrame {
  switch (event.type) {
    case "join":
      return {
        type: "join",
        client_sequence: event.sequence,
        position: event.position,
        request: event.request,
      };
    case "move":
      return { type: "move", client_sequence: event.sequence, position: event.position };
    case "chat":
      return { type: "chat", client_sequence: event.sequence, text: event.text };
    case "leave":
      return { type: "leave", client_sequence: event.sequence };
  }
}
