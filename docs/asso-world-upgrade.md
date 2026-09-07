# Asso World — revisione grafica e motore

Il componente della lobby mantiene la stessa integrazione con tavoli, creazione
sfide e gestore mazzi ufficiali. La personalizzazione continua a passare dalla
Server Action e la Piazza usa il WebSocket autenticato esistente.

## Grafica e interazioni

- Sala Tornei con arredi procedurali, monitor a tre scene, tavolo TCG con
  tappetino, carte, segnalini e deck box; bacheca separata dalla porta Piazza.
- Piazza con finestre panoramiche, luci, insegne, tavoli e cabinati ridisegnati.
  I tre cabinati aprono Stack Attack, TCG Jump e Card Memory. I tavoli aprono
  i tavoli ufficiali e la creazione di una sfida.
- Guardaroba con 30 combinazioni persistenti, preset, scelta casuale,
  rotazione manuale e prova del cammino. Anteprima e mondo condividono gli
  stessi sprite. Nessuna nuova opzione priva di supporto nel profilo backend.
- Navigazione tra stanze con percorsi sulla griglia e passaggio automatico
  dalla Sala Tornei quando non esiste una porta diretta.
- HUD compatto, comandi accessibili, focus nelle finestre e ripristino alla chiusura.

## Diorama in qualità alta

La qualità alta usa un renderer dedicato in `high-detail/`, con contorni morbidi
alla risoluzione del display: parquet, pareti con boiserie, monitor panoramico,
tavolo in legno con bordo intarsiato, carte e materiali sfumati. La Piazza ha
una pergola con piante sospese, fioriere, luci e tavoli da gioco; la Sala Arcade
mantiene un'identità distinta con arredi e illuminazione dedicati.

Personaggi e animali sono disegnati con volumi e ombre. Il guardaroba usa lo
stesso renderer del mondo, incluse rotazione e animazione del cammino; le 30
combinazioni conservano i colori e le chiavi del profilo ufficiale.

Fondali e arredi sono precalcolati a risoluzione tripla. La cache conserva una
sola stanza e viene liberata al cambio di qualità, stanza o fase del giorno e
allo smontaggio. I clic usano maschere della nuova sagoma; percorsi e collider
mantengono il reticolo originale. La qualità leggera conserva il renderer pixel
art e i suoi limiti di consumo. Non sono state aggiunte dipendenze.

Il cambio della luce aggiorna correttamente anche una Sala Tornei mai lasciata;
l'ingresso diretto nella Sala Arcade inizializza la scena corrispondente.

## Rifinitura dei personaggi e movimento

L'avatar ha collo corto, viso sorridente, mani e scarpe arrotondate, pantaloni
denim e dettagli coerenti degli abiti. Le quattro direzioni condividono respiro,
sguardo, battito delle palpebre e passo con appoggi alternati; il guardaroba usa
lo stesso disegno e sospende il proprio loop quando la scheda è nascosta.
La posa seduta appoggia il bacino alla nuova sedia, senza l'offset pixel art.

Cane e gatto distinguono cammino, seduta, sonno e carezze, con coda, orecchie e
zampe animate. Il movimento effettivo prevale sullo stato di riposo conservato
dal motore durante gli spostamenti. Anche il cane registra l'ultima carezza.

PC, cabinati, carte e giradischi aggiungono dettagli animati sopra gli arredi
precalcolati. Il disco ruota quando la musica è attiva. Le sei fronde della
pergola sono bitmap separate: ondeggiano senza ricostruire foglie o gradienti
a ogni frame. Restano visibili e ferme con movimento ridotto; il cambio di
stanza, qualità e lo smontaggio liberano anche questa cache.

## Confini del codice

`IsoRoomGame.jsx` compone le foglie interattive. `world-client/` contiene gli
hook React, gli eventi ufficiali, il tutorial e l'avvio del motore.
`world-engine/` separa input, navigazione, aggiornamento della simulazione,
rendering e lifecycle. Le funzioni vengono registrate prima di inizializzare
scene e listener; ogni istanza possiede il proprio oggetto `engine`.
Le fasi di aggiornamento e rendering condividono un contesto `frame` locale
alla chiamata, senza stato globale del personaggio.

`room-art/` e `avatar/` producono sprite procedurali. La cache avatar è limitata
a otto look completi. La cache delle presenze usa chiavi canoniche, quindi
non può crescere attraverso varianti arbitrarie della stessa stringa.

`world-runtime/` serializza i salvataggi del look: una richiesta attiva e solo
l'ultima scelta in attesa. Una risposta corrotta viene rifiutata; un errore
ripristina il look confermato e consente un nuovo tentativo. Lo smontaggio
scollega React ma completa l'ultimo salvataggio già richiesto.

## Prestazioni e correttezza

La modalità leggera conserva 30 FPS e DPR massimo 0,75; la qualità alta usa
60 FPS e DPR massimo 1,5. Le preferenze di movimento ridotto disattivano gli
effetti anche quando è stata salvata la qualità alta. La stanza si sospende
quando è nascosta, sotto un cabinato o coperta da una superficie ufficiale.

Input da chat, pulsanti e altre superfici non sposta il personaggio. Blur,
cambio di focus e visibilità rilasciano i tasti; i listener hanno cleanup
idempotente. Gli echo di posizione locale non cancellano una rotta attiva.
L'avvio incompleto e gli errori ripetuti del rendering liberano le risorse.

Statistiche e scadenze derivano dallo snapshot ufficiale. Le lettere con
ricompense simulate del vecchio prototipo non vengono generate sul sito.

## Verifica

Sono coperti da test contratto look, cache e sprite, concorrenza dei salvataggi,
percorsi e collider, collegamento degli oggetti Piazza, input, proiezione,
qualità e confini CSP/integrazione ufficiale. Typecheck, lint e build production
sono controlli distinti dalla verifica visiva.
La rifinitura del 7 settembre passa 734 test in 145 file con un worker, oltre a
typecheck, lint e build. I test includono maschere dei clic, rilascio della cache,
coordinate non valide, cambio della luce, pose, animazioni e movimento ridotto.

Per questa rifinitura la verifica grafica usa il renderer reale con un canvas
nativo esterno all'app, senza aprire browser o server. Sono stati confrontati
272 render di avatar e animali, incluse le 120 combinazioni look/direzione,
e le tre stanze: fotogrammi animati differenti, fotogrammi ridotti identici,
cache riutilizzata e canvas liberati. Questi controlli non misurano gli FPS
del browser né sostituiscono una prova interattiva sul dispositivo.

La prova browser locale usa il componente reale con fixture esplicite per la
Server Action e le callback della lobby, fuori dal repository. Verifica
rendering, guardaroba, navigazione, cabinati, focus, pausa e layout mobile.
Non attesta persistenza in produzione, una sessione autenticata con due amici
o le prestazioni su un telefono fisico. Nessuna migrazione o modifica al
protocollo di autenticazione è necessaria per questa revisione.
