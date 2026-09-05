# AapdaSarthi — Project Handoff / Engineer Briefing

> Complete technical briefing so another AI (or engineer) can pick up this codebase cold
> and start working without re-discovering everything.
>
> **Repo path:** `C:\Users\Takhi\Desktop\X\DecodeSih`
> **Live product:** https://production-inky-eight.vercel.app
> **Git:** `main` branch, clean working tree, all pushed to `origin/main`.

---

## 1. What this project is

**AapdaSarthi ("Flood Response Copilot")** is a two-sided, offline-first disaster-response
resource-allocation platform built for **DecodeSIH 2026** (track **BHARAT SHAKTI — PS3
Disaster Response Intelligence Platform**), team **FALCONX**. It is Round-2 selected.

It connects three roles into one realtime loop:
1. **Citizen** (`/citizen`) — one-tap SOS with GPS + photo/video/voice. Works with **zero
   internet** (local save + cellular **SMS fallback**).
2. **Rescuer** (`/rescuer`) — nearest-team dispatch, distance-sorted signals, "take control"
   of a response, request medkits/food-kits/transport from HQ.
3. **HQ Command Center** (`/hq`) — live all-India rainfall + flood-risk map, **AI risk
   engine** (narrative verdicts), live SOS board, resource-request queue with
   allocate/fulfill, automated multilingual alerts.

The demo was pivoted in Aug 2026 from "replay a 2024 flood scenario" to a **live-only
command center** — it renders real weather telemetry from Open-Meteo, real risk scores
computed on live data, and real seconds-later cross-device sync via Supabase Realtime.
Baked-in scenario data (`src/data/scenarios.ts`, `assam-districts.ts`, `kerala-districts.ts`)
is kept for reference/portfolio but **`/hq` is fully live-driven**.

---

## 2. Tech stack

- **Framework:** Next.js **16.2.12** (App Router) — note builds run with **Webpack**,
  not Turbopack (`npm run dev` = `next dev --webpack`, `npm run build` = `next build --webpack`).
- **React 19.2.4**, **TypeScript 5**, **Tailwind CSS v4** (CSS-first config in `globals.css`
  via `@theme inline`, PostCSS `@tailwindcss/postcss`).
- **State:** **Zustand v5** with `persist` middleware (localStorage) for the SOS/request/rescuer store.
- **Realtime cross-device sync:** **Supabase** (`@supabase/supabase-js`) — 3 tables
  (`sos_items`, `resource_requests`, `rescuers`), RLS open for MVP, **Realtime** enabled.
- **Maps:** **react-leaflet v5** + **Leaflet 1.9** (all map components `dynamic(... ssr:false)`),
  OSM raster tiles (keyless), **OSRM public routing API** for real road evacuation routes.
- **Charts:** **Recharts 3** (HQ trend + at-risk bar charts).
- **AI:** **Groq** (LLaMA via OpenAI-compatible chat completions) and/or **Gemini**
  (`gemini-2.0-flash`) for "AI verdict" situation reports; deterministic template fallback.
- **PWA / offline:** **Serwist** (`@serwist/next`, SW src `src/app/sw.ts` → `public/sw.js`).
- **Source of weather:** Open-Meteo forecast API (keyless, free).
- **Alerts UI:** Radix primitives (`@radix-ui/react-*`), `lucide-react` icons,
  `class-variance-authority` + `clsx` + `tailwind-merge` (`cn()` helper).

### Package scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | dev server (Webpack) |
| `npm run build` | production build (Webpack) |
| `npm run start` | serve production build |
| `npm run lint` | eslint (config `eslint.config.mjs` — flat config, next core-web-vitals + TS) |

There is **no test framework** installed (no vitest/jest) — verification is
`npm run build` + `npm run lint` + manual browser smoke tests.

---

## 3. Environment variables

`.env.example` documents everything. Copy to `.env.local` for local dev; set the same on
**Vercel** (Project → Settings → Environment Variables). None are strictly required for the
app to run — it degrades gracefully.

