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

Click/tap su un tile per muoverti (A* evita i mobili), WASD/frecce in alternativa, **1/2/3** per aprire direttamente PC/Tavolo/Bacheca, ESC o click fuori per chiudere le modali, 🔊 in alto a destra per il mute.

## Vita nella stanza

- **Ciclo giorno/notte** dall'ora locale: alba, giorno, tramonto e notte (luna, stelle, tinta ambiente, lampada potenziata). Ricontrollato ogni 30s.
- **Missy la gatta** 🐱: dorme sul tappeto (zzz), vaga per la stanza, fa le fusa se lo accarezzi (cuori); dopo 3 carezze ti segue.
- **Giradischi** (angolo in alto a destra): click per ciclare 3 tracce chiptune (Pixel Sunset / Mana Groove / Night Drive) e spegnere. Note fluttuanti e disco che gira.
- **Easter egg**: pianta, lampada, telecamere, sedia, sgabelli, finestra e poster rispondono con battute.
- **Clipboard statistiche** sulla parete sinistra (W/L e winrate, cliccabile). Valori passati via `opts`/mock.
- **Citofono** sulla parete di fondo: click per un test → dopo 3s arriva una sfida mock (suono ding-dong, LED rosso, alert sul PC). Dall'esterno: `api.ring(msg)` e `api.notify()` — il componente li chiama da solo quando le props `tournaments` cambiano (nuovo torneo → citofono; torneo iniziato → glow sul PC).
- **Idle reward**: dopo 45s di inattività l'avatar va a meditare sul tappeto (scintille/zzz); al primo input si sveglia con una battuta premio. Oggetti interattivi: PC → tornei live, tavolo → deck/inventario, bacheca → crea torneo. Cliccati da lontano: l'avatar cammina fino all'oggetto e poi parte lo zoom. Il PC è speciale: l'avatar si siede sulla sedia da ufficio prima che la camera zoomi sul monitor, e si rialza alla chiusura.

## Personalizzazione rapida

In testa al file: `P` (palette ~24 colori), `FURN` (posizioni arredi), `INTERACTIVES` (tile di approccio, fuochi camera, zoom), `SPEED`, `mockTournaments/mockDecks/mockCards`.

## Stato verifica

Codice rivisto riga per riga (proiezione iso, A*, depth sorting con assi separatori, tween camera, cleanup, ARIA delle modali). L'ambiente sandbox per il test automatico non era disponibile su questa macchina (spazio disco esaurito), quindi la verifica runtime va completata con `demo.html`: avvio → l'avatar entra e saluta; click sui 3 oggetti → walk + zoom + modale; ESC/click fuori → zoom-out; form torneo → foglio pinnato; console pulita attesa.
