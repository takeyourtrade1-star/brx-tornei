# Ebartex Tournaments — Architettura Frontend

> Mini-sito verticale per gestione e visualizzazione Tornei TCG.
> Dominio target: `tournaments.ebartex.com` (il redirect `/tornei-live` → tournaments.ebartex.com esiste già in `next.config.mjs` del sito principale).
> Stack: Next.js 15 (App Router) · React 18 · TypeScript · Tailwind CSS 3.4 — speculare a `new_frontend_brx`.

---

## 1. Analisi dello stato attuale di Ebartex (verificato sulla codebase)

| Area | Com'è fatto in `new_frontend_brx` | Impatto sul nuovo sito |
|---|---|---|
| Auth backend | Microservizio FastAPI su AWS, JWT RS256 (access + refresh), MFA con pre-auth token, login passwordless via codice email, honeypot `website_url` | Stesso backend, zero modifiche richieste |
| Auth client | Token in `localStorage` (`ebartex_access_token`, `ebartex_refresh_token`, `ebartex_user`) + store Zustand persistito (`ebartex-auth`) | localStorage NON è condiviso tra domini → non utilizzabile per SSO |
| Proxy auth | `app/api/auth/[...path]/route.ts`: il browser chiama same-origin `/api/auth/*`, il route handler inoltra ad `AUTH_API_URL`. Imposta già cookie `ebartex_access_token` **HttpOnly, SameSite=Lax, host-only** | Il pattern proxy va replicato identico. Il cookie è host-only: oggi invisibile ai sottodomini |
| Design system | shadcn/ui style: `cva` + `@radix-ui/react-slot` + `cn()` (clsx + tailwind-merge). Token in `tailwind.config.ts` + CSS vars in `globals.css`. Font: Nunito (next/font) + Comodo Regular (display) | Token e atomi estratti in un preset Tailwind condivisibile |
| Palette | Gradiente globale `#3D65C6 → #1D3160` + pattern `brx_bg.png`, primary `#FF7300` (text AA `#CC5C00`), header `#0F172A`, gradienti card (`#BB82FF→#4A02A4`, ecc.), marquee `#F3C76A`, radius `0.5rem` | Replicata 1:1 nel preset |
| Forms | react-hook-form + zod + floating-label input | Nel nuovo sito: zod lato server action; RHF solo se serve UX client |

---

## 2. Strategia di condivisione — Auth (SSO)

### 2.1 Problema
La sessione Ebartex vive in `localStorage`, che è **isolato per origin**: `tournaments.ebartex.com` non può leggerla. L'unico canale nativo condivisibile tra sottodomini è un **cookie con `Domain=.ebartex.com`**.

### 2.2 Soluzione: cookie di sessione parent-domain (nessuna modifica al backend FastAPI)

I cookie li imposta già il **proxy Next** del sito principale, non il backend. Servono due modifiche minime al sito principale:

1. In `app/api/auth/[...path]/route.ts` aggiungere `Domain=.ebartex.com` al cookie `ebartex_access_token` (solo in produzione; in dev resta host-only).
2. Aggiungere un secondo cookie `ebartex_refresh_token` — **HttpOnly, Secure, SameSite=Lax, Domain=.ebartex.com** — impostato su login/refresh, cancellato su logout. È questo che rende l'SSO durevole: l'access token scade, il refresh no.

Flusso SSO trasparente sul nuovo sito:

```
Utente loggato su ebartex.com → naviga su tournaments.ebartex.com
  └─ middleware.ts: nessuna sessione locale, ma cookie ebartex_refresh_token presente
       └─ redirect a /auth/bridge?next=<url>
            └─ route handler: POST /api/auth/refresh col refresh token
                 ├─ OK  → set cookie sessione locale → redirect a <next>  (login invisibile)
                 └─ KO  → redirect a /login (UI speculare a Ebartex)
```

Direzione inversa (login fatto sul mini-sito → utente già loggato quando torna su ebartex.com): garantita impostando gli stessi cookie `Domain=.ebartex.com` dal proxy del mini-sito.

### 2.3 Sessione interna al nuovo sito: cookie-first (non localStorage)

Essendo il paradigma server-first, la sessione vive in **cookie HttpOnly** letti da RSC/Server Actions/middleware via `cookies()`. Niente token in localStorage, niente store client per l'auth: lo stato "chi sono" arriva dal server a ogni render. Vantaggi: protezione XSS reale, middleware può proteggere le route, gli RSC fanno fetch autenticati senza waterfall client.

| Cookie | Flag | Scopo |
|---|---|---|
| `ebartex_access_token` | HttpOnly, Secure, Lax, `Domain=.ebartex.com`, Max-Age = expires_in | Chiamate API server-side |
| `ebartex_refresh_token` | HttpOnly, Secure, Lax, `Domain=.ebartex.com`, Max-Age 30gg | Silent refresh / SSO |

