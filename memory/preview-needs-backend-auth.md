---
name: preview-needs-backend-auth
description: Why live/preview verification of dashboard pages can't be done locally without setup
metadata:
  type: project
---

The tornei dashboard (and other authed pages) are gated by `getSession()` in `lib/auth/session.ts`, which validates an HttpOnly access-token cookie against a real backend `GET /api/auth/me` (`config.api.baseURL`). There is no dev login bypass and no seeded session.

**Why:** Means I cannot screenshot/verify these pages via a local preview without real credentials + a reachable backend.

**How to apply:** For UI changes on authed pages, rely on typecheck/lint + careful code review, and ask the user to verify visually in their own logged-in browser instead of spinning up a preview. Dev server runs on port 3001 (`npm run dev`).
