# Runbook staging — frammenti webcam durante disconnessione

## Blocco iniziale rilevato

Lo stack in `tournaments/infra/terraform` è dichiarato **production-only** e
usa lo state `tournaments/terraform.tfstate`. Contiene inoltre drift noto che
rende non sicuro un apply non mirato. Non usare quello state come staging e non
accettare mai production come fallback quando un valore staging manca.

Prima del rollout deve esistere un target staging separato con:

- account AWS atteso e verificato con `sts:GetCallerIdentity`;
- bucket/key Terraform staging distinti, versionati, cifrati e con lockfile;
- hostname, certificato ACM, origin frontend e image digest staging;
- database e ruoli runtime/migration dedicati;
- Redis TLS, ECR, S3 e SSM staging separati;
- un ambiente Staff staging con hostname e secret propri.

## Gate 1 — sorgente riproducibile

1. Non costruire immagini da worktree sporchi o con file non tracciati.
2. Rieseguire le suite dei tre repository dal commit candidato.
3. Pubblicare immagini immutabili e annotare digest, commit e SBOM.
4. Verificare le catene Alembic:
   - Auth: `012_tournament_gap_review` come unico head;
   - Tournaments: `006` come unico head.

## Gate 2 — secret e autorizzazioni

Generare un token casuale di almeno 32 caratteri con il workflow secret
approvato. Lo stesso valore deve essere disponibile soltanto come:

- Tournaments: `/tournaments-staging/MATCH_GAP_STAFF_API_TOKEN`;
- Staff staging: `/staging/ebartex/staff/tournament_api_token`.

Non stamparlo, non inserirlo in tfvars/state e non riusarlo per Auth, Support o
fingerprint. Configurare inoltre nello Staff staging:

- `tournament_internal_origin`;
- `tournament_allowed_hosts`;
- `tournament_media_allowed_hosts`, con l'hostname S3 esatto.

Applicare la migrazione Auth e assegnare manualmente al ruolo collaudatore:

- `tournament.gap_recording.read`;
- `tournament.gap_recording.review`;
- scope `queue:tournament_gap_review`.

Nessun ruolo riceve questi permessi automaticamente.

## Gate 3 — Terraform plan separato

Inizializzare Terraform con un `backend.staging.hcl` esterno al repository. Il
plan deve usare almeno:

- `project=tournaments-staging`;
- `desired_count=0` per il bootstrap;
- `match_gap_recording_enabled=false`;
- image digest, DNS, ACM, issuer, audience e CORS esclusivamente staging.

Salvare il plan fuori dal repository. Fermarsi se il piano:

- legge lo state o nomina risorse `tournaments` production;
- distrugge o sostituisce risorse esistenti;
- modifica RDS/Redis/security group non appartenenti allo staging;
- contiene secret o valori sensibili inattesi.

Dopo revisione a quattro occhi, applicare il plan bootstrap mirato. Non usare
`-target` per mascherare dipendenze non comprese: ogni target deve essere
motivato e il plan completo deve comunque essere letto.

## Gate 4 — migrazioni e deploy con flag spento

1. Eseguire una sola task migrazione Auth con ruolo DB dedicato; richiedere exit
   code 0 e `alembic check` pulito.
2. Eseguire una sola task migrazione Tournaments; richiedere exit code 0.
3. Distribuire Tournaments e Staff con il recorder disattivato.
4. Verificare `/livez`, `/readyz`, login Staff MFA e risposta fail-closed della
   coda quando la feature è spenta.
5. Abilitare prima backend/bucket/Staff, poi il flag client sul solo gruppo di
   collaudo.

Le migrazioni sono additive: in rollback spegnere i flag e lasciare che TTL e
cleanup eliminino i file. Non eseguire downgrade distruttivi durante un
incidente.

## Gate 5 — prova reale su due PC

Usare due PC fisici, account di test e webcam diverse. Per ogni browser desktop
supportato eseguire entrambe le modalità ICE disponibili nello staging:

| Caso | Atteso |
|---|---|
| Match senza gap | zero incidenti e zero byte caricati |
| Gap 30 secondi | pre-roll, gap e post-roll; match continua |
| Gap 90 secondi | copertura fino al limite, upload dopo reconnect |
| Gap oltre grace | nessuna pretesa di copertura oltre la chiusura match |
| Flap ripetuto | incidenti limitati, nessun duplicato |
| Reload offline | incidente `interrupted`, nessun intervallo inventato |
| Upload interrotto | retry idempotente dopo ritorno rete |
| IndexedDB pieno | avviso e fallimento sicuro, match non bloccato |
| P2P diretto | upload HTTPS non usa il DataChannel |
| P2P via TURN | upload HTTPS non aumenta il traffico TURN |

Raccogliere `RTCPeerConnection.getStats()` soltanto per confermare il tipo di
candidate pair e i byte TURN; non salvare SDP, IP, video o identificativi utenti
nei documenti di evidenza.

## Gate 6 — Staff, cancellazione e telemetria

1. Aprire la coda con un operatore `read`: può vedere e riprodurre, non decidere.
2. Verificare che il browser non riceva hostname/query presigned S3 nel markup,
   nelle API JSON o nella console.
3. Con un operatore `review`, salvare una decisione e confermare:
   - audit con subject, reason code e timestamp;
   - oggetti S3 assenti subito dopo la risposta;
   - ticket media successivo rifiutato;
   - stessa decisione idempotente e decisione opposta in conflitto.
4. Verificare nei log soltanto gli eventi aggregati:
   - `match_gap_event=ready`;
   - `match_gap_event=reviewed`;
   - `match_gap_event=expired`;
   - `match_gap_event=storage_error`.

I log non devono contenere recording ID, match ID, user ID, object key, token o
URL firmati.

## Gate 7 — rollout progressivo

Procedere 5% → 25% → 100% soltanto se, per almeno una finestra completa di TTL:

- non cresce `storage_error`;
- byte e durata media sono coerenti con i limiti;
- il numero di incidenti non supera quello delle disconnessioni osservate;
- gli oggetti revisionati spariscono subito e gli altri entro 72 ore;
- audio/video live e traffico TURN non peggiorano dopo il reconnect.

Arrestare il rollout spegnendo il flag client e poi quello backend. Conservare
soltanto metadati audit e misure aggregate; mai esportare le clip come evidenza
di test permanente.