### 2.4 Sviluppo locale
Due dev server (`3000` sito principale, `3001` tornei): `Domain` cross-port non serve, i cookie su `localhost` sono condivisi tra porte → l'SSO funziona anche in locale senza configurazione extra (il proxy non imposta `Domain` quando l'host è localhost).

### 2.5 Cosa NON fare
- Passare token in query string tra domini (finiscono in log, referrer, history).
- Replicare il pattern localStorage di Ebartex: nel nuovo sito sarebbe un passo indietro architetturale e non risolverebbe l'SSO.

---

## 3. Strategia di condivisione — Design System

### Fase 0 (oggi): preset Tailwind vendored
Tutti i token Ebartex (colori, gradienti, font, radius, animazioni, breakpoint) vivono in **`design-system/tailwind-preset.ts`** — un file unico, estratto 1:1 dal `tailwind.config.ts` del sito principale — consumato via `presets: [ebartexPreset]`. Gli atomi UI (button, card, badge, input) sono copiati in `components/ui/` con lo stesso stile cva/shadcn. Source of truth dichiarata: il repo principale; questo file non si modifica mai a mano per "aggiustare" un colore.

### Fase 1 (quando i siti diventano ≥3 o i token cambiano spesso): pacchetto privato
Estrarre in `@ebartex/design-system` (GitHub Packages, repo dedicato):
- `tailwind-preset` (token)
- `cn()` e utility condivise
- atomi `components/ui` (peer deps: react, tailwind)

Entrambi i siti lo installano; un bump di versione propaga il rebranding. Il monorepo è escluso per scelta (repository separate); il pacchetto npm è l'alternativa corretta che evita la duplicazione senza accoppiare i deploy.

**Regola anti-drift**: nel nuovo repo, `design-system/` e `components/ui/` non contengono MAI logica di dominio — solo presentazione. Così l'estrazione in pacchetto (Fase 1) sarà un copia-incolla.

---

## 4. Architettura delle cartelle

Principi: server-first (RSC di default, `'use client'` solo foglia), max 200–250 righe/file, logica di business in Server Actions e `lib/`, UI pura in `components/`.

```
tournaments-live-frontend/
├── app/
│   ├── layout.tsx                  # Root layout: font Nunito, sfondo gradient Ebartex
│   ├── globals.css                 # CSS vars (copiate da Ebartex) + body gradient
│   ├── page.tsx                    # / → redirect: sessione ? /hub : /login
│   │
│   ├── (auth)/                     # Route group: shell auth (logo, sfondo blur)
│   │   ├── layout.tsx              # AuthShell speculare a Ebartex
│   │   ├── login/page.tsx          # RSC: rende LoginForm (client)
│   │   └── registrati/page.tsx     # Stub → rimanda al sito principale (MVP)
│   │
│   ├── auth/bridge/route.ts        # SSO: refresh-token cookie → sessione locale → redirect
│   │
│   ├── (hub)/                      # Route group: fasi di configurazione
│   │   ├── layout.tsx              # Shell hub (SiteHeader stile Ebartex)
│   │   ├── hub/page.tsx            # Step 1 formato + Step 2 modalità (stessa pagina, RSC)
│   │   └── hub/modalita/page.tsx   # Redirect legacy → /hub#modalita
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Header di stato (username, modalità, azioni)
│   │   └── tornei/page.tsx         # Main view: tabella tornei (RSC)
│   │
│   └── api/auth/[...path]/route.ts # Proxy → AUTH_API_URL (pattern Ebartex, cookie-first)
│
├── actions/                        # Server Actions ('use server') — business logic
│   ├── auth.ts                     # loginAction, logoutAction (zod-validated)
│   └── tournaments.ts              # createTournamentAction, registerToTournamentAction
│
├── components/
│   ├── ui/                         # Atomi (stile shadcn/cva, identici a Ebartex)
│   │   ├── button.tsx  card.tsx  badge.tsx  input.tsx
│   ├── layout/
│   │   ├── AuthShell.tsx           # Shell login (server component)
│   │   └── DashboardHeader.tsx     # Header di stato (server component)
│   └── feature/
│       ├── auth/login-form.tsx     # 'use client' (form interattivo → server action)
│       ├── hub/selection-card.tsx  # Card selezione gioco/modalità (RSC, è un <Link>)
│       └── tornei/
│           ├── tournaments-table.tsx   # Tabella (RSC: i dati arrivano dal server)
│           ├── tournament-row.tsx      # Riga + partecipanti (RSC)
│           ├── status-badge.tsx        # Badge stato (RSC)
│           └── create-tournament-button.tsx  # 'use client' (pending state)
│
├── lib/
│   ├── config.ts                   # Env centralizzate (pattern lib/config.ts Ebartex)
│   ├── utils.ts                    # cn()
│   ├── auth/session.ts             # server-only: getSession(), setSessionCookies()...
│   ├── data/tournaments.ts         # Data layer: fetcher tornei (mock → API reale)
│   └── validations/                # Schemi zod
│       ├── auth.ts  tournament.ts  selection.ts
│
├── types/                          # Tipi condivisi (Tournament, Session, Game, Mode)
├── design-system/tailwind-preset.ts  # Token Ebartex (vedi §3)
├── hooks/                          # Custom hook SOLO client (vuoto all'MVP — buon segno)
├── middleware.ts                   # Protezione route + innesco bridge SSO
├── tailwind.config.ts  next.config.mjs  tsconfig.json  .env.example
```

