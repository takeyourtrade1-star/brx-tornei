# Verifica backend WebRTC, TURN e privacy IP

Documento di passaggio per il PC che gestisce il repository backend `tournaments`.

- Backend: `C:\Users\xheta\repos\tournaments`
- Frontend: `C:\Users\xheta\Documents\GitHub\brx-tornei`
- Contratto frontend di riferimento: commit `9d0f870`
- Data verifica: 13 luglio 2026

## Obiettivo

Verificare e, dove indicato, correggere il backend che gestisce tavoli 1v1,
signaling WebRTC, credenziali TURN e scelta privacy `with_friend`.

Il risultato è accettabile soltanto con signaling riservato ai partecipanti,
TURN obbligatorio senza consenso IP, fallback espliciti e test automatici.

## Contratto atteso dal frontend

### Creazione tavolo

`POST /api/v1/tournaments`

```json
{
  "format": "modern",
  "mode": "1v1",
  "bestOf": "BO3",
  "isPrivate": false,
  "withFriend": false
}
```

- `withFriend: false` o omesso: modalità protetta, IP nascosti, TURN obbligatorio.
- `withFriend: true`: P2P diretto consentito, IP visibile all'altro giocatore.
- La risposta deve contenere `with_friend` e `webcam_session_id`.
- Il valore non deve essere modificabile dopo la creazione del tavolo.

### Avvio match

Il match deve essere creato solo quando entrambi i partecipanti sono pronti.
La risposta di `ready` e le successive `GET /api/v1/tournaments/{id}` devono
restituire al partecipante `match_id`, `match_webcam_session_id` e lo stesso
`with_friend` del tavolo.

Un osservatore non deve ricevere le chiavi della sessione match.

### Configurazione ICE

`GET /api/v1/signaling/ice-servers?session_id={match_webcam_session_id}`

```json
{"data":{"ice_servers":[],"expires_at":"ISO-8601 UTC","force_relay":true}}
```

- `force_relay` deve essere `true` salvo tavolo `with_friend=true`.
- In modalità protetta deve essere presente almeno un URL `turn:` o `turns:`.
- Le credenziali TURN devono essere temporanee e scadere secondo
  `TURN_TTL_SECONDS`.

### Signaling

- `GET /api/v1/signaling/{session_id}/messages?role=host&since=0`
- `POST /api/v1/signaling/{session_id}/messages`

Il frontend assegna `host` al partecipante con UUID lessicograficamente minore
e `guest` all'altro partecipante.

I messaggi hanno tipo `offer`, `answer`, `candidate` o `bye`. Il campo `data`
contiene anche un `attemptId`; non deve essere trasformato dal backend.

## P0 — correzioni bloccanti

### 1. Autorizzare la sessione, non soltanto il JWT

Attualmente `app/api/v1_signaling.py` verifica il JWT ma non verifica che il
richiedente appartenga alla sessione. Inoltre accetta il ruolo dichiarato dal
client. Un utente autenticato che conosce un UUID potrebbe quindi leggere o
iniettare offer, answer e candidati ICE.

- tipizzare `session_id` come `UUID`, non come stringa arbitraria;
- risolvere sia la sessione lobby sia la sessione match;
- estrarre `user_id` dal `sub` validato;
- accettare solo un partecipante del tavolo;
- per la sessione match accettare solo `player_1_id` o `player_2_id`;
- derivare il ruolo lato server oppure confrontarlo con il ruolo atteso;
- rifiutare osservatori e utenti esterni con `403` o `404` coerente;
- rifiutare sessioni inesistenti e match conclusi;
- applicare gli stessi controlli a lettura e scrittura.

Casi automatici obbligatori:

- nessun token → `401`;
- token scaduto o `sub` non UUID → `401`;
- utente esterno con sessione valida → `403/404`;
- partecipante che dichiara il ruolo dell'avversario → `403`;
- partecipante corretto → `200`;
- sessione inventata → `404` senza creare chiavi Redis.

### 2. TURN protetto deve fallire chiuso

Attualmente `build_ice_servers()` cambia `force_relay` da `true` a `false`
quando `TURN_HOST` o `TURN_SECRET` mancano. Questo indebolisce la privacy.

Correzione richiesta:

- se `force_relay=true` e TURN non è configurato, rispondere `503` con un codice
  stabile, per esempio `TURN_UNAVAILABLE`;
- non restituire `force_relay=false` e non autorizzare STUN-only;
- non inserire segreti nei log;
- mantenere STUN-only possibile esclusivamente per `with_friend=true`.

Il frontend applica già `iceTransportPolicy: "relay"` senza consenso, ma la
garanzia deve esistere anche sul backend.

## P1 — solidità raccomandata

### Errori e limiti

- Convertire Redis non disponibile in `503 SIGNALING_UNAVAILABLE`, non in `500`.
- Mantenere limite messaggio a 64 KiB, TTL a 1 ora e massimo 500 messaggi.
- Aggiungere rate limit per utente/sessione a GET e POST signaling.
- Verificare che una richiesta rifiutata non crei contatori o liste Redis.
- Valutare un TTL più lungo se una partita può superare un'ora.
- Aggiungere test di retry dopo riavvio del task ECS: Redis esterno deve
  conservare i messaggi fino al TTL.

### TURN e reti restrittive

Il backend oggi pubblica TURN UDP e TCP sulla porta 3478.

