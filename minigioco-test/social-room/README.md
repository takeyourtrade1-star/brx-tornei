# Sala Piazza

Questa cartella contiene i moduli per la stanza social "Sala Piazza" del videogioco isometrico:

- `SocialRoom.tsx` monta `IsoRoomGame` impostato sulla stanza `'piazza'`, garantendo totale coerenza grafica e riutilizzo dello stesso avatar/omino;
- `PiazzaBackground.jsx` disegna lo sfondo isometrico con grandi finestre panoramiche, cielo aperto con ciclo giorno/notte, fasci di luce solare e porta verso la Sala Tornei;
- `PiazzaSprites.jsx` crea gli arredi isometrici coerenti: 3 macchine arcade (con lo stesso renderer `mkCabinet`), 2 tavolini da gioco TCG con playmats e carte, panche e piante;
- `piazza-config.js` definisce palette, coordinate griglia, arredi e trigger interattivi con fumetti di ispezione;
- `social-room-presence` e `social-room-transport` gestiscono la sincronizzazione multiplayer cross-tab locale.