| Var | Purpose | If missing |
|-----|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | app runs localStorage-only (no cross-device sync) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | same as above |
| `NEXT_PUBLIC_EMERGENCY_SMS_NUMBER` | Intl-format emergency number for the `sms:` fallback link (e.g. `+911234567890`) | SMS fallback uses placeholder `+91XXXXXXXXXX` |
| `GEMINI_API_KEY` | enables Gemini AI verdicts | AI falls back to deterministic |
| `GEMINI_MODEL` | default `gemini-2.0-flash` | — |
| `AI_PROVIDER` | `"gemini"` to force Gemini | auto-detect when the key is present |

Note: `.env.local` exists locally but is gitignored; **never commit it**.

---

## 4. Directory / file map (complete)

```
DecodeSih/
├─ next.config.ts            # Serwist PWA plugin config: swSrc → public/sw.js,
│                            #   cacheOnNavigation, precache entries for /, /citizen,
│                            #   /rescuer, /hq, /offline (with revision "1").
├─ package.json              # scripts + deps (see §2). name: "production".
├─ tsconfig.json             # standard Next TS config, "@/*" → "./src/*".
├─ eslint.config.mjs         # flat config (next core-web-vitals + typescript),
│                            #   ignores .next/**, out/**, build/**, next-env.d.ts, public/sw.js.
├─ SUPABASE_SETUP.md         # exact SQL + Realtime instructions to recreate the backend (see §8).
├─ PITCH_SHEET.md            # 1-page executive summary used for judges.
├─ README.md / CLAUDE.md     # boilerplate / `@AGENTS.md` include (ignore).
├─ public/                   # icons (icon-192.png, icon-512.png, maskable), favicon.
└─ src/
   ├─ app/
   │  ├─ layout.tsx          # root layout; fonts (Geist/Geist_Mono); mounts
   │  │                      #   <ConnectivityBanner/>, <SosSync/>, <DemoSeed/>, {children}.
   │  ├─ page.tsx            # landing (client). Role cards, live system-status stat strip,
   │  │                      #   rainfall band legend, "Future scope & roadmap" 5-phase section.
   │  ├─ globals.css         # Tailwind v4 @theme colors, keyframes (pulse/blip/sweep/gmap-you),
   │  │                      #   severity tints, Leaflet light-skin overrides, tooltip styles.
   │  ├─ manifest.ts         # PWA manifest; start_url "/citizen" (installed app opens to SOS).
   │  ├─ sw.ts               # Serwist service worker; navigateFallback "/offline".
   │  ├─ offline/page.tsx    # branded offline fallback page (SOS cached, still reachable).
   │  ├─ citizen/page.tsx    # server wrapper: RoleNav + <SosComposer/>.
   │  ├─ rescuer/page.tsx    # server wrapper: RoleNav + <RescuerPanel/> (list) + <RescuerMap/>.
   │  ├─ hq/page.tsx         # server wrapper: RoleNav + Header + grid of HQ panels.
   │  ├─ api/risk/route.ts               # GET /api/risk (all-India risk engine, see §7).
   │  └─ api/risk/connectivity/route.ts  # GET /api/risk/connectivity → {online:true} health probe.
   ├─ components/
   │  ├─ role-nav.tsx        # sticky sub-nav Home | Citizen | Rescuer | HQ (active highlight).
   │  ├─ header.tsx          # HQ sticky header: UTC clock, LIVE FEED toggle (dashboard store),
   │  │                      #   status ticker (risk engine online, Open-Meteo feeds, uptime).
   │  ├─ demo-seed.tsx       # mounts once; seeds store with realistic demo SOS/requests/
   │  │                      #   rescuers ONLY when store is empty (see seedOnce in sos-store).
   │  ├─ sos-sync.tsx        # Supabase push/pull/realtime bridge (see §9). Mounted in layout.
   │  ├─ connectivity-banner.tsx # amber offline banner shown only when navigator offline.
   │  ├─ sos-composer.tsx    # citizen SOS form (see §10 details).
   │  ├─ rescuer-panel.tsx   # dispatcher list: identity card → signals tab (distance-sorted,
   │  │                      #   take-control, resource-request form) → my-rescues tab.
   │  ├─ rescuer-map.tsx     # field map: Google-maps-style blue dot for rescuer, SOS markers
   │  │                      #   ≤50 km (NEAR_RADIUS_KM), flyTo, click-to-take-control.
   │  ├─ live-map.tsx        # HQ national map — biggest component (see §11).
   │  ├─ hq-sos-board.tsx    # live SOS list (last 6) + field resource requests with
   │  │                      #   "Allocate & fulfill", reset-demo button.
   │  ├─ risk-panel.tsx      # "AI Risk Prediction": clusters derived from open SOS signals.
   │  ├─ resource-panel.tsx  # live resource totals (teams online, pending, medkits, food,
   │  │                      #   transports, fulfilled/people rescued) or empty state.
   │  ├─ auto-alerts.tsx     # 5-language automated SMS alert preview, top-3 risk zones,
   │  │                      #   "Auto-broadcast" button (simulated).
   │  ├─ alert-composer.tsx  # multilingual (en/hi/as/ml/bn) flood SMS templates, recipient
   │  │                      #   count (live SOS people or 1250), broadcast + copy buttons.
   │  ├─ charts.tsx          # RiskTrendChart (area, last-7-day SOS) + DistrictImpactChart
   │  │                      #   (bar, at-risk zones by people) via Recharts.
   │  └─ ui/                 # minimal shadcn-style primitives: button.tsx (variants
   │     │                   #   default/primary/ghost/outline/danger/cyan; sizes sm/md/lg/icon),
   │     │                   #   card.tsx (Card/Header/Title/Content), badge.tsx (severity).
   │     └─ ...
   ├─ store/
   │  ├─ sos-store.ts        # THE shared client state (see §6).
   │  ├─ dashboard-store.ts  # HQ header liveMode/scenario toggle (legacy, scenario-focused).
   │  └─ connectivity.ts     # useOnline() via useSyncExternalStore + navigator.onLine events.
   ├─ lib/
   │  ├─ types.ts            # shared types: Severity, DistrictRisk, ResourceItem, EvacRoute,
   │  │                      #   AlertTemplate, TimelinePoint, Scenario.
   │  ├─ risk.ts             # pure flood-risk scoring engine (see §7).
   │  ├─ rainfall.ts         # 30-city rainfall fetch (Open-Meteo), band classification,
   │  │                      #   seeded fallback, haversineKm().
   │  ├─ routing.ts          # OSRM road routing → real evacuation route, polyline decode,
   │  │                      #   straight-line fallbackRoute().
   │  ├─ live-stats.ts       # deriveLiveStats()/useLiveStats() — aggregates derived from the
   │  │                      #   real SOS store (open signals, clusters, daily trend, teams,
   │  │                      #   pending requests, totals).
   │  ├─ supabase.ts         # lazy getSupabase() singleton; null when creds absent.
   │  ├─ utils.ts            # cn(), severityOrder, sortBySeverity, formatNum (en-IN), timeAgo.
   │  └─ server/
   │     ├─ weather.ts       # server-only: fetch Open-Meteo for ALL ~594 Indian districts
   │     │                   #   (batched ≤250), real 24h accumulation, getIndiaDistricts()
   │     │                   #   with seeded fallback.
   │     ├─ ai.ts            # provider-agnostic AI verdict: Groq + Gemini + deterministic;
   │     │                   #   getAiAssessment() returns {assessment, provider}.
   │     └─ gemini.ts        # Gemini client + deterministicAssessment() template fallback.
   └─ data/
      ├─ india-districts.ts  # ~594 districts [{name,state,lat,lon}] (auto-generated).
      ├─ scenarios.ts        # Assam-2024 (and friends) legacy demo scenarios (portrait only now).
      ├─ assam-districts.ts  # extra Assam district geometry ref data.
      └─ kerala-districts.ts # Kerala district ref data (legacy).
```