Verificare sul server coturn:

- servizio attivo e avvio automatico;
- `use-auth-secret` abilitato;
- secret identico a `TURN_SECRET` del backend;
- 3478 UDP/TCP raggiungibile;
- range relay UDP 40000–49999 raggiungibile;
- realm corretto;
- credenziali HMAC-SHA1 temporanee realmente accettate;
- log privi di errori di autenticazione o allocation.

Per reti aziendali o mobili molto restrittive è raccomandato anche TURN/TLS su
443 (`turns:`). Senza 443, se 3478 è bloccata il fallback TCP non basta.

### Health e osservabilità

`GET /api/tournaments/health` verifica già database e Redis. Aggiungere o
documentare separatamente:

- `turn_configured`: host e secret presenti, senza esporne i valori;
- smoke test esterno che crei davvero una TURN allocation;
- metriche Redis errori/latency;
- banda e allocation coturn;
- conteggio risposte `TURN_UNAVAILABLE` e `SIGNALING_UNAVAILABLE`;
- allarme banda TURN, perché il relay non è gratuito.

Nota: l'emissione di credenziali TURN non prova che il traffico sia transitato
dal relay. La fonte attendibile è coturn; lato browser lo conferma la candidate
pair selezionata e il badge `Relay TURN` del frontend.

## Matrice fallback da collaudare

| Modalità | Condizione | Risultato atteso |
|---|---|---|
| Protetta | TURN sano | Solo relay, badge `Relay TURN`, IP peer non esposto |
| Protetta | TURN assente o irraggiungibile | Errore esplicito, mai P2P diretto |
| Amici | NAT compatibile | P2P diretto, badge `P2P diretto` |
| Amici | CGNAT/NAT simmetrico | Fallback TURN |
| Amici | UDP bloccato | TURN TCP 3478 |
| Amici | 3478 bloccata | Fallisce oggi; deve riuscire dopo TURN/TLS 443 |
| Amici | TURN down ma P2P possibile | P2P diretto |
| Amici | TURN down e P2P impossibile | Errore di connessione |
| Qualsiasi | Redis down prima dell'handshake | `503`, connessione non avviata |
| Qualsiasi | Redis down dopo `connected` | Video continua; riconnessione non disponibile |
| Qualsiasi | API down dopo `connected` | Video già stabilito continua; retry/new ICE falliscono |
| Qualsiasi | Task ECS riavviato | Nuovo task legge la stessa sessione da Redis |

Eseguire la matrice con due utenti reali e, almeno, queste combinazioni:

1. stessa LAN;
2. due reti domestiche differenti;
3. Wi-Fi contro hotspot 4G/5G;
4. UDP bloccato;
5. TURN fermato intenzionalmente;
6. Redis fermato prima e dopo la connessione.

Durante ogni test raccogliere `chrome://webrtc-internals`, candidate pair
selezionata, log API, log Redis e log coturn. Non pubblicare IP o credenziali
nel report condiviso.

## Costi: interpretazione corretta

“P2P senza costi” significa soltanto che il video diretto non consuma banda
del server TURN. Non significa infrastruttura completamente gratuita.

- P2P diretto: banda video a carico dei due utenti.
- Signaling: usa comunque ALB/API/ECS/Redis durante l'handshake.
- Il frontend interroga ogni 600 ms finché si connette, poi interrompe il polling.
- TURN protetto: tutta la banda audio/video passa dal server Hetzner.
- TURN fallback in modalità amici: genera costo soltanto quando viene selezionato.
- AWS, Hetzner e IP pubblici hanno costi fissi anche senza partite.

Registrare almeno banda TURN giornaliera, picco di allocation contemporanee,
tempo medio di handshake e percentuale direct/relay.

## Test automatici da aggiungere

Creare una suite backend, oggi assente o non evidente, che copra almeno:

- serializzazione e persistenza `with_friend` true/false;
- risoluzione sessione lobby e sessione match;
- autorizzazione partecipante/estraneo e validazione ruolo;
- sessione inesistente senza scrittura Redis;
- `force_relay=true` per default, sessione ignota e tavolo protetto;
- `force_relay=false` soltanto per tavolo amici autorizzato;
- `503` quando TURN è richiesto ma non configurato;
- formato e scadenza delle credenziali TURN;
- HMAC calcolato con il secret previsto;
- TTL Redis, sequenza crescente, filtro `since`, trim a 500 messaggi;
- messaggio oltre 64 KiB rifiutato;
- Redis indisponibile tradotto in errore stabile;
- ready concorrente/idempotente: viene creato un solo match e un solo UUID webcam.

Comandi minimi finali, adattandoli alla suite scelta:

```bash
python -m compileall app
alembic current
alembic heads
pytest -q
```

## Evidenze da restituire

Il PC backend deve produrre un report finale con:

- commit backend applicato;
- elenco file modificati;
- output sintetico di migrazioni e test;
- esito di ogni riga della matrice fallback;
- conferma esplicita che la modalità protetta non degrada a direct;
- conferma autorizzazione signaling con test negativo utente estraneo;
- candidate type selezionato nei test direct e relay;
- porte TURN effettivamente aperte;
- eventuale decisione su TURN/TLS 443;
- stima del costo/banda osservata, distinguendo costi fissi e relay.

Non dichiarare il backend “solido” se i due P0 non sono risolti e coperti da
test automatici.
