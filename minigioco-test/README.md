# IsoRoomGame 🏆

Minigioco isometrico pixel-art per React: una stanza in stile classico-iso con avatar, postazione PC, tavolo delle carte TCG e bacheca tornei. Canvas 2D puro, grafica 100% procedurale, zero dipendenze oltre a React.

## File

- `IsoRoomGame.jsx` — l'intero gioco, un solo file, default export.
- `demo.html` — anteprima immediata senza build: nella cartella esegui `python -m http.server 8000` (o `npx serve .`) e apri `http://localhost:8000/demo.html`. React, ReactDOM e Babel sono fissati a versioni esatte con SRI; aggiornare insieme URL e hash. I callback loggano in console.

## Integrazione

```jsx
import IsoRoomGame from "./IsoRoomGame";

// il componente riempie il container: dagli un'altezza
<div style={{ height: "80vh" }}>
  <IsoRoomGame />
</div>
```

Nient'altro da configurare. Il componente inietta da sé il proprio CSS con il nonce
della pagina (quando la CSP è attiva) e usa un fallback monospace senza asset
esterni. Salva solo le preferenze locali di tutorial e qualità grafica; non salva
sessioni, token o mazzi. Cleanup completo allo smontaggio (rAF, listener,
ResizeObserver, AudioContext).

## Integrazione nella lobby Tornei

Nel sito la stanza viene aperta dal pulsante secondario **Sala Arcade** presente
nella lobby moderna. La lobby e il backend correnti sono l'unica fonte autorevole:

- il PC apre il mirror dei tavoli ufficiali correnti;
- la bacheca apre direttamente il flusso ufficiale di creazione;
- la lobby attuale richiede il mazzo dichiarato prima di creare o raggiungere un tavolo;
- l'oggetto Tavolo/Deck apre il gestore Mazzi server-backed condiviso con `/mazzi`.

Il componente non contiene più copie locali del PC, della bacheca o dell'editor
mazzi: i tre oggetti sono esclusivamente ingressi alle callback ufficiali. La
modalità `prototype` resta disponibile per gli altri minigiochi standalone.

Il duello WebRTC con signaling manuale resta disponibile solo in `prototype`:
la superficie autenticata del sito non apre connessioni P2P sperimentali e offre
il tavolo locale come minigioco secondario.

## Props (tutte opzionali)

```jsx
<IsoRoomGame
  roomName="Sala Tornei"
  username="PrincessLeo"
  tournaments={[...]}     // sovrascrive i mock
  onOpenTournaments={() => openOfficialTables()}
  onOpenCreateTournament={() => openOfficialCreation()}
  onOpenDecks={() => openOfficialDecks()}
/>
```

In produzione le callback non chiamano API dal browser: il contenitore le collega
alle superfici correnti, che usano Server Action e data layer.

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
