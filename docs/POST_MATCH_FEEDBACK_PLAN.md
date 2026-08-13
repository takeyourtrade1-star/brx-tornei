# POST-MATCH FEEDBACK — Spec Backend

> Piano di implementazione lato Tournament Service per le valutazioni
> in-game. Il frontend è già pronto: consuma questi tre endpoint con i
> payload descritti sotto (`lib/data/match-feedback.ts`,
> `lib/validations/match-feedback.ts`, `actions/feedback.ts`).

## Obiettivo

- A fine partita per **abbandono/disconnessione** (`endReason = leave`),
  il giocatore rimasto compila un "rapporto di battaglia" leggero:
  conferma dell'esito + qualità della connessione percepita.
- A fine partita **regolare** (`endReason = reported`), entrambi i
  giocatori possono consegnare all'avversario un **titolo** (badge)
  positivo o una segnalazione negativa, stile honor.
- I dati alimentano la sezione "Valutazioni In-Game" della pagina
  `/partite` (GET riepilogo).

## Contratto API

### 1. `POST /api/v1/matches/{matchId}/end-feedback`

Autenticato. Accessibile solo ai partecipanti del match (`matchId`).

```json
{
  "disconnect_confirmed": true,
  "connection": "smooth" | "some_issues" | "poor"
}
```

Risposta `200`:

```json
{ "data": { "status": "ok" | "already_submitted" } }
```

Errori: `404` match inesistente, `403` non partecipante, `409` match
non chiuso con `endReason = leave`, `422` payload non valido.

### 2. `POST /api/v1/matches/{matchId}/opponent-badge`

Autenticato. Accessibile solo ai partecipanti del match.

```json
{ "badge": "friendly" }
```

Risposta `200` identica al punto 1. Errori: `422` badge sconosciuto
(vincolare all'enum), `409` match non chiuso con `endReason = reported`.

### 3. `GET /api/v1/players/me/match-feedback`

Autenticato. Riepilogo del giocatore corrente.

```json
{
  "data": {
    "badges": [
      { "badge": "friendly", "count": 3 },
      { "badge": "laggy", "count": 1 }
    ],
    "connection_reports": { "smooth": 8, "some_issues": 2, "poor": 1 }
  }
}
```

- `badges`: solo i badge con `count > 0`, aggregati per tipo.
- `connection_reports`: i rapporti di connessione **inviati da me**
  (non quelli ricevuti), aggregati per livello.

## Enum badge (15)

Positivi: `friendly`, `kind`, `great_player`, `sportive`, `strategist`,
`creative_genius`, `fast_play`, `mentor`, `funny`, `table_legend`.
Negativi: `offensive`, `unfair`, `laggy`, `staller`, `arrogant`.

## Modello dati

```sql
CREATE TABLE match_feedback (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id      UUID NOT NULL REFERENCES matches(id),
  from_user_id  UUID NOT NULL,
  to_user_id    UUID,                -- null per i rapporti di connessione
  kind          TEXT NOT NULL CHECK (kind IN ('end_feedback', 'opponent_badge')),
  badge         TEXT,                -- valorizzato solo per opponent_badge
  disconnect_confirmed BOOLEAN,      -- valorizzato solo per end_feedback
  connection    TEXT,                -- 'smooth' | 'some_issues' | 'poor'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, from_user_id, kind)  -- idempotenza
);
```

## Regole di business

1. **Idempotenza**: una submission per `(match_id, from_user_id, kind)`.
   La seconda chiamata non modifica nulla e risponde `already_submitted`.
   L'unicità va gestita con un vincolo + upsert o con `INSERT ... ON
   CONFLICT DO NOTHING`, non con check applicativi (race safe).
2. **Validazione enum**: `badge` e `connection` accettano solo i valori
   dell'enum; il resto è `422`.
3. **Chiusura del match**: accettare `end_feedback` solo per match
   `endReason = leave` e `opponent_badge` solo per match
   `endReason = reported`, pena `409`. Il timeout chiuso (`timeout`)
   non accetta feedback (scelta prodotto: nessuna domanda).
4. **`to_user_id`**: per i badge è l'avversario del match; derivarlo
   sempre lato server dalla composizione del match, mai dal payload.
5. **Aggregazione**: la GET riepilogo aggrega con GROUP BY, cache breve
   (o nessuna), risposta snella (`cache: no-store` dal client).
6. **Moderazione**: i badge negativi non sono mai visibili pubblicamente
   e non producono sanzioni automatiche. Il conteggio è esposto solo al
   giocatore che li ha ricevuti (già garantito: la GET è `/me`).
7. **Segnalazioni spurie**: eventuali soglie/regole anti-abuso (es.
   minimo di durata match, cooldown) sono decisioni di prodotto future;
   il ledger grezzo resta disponibile per l'analisi.

## Note di sicurezza

- Auth: stesso Bearer token SSO degli altri endpoint.
- Verifica che `from_user_id` (dal token) sia un partecipante del match.
- Log minimale, nessun contenuto libero (niente testo utente: solo enum).

## Rollout

1. Migrazione tabella + vincoli unici.
2. Endpoint POST (idempotenti) + GET riepilogo.
3. Switch automatico del frontend: nessun cambio codice, i client
   esistenti iniziano a funzionare appena gli endpoint rispondono
   (il fetch attuale fallisce in modo non bloccante fino ad allora).
