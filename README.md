# Ebartex Tournaments

Mini-sito verticale per i Tornei TCG dell'ecosistema Ebartex.
Dominio target: `tournaments.ebartex.com`.

**Leggi prima [ARCHITECTURE.md](./ARCHITECTURE.md)** — contiene la strategia di sessione host-only, le regole sul design system condiviso, l'architettura delle cartelle e la roadmap.

## Setup

```bash
npm ci --ignore-scripts       # lockfile esatto; nessun lifecycle script di terze parti
cp .env.example .env.local   # compila NEXT_PUBLIC_AUTH_API_URL (stesso valore del sito principale)
npm run dev                   # porta 3001 (il sito principale gira su 3000)
```

In produzione la build è fail-fast: tutti gli endpoint configurati devono essere
origin canonici HTTPS/WSS (senza credenziali, path, query, fragment o porte TLS
non standard) e i rispettivi hostname devono comparire esplicitamente in
`TRUSTED_HTTPS_HOSTNAMES`. I soli backend server-side autorizzati vanno anche
elencati esattamente in `TRUSTED_UPSTREAM_HOSTS`; il controllo viene ripetuto a
runtime e accetta solo origin HTTPS canonici. `NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN` deve essere lo
stesso origin del Tournament Service con il solo protocollo cambiato in `wss://`.

Font: nessun asset da copiare né download remoto — il test di build
(`lib/__tests__/build-environment.test.ts`) vieta riferimenti a `/fonts/` e a
`next/font/google`. Sans e display usano lo stack di sistema arrotondato,
allineato al sito principale (vedi `app/globals.css`).

## Script

| Comando | Descrizione |
|---|---|
| `npm run dev` | Dev server su `:3001` |
| `npm run build` | Build di produzione |
| `npm run lint` | ESLint (config Next) |
| `npm run typecheck` | `tsc --noEmit` |

## Regole del repo (vincolanti)

- Server-first: RSC di default, `'use client'` solo su componenti foglia interattivi.
- Max 200–250 righe per file.
- Business logic in `actions/` (Server Actions) e `lib/`; `components/` è solo UI.
- Sessione SOLO in cookie HttpOnly (`lib/auth/session.ts`) — mai localStorage.
- `design-system/` e `components/ui/`: copie fedeli di Ebartex, niente logica di dominio.