---

## 5. The core data model (`src/store/sos-store.ts`)

Zustand store **`useSosStore`** (persisted under localStorage key `aapdasarthi-sos`). All
three pages read/write the same store; `<SosSync/>` bridges it to Supabase.

```ts
interface MediaAttachment { kind: "voice" | "video" | "photo"; url: string; name: string; }

interface Rescuer {
  id: string; name: string; lat: number; lng: number;
  online: boolean; lastSeen: string;            // ISO
}

interface SosItem {
  id: string;                                   // "sos-<base36-ts>-<uid>"
  citizenName: string;
  message: string;
  peopleCount: number;
  location?: { lat: number; lng: number; accuracy?: number };
  media: MediaAttachment[];                     // blob: URLs (session-scoped)
  timestamp: string;                            // ISO
  status: "open" | "claimed" | "resolved";
  rescuerName?: string;                         // set on claim
  nearestRescuerName?: string;                  // computed at send-time
  nearestDistanceKm?: number;
}

interface ResourceRequest {
  id: string; sosId?: string; rescuerName: string;
  location?: { lat: number; lng: number }; locationLabel?: string;
  peopleRescued: number; medkits: number; foodkits: number; transports: number;
  timestamp: string; status: "pending" | "fulfilled";
}
```

**Actions:** `setRescuerName`, `registerRescuer` (dedupes by name, reuses existing record),
`updateRescuerLocation`, `setRescuerOnline`, `unregisterRescuer`, `addSos` (computes nearest
online rescuer via `haversineKm` when location present), `claimSos` (sets status + rescuerName),
`resolveSos`, `addRequest`, `fulfillRequest`, `seedOnce` (demo seed, guarded by module-level
`seedDone` + store not empty), `resetDemo`.

