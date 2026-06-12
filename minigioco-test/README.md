# IsoRoomGame 🏆

Minigioco isometrico pixel-art per React: una stanza in stile classico-iso con avatar, postazione PC, tavolo delle carte TCG e bacheca tornei. Canvas 2D puro, grafica 100% procedurale, zero dipendenze oltre a React.

## File

- `IsoRoomGame.jsx` — l'intero gioco, un solo file, default export.
- `demo.html` — anteprima immediata senza build: nella cartella esegui `python -m http.server 8000` (o `npx serve .`) e apri `http://localhost:8000/demo.html`. I callback loggano in console.

## Integrazione

```jsx
import IsoRoomGame from "./IsoRoomGame";

// il componente riempie il container: dagli un'altezza
<div style={{ height: "80vh" }}>
  <IsoRoomGame />
</div>
```

Nient'altro da configurare. Il componente inietta da sé il proprio CSS e il font "Press Start 2P" (Google Fonts, unico asset esterno; con font bloccati usa il fallback monospace). Niente localStorage. Cleanup completo allo smontaggio (rAF, listener, ResizeObserver, AudioContext).

## Props (tutte opzionali)

```jsx
<IsoRoomGame
  roomName="Sala Tornei"
  username="PrincessLeo"  // username del giocatore (pill nei partecipanti)
  tournaments={[...]}     // sovrascrive i mock
  decks={[...]}
  cards={[...]}
  onCreateTournament={(t) => api.post("/tournaments", t)}
  onJoinTournament={(id) => api.post(`/tournaments/${id}/join`)}
  onCreateDeck={(d) => api.post("/decks", d)}
/>
```

Shape dei dati (i tornei usano la stessa shape di `tournaments-live-frontend/types/tournament.ts`):

```js
tournament: { id, format, mode, buyIn: "for_fun",
              bestOf: "BO1"|"BO3"|"BO5",
              status: "in_registrazione"|"iniziata"|"terminata",
              maxPlayers, participants: [{ id, username }],
              createdAt, isPrivate? }
deck:       { id, nome, carte, colore: "#hex",
              sig: "flame"|"wave"|"leaf"|"star"|"bolt"|"sun"|"moon"|"shield" }
card:       { id, nome, rarita: "comune"|"rara"|"epica"|"leggendaria",
              costo, tipo, sig }
```

La modale del PC replica la tabella tornei della dashboard (Buy-In · Forma · Stato · Registrati · Partecipanti) con badge di stato, lucchetto per le private, popover dei giocatori (paese, stato online, mazzo) e bottone "Partecipa" liquid-glass — bandiere emoji al posto di flagcdn, nessun asset esterno. I tornei creati dalla bacheca compaiono subito nella tabella come `in_registrazione` con te come primo iscritto; "Partecipa" aggiunge la tua pill e, a torneo pieno, lo stato passa a `iniziata`. I callback ricevono gli stessi oggetti, pronti per il tuo backend.

## Comandi di gioco

Click/tap su un tile per muoverti (A* evita i mobili), WASD/frecce in alternativa, ESC o click fuori per chiudere le modali, 🔊 in alto a destra per il mute. Oggetti interattivi: PC → tornei live, tavolo → deck/inventario, bacheca → crea torneo. Cliccati da lontano: l'avatar cammina fino all'oggetto e poi parte lo zoom. Il PC è speciale: l'avatar si siede sulla sedia da ufficio prima che la camera zoomi sul monitor, e si rialza alla chiusura.

## Personalizzazione rapida

In testa al file: `P` (palette ~24 colori), `FURN` (posizioni arredi), `INTERACTIVES` (tile di approccio, fuochi camera, zoom), `SPEED`, `mockTournaments/mockDecks/mockCards`.

## Stato verifica

Codice rivisto riga per riga (proiezione iso, A*, depth sorting con assi separatori, tween camera, cleanup, ARIA delle modali). L'ambiente sandbox per il test automatico non era disponibile su questa macchina (spazio disco esaurito), quindi la verifica runtime va completata con `demo.html`: avvio → l'avatar entra e saluta; click sui 3 oggetti → walk + zoom + modale; ESC/click fuori → zoom-out; form torneo → foglio pinnato; console pulita attesa.