Decisioni notevoli:
- **Route groups** `(auth)/(hub)/(dashboard)`: layout indipendenti senza inquinare gli URL.
- **`actions/` a radice**, non dentro `app/`: le server actions sono business logic riusabile da più route, non dettagli di pagina.
- **`lib/data/`** è il confine col backend: oggi mock tipizzati, domani fetch all'API tornei — le pagine non cambiano.
- **Selezione formato/modalità via URL** (`/tornei?format=modern&mode=heads-up`): stato condivisibile, niente store client, validato con zod in `lib/validations/selection.ts`. Il server legge i searchParams, punto. Lo Step 1 è il **formato** (Old School → Commander, dal mockup), lo Step 2 la modalità che appare sotto nella stessa pagina `/hub`.
- **`hooks/` vuoto all'MVP**: la prima feature che lo riempie deve giustificare perché il server non basta.

---

## 5. Piano di sviluppo step-by-step

### M0 — Fondamenta (questo scaffold)
1. `git init` + scaffold (fatto: vedi repo).
2. `npm install` e verifica `npm run dev` + `npm run build`.
3. Copiare in `public/`: `brx_bg.png`, logo, font Comodo dal repo principale (asset binari non inclusi nello scaffold).
4. Configurare `.env.local` da `.env.example` (`NEXT_PUBLIC_AUTH_API_URL` identico al sito principale).

### M1 — Design system operativo
5. Verifica visiva dei token: pagina `/hub` deve essere indistinguibile per palette/font dal sito principale.
6. Porting degli atomi mancanti man mano che servono (floating-input per il login, ecc.) — sempre copie fedeli, mai reinterpretazioni.

### M2 — Auth Gateway
7. Login locale: `LoginForm` → `loginAction` → proxy `/api/auth/login` → set cookie sessione → redirect `/hub`. Gestire MFA (redirect a step codice) ed errori col formato del backend (`parseAuthError` pattern).
8. Bridge SSO: completare `/auth/bridge` (già scaffoldato) e testare il giro completo in locale con due dev server (3000/3001).
9. **Unica modifica al sito principale**: `Domain=.ebartex.com` + cookie refresh nel proxy auth (vedi §2.2). PR separata e piccola.
10. Logout sincronizzato: `logoutAction` cancella i cookie parent-domain.

### M3 — Hub di selezione
11. Step 1 (gioco) e Step 2 (modalità) con `SelectionCard`; modalità non disponibili rese come "Presto in arrivo" (badge, non cliccabili) come da mockup.
12. Validazione zod dei searchParams: combinazioni invalide → redirect allo step corretto.

### M4 — Dashboard Tornei (prototipo funzionante)
13. `DashboardHeader`: username (da sessione server), gioco/modalità scelti, bottoni "I miei mazzi" / "Le mie partite" (stub).
14. `TournamentsTable` su mock data: colonne Buy-In ("For Fun"), Formato (BO1/BO3/BO5), Stato (In Registrazione / Iniziata / Terminata), Registrati (n/max), partecipanti per riga; bottone "Crea Torneo" → `createTournamentAction` (mock: aggiunge riga e `revalidatePath`).
15. Stati vuoti, `loading.tsx` con skeleton, `error.tsx`.

### M5 — Hardening e aggancio API reale
16. Sostituire `lib/data/tournaments.ts` mock con fetch all'API tornei (server-side, token dal cookie).
17. Test: vitest sui moduli `lib/` e sulle server actions (pattern del repo principale).
18. i18n: replicare `lib/i18n` di Ebartex quando i testi si stabilizzano (l'MVP è hardcoded IT, stessi default del principale).
19. Deploy Amplify (stessa pipeline del principale), dominio `tournaments.ebartex.com`, verifica cookie cross-subdomain in produzione.

---

## 6. Regole di qualità (vincolanti)

- Max 200–250 righe per file; se un componente cresce, si spezza per responsabilità.
- `'use client'` solo su componenti foglia con interattività reale (form, pending state). Mai su pagine o layout.
- Le Server Actions validano SEMPRE l'input con zod e rileggono la sessione dal cookie — mai fidarsi di dati client.
- `components/ui` e `design-system/` senza logica di dominio (prerequisito Fase 1 §3).
- Nessun token/segreto in codice client: tutto passa dal proxy o da server actions.
