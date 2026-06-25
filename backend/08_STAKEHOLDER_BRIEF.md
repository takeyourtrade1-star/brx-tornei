# 08 — Documento Informativo per Stakeholder

> **Tipo di documento**: Briefing per decisori e team tecnico  
> **Versione**: 1.0  
> **Data**: Giugno 2026  
> **Lingua**: Italiano  
> **Destinatari**: Project Owner (non tecnico), CTO, Senior Developer, Investitori  
> **Stato del progetto**: In sviluppo attivo — Fasi 8–11 in corso

---

# Ebartex Tornei — Piattaforma Tornei TCG Live

---

## Sezione 1: Panoramica del Progetto

### 1.1 Cosa Stiamo Costruendo

Ebartex Tornei è una **piattaforma digitale per organizzare e guardare tornei di giochi di carte collezionabili (TCG) in diretta video**. Immagina un campo da tennis virtuale dove due giocatori si sfidano con la loro webcam accesa, mentre il pubblico guarda in diretta come se fosse una partita di calcio in streaming.

La piattaforma si integra direttamente con il sito ebartex.com già esistente — che gestisce gli account degli utenti, il catalogo delle carte e il motore di ricerca — aggiungendo tutto il necessario per **gestire tornei live con video, tessere associative e una sala arcade virtuale**.

**In parole semplici**: Ebartex Tornei porta i tornei di carte dal tavolo fisico al mondo digitale, con video live, classifiche in tempo reale e una community organizzata tramite tessera associativa.

### 1.2 Come Si Integra con ebartex.com

ebartex.com è già una piattaforma funzionante che offre:
- **Account e login (SSO)**: Gli utenti hanno già un account su ebartex.com
- **Catalogo carte e inventario**: Le carte dei giocatori sono già nel sistema
- **Motore di ricerca (Meilisearch)**: I tornei saranno cercabili insieme alle carte

Ebartex Tornei si aggiunge come un **nuovo servizio separato** (microservizio) che si "aggancia" all'infrastruttura esistente:

```
ebartex.com (già esistente)
    ├── Account e autenticazione ─────────────────────►┐
    ├── Catalogo carte                                  │ usa per
    ├── Motore di ricerca ────────────────────────────► │ autenticare
    │                                                   │ i giocatori
    └── [NUOVO] Ebartex Tornei ◄────────────────────────┘
            ├── Gestione tornei
            ├── Match 1v1 con video
            ├── Sistema tessera associativa
            └── Sala arcade virtuale
```

**Vantaggi di questa architettura**: Non si riparte da zero. Il login degli utenti, le loro carte e la ricerca funzionano già. La piattaforma tornei si costruisce sopra quello che c'è.

### 1.3 I Tre Attori della Piattaforma