**Important gotcha:** `nearestRescuer()` runs inside `addSos` immediately — so routing is
computed from the rescuer roster at send time, not live on the HQ side.

---

## 6. Data flow (how the pieces talk)

```
                     ┌── localStorage (persist) ──┐
 Citizen SOS ───────▶│   useSosStore  ◀───────────│── Rescuer take-control / requests
 (sos-composer)      └──────┬─────────────────────┘
                            │ upsert (debounced, on change, online only)
                            ▼
                     Supabase tables (sos_items / resource_requests / rescuers)
                            ▲
                            │ Realtime postgres_changes → merge back into store
                            ▼
                  HQ board / map / panels / charts (via useLiveStats)
```

- **Client-only default:** with no Supabase env vars, everything lives in localStorage —
  cross-device sync is off but the demo works 100%.
- **With Supabase:** `SosSync` pulls all rows on mount (merges by `id`, remote wins on
  newer `timestamp`/`lastSeen`), writes changes up debounced (500 ms; 1 s after
  `online` event), and listens on Realtime for the 3 tables.
- **Echo-loop safety:** when Realtime plays back this device's own write, the timestamp is
  unchanged → the handler skips it. This fixed an endless list re-order/jitter bug
  (see commit `8f94933`).

---

## 7. The risk engine (`src/lib/risk.ts`)

Pure, client-safe scoring — explainable, not a black box (judge-facing story).

```ts
riskScore(precipitation, precipitation24h, probability): number  // 0–100

intensity = clamp(p / 2.5)          // heavy-rain threshold 2.5 mm/hr
accum     = clamp(p24h / 64)        // IMD "very heavy day" 64 mm/24h
prob      = clamp(prob / 100)
base      = 0.55*intensity + 0.30*accum + 0.15*prob
wet       = clamp(p/5 + p24h/32)    // calm-weather dampener
score     = base * (0.25 + 0.75*wet)  → round(clamp*100)
```

Severity bands: **≥72 CRITICAL · ≥48 HIGH · ≥24 MODERATE · else LOW**.
Also `riskDrivers()` (readable reasons) and `assessDistrict()`.

**Server-side weather collector (`src/lib/server/weather.ts`):**
- Fetches Open-Meteo for all ~594 district centroids from `india-districts.ts`,
  batched at 250 districts per request (`current=precipitation,precipitation_probability`
  + `daily=precipitation_sum&past_days=1&forecast_days=1`).
- **24h accumulation uses the actual past-day total** (`daily.precipitation_sum[0]`),
  NOT the hourly forecast — fixed to avoid "rain that hasn't fallen yet" inflating scores
  (commit `674117e`).
