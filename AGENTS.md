# Rules — Ebartex Tournaments Frontend

> Regole operative per AI assistant e sviluppatori. File canonico e IDE-agnostico:
> copialo/symlinkalo come `.cursorrules` (Cursor), `.windsurfrules` (Windsurf),
> `CLAUDE.md` (Claude Code) o `.github/copilot-instructions.md` (Copilot).
> In caso di conflitto tra questo file e ARCHITECTURE.md, vince ARCHITECTURE.md.

## Contesto

Mini-sito Next.js 15 (App Router) per Tornei TCG, estensione verticale di Ebartex
(repo principale: `new_frontend_brx`). Dominio: `tournaments.ebartex.com`.
Stack: React 18 · TypeScript strict · Tailwind CSS 3.4 · zod. Lingua del progetto: italiano
(commenti, testi UI, messaggi di errore).

## 1. Paradigma: Server-First (regola madre)

- Ogni componente nasce Server Component. `'use client'` è un'eccezione da giustificare,
  ammessa SOLO su componenti foglia con interattività reale (form, pending state, eventi).
- MAI `'use client'` su pagine, layout o componenti contenitore.
- Dati: fetch nei RSC o nel data layer, mai `useEffect` + fetch client-side.
- Mutazioni: SOLO Server Actions in `actions/` (`'use server'`), mai chiamate API dal client.
- Stato condiviso tra pagine → URL (searchParams validati con zod) o cookie. Niente store
  client globali (zustand/redux) finché un caso d'uso non li impone — e va documentato.
- Next 15: `params` e `searchParams` sono Promise → sempre `await`.

## 2. Modularità

- **Max 200–250 righe per file.** Superata la soglia → spezzare per responsabilità.
- Separazione rigida UI / logica:
  - `components/` → SOLO presentazione (riceve dati pronti via props)
  - `actions/` → business logic delle mutazioni (sessione + validazione + data layer)
  - `lib/data/` → unico confine col backend (oggi mock, domani API: le pagine non cambiano)
  - `lib/validations/` → tutti gli schemi zod
  - `hooks/` → SOLO logica client; deve restare quasi vuoto (se cresce, è un sintomo)
- Un file = una responsabilità. Niente file "utils" calderone oltre `lib/utils.ts` (cn).

## 3. Auth & sessione (sicurezza, non negoziabile)

- La sessione vive SOLO in cookie HttpOnly (`ebartex_access_token`, `ebartex_refresh_token`),
  letti esclusivamente server-side via `lib/auth/session.ts`.
- VIETATO: token in localStorage/sessionStorage, token passati a componenti client,
  token in query string, segreti in codice client (`NEXT_PUBLIC_*` solo per valori pubblici).
- Ogni Server Action: 1) rilegge la sessione dal cookie (`getSession()`), 2) valida l'input
  con zod. Mai fidarsi di dati provenienti dal client, inclusi gli hidden field.
- Le route protette passano dal `middleware.ts`; l'SSO passa da `/auth/bridge`. Non
  aggiungere logiche di auth alternative.
- Chiamate al backend auth: server-side dirette o via proxy `/api/auth/[...path]` (allowlist).

## 4. Design System (fedeltà a Ebartex)

- Source of truth: `new_frontend_brx`. `design-system/tailwind-preset.ts` e `components/ui/`
  sono COPIE FEDELI: mai modificarli per esigenze locali; se un token/atomo cambia, si
  riallinea dal repo principale.
- `components/ui/` e `design-system/`: zero logica di dominio, zero import da `lib/data`
  o `actions/` (prerequisito per l'estrazione in pacchetto `@ebartex/design-system`).
- Stile: solo classi Tailwind dal preset (palette, gradienti `bg-gradient-card*`,
  `font-display`, `bg-header-bg`...). Niente colori hardcoded nei componenti.
- Pattern atomi: cva + `cn()` (clsx + tailwind-merge), stile shadcn/ui.
- Nuove classi Tailwind usate in file `.ts` fuori da `app/`/`components/` → verificare che
  il path sia nei `content` di `tailwind.config.ts` (es. `lib/data/catalog.ts`).

## 5. Convenzioni di codice

- TypeScript strict. Vietato `any` (usare `unknown` + narrowing). Tipi condivisi in `types/`.
- Export nominati (no default) per componenti e funzioni; default export solo dove Next
  lo richiede (pagine, layout, route handler, middleware).
- Naming file: componenti feature in kebab-case (`login-form.tsx`), componenti layout in
  PascalCase (`DashboardHeader.tsx`) — coerente con il repo principale.
- Le risposte del backend possono essere annidate in `{ data: ... }`: usare sempre
  l'unwrap difensivo già presente nei file esistenti, non assumere la forma.
- Fetch server-side: sempre `cache: 'no-store'` per dati auth/dinamici e
  `AbortSignal.timeout(...)`.
- Errori delle action: ritornare `{ error: string }` tipizzato, mai throw verso il client
  (eccetto `redirect()`).

## 6. Anti-pattern vietati

- `npm audit fix --force` (downgrade distruttivi; gli override sono in `package.json`).
- `useEffect` per data fetching o sincronizzazione che il server può fare.
- Componenti che ricevono `accessToken`/`refreshToken` come prop.
- Duplicare token di design (colori, radius, font) fuori dal preset.
- Aggiungere dipendenze senza necessità dimostrata: lo stack volutamente minimale è
  un vincolo, non una mancanza (niente axios, react-query, framer-motion finché non servono).
- Route API generiche: ogni endpoint nuovo deve avere allowlist e motivazione.

## 7. Checklist prima di ogni PR / fine task

1. `npm run typecheck` e `npm run lint` puliti.
2. Nessun file > 250 righe; nessun nuovo `'use client'` non giustificato.
3. Input di ogni nuova action/route validato con zod.
4. Nessun token o segreto raggiungibile dal client.
5. Testi UI e commenti in italiano; palette/font identici a Ebartex a vista.
6. Se hai toccato `lib/data/`: l'interfaccia delle funzioni è rimasta stabile per le pagine?