La piattaforma è progettata per tre tipi di utenti con esperienze molto diverse:

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🏆 ORGANIZZATORE / HOST                                              │
│ Chi è: Il giocatore che crea il torneo                               │
│ Cosa fa: Apre la stanza, gestisce la partita, condivide la webcam    │
│ Tecnologia: Webcam bidirezionale + streaming per gli spettatori      │
│ Accesso richiesto: Tessera associativa attiva                        │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 🎮 GIOCATORE / PARTECIPANTE                                          │
│ Chi è: Il giocatore che si iscrive al torneo                         │
│ Cosa fa: Si unisce alla stanza 1v1, gioca con la propria webcam      │
│ Tecnologia: Webcam bidirezionale (si vede con l'organizzatore)       │
│ Accesso richiesto: Tessera associativa attiva                        │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 👁️ SPETTATORE                                                        │
│ Chi è: Chiunque voglia guardare la partita in diretta                │
│ Cosa fa: Guarda il video live come su YouTube/Twitch, in sola lettura│
│ Tecnologia: Video in streaming (no webcam richiesta)                 │
│ Accesso richiesto: Nessuno (guardare è gratuito)                     │
└──────────────────────────────────────────────────────────────────────┘
```

Questa distinzione è **fondamentale** dal punto di vista tecnico: organizzatore e giocatore hanno bisogno di video bidirezionale (si vedono a vicenda), mentre lo spettatore vede solo un flusso video in uscita — come Twitch. Le infrastrutture necessarie sono completamente diverse e scalano in modo diverso.

### 1.4 Visione del Prodotto Finale

Il prodotto finale sarà una piattaforma completa dove:

1. Un organizzatore con tessera associativa crea un torneo in 2 minuti
2. I giocatori iscritti si sfidano in partite 1v1 con webcam, in diretta
3. Il pubblico può guardare qualsiasi partita in corso in streaming, come Twitch
4. I risultati vengono registrati automaticamente, con un sistema di ranking ELO
5. Tra una partita e l'altra, i giocatori possono intrattenersi nella **Sala Arcade** con mini-giochi P2P
6. La tessera associativa digitale gestisce l'accesso, i premi e la community

**Ambizione a lungo termine**: Essere il punto di riferimento in Italia per i tornei di TCG digitali, con la stessa professionalità di una piattaforma di scacchi online, ma per le carte collezionabili.

---

## Sezione 2: Funzionalità Chiave

### 2.1 Sistema Tornei 1v1 Live con Webcam

Il cuore della piattaforma sono le partite 1v1 in diretta video.

**Come funziona per l'utente**:
1. L'organizzatore crea un torneo dalla dashboard (nome, formato, buy-in opzionale, visibilità)
2. I giocatori sfidanti trovano il torneo nella lista e si iscrivono
3. Quando la partita inizia, entrambi i giocatori attivano la webcam
4. Si vedono in diretta (come una video-chiamata) e giocano fisicamente con le loro carte
5. A fine partita, entrambi inseriscono il risultato; il sistema calcola automaticamente il ranking

**Caratteristiche tecniche rilevanti per il business**:
- Partite sempre 1 contro 1 (nessun torneo multi-giocatore in una singola stanza)
- Video diretto tra i due giocatori (non passa per i nostri server — risparmio di banda e costi)
- Gli spettatori vedono il video dell'organizzatore in streaming su un canale dedicato

### 2.2 Sistema Membership / Tessera Associativa

Per accedere alle funzionalità premium (creare tornei, partecipare come sfidante), i giocatori devono **iscriversi come soci** ottenendo la tessera associativa digitale.

**Processo di iscrizione**:
1. L'utente compila un modulo con dati anagrafici (nome, data di nascita, comune, club sportivo)
2. Dà il consenso al trattamento dei dati (GDPR)
3. Riceve automaticamente la **tessera numerata** nel formato `EBX-2026-00001`
4. La tessera è valida per 1 anno con possibilità di rinnovo

**Funzionalità tessera**:
- Controllo automatico all'accesso (senza tessera = niente tornei)
- Notifica automatica 30 giorni prima della scadenza
- Tessere numerate progressive e univoche per ogni anno
- Gestione livelli (Standard → Gold → Platinum) per funzionalità future

**Perché è importante per il business**: La tessera crea una community affiliata, genera un database di soci qualificati, e consente di strutturare abbonamenti/quote associative future.

### 2.3 Sala Arcade con Mini-Giochi P2P

La Sala Arcade è uno **spazio di intrattenimento** all'interno della piattaforma, accessibile tra una partita e l'altra. Contiene 4 mini-giochi:

| Mini-Gioco | Tipo | Modalità | Premi |
|---|---|---|---|
| **Stack Attack** | Puzzle - Stacking rapido | Solo (contro il punteggio massimo) | Ticket in base al punteggio |
| **TCG Jump** | Endless runner | Solo | Ticket in base alla distanza |
| **Card Memory** | Memory cards | Solo (con timer) | Ticket in base alla velocità |
| **Tavolo Duello (Kakegurui)** | Gioco di carte P2P | 1v1 contro un altro giocatore | Ticket in base al risultato |

I **ticket** guadagnati nei giochi potranno essere spesi per premi (sistema di rewards futuro).

Il Tavolo Duello è l'unico gioco multiplayer: i due giocatori si connettono direttamente tramite tecnologia P2P (senza passare per i server), scambiando un codice di 6 caratteri fuori dalla piattaforma (come scambiarsi un link). **Questo non richiede infrastruttura aggiuntiva**.

### 2.4 Classifiche e Ranking

- **Classifica ELO**: Ogni giocatore ha un punteggio ELO che aumenta/diminuisce in base ai risultati delle partite
- **Classifica Arcade**: I migliori punteggi di ogni mini-gioco, pubblica e aggiornata in tempo reale
- **Storico partite**: Ogni giocatore vede la propria storia di partite, con risultati e andamento ELO

### 2.5 Sistema Notifiche

Gli utenti ricevono notifiche per:
- Inizio di una partita (il rivale è entrato nella stanza)
- Aggiornamenti di stato del torneo
- Scadenza imminente della tessera (30 giorni prima)
- Nuovo record personale in Arcade
- Risultato confermato di una partita

Le notifiche arrivano sia **in-app** (notifiche push mentre si usa la piattaforma) sia via **email**.

---

## Sezione 3: Architettura Tecnica (Semplificata)

### 3.1 Diagramma dell'Architettura

```
                         ┌─────────────────────────┐
                         │   INTERNET (Utenti)     │
                         └─────────┬───────────────┘
                                   │
                         ┌─────────▼───────────────┐
                         │   CLOUDFRONT (CDN)      │
                         │   Distribuisce il sito  │
                         │   in tutto il mondo     │
                         └─────────┬───────────────┘
                                   │
                  ┌────────────────▼─────────────────┐
                  │   APPLICATION LOAD BALANCER       │
                  │   Smista le richieste             │
                  └──────┬──────────────┬────────────┘
                         │              │
            ┌────────────▼──┐   ┌───────▼──────────────┐
            │  API SERVER   │   │   WEBSOCKET SERVER    │
            │  (FastAPI)    │   │   Notifiche real-time │
            │  Gestisce     │   │   ai giocatori        │
            │  tutto il     │   └───────────────────────┘
            │  business     │
            │  logic        │
            └──┬────────┬───┘
               │        │
    ┌──────────▼─┐  ┌───▼──────────┐
    │  DATABASE  │  │    CACHE     │
    │ PostgreSQL │  │    Redis     │
    │ Dati       │  │ Velocità,   │
    │ permanenti │  │ sessioni,   │
    │ (Aurora)   │  │ classifiche │
    └────────────┘  └──────────────┘

    ┌──────────────────────────────────────────────────┐
    │   SERVIZI ESTERNI (gestiti da terzi)             │
    │                                                  │
    │  AWS IVS ──────── Video spettatori in streaming  │
    │  TURN Server ───── Connessione video tra giocatori│
    │  SES (Amazon) ──── Email notifiche               │
    │  ebartex.com ───── Account utenti (SSO)          │
    └──────────────────────────────────────────────────┘
```

### 3.2 Microservizi: Cosa Fa Ciascuno

**Nota per i non tecnici**: Un "microservizio" è come un ufficio specializzato all'interno di un'azienda — ognuno fa una cosa e la fa bene, collaborando con gli altri.

| Servizio | Fornitore | Cosa fa | Chi lo gestisce |
|---|---|---|---|
| **Auth Service** | ebartex.com (esistente) | Login degli utenti, token di accesso | Team ebartex.com |
| **Sync Service** | ebartex.com (esistente) | Sincronizza l'inventario delle carte | Team ebartex.com |
| **Search Service** | ebartex.com + Meilisearch | Ricerca carte e tornei | Team ebartex.com |
| **Tournament Service** | **Noi** (nuovo) | Tutto: tornei, match, tessere, arcade | **Nostro team** |

Il **Tournament Service** è il cuore del nostro lavoro. È un'applicazione Python (FastAPI) che gira su Amazon AWS e si occupa di:
- Creare e gestire tornei e partite
- Gestire le tessere associative
- Calcolare ranking e classifiche
- Coordinare lo streaming video per gli spettatori
- Gestire la Sala Arcade

### 3.3 Dove Risiedono i Dati

Tutti i dati sono **in Europa** (conforme al GDPR):

| Tipo di Dati | Dove | Regione AWS |
|---|---|---|
| Dati tornei, partite, risultati | Database Aurora (PostgreSQL) | Milano (eu-south-1) |
| Tessere associative, dati soci | Database Aurora (PostgreSQL) | Milano (eu-south-1) |
| Punteggi arcade, classifiche | Redis + Database Aurora | Milano (eu-south-1) |
| Video live (streaming spettatori) | AWS IVS | Irlanda (eu-west-1) |
| Registrazioni video (opzionale) | Amazon S3 | Irlanda (eu-west-1) |
| Log e metriche | CloudWatch | Milano (eu-south-1) |

**Nota GDPR**: I dati personali (tessera, anagrafica soci) sono in Italia (Milano). I video live sono in Irlanda ma rimangono comunque nell'Unione Europea.

### 3.4 Flusso di una Partita (dalla Creazione allo Spettatore)

```
FASE 1: CREAZIONE TORNEO (5 secondi)
─────────────────────────────────────
Organizzatore → Apre la pagina tornei
             → Compila il modulo (nome, formato)
             → Clicca "Crea Torneo"
             → Il sistema salva tutto nel database
             → Il torneo appare nella lista pubblica

FASE 2: ISCRIZIONE SFIDANTE (10 secondi)
─────────────────────────────────────────
Giocatore B → Trova il torneo nella lista
           → Clicca "Iscriviti"
           → Il sistema controlla la tessera attiva
           → Conferma l'iscrizione nel database
           → Notifica all'Organizzatore: "Il tuo sfidante è pronto"

FASE 3: AVVIO PARTITA (30 secondi)
────────────────────────────────────
Organizzatore → Clicca "Inizia Partita"
             → Il sistema crea una "stanza video"
             → Entrambi i giocatori attivano la webcam
             → Le webcam si connettono direttamente tra loro (P2P)
             → Il sistema apre anche un canale video per gli spettatori (IVS)
             → L'Organizzatore riceve in modo sicuro il codice per iniziare lo streaming spettatori

FASE 4: PARTITA IN CORSO (20-90 minuti)
─────────────────────────────────────────
Organizzatore + Giocatore B → Giocano con le carte, si vedono in video
Spettatori → Guardano il video live come su Twitch (ritardo di 3-5 secondi)
Sistema → Aggiorna il contatore spettatori in tempo reale
        → Tutta la logica gira su AWS senza intervento umano

FASE 5: FINE PARTITA (1 minuto)
─────────────────────────────────
Uno dei giocatori → Inserisce il risultato (chi ha vinto, quante vite)
L'altro giocatore → Conferma il risultato
Sistema → Aggiorna i punteggi ELO automaticamente
        → Chiude il canale video spettatori
        → Invia notifiche ai giocatori
        → Aggiorna le classifiche in tempo reale
```

---

## Sezione 4: Opzioni Infrastrutturali e Costi

### 4.1 Il Problema dei Costi: Tre Bisogni Diversi

La piattaforma ha tre "tipi" di infrastruttura con costi e caratteristiche molto diverse:

**A) Gestione delle partite 1v1** — Il server coordina la connessione video tra i due giocatori, ma il video in sé viaggia direttamente tra i browser dei giocatori (non attraverso i nostri server). Quindi il costo è basso e fisso.

**B) Streaming per gli spettatori** — Questo è il costo più variabile. Ogni partita con spettatori richiede un canale video separato. Se 200 partite sono in corso contemporaneamente con 30 spettatori ciascuna, il sistema deve gestire 200 stream individuali.

**C) Backend (API, database, cache)** — Il cuore della piattaforma. Costo proporzionale al numero di utenti connessi.

### 4.2 Tabella Comparativa Provider (Versione Semplificata)

| Soluzione | Costo Mensile (1k utenti) | Pro | Contro |
|---|---|---|---|
| **AWS completo** (raccomandato) | ~$2.500 | Tutto in un posto, scalabile, EU | Costo più alto |
| AWS + Bunny.net (ibrido) | ~$1.200 | Risparmio su video | Due fornitori da gestire |
| Railway + Bunny.net (budget) | ~$550 | Molto economico | Meno scalabile, latenza maggiore |

### 4.3 Stack Raccomandato e Motivazione

**Raccomandiamo la soluzione AWS completa** per le seguenti ragioni:

1. **Tutto in un posto**: Un solo fornitore, una sola fattura, un solo sistema di monitoraggio
2. **Scalabilità automatica**: Il database e i server si espandono automaticamente in caso di picchi (es: evento importante con molti utenti)
3. **Dati in Italia**: Il database principale è nella regione AWS di Milano — nessun dato personale esce dall'Italia
4. **Integrazione nativa**: I servizi AWS si "parlano" tra loro senza costi aggiuntivi di integrazione
5. **Affidabilità**: Amazon garantisce il 99.9% di disponibilità con contratti SLA formali

**Alternativa economica**: Se il budget è un vincolo prioritario in fase MVP (< 100 utenti), Railway.app + Bunny.net è una scelta valida che può essere migrata ad AWS successivamente in 2–4 giorni di lavoro tecnico.

### 4.4 Stima Costi Mensili per Tre Scenari di Crescita

```
SCENARIO PICCOLO — Fase MVP (fino a 100 utenti simultanei)
──────────────────────────────────────────────────────────
Partite attive: ~10 simultanee
Spettatori medi: 5 per partita
Partite/mese: ~300

Server API (AWS ECS):              $80/mese
Database (AWS Aurora):            $120/mese
Cache Redis:                        $65/mese
Video spettatori (AWS IVS):       $175/mese  ← costo dominante
Rete e altri servizi:             $110/mese
                                  ─────────
TOTALE:                         ~$550/mese


SCENARIO MEDIO — Crescita (1.000 utenti simultanei)
──────────────────────────────────────────────────────────
Partite attive: ~100 simultanee
Spettatori medi: 10 per partita
Partite/mese: ~3.000

Server API (AWS ECS):             $280/mese
Database (AWS Aurora):            $420/mese
Cache Redis:                      $480/mese
Video spettatori (AWS IVS,        
  ottimizzato):                 $1.500/mese  ← ottimizzato: IVS solo se ci sono spettatori
TURN server + rete:               $200/mese
Monitoraggio e altri:             $200/mese
                                  ─────────
TOTALE:                         ~$3.080/mese


SCENARIO GRANDE — Scala nazionale (5.000 utenti simultanei)
──────────────────────────────────────────────────────────
Partite attive: ~500 simultanee
Spettatori medi: 15 per partita
Partite/mese: ~15.000

Server API (cluster):             $800/mese
Database (Aurora grande):       $1.800/mese
Cache Redis (cluster):          $1.200/mese
Video spettatori (Bunny.net,      
  migrazione conveniente):        $900/mese  ← a questa scala, Bunny.net è più economico
TURN server:                      $400/mese
Rete, monitoraggio, altri:        $500/mese
                                  ─────────
TOTALE:                         ~$5.600/mese
```

### 4.5 Break-Even e Considerazioni Economiche

**Domanda chiave**: Quante tessere associative deve vendere la piattaforma per coprire i costi?

```
Costo infrastruttura scenario medio: ~€2.800/mese (circa)

Se tessera annuale = €30:
   Tessere necessarie per break-even mensile: 2.800 / (30/12) = 1.120 soci

Se tessera annuale = €50:
   Tessere necessarie per break-even mensile: 2.800 / (50/12) = 672 soci

Se tessera annuale = €20 (economica):
   Tessere necessarie: 2.800 / (20/12) = 1.680 soci

CONCLUSIONE: Con una quota associativa di €30/anno,
circa 1.100 soci attivi rendono la piattaforma economicamente sostenibile
(considerando i soli costi infrastrutturali, senza costi di sviluppo e team).
```

**Modello di ricavo potenziale aggiuntivo** (futura considerazione):
- Buy-in tornei (percentuale sul pot)
- Premi negozio arcade (merchandising ebartex.com)
- Abbonamenti Gold/Platinum per funzionalità premium (1080p video, recording)

---

## Sezione 5: Roadmap di Sviluppo

### 5.1 Fasi Completate (Piattaforma v1.0)

Le seguenti funzionalità sono già **completate** e funzionanti:

```
✅ Fase 1:  Infrastruttura AWS (server, database, rete)
✅ Fase 2:  Sistema tornei base (crea, modifica, cancella)
✅ Fase 3:  Gestione partite e iscrizioni
✅ Fase 4:  Connessione video (WebRTC) tra i giocatori
✅ Fase 5:  Registrazione risultati di gioco
✅ Fase 6:  Notifiche in tempo reale (WebSocket)
✅ Fase 7:  Classifiche ELO e ricerca tornei
```

### 5.2 Timeline Sviluppo Attuale (Fasi 8–12)

```
GIUGNO 2026 — SETTEMBRE 2026
═══════════════════════════════════════════════════════════════════

Settimana 1–2   │ FASE 8: Filtri Tornei e Refactor
                │ → Filtro per buy-in, formato, visibilità
                │ → Vista mobile ottimizzata
                │ → ✅ Bassa complessità, alta visibilità
                │
Settimana 2–6   │ FASE 9: Sistema Tessera Associativa ← IN CORSO
                │ → Iscrizione soci (modulo, dati anagrafici)
                │ → Generazione tessera numerata EBX-2026-NNNNN
                │ → Gate di accesso: niente tornei senza tessera
                │ → Worker automatico per scadenze
                │ → Email di conferma (integrazione SES)
                │ → ⚠️ Alta priorità: sblocca i ricavi
                │
Settimana 5–9   │ FASE 10: Backend Sala Arcade
                │ → API punteggi e classifiche
                │ → Sistema wallet (ticket guadagnati)
                │ → Registro stanze P2P (Tavolo Duello)
                │ → Worker sincronizzazione classifiche
                │
Settimana 8–11  │ FASE 11: Streaming Spettatori (IVS)
                │ → Creazione canale video automatica all'avvio partita
                │ → Consegna sicura del codice streaming all'organizzatore
                │ → Contatore spettatori in tempo reale
                │ → Recording opzionale su S3
                │
Settimana 10–15 │ FASE 12: Hardening per Produzione
                │ → Load test (1.000 connessioni simultane)
                │ → Ottimizzazione query database
                │ → Test di sicurezza (penetration test)
                │ → WAF e protezione DDoS
                │ → Documentazione operativa completa
                │
Settimana 16+   │ LANCIO PUBBLICO
                │ → Comunicazione alla community
                │ → Monitoraggio intensivo prime 72 ore
                │ → Feedback loop e fix rapidi
```

### 5.3 Milestone Chiave e Deliverable

| Milestone | Settimana | Cosa Consegnamo | Chi Beneficia |
|---|---|---|---|
| **M1: Filtri Tornei** | Sett. 2 | Ricerca avanzata funzionante | Tutti gli utenti |
| **M2: Tessera Live** | Sett. 6 | Iscrizione soci attiva, gate funzionante | Community, ricavi |
| **M3: Arcade Backend** | Sett. 9 | Classifiche arcade live, ticket funzionanti | Engagement utenti |
| **M4: Streaming Live** | Sett. 11 | Spettatori vedono le partite in diretta | Crescita community |
| **M5: Produzione Ready** | Sett. 15 | Piattaforma certificata per il traffico pubblico | Business |
| **M6: Lancio Pubblico** | Sett. 16+ | Apertura alla community | Tutti |

### 5.4 Risorse Necessarie

**Team richiesto**:

| Ruolo | Tipo | Responsabilità | Fase |
|---|---|---|---|
| **Backend Developer (AI Agent)** | Agente AI (Cursor) | Scrive tutto il codice backend | Tutte le fasi |
| **Frontend Developer (AI Agent)** | Agente AI (Cursor) | Componenti React, integrazione API | Tutte le fasi |
| **Tech Lead** | Umano | Supervisione architettura, review PR | Tutte le fasi |
| **DevOps / Cloud** | Umano o AI | Deployment AWS, monitoraggio | Fasi 8–12 |
| **Product Owner** | Umano | Decisioni di business, priorità | Continuo |
| **Tester QA** | Umano | Test manuali end-to-end prima del lancio | Fase 12 |

**Competenze chiave richieste** nel team umano:
- Conoscenza AWS (almeno un Senior DevOps/Cloud per le fasi infrastrutturali)
- Capacità di supervisionare codice generato da AI (Tech Lead con esperienza Python/React)
- Project management per coordinare AI agents e sviluppo umano

### 5.5 Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| **IVS non disponibile in Milano AWS** | Alto (già verificato) | Medio | Usare eu-west-1 (Irlanda) — dati nell'EU, GDPR ok |
| **Costi IVS superiori alle previsioni** | Medio | Alto | Creazione canale lazy (solo se ci sono spettatori) |
| **WebRTC non funziona in reti aziendali** | Medio | Medio | TURN server TCP su porta 443 come fallback |
| **Violazione dati personali tessere** | Basso | Molto Alto | Crittografia, accessi limitati, piano di risposta GDPR |
| **Scalabilità insufficiente al lancio** | Basso | Alto | Load test in Fase 12; Aurora si scala automaticamente |
| **Codice AI di bassa qualità** | Medio | Medio | Tech Lead review obbligatoria prima di ogni deploy |
| **Community non adotta la tessera** | Medio | Alto | Prezzo competitivo, valore chiaro, comunicazione efficace |

---

## Sezione 6: Decisioni Aperte

Le seguenti decisioni richiedono approvazione dei decision maker prima di procedere. Per ciascuna vengono presentate le opzioni con impatto e chi deve decidere.

---

### Decisione 1: Prezzo della Tessera Associativa

**Contesto**: La tessera è il principale driver di ricavo. Il prezzo deve bilanciare accessibilità per la community e sostenibilità economica.

| | Opzione A | Opzione B |
|---|---|---|
| **Proposta** | €20/anno (economica) | €35/anno (standard) |
| **Vantaggio** | Alta adozione, barriera bassa | Sostenibilità con meno soci (800 per break-even) |
| **Svantaggio** | Bisogno di 1.700 soci per break-even | Possibile resistenza iniziale |
| **Break-even** | ~1.680 soci | ~960 soci |
| **Chi decide** | Product Owner + Fondatori | Product Owner + Fondatori |

---

### Decisione 2: Streaming Spettatori — Gratuito o a Pagamento?

**Contesto**: Gli spettatori generano costi (IVS) senza pagare direttamente. Dobbiamo decidere il modello.

| | Opzione A | Opzione B |
|---|---|---|
| **Proposta** | Gratuito per tutti (senza account) | Richiede account ebartex.com gratuito |
| **Vantaggio** | Massima viralità, condivisioni sui social | Database utenti, possibilità di notifiche |
| **Svantaggio** | Nessun dato sugli spettatori | Attrito per spettatori occasionali |
| **Impatto tecnico** | Zero (già progettato così) | 1 settimana di sviluppo aggiuntiva |
| **Chi decide** | Product Owner + Marketing | Product Owner + Marketing |

---

### Decisione 3: Video Registrato delle Partite (IVS Recording)

**Contesto**: AWS IVS può registrare automaticamente le partite su Amazon S3. Le registrazioni costano ~$0.085/GB.

| | Opzione A | Opzione B |
|---|---|---|
| **Proposta** | Solo su richiesta organizzatore (opt-in) | Tutte le partite registrate automaticamente |
| **Vantaggio** | Controllo dei costi; privacy by design | Archivio completo, possibile funzione replay |
| **Svantaggio** | Nessun archivio automatico | Costo variabile (dipende dal volume partite) |
| **Costo aggiuntivo** | ~$0 (nessuna registrazione di default) | ~$50–200/mese a 200 partite/mese |
| **Chi decide** | Tech Lead + Product Owner | Tech Lead + Product Owner |

---

### Decisione 4: Ticket Arcade — Solo Cosmetics o Sconti Reali?

**Contesto**: I ticket guadagnati nell'arcade possono dare accesso a premi. Dobbiamo definire il valore dei premi.

| | Opzione A | Opzione B |
|---|---|---|
| **Proposta** | Solo cosmetics virtuali (avatar frame, badge) | Sconti su shop ebartex.com o rinnovo tessera |
| **Vantaggio** | Nessun impatto economico diretto; semplice | Forte incentivo, engagement elevato |
| **Svantaggio** | Minor motivazione a giocare nell'arcade | Richiede integrazione con ebartex.com commerce |
| **Complessità tecnica** | Bassa (Phase 13) | Alta (Phase 13, integrazione esterna) |
| **Chi decide** | Product Owner + Team ebartex.com | Product Owner + Team ebartex.com |

---

### Decisione 5: Profilo Livelli Membership (Gold/Platinum)

**Contesto**: L'architettura prevede 3 livelli (Standard, Gold, Platinum), ma il contenuto dei livelli non è ancora definito.

| | Opzione A | Opzione B |
|---|---|---|
| **Proposta** | Un unico livello in MVP (tutti Standard) | Lancia subito i 3 livelli con benefici chiari |
| **Vantaggio** | Più semplice, lancio rapido | Monetizzazione differenziata sin dall'inizio |
| **Svantaggio** | Monetizzazione ritardata | Richiede 2–3 settimane in più per definire i benefit |
| **Esempi Benefit Gold** | — | 1080p video, recording partite, badge esclusivo |
| **Esempi Benefit Platinum** | — | Tutto Gold + accesso beta feature, supporto prioritario |
| **Chi decide** | Product Owner | Product Owner |

---

## Sezione 7: Prossimi Passi Immediati

### 7.1 Cosa Fare nelle Prossime 2 Settimane

**Settimana 1 — Decisioni e Setup**:

| Priorità | Task | Responsabile | Giorni |
|---|---|---|---|
| 🔴 CRITICO | Prendere le 5 decisioni aperte (Sezione 6) | Product Owner | 2 giorni |
| 🔴 CRITICO | Attivare dominio `turn.ebartex.com` su Route53 | DevOps | 1 giorno |
| 🟡 ALTO | Creare account AWS in eu-west-1 per IVS (se non attivo) | DevOps | 0.5 giorni |
| 🟡 ALTO | Definire prezzo tessera e aprire landing page iscrizioni | Product Owner + Marketing | 3 giorni |
| 🟢 MEDIO | Completare Fase 8 (filtri tornei) | Backend Agent | 5 giorni |

**Settimana 2 — Sviluppo Tessera**:

| Priorità | Task | Responsabile | Giorni |
|---|---|---|---|
| 🔴 CRITICO | Avviare Fase 9: Schema database tessere | Backend Agent | 1 giorno |
| 🔴 CRITICO | Implementare POST /membership/enroll | Backend Agent | 2 giorni |
| 🟡 ALTO | Implementare gate di accesso ai tornei | Backend Agent | 1 giorno |
| 🟡 ALTO | Test end-to-end iscrizione tessera su staging | QA + Tech Lead | 1 giorno |
| 🟢 MEDIO | Preparare testo email di conferma iscrizione | Product Owner + Marketing | 1 giorno |

### 7.2 Chi Fa Cosa

```
PRODUCT OWNER:
  → Prende le 5 decisioni di Sezione 6 entro fine settimana 1
  → Approva testo email conferma tessera
  → Definisce prezzo tessera e benefit Gold/Platinum (se Opzione B)

TECH LEAD (Sviluppatore Senior):
  → Supervisiona tutto il codice generato dagli AI agents
  → Approva ogni Pull Request prima del deploy in staging
  → Prende decisioni tecniche non coperte dalle specifiche

DEVOPS:
  → Attiva dominio turn.ebartex.com
  → Verifica disponibilità IVS in eu-west-1
  → Deploy Fase 8 in produzione

BACKEND AGENT (AI - Cursor):
  → Implementa Fase 8 (filtri tornei)
  → Inizia Fase 9 (tessera): modello DB, API enroll, gate accesso
  → Scrive test automatici per ogni endpoint

FRONTEND AGENT (AI - Cursor):
  → Integra nuovi endpoint filtri dal backend
  → Verifica che i form membership-onboarding-form chiamino gli endpoint corretti
  → Fix eventuali discrepanze nel contratto API

MARKETING:
  → Prepara comunicazione lancio tessera alla community
  → Definisce copy per email di conferma iscrizione
```

### 7.3 Come Procedere con lo Sviluppo Automatizzato tramite Agenti AI

Questo progetto utilizza **Cursor** — un IDE con intelligenza artificiale integrata — per accelerare lo sviluppo. Gli "agenti AI" sono sessioni di Cursor che leggono la documentazione tecnica (questi documenti) e scrivono codice autonomamente.

**Come funziona in pratica**:

1. **Il Tech Lead sceglie la funzionalità** da implementare (es: "endpoint iscrizione tessera")
2. **L'agente AI legge le specifiche** tecniche (il documento `02_TECHNICAL_SPEC.md` e `05_AGENT_ORCHESTRATION_PLAN.md`)
3. **L'agente AI scrive il codice** in automatico: modello database, API, test
4. **Il Tech Lead fa review** del codice generato (10–30 minuti per feature semplice)
5. **Deploy automatico** su staging per test
6. **Se ok, deploy in produzione**

**Regola critica**: L'agente AI **NON prende decisioni di architettura** — legge le specifiche scritte dai tecnici umani e le implementa. Se un requisito non è nei documenti, l'agente si ferma e chiede al Tech Lead.

**Vantaggi dello sviluppo AI-assisted**:
- Velocità: 2–5× più rapido dello sviluppo tradizionale per codice ripetitivo (CRUD, API, test)
- Consistenza: Il codice segue sempre gli stessi pattern definiti nelle specifiche
- Documentazione: Il codice è auto-documentato perché le specifiche sono la fonte di verità

**Cosa NON può fare un agente AI**:
- Prendere decisioni di business (prezzo tessera, benefit Gold/Platinum)
- Capire il contesto di mercato italiano del TCG
- Fare test manuali con utenti reali
- Gestire l'infrastruttura AWS (richiede DevOps umano)

---

### Prossimo Aggiornamento Consigliato

Questo documento dovrebbe essere aggiornato:
- Dopo le 5 decisioni di Sezione 6 (integra le decisioni prese)
- Al completamento della Fase 9 (update con costi reali primi soci)
- Prima del lancio pubblico (update roadmap post-lancio)

---

*Documento redatto da: Senior Tech Lead — Giugno 2026*  
*Per domande tecniche: aprire una issue su GitHub o contattare il Tech Lead*  
*Per decisioni di business: contattare il Product Owner*