- `getIndiaDistricts()` → `{districts, source:"live"|"seeded"}`; seeded fallback is a
  deterministic hotspot list (Assam belt, West coast, NE) so the map never renders empty.

**API inference (`src/lib/server/ai.ts` + `gemini.ts`):**
- Builds a prompt from the top-8 at-risk districts; asks for `SUMMARY:/ACTIONS:/ZONES:`.
- Provider order: forced `AI_PROVIDER`, else Gemini if `GEMINI_API_KEY`, else
  `deterministicAssessment()`.
- Skips the LLM round-trip when there are zero CRITICAL+HIGH districts ("calm nation").
- Parses the shaped response defensively; per-field fallback to the deterministic template.

---

## 8. Supabase backend (how to recreate)

`SUPABASE_SETUP.md` contains the exact SQL. Essentials:

- **Tables** (all `id text primary key, data jsonb`): `sos_items`, `resource_requests`, `rescuers`.
- **RLS:** enabled; public read + insert + update for all three (MVP-open; put auth per
  rescue team before production).
- **Realtime:** in Dashboard → Database → Replication, toggle the 3 tables into the
  `supabase_realtime` publication.
- **Client:** `src/lib/supabase.ts` lazily builds the client from the two
  `NEXT_PUBLIC_SUPABASE_*` vars; `persistSession: false`.

---

## 9. PWA / offline strategy

- **Serwist** (`next.config.ts`): precaches `/`, `/citizen`, `/rescuer`, `/hq`, `/offline`.
- `src/app/sw.ts`: `navigateFallback = "/offline"`, `skipWaiting + clientsClaim`,
  `navigationPreload`, defaultCache runtime rules.
- **Citizen flow offline-first:** `getEffectiveOnline()` + a fetch to
  `/api/risk/connectivity` decide online vs SMS path. SOS is always written to the store
  (localStorage) FIRST; if server unreachable → `window.location.href = "sms:...?body=..."`
  with the pre-filled emergency text (uses `NEXT_PUBLIC_EMERGENCY_SMS_NUMBER`, must be
  international format).
- Geolocation uses `enableHighAccuracy: true, timeout: 8000` → prefers GPS satellite fix
  (works with no internet), fails fast to a saved `aapda-saarthi-last-location` in
  localStorage.

---

## 10. Page-by-page behavior details

### `/` Landing (`src/app/page.tsx`, client)
- Live system-status stats come from `useSosStore` (open SOS, active rescues, teams online,
  pending reqs).
- Rainfall band chips via `getRainfall()` + `rainfallBand()`; "heavy/moderate/dry" counts
  (dry = `points.length - high - moderate`).
- Roles: 3 cards (`/citizen` "I'm in trouble", `/rescuer`, `/hq`).
- Roadmap section: 5 phases (01 Offline-first [live today] → 02 AI Dispatch [next up] →
  Mesh & Satellite / Forecast Fusion / National Scale [on roadmap]).

### `/citizen` (`src/components/sos-composer.tsx`)
- Fields: name (optional), message (required), people count (1–50 stepper), location
  (fetch GPS / manual lat-lng fallback / last-saved), media (photo, video, voice-note via
  MediaRecorder → blob URLs).
- `canSubmit = message.trim() && locStatus === "ok"`.
- On submit: `addSos()` FIRST (local + routed-to badge), then connectivity probe; online →
  "SOS transmitted" (Supabase picks it up via SosSync), offline → SMS composer opens.
- Media blobs are session-scoped (`blob:` URLs); they ride along in the `data` payload but
  are not uploaded anywhere (no storage backend).

### `/rescuer` (`rescuer-panel.tsx` + `rescuer-map.tsx`)
- Identity card: type team/name + "Set my location" → `registerRescuer` writes/updates the
  single store record shared with the map (fixes a position bounce bug — commit `052bd9a`).
- **Signals tab:** open SOS sorted by distance from rescuer's store location; badges for
  distance, "ROUTED TO YOU", routed-to-other. "Take control" → `claimSos` → jumps to
  "My rescues" tab (does NOT auto-open the request form).
- **My rescues tab:** claimed signals; "Request resources" opens medkit/foodkit/transport
  form → `addRequest` (pending). "Resolve" → `resolveSos`.
- **Field map:** shows only open signals within `NEAR_RADIUS_KM = 50`; blue Google-maps-style
  location dot (divIcon built from lazily-loaded Leaflet to avoid SSR issues);
  distance-colored markers (red <5 km → green <50 km); click → take-control card.

### `/hq` (`hq/page.tsx` + panels)
Layout: 8-col left (map, 2 charts, ResourcePanel) + 4-col right rail
(HqSosBoard, AutoAlerts, RiskPanel, AlertComposer).
- All panels read `useLiveStats()` — so HQ is **live-only**: no scenario layers, empty-state
  panels when there's no field data (commit `e03585e`).
- `Header` has the LIVE FEED toggle (cosmetic) + UTC clock + status ticker.

---

## 11. The HQ live map (`src/components/live-map.tsx`) — deepest component

Layers (bottom→top):
1. **OSM raster tiles** (`tile.openstreetmap.org/...`, keyless).
2. **Rainfall markers** — `CircleMarker`s for the 30 cities, ONLY ≥ moderate band shown
   (commit `8ee478f`, hides low-band green dots).
3. **Live risk zones** — `Circle`s per district, radius scaled by severity
   (CRITICAL 120 km / HIGH 80 km / MODERATE 45 km), fill opacity by band; `riskScore<=0`
   skipped.
4. **Live SOS markers** — distinct small red `CircleMarker`s with a permanent "SOS · name"
   tag (visually separated from flood zones; commit `f6e2e36`).

Overlays (absolutely positioned):
- Top-left: live risk counter (CRITICAL/HIGH counts, open/claimed SOS).
- At-risk district names rail (left, below title): top-12 CRITICAL/HIGH/MODERATE, scrollable,
  auto-updates with the feed (commits `a57c383`, `0aa35d4` — included MODERATE so panel shows
  on quiet days).
- Top-right: at-risk tally + people-in-open-signals.
- Top-center-right: rainfall source chip (heavy/mod/dry, `(cached)` when seeded).
- Bottom-left: "AI Risk Verdict" summary card (`LiveRiskSummary`).
- Legend chips + zoom hint (zoom ≥ 6.5 = "district detail · routes live").
- **Safe-route generator:** toggle → click origin (flood point) → click destination →
  `generateSafeRoute()` via OSRM road network, drawn as double polyline (soft halo + dashed
  cyan); OSRM failure → straight-line `fallbackRoute()` + warning. "random demo" picks a
  random risky district.
- Polling: rainfall every 10 min, risk every 15 min (rAF-initial + setInterval).
- `MapClickHandler` uses `useMapEvents` so clicking the map also works when route mode is on.

---

## 12. API routes

### `GET /api/risk`
- Query: `?limit=N` (cap districts; default all ~594), `?ai=0` (skip LLM call),
  `?debug=1` (returns `debug` log array).
- Flow: `getIndiaDistricts()` → sort worst-first → `getAiAssessment(top, debug?)?` →
  deterministic when `ai=0`.
- Response: `{ generatedAt, source: "live"|"seeded", provider: "gemini"|"deterministic",
  gemini: bool, count, totalDistricts, summary: {summary, actions, riskZones}, districts[] }`.
- Headers: `Cache-Control: no-store`, `Access-Control-Allow-Origin: *`.
- `export const dynamic = "force-dynamic"`.

### `GET /api/risk/connectivity`
- `{ online:true, timestamp }` with no-cache headers — used by the citizen composer to
  probe real server reachability before choosing online vs SMS delivery.

---

## 13. Known engineering decisions & gotchas (read before editing)

1. **Webpack build**: `--webpack` flags are intentional (Serwist/Turbopack quirks). Keep them.
2. **Leaflet + SSR**: every react-leaflet component must be `dynamic(..., { ssr:false })`;
   the rescuer map loads the whole `leaflet` module lazily before creating `divIcon`s.
