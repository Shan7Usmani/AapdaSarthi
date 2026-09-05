# Swytchcode Integration (AapdaSarthi)

Swytchcode is the Official AI Integration Partner for DecodeSIH 2026. This repo
uses it as the execution layer for alert broadcasts (the app's SMS/cell-broadcast
gateway). Participants get **US$100 credits** via the official referral link, and
the *Best Use of Swytchcode* award requires: building with the CLI, using the
Python/TS runtime, calling 2+ external APIs from the ecosystem, an AI workflow,
and a functional end-to-end app.

## What is wired up already

- `POST /api/alerts/dispatch` — receives `{ lang, region, sms, recipients }` and
  executes it through `@swytchcode/runtime`: `new SwytchcodeRuntime().execute({ tool, input })`.
- Graceful fallback: without config the response channel is `"simulated"` and the
  HQ/alert UI labels the broadcast **SIMULATED** (honest, never faked).
- `@swytchcode/runtime@^1.1.6` is a dependency; `next.config.ts` marks it
  `serverExternalPackages` so it stays unbundled at runtime.

## One-time setup (do in this order)

1. **Account + credits** — sign up at swytchcode.com (use the official DecodeSIH
   referral link to load US$100).
2. **Install the CLI** — `npm i -g swytchcode`, then `swy --version`
   (older builds use `swytchcode --version`).
3. **Authenticate** — `swy login`.
4. **Init in this repo** — `swy init` (creates `tooling.json`).
5. **Connect a tool** — `swy get <integration>` to browse, then
   `swy add <canonical_id>` and `swy auth connect <integration>`.
   Free/zero-cost options (e.g. Google Sheets, GitHub) work fine for the judge
   demo — the SDK only executes tools listed in `tooling.json`.
6. **Env vars** — set in `.env.local`:

   ```
   SWYTCHCODE_ENABLED=1
   SWYTCHCODE_TOOL_ID=<canonical tool id from swy add>
   ```

## Why no Twilio

The team has no Twilio credits. AapdaSarthi deliberately keeps the gateway
config-driven: whichever Swytchcode tool you connect becomes the real
send/audit channel. Until then every broadcast is clearly marked SIMULATED.