# Load test Tornei

Harness protocol-level per tavoli heads-up reali. Una coppia di identità crea un
tavolo, esegue join/ready, apre i canali realtime, simula signaling e letture
live, quindi chiude il risultato per consenso.

## Cosa misura

- RSC/Next attraverso `tornei.ebartex.com` (opzionale ma raccomandato);
- REST Tournament Service: profilo, tavolo, reputazione e telemetria;
- due WebSocket per giocatore: eventi torneo e chat/presenza;
- burst iniziale di authorize, ICE e polling signaling;
- create/join/ready e risultato consensuale;
- 429, 5xx, p95/p99, autenticazione WS e chiusure inattese.

Non genera media WebRTC. Coturn va provato separatamente con browser/fake media
e con `turnutils_uclient`; lo signaling riuscito non dimostra che il relay video
regga la banda.

## Identità

Preparare fuori dal repository un JSON come `users.example.json`. Servono
identità Auth distinte, senza MFA, con gamertag già impostato. Ogni record deve
contenere `accessToken` e `refreshToken`; il refresh è necessario per prove oltre
la durata dell'access token. Non riusare lo stesso JWT: i lock, le quote attore e
la regola `ALREADY_SEATED` renderebbero il test non rappresentativo. Il runner
valida numero pari di identità, UUID, claim `exp` e presenza dei refresh token
prima di avviare Docker, senza stampare i token.

Il file reale è escluso da Git. Il backend consente al protocol test di omettere
`deckId`; questo collauda orchestrazione e infrastruttura, non la validazione dei
mazzi. Un canary browser separato deve coprire l'intero percorso UI con mazzi
reali. Il test crea dati reali (tavoli, join, ready e risultati): usare account
tecnici dedicati e una finestra concordata, anche quando il target è un ambiente
di produzione. Distribuire il file tra i generatori solo con un canale per
segreti autorizzato; non copiarlo in Git, issue, chat o log.

## Profili

- `smoke`: 2 giocatori, 1 match, circa 40 secondi.
- `rehearsal`: 30 giocatori, 15 match, circa 23 minuti.
- `capacity`: rampa 20 -> 50 -> 100 -> 200.
- `soak`: 30 giocatori per 60 minuti.
- `stress`: rampa oltre la capacità attesa, solo dopo aver fissato i limiti e
  concordato l'esecuzione con chi osserva l'infrastruttura.

Gli stage si possono sostituire con `LOAD_STAGES`, nel formato k6
`durata:giocatori`, per esempio `30s:2,3m:20,10m:30,30s:0`.

`capacity` e `stress` richiedono rispettivamente almeno 200 e il numero di
identità indicato dagli stage. Il profilo `soak` dura poco più di un'ora
considerando rampa e discesa; i tempi di preparazione delle coppie sono
aggiuntivi.

## Esecuzione locale

Avviare backend e frontend locali, quindi:

```bash
USERS_FILE=/private/tmp/ebartex-load/users.json \
LOAD_PROFILE=smoke \
AUTH_BASE_URL=https://api.ebartex.com \
LOAD_TEST_CONFIRM_HOSTS=api.ebartex.com \
npm run load:tornei
```

`AUTH_BASE_URL` è obbligatorio e va scelto esplicitamente per gli account del
file (nell'esempio usa l'Auth remoto); se punta a un hostname remoto, aggiungerlo a
`LOAD_TEST_CONFIRM_HOSTS`. In questo modo un run locale non può contattare
l'Auth di produzione per un refresh senza una scelta esplicita.

Il runner usa l'immagine `grafana/k6:2.1.0`, non installa pacchetti npm e salva
il riepilogo in `artifacts/load-tests/`. Ogni run usa per default un nome con
timestamp UTC e shard, ad esempio
`capacity-20260901T120000Z-generator-1-of-4-summary.json`; è possibile
impostare `LOAD_RUN_ID` o `LOAD_RESULT_FILE` (un semplice nome `.json`) per
controllare il nome. Il file delle identità viene montato in Docker come singolo
volume read-only, non come intera directory dei segreti.

Se `LOAD_INCLUDE_FRONTEND=true` (default), `LOAD_INCLUDE_BACKEND_READS` è false
di default perché la pagina live genera già le letture RSC/BFF; impostarlo a
`true` solo per un run combinato intenzionale. Con `LOAD_INCLUDE_FRONTEND=false`
le letture REST dirette tornano attive di default.

## Produzione controllata

Un target remoto viene rifiutato finché tutti gli hostname remoti non sono
confermati letteralmente. Esempio smoke:

```bash
USERS_FILE=/private/tmp/ebartex-load/users.json \
LOAD_PROFILE=smoke \
LOAD_TEST_CONFIRM_HOSTS=api-tornei.ebartex.com,tornei.ebartex.com,api.ebartex.com \
TOURNAMENTS_BASE_URL=https://api-tornei.ebartex.com \
TOURNAMENTS_FRONTEND_URL=https://tornei.ebartex.com \
TOURNAMENTS_WS_ORIGIN=wss://api-tornei.ebartex.com \
AUTH_BASE_URL=https://api.ebartex.com \
BROWSER_ORIGIN=https://tornei.ebartex.com \
npm run load:tornei
```

Il comando sopra è intenzionalmente esplicito: eseguirlo solo con account
tecnici, in finestra concordata, e dopo aver aperto dashboard/log di ALB, ECS,
RDS, Redis, Hostinger e coturn. Il guard non è un'autorizzazione operativa né
un limite di velocità.

Frontend e backend hanno hostname e percorsi diversi. Per isolare un problema,
eseguire due run esplicitamente separati:

1. end-to-end RSC con `LOAD_INCLUDE_BACKEND_READS=false` e frontend remoto;
2. protocol-level con `LOAD_INCLUDE_FRONTEND=false` e backend remoto.

Nel primo run lasciare attivi solo gli scenari realmente necessari (per esempio
disabilitando signaling e WebSocket se si sta misurando esclusivamente RSC). Il
secondo misura direttamente il servizio Tournament; non dimostra il percorso
Next/BFF.

Quando si vuole misurare anche il signaling nel percorso browser → BFF →
Tournament Service, aggiungere al primo run
`LOAD_SIGNALING_VIA_FRONTEND=true`: usa le route same-origin
`/api/tournaments/signaling/*` e `/api/tournaments/ice-servers`, con i cookie di
sessione e l'header `Origin`. Il percorso diretto resta il default per isolare il
backend. Create/join/ready del setup sono volutamente protocol-level, perché
sono Server Actions e non hanno un endpoint browser pubblico equivalente.

## Generatori distribuiti

Il file utenti è ordinato per coppie. Per `N` generatori, ogni runner usa:

```bash
LOAD_GENERATOR_COUNT=N
LOAD_GENERATOR_INDEX=0   # poi 1 ... N-1
```

Le coppie vengono shardingate senza separare i due avversari. I risultati JSON
sono nominati per indice; conservarli tutti per aggregare il run. Con due WS
per giocatore e limite live di 8 socket/IP, non assegnare più di quattro
giocatori a ciascun IP pubblico del generatore se l'obiettivo è misurare la
capacità distribuita e non il guardrail per-IP.
Non configurare più generatori delle coppie disponibili: ogni shard deve
ricevere almeno una coppia, altrimenti il run viene rifiutato.

Questo limite riguarda il generatore, non i partecipanti reali: 20/30 persone
possono collegarsi da reti diverse senza condividere il Wi-Fi. Le WebSocket del
browser vanno direttamente all'ALB e quindi seguono gli IP pubblici reali. Le
letture REST/RSC che passano dal frontend possono invece concentrarsi sull'IP o
sugli IP di uscita del BFF/Hostinger; per questo la capacità va verificata sia
con il protocol test diretto sia con il run attraverso il dominio frontend.

Per 100/200 giocatori usare più macchine o runner con IP pubblici distinti, non
più processi sullo stesso laptop: ogni processo conserva comunque il limite
per-IP del proprio egress. Coordinare gli stessi `N`, gli indici `0..N-1` e lo
stesso file utenti su tutti i generatori, poi unire i JSON senza sovrascriverli.
Con due socket per giocatore e un limite effettivo di 8 socket per IP, il caso
peggiore richiede rispettivamente 25/50 IP pubblici per 100/200 giocatori; prima
del run verificare l'ambito reale del limiter e il piano di distribuzione.

Il protocol test non simula la banda video. WebRTC media e TURN richiedono un
test separato con browser/fake media e `turnutils_uclient`; un signaling riuscito
non dimostra che il relay regga la banda o che la webcam funzioni.

## Gate iniziale

Il run è considerato non superato se presenta:

- qualunque 429 o 5xx;
- create/join/ready/result non riuscito;
- p95 letture o mutazioni oltre 1 s, p99 oltre 2 s;
- p95 pagina frontend oltre 2 s, p99 oltre 3 s;
- meno del 99,5% dei WebSocket autenticati;
- chiusure WebSocket inattese;
- match duplicati/mancanti o risultato non completato.

Durante il run osservare anche ALB, ECS, RDS, Redis, Hostinger e coturn. Il JSON
client da solo non può rilevare pool esauriti, autoscaling mancato o banda TURN.
