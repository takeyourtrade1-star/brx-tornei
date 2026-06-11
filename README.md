# Ebartex Tournaments

Mini-sito verticale per i Tornei TCG dell'ecosistema Ebartex.
Dominio target: `tournaments.ebartex.com`.

**Leggi prima [ARCHITECTURE.md](./ARCHITECTURE.md)** — contiene la strategia SSO, le regole sul design system condiviso, l'architettura delle cartelle e la roadmap.

## Setup

```bash
npm install
cp .env.example .env.local   # compila NEXT_PUBLIC_AUTH_API_URL (stesso valore del sito principale)
npm run dev                  # porta 3001 (il sito principale gira su 3000)
```

Asset da copiare da `new_frontend_brx/public/` (binari, non versionati qui):
`brx_bg.png`, `fonts/Comodo Regular Free.{otf,ttf}`.

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
