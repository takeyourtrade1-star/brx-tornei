# Sala Piazza

Questa cartella contiene una stanza social locale per il prototipo Arcade:

- `SocialRoom` è il componente visuale montato a schermo intero con Canvas 2D isometrico a 60 FPS;
- `piazza-background.ts` genera lo sfondo con finestre panoramiche, fascio di luce e porta;
- `piazza-sprites.ts` modella i 3 cabinati arcade fuori servizio, i tavolini da gioco e gli arredi;
- `piazza-chibi.ts` si occupa del rendering procedurale degli avatar pixel-art e dei fumetti chat;
- `use-piazza-engine.ts` gestisce il loop di simulazione, depth-sorting e click/WASD;
- `useSocialRoomPresence` espone giocatori, posizione, bolle chat e lifecycle;
- `social-room-transport` usa `BroadcastChannel`, poi `storage` events;
- `social-room-door.ts` descrive la porta integrata in `IsoRoomGame`.

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
