# Registrazione temporanea dei gap P2P — piano di implementazione

## Stato implementazione

Implementati dietro feature flag: recorder desktop, pre/post-roll, IndexedDB,
consenso esplicito prima dell'upload, BFF same-origin, manifest idempotente,
upload S3 firmato, verifica reciproca tra i due giocatori, cancellazione locale,
pulizia applicativa a scadenza e lifecycle S3. Staff non partecipa al flusso.

La configurazione Terraform passa `fmt` e `validate` con i provider bloccati.
Gli eventi operativi sono ora aggregati e privi di ID. Prima del rollout
restano: creazione di un vero target staging separato, `terraform plan` contro
quell'account/state, migrazioni e prova reale a due PC. La procedura completa è in
`docs/MATCH_GAP_STAGING_RUNBOOK.md`.

## Obiettivo e confini

Quando un giocatore perde il collegamento WebRTC durante un match già connesso,
il suo PC conserva localmente il video della propria webcam per la durata del
gap. Alla riconnessione mostra l'informativa e chiede il consenso: solo dopo
carica quel tratto su storage privato perché l'avversario possa verificarlo.
Nessuna partita completa viene caricata o conservata.

Vincoli del primo rilascio:

- desktop soltanto, con browser che espongono `MediaRecorder` e IndexedDB;
- una registrazione riguarda soltanto lo stream locale del giocatore;
- il live WebRTC resta invariato;
- i file del gap sono un segnale aggiuntivo, non una prova forense;
- il browser non riceve token del Tournament Service o credenziali AWS;
- la feature resta disattivata finché API, bucket e lifecycle non sono pronti.

## Decisione di trasporto

L'upload non usa un `RTCDataChannel`. Nei tornei protetti il collegamento
applica `iceTransportPolicy: "relay"`, quindi anche i dati P2P passerebbero da
TURN. Il recupero usa invece URL S3 monouso e firmati, ottenuti dal Tournament
Service attraverso un BFF same-origin.

Il DataChannel `brx-presence` resta dedicato al solo heartbeat. Separare media
live e recupero evita che un upload saturi la connessione appena ristabilita.

## Ciclo client

### Parametri iniziali

| Parametro | Valore |
|---|---:|
| Durata clip autonoma | 5 secondi |
| Pre-roll | 10 secondi |
| Post-roll | 5 secondi |
| Video target | 1.200.000 bit/s |
| Audio target | 64.000 bit/s |
| Durata massima incidente | 120 secondi |
| Dimensione massima incidente | 32 MiB |
| Concorrenza upload | 2 clip |

Il recorder ruota file completi invece di conservare arbitrariamente una
porzione centrale dei `Blob` prodotti da una singola sessione: lo standard non
garantisce che un singolo blob intermedio sia riproducibile senza i dati di
inizializzazione del contenitore.

### Stato

1. `disabled`: flag spento, browser non supportato, osservatore o match non live.
2. `armed`: il PC produce clip locali e conserva soltanto il pre-roll.
3. `capturing`: dopo una perdita P2P, le clip non vengono più eliminate.
4. `closing`: P2P ristabilito; si attendono 5 secondi di post-roll.
5. `awaiting-consent`: manifest e clip sono completi ma ancora soltanto sul PC.
6. `queued`: il giocatore ha letto l'informativa e autorizzato l'upload.
7. `uploading`: init idempotente, upload firmati, finalize.
8. `uploaded`: il backend ha verificato presenza e dimensione degli oggetti;
   i blob locali vengono eliminati.
9. `failed`: i dati restano locali e il retry riparte su `online`, mount della
   pagina o comando esplicito.

La transizione verso `capturing` è ammessa solo dopo che il link è stato almeno
una volta `connected`. Primo handshake lento e attesa dell'avversario non sono
incidenti.

Se la pagina viene ricaricata, un incidente aperto viene chiuso come
`interrupted` usando l'ultima clip persistita. Non si afferma di aver registrato
il periodo in cui la pagina era chiusa.

## Persistenza browser

Database IndexedDB `ebartex-match-gap-v1`:

### `clips`

- `id`: UUID client;
- `matchId`, `userId`, `recordingSessionId`, `sequence`;
- `startedAt`, `endedAt`, `mimeType`, `byteLength`;
- `incidentId`: UUID client o `null` per il pre-roll sovrascrivibile;
- `blob`.

Indici: `matchUser`, `incidentId`, `endedAt`.

### `incidents`

- `id`: UUID client e chiave idempotente;
- `matchId`, `webcamSessionId`, `userId`;
- `detectedAt`, `captureStartedAt`, `captureEndedAt`;
- `status`, `clipIds`, `byteLength`, `captureCapped`, `interrupted`;
- `uploadConsentedAt` e `uploadConsentVersion`, null finché manca il consenso;
- `remoteIncidentId`, `retryCount`, `nextRetryAt`, `lastError`.

Indici: `matchUser`, `status`, `updatedAt`.

Le clip senza incidente più vecchie del pre-roll vengono eliminate dopo ogni
rotazione. Gli incidenti non caricati hanno anche un TTL locale difensivo di 72
ore; una risposta server `410` elimina subito la copia locale scaduta.

## Contratto HTTP

Il browser chiama esclusivamente i BFF sotto `/api/tournaments/...`. Il BFF
rilegge il cookie HttpOnly e inoltra il Bearer token server-side.

### 1. Preparazione upload

`POST /api/v1/matches/{match_id}/gap-recordings`

Body massimo 64 KiB:

```json
{
  "client_incident_id": "uuid",
  "webcam_session_id": "uuid",
  "detected_at": "ISO-8601",
  "capture_started_at": "ISO-8601",
  "capture_ended_at": "ISO-8601",
  "capture_capped": false,
  "interrupted": false,
  "upload_consented_at": "ISO-8601",
  "upload_consent_version": "peer-gap-review-v1",
  "temporary_storage_acknowledged": true,
  "opponent_review_acknowledged": true,
  "clips": [
    {
      "client_clip_id": "uuid",
      "sequence": 1,
      "started_at": "ISO-8601",
      "ended_at": "ISO-8601",
      "content_type": "video/webm",
      "byte_length": 812345,
      "sha256": "base64"
    }
  ]
}
```

Il backend rifiuta il manifest se manca uno dei campi di consenso. La risposta
restituisce l'ID server e, per ogni oggetto non ancora presente,
un presigned POST con URL e campi firmati. Ripetere la stessa richiesta non
crea una seconda registrazione.

### 2. Upload diretto

Il browser invia ogni clip direttamente al bucket con il presigned POST. Le
policy impongono chiave, content type, checksum e limite di dimensione. Due
upload concorrenti evitano di saturare la rete appena ripristinata.

### 3. Finalizzazione

`POST /api/v1/matches/{match_id}/gap-recordings/{incident_id}/complete`

Il Tournament Service esegue `HeadObject` per ogni clip e verifica chiave,
dimensione, content type e checksum. Solo dopo porta l'incidente a `ready`.
La finalizzazione è idempotente.

### 4. Verifica e cancellazione

Il Tournament Service espone route autenticate per lista del match, dettaglio,
presa visione, ticket media e decisione. Autorizza soltanto i due partecipanti;
l'uploader non può aprire o verificare i propri frammenti. Prima del ticket,
l'avversario deve accettare l'informativa versionata.

Una decisione `verified` salva giocatore, reason code e timestamp e cancella
subito le clip S3. `rejected` apre invece la contestazione e conserva gli
oggetti privati solo fino alla scadenza massima di 72 ore. Il giocatore che ha
contestato può chiudere una disputa risolta e cancellarli prima; l'uploader non
può farlo unilateralmente. La stessa decisione è idempotente.

## Modello backend

`match_gap_recordings`:

- ID server, ID client, match e utente;
- intervallo dichiarato, stato e flag di completezza;
- conteggio clip, byte totali, scadenza;
- consenso dell'uploader e presa visione dell'avversario, entrambi versionati;
- timestamp di creazione, completamento, verifica e cancellazione;
- unique `(match_id, user_id, client_incident_id)`.

`match_gap_clips`:

- incidente, ID client, sequenza e intervallo;
- chiave storage generata dal server;
- dimensione, content type e SHA-256;
- unique `(recording_id, client_clip_id)` e `(recording_id, sequence)`.

## Limiti e controlli

- soltanto i due partecipanti possono creare incidenti per il proprio video;
- massimo 32 clip e 32 MiB per incidente;
- durata dichiarata massima 120 secondi, tolleranza clock 30 secondi;
- massimo 5 incidenti per utente e match;
- rate limit distribuito per attore e IP su init e complete;
- chiavi storage non fornite dal client;
- bucket privato, public access block, ownership enforced, cifratura server-side;
- CORS limitato all'origin tornei e solo al metodo necessario;
- nessun URL firmato scritto nei log o nel database;
- metriche solo aggregate: incidenti, byte, errori, tempo di upload e cleanup;
- un video assente, interrotto o non caricabile viene mostrato come dato
  incompleto, mai trasformato automaticamente in una sanzione.

## Rollout

1. Recorder, IndexedDB e test della macchina a stati dietro feature flag.
2. API, modello Alembic, adapter S3 e test di autorizzazione/idempotenza.
3. BFF, uploader e retry persistente.
4. Bucket, IAM, CORS e lifecycle.
5. API e UI di verifica reciproca, informativa e cancellazione immediata.
6. Provisioning staging e migrazioni, senza token o permessi Staff.
7. Test reali con Chrome/Edge/Firefox desktop: perdita WAN, flap, 90 secondi,
   reload, quota piena e upload interrotto.
8. Abilitazione al 5% con metriche, poi progressiva.

Non esistono secret o permessi Staff per questa funzione. Restano necessari il
bucket privato, IAM limitato al prefisso, CORS dell'origin tornei e il normale
JWT dei due giocatori già usato dalle API del match.

## Criteri di accettazione

- match senza disconnessioni: nessun byte caricato e nessun file completo
  conservato localmente;
- gap di 30 e 90 secondi: pre-roll, gap e post-roll presenti per entrambi i PC;
- nessun incidente prima della prima connessione P2P;
- doppio init/finalize non duplica righe o oggetti;
- reload conserva una coda incompleta senza inventare copertura video;
- dopo conferma backend i blob locali spariscono;
- dopo la verifica dell'avversario gli oggetti S3 spariscono immediatamente e il record
  conserva soltanto metadati audit;
- una contestazione conserva gli oggetti soltanto fino al TTL di 72 ore;
- dopo 72 ore gli oggetti non verificati spariscono dallo storage;
- l'upload non usa TURN e non degrada audio/video appena riconnessi.
