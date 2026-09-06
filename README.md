# AapdaSaarthi — Flood Response Copilot

**DecodeSIH 2026 · Bharat Shakti Track · PS3 — Disaster Response Intelligence Platform**

AapdaSaarthi is a two-sided resource-allocation command center for flood response: a **citizen SOS** app, a **rescuer dispatch** app, and an **HQ command center** with a live India rainfall map, an AI risk engine, and multilingual alerts.

## Live prototype

Deployed on Vercel via `main` — every push to the repo auto-deploys to production.

## Roles

- **/citizen** — one-tap SOS with voice/photo/location, plus SMS confirmation back to the citizen's number at every rescue stage.
- **/rescuer** — nearest-rescuer dispatch (distance-sorted, "take control"), request medkits/foodkits/transport, on-site → delivered lifecycle, and a "SMS this citizen" fallback that opens the native SMS app addressed to the citizen's stored number.
- **/hq** — live SOS board + resource-request queue, live India rainfall map (Open-Meteo), AI risk engine, ground-info update threads, and auto multilingual alerts.

## Core features

- **Offline-first PWA** — all routes precached (`/`, `/citizen`, `/rescuer`, `/hq`, `/offline`) with a branded offline fallback; SOS works with just cellular signal via an `sms:` link.
- **Live sync** — SOS / rescuer / resource records sync wirelessly via Supabase with last-write-wins realtime merging (stale devices can't revert a delivered rescue back to claimed).
- **SMS confirmations** — auto "has taken your request" / "at your location" / "item delivered" messages back to the citizen (SIMULATED by default — plug a gateway via `src/lib/server/sms.ts`).
- **Alert dispatch** — `POST /api/alerts/dispatch` with an honest simulated-fallback broadcast queue (Swytchcode-ready, see `SWYTCHCODE.md`).
- **Risk engine** — heatwave/rainfall risk scoring + district risk panels on the HQ map.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in optional Supabase / emergency SMS values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs fully client-side (localStorage) when Supabase env vars are blank, so it works with zero backend setup.

## Environment variables

See `.env.example` for the full list. All are optional; Supabase enables live multi-device sync, and the emergency SMS number powers the offline `sms:` fallback.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Leaflet + react-leaflet · Supabase · Zustand · TanStack Query · Serwist (PWA) · Open-Meteo (free weather API).

## Building for production

```bash
npm run build   # next build --webpack
```

## Docs

- `PROJECT_HANDOFF.md` — architecture, sync design, known limitations, demo script.
- `PITCH_SHEET.md` — one-page pitch for judges.
- `SUPABASE_SETUP.md` — Supabase project + RLS setup.
- `SWYTCHCODE.md` — optional alert-dispatch gateway setup.

---

Built by **FALCONX** — DecodeSIH 2026, Bharat Shakti PS3.