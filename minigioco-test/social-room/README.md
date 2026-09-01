# Sala Piazza

Questa cartella contiene una stanza social locale per il prototipo Arcade:

- `SocialRoom` è il componente visuale pronto da montare;
- `useSocialRoomPresence` espone giocatori, posizione, bolle chat e lifecycle;
- `social-room-transport` usa `BroadcastChannel`, poi `storage` events;
- `social-room-door.ts` descrive la porta da aggiungere al registry Arcade.

Esempio:

```tsx
<SocialRoom
  roomId="social-room"
  gamertag={gamertag}
  avatarId={avatarId}
  initialFriends={[
    { id: "friend-1", gamertag: "Kurogane", avatarId: "avatar-fox" },
  ]}
  onExit={() => setRoom("arcade")}
/>
```

Gli amici passati in `initialFriends` ritornano come `source: "seed-demo"`; un
altro tab che usa la stessa `roomId` ritorna come `source: "live-tab"`. Il
movimento idle è solo cosmetico per i seed e non viene trasmesso.

È un adapter same-origin tra tab della stessa origine. Non è realtime tra
dispositivi e non sostituisce un endpoint WebSocket backend. La porta `PIAZZA`
è integrata in `IsoRoomGame`: apre la stanza come overlay e sospende il loop
della Sala Arcade sottostante finché l'utente non torna indietro.
