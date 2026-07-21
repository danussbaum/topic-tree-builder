# CLAUDE.md

Arbeitsanweisungen für Claude Code in diesem Repo. Sprache: **Deutsch** (Code-Kommentare & Commit-Messages ebenfalls auf Deutsch, siehe git log).

## Was ist das

**Prototyp für ein neues Modul der bestehenden Software [socialweb](https://www.glauxgroup.ch/angebot/socialweb-fallfuehrungssoftware-schweiz) (Fallführungssoftware, Glaux Group).**

Das Modul ist ein **generisches Werkzeug, mit dem KundInnen den PDCA-Zyklus umsetzen** können. Die App-Ansichten bilden PDCA ab:

- **P (Plan)** → Ansicht **Planung**
- **D (Do)** → Ansicht **Umsetzung**
- **C (Check)** → Ansicht **Überprüfen**, unterstützt von Ansicht **Auswertungen**
- **A (Act)** → Anpassung des Plans zurück in Ansicht **Planung**

Konkrete Use-Cases (bewusst generisch gehalten):

- Langzeit-Behandlungen für Inhouse-Spitex
- Therapien in Physiotherapie, Ergotherapie, Logopädie, Psychotherapie usw.
- Agogischer Bereich: persönliche Zielsetzungen von KlientInnen, die befähigt werden
- u. v. m.

Technisch: React-SPA, läuft vollständig im Browser; kein Backend ausser dem Auth-Endpoint.

## Tech-Stack

- **Vite + React 18 + TypeScript**, SWC-Plugin
- **shadcn/ui** (Radix + Tailwind), Icons: lucide-react
- **react-router-dom** (Routen in `src/App.tsx`: `/`, `/settings`, `*`)
- **@tanstack/react-query**, react-hook-form + zod, recharts, date-fns
- **Vitest** + Testing Library (jsdom) für Tests
- Paket-Manager: **npm** (`package-lock.json` ist maßgeblich; `bun.lock*` liegt zwar herum, aber npm nutzen)

## Befehle

```bash
npx vercel dev   # LOKALER Dev-Server — so wird lokal gestartet (nicht npm run dev).
                 # Emuliert die Vercel-Umgebung inkl. /api/auth Edge Function. Port 3000.
npm run build    # Production-Build nach dist/
npm run lint     # ESLint
npm test         # Vitest einmalig (vitest run)
npm run test:watch
```

Lokal immer mit `npx vercel dev` starten, damit der Auth-Endpoint `/api/auth` mitläuft (URL: http://localhost:3000). `npm run dev` bzw. reines `npx vite` startet nur das Frontend (Port 8080 laut `vite.config.ts`) **ohne** `/api/auth` — nur nutzen, wenn Auth egal ist. Die `.claude/launch.json` (Port 5173) ist veraltet.

## Projektstruktur

- `src/pages/` — `Index.tsx` (Haupt-App), `Settings.tsx`, `NotFound.tsx`
- `src/components/` — `ui/` (shadcn), `assessment/`, `ribbon/`, `settings/`, `icons/`
- `src/lib/` — Kernlogik & Persistenz:
  - `application-storage.ts` — zentrale localStorage-Keys & Clearing beim Logout
  - `auth.ts` — Auth-Client + clientseitiges Brute-Force-Throttling (UX-Bremse)
  - `assessment-cache.ts` — Zwischenspeicher der Auswertungs-Daten
  - `action-plan-{templates,disciplines,categories}.ts` — Vorlagen/Stammdaten
  - `xlsx.ts` — Excel-Export
- `src/types/` — `assessment.ts`, `assessment-filter.ts`
- `src/test/` — Vitest-Tests
- `api/auth.ts` — **Vercel Edge Function** für serverseitige Auth

## Daten & Persistenz

Kein DB-Backend. Nutzdaten liegen im **localStorage** (siehe `APPLICATION_BROWSER_STORAGE_KEYS` in `application-storage.ts`). Beim Logout werden diese Keys gezielt geleert.

## Auth (wichtig)

- Passwort wird **ausschliesslich serverseitig** in `api/auth.ts` gegen Env-Vars geprüft (`APP_USER`, `APP_PASSWORD`) — landet nie im Browser-Bundle.
- Bei Erfolg: HMAC-signiertes Token (`AUTH_SECRET`) als **httpOnly-Cookie**, Session 12 h.
- Routen unter `/api/auth`: `GET` Status, `POST` Login, `DELETE` Logout.
- Env-Vars für den Server **ohne** `VITE_`-Präfix. Lokal testen mit `vercel dev`.

## Workflow / Deployment

- **Solo-Prototyp: direkt auf `main` arbeiten** — kein Branch/PR-Workflow nötig. Commit/Push nur, wenn der User es verlangt.
- Deployment über **Vercel** (eigene Domains). `.vercel/` ist vorhanden.
- `gh` CLI ist installiert & authentifiziert, falls doch mal ein PR gebraucht wird.

## Konventionen

- Kommentare nur, wo das *Warum* nicht offensichtlich ist (bestehender Code macht das gut vor — an dessen Dichte/Stil halten).
- Import-Alias `@/` → `src/`.
- Kein Overengineering; im Stil des umgebenden Codes bleiben.
