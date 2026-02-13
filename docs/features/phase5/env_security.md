# Feature: Environment Variable Security (Phase 5)

## Milestone Item
- Milestone: Phase 5 / 보안
- Checkbox: 환경변수 보안 점검

## Summary
Centralized server env access with validation in `lib/env/server.ts`. Required vars are validated (non-empty, URLs valid); missing or invalid env throws `EnvError` (code `ENV_MISSING`) with a safe message (never includes actual values). Routes map this to 500 `SERVER_MISCONFIGURED` and log via `writeErrorLog` (best-effort). Optional Stripe price ids: missing only fails in checkout (400 `PRICE_NOT_CONFIGURED`). No secrets in logs or responses.

## Required env vars (validated by getServerEnv)
- OPENAI_API_KEY — OpenAI API
- STRIPE_SECRET_KEY — Stripe API
- STRIPE_WEBHOOK_SECRET — Webhook signature verification
- SUPABASE_SERVICE_ROLE_KEY — Service role client (webhook, etc.)
- NEXT_PUBLIC_SUPABASE_URL — Supabase URL (server + client)
- NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anon key (server + client)
- APP_URL — Checkout success/cancel redirect base

## Optional (validated if present)
- STRIPE_PRICE_STANDARD — Checkout for Standard plan; missing → 400 PRICE_NOT_CONFIGURED
- STRIPE_PRICE_PRO — Checkout for Pro plan; missing → 400 PRICE_NOT_CONFIGURED

## Where used
- OpenAI: lib/openai/client.ts (OPENAI_API_KEY)
- Stripe: lib/billing/stripe.ts (STRIPE_SECRET_KEY, APP_URL); webhook (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- Supabase: lib/supabase/server.ts (URL, anon key); lib/supabase/service.ts (URL, service role key)
- Plans: lib/billing/plans.ts (STRIPE_PRICE_* via getServerEnv)

## How to test locally
- (E-1) Unset OPENAI_API_KEY → POST /api/generate returns 500 SERVER_MISCONFIGURED; error_logs row created (user_id set).
- (E-2) Unset STRIPE_SECRET_KEY → POST /api/billing/checkout returns 500 SERVER_MISCONFIGURED; log created.
- (E-3) Unset STRIPE_PRICE_STANDARD → checkout for plan "standard" returns 400 PRICE_NOT_CONFIGURED (not 500).
- (E-4) Ensure no response body or log includes actual env values.

## Security notes
- Never log or expose secret env values. `safeServerEnvSummary()` returns only booleans (present/absent).
- `lib/env/server.ts` is server-only; do not import from client components.
- EnvError message is generic (e.g. "Missing or invalid: OPENAI_API_KEY") and never includes the value.

## Edge cases
- createClient() or getServerEnv() throwing before we have supabase: return 500 without writing to error_logs.
- Webhook EnvError: return 500 "Server configuration error" without logging (no service role yet if key missing).