3. **react-hooks lint** (`react-hooks/set-state-in-effect` is active in this Next config):
   effects must not synchronously set state — all fetches resolve async, or use
   `requestAnimationFrame`/`setTimeout(0)` kicks (look at `live-map.tsx`, `header.tsx`,
   `rescuer-map.tsx` for the established patterns).
4. **SosSync echo suppression** is load-bearing — don't "simplify" the realtime handler;
   removing the timestamp-equality guard reintroduces infinite list jitter.
5. **Malformed rows are filtered** in `sos-sync.tsx` `readAll()` (must have a string
   `timestamp`/`lastSeen`) to prevent an old probe row from white-screening HQ — keep the filter.
6. **Media is blob-only**: `SosItem.media` holds `blob:` URLs on the sending device; there is
   no media upload backend. Rescuers only see kind/name chips (`MediaChips`, guarded against
   a missing `media` field — commit `7856e80`).
7. **Risk engine calm-dampener**: most of India should read LOW/Safe by design; don't weaken
   `wet` unless you want a nation of false alerts.
8. **`.env.local` and `.vercel` are gitignored**; deployment secrets live in Vercel only.
9. **No tests** — verify via build + lint + manual smoke of `/`, `/citizen`, `/rescuer`, `/hq`,
   `/offline`, and `/api/risk` (optionally `?limit=5`).
10. **Node 25 / npm 11** were used on the dev machine; the repo is plain npm (no pnpm/yarn).

---

## 14. Git history (recent work, newest first)

- `0aa35d4` fix(map): include MODERATE districts in at-risk names panel (show when 0 critical/high)
- `a57c383` feature(map): at-risk district names panel on HQ, auto-updates with live risk feed
- `f6e2e36` feature(map): render real flood-risk zones (severity-scaled areas), distinguish SOS signals from zones
- `674117e` fix(risk): use real past-24h precipitation (daily sum), not hourly forecast, for 24h accumulation
- `e03585e` refactor(hq): live-only command center — drop 2024 scenario layers, keyless OSM basemap, empty-state panels
- `8ee478f` fix(hq-map): hide green low-band rainfall and LOW-severity risk dots
- `7856e80` fix(rescuer): guard MediaChips against missing media field
- `18fd776` Remove offline-demo (simulate-offline) toggle
- `369dd61` HQ: live SOS-derived panels + Nepal flood scenario
- `e167b55` fix HQ white-screen from malformed synced SOS row; harden sync ingress
- `3cdbbd4` replace default leaflet 'YOU' marker with google-maps-style location dot
- `8f94933` fix endless list jitter caused by realtime echo feedback loop
- `df0d00e` add one-page executive pitch sheet for judges
- `052bd9a` fix rescuer page glitching: unify location source + stop forced form pop
- `66d3e85` harden offline geolocation: prefer GPS fix + fail fast to saved location
- `882a80e` harden offline app shell: precache all routes + branded offline fallback
- `526712e` Add offline-first polish: global offline banner + offline-demo toggle
- `e9cb6d6` Add offline SOS PWA support
- `fa5eca3` Initial commit - Aapda Saarthi (DecodeSIH 2026, Bharat Shakti PS3)

---

## 15. Suggested next-step / roadmap work (exists in the UI as "future scope")

- **AI dispatch** — an LLM dispatcher that auto-triages SOS, suggests the nearest team,
  drafts multilingual alerts (described as "Next up" on the landing page).
- **Real SMS / WhatsApp / CB-SMS gateway** — alert composer + auto-alerts currently simulate
  broadcast; wire to a real gateway (e.g. Twilio/QuickSMS) behind `NEXT_PUBLIC_*` vars.
- **Media upload** — blob URLs don't leave the device; add storage + presigned URLs if
  photo/video/voice need to reach HQ.
- **Authenticated rescuer records + RLS tightening** — SUPABASE_SETUP.md flags the open RLS
  as MVP-only.
- **Forecast fusion** — blend hourly forecast, river-gauge, and satellite flood models into
  a predictive score (Phase 04 card).

---

*Prepared from repo state `main @ 0aa35d4` (working tree clean). For judging context see
`PITCH_SHEET.md`; for the backend SQL see `SUPABASE_SETUP.md`.*