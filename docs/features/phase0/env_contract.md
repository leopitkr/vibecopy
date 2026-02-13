# Feature: 환경변수(.env.local) 구조 정의

## Milestone Item
- Milestone: Phase 0 / 환경 구축
- Checkbox: 환경변수(.env.local) 구조 정의

## Summary
Defined env var contract for MVP and later phases. `.env.example` lists all variables with placeholders and comments (public vs server-only). No real values in repo; `.env*` in `.gitignore`, `!.env.example` allowed.

## Files Changed
- .env.example (placeholders: NEXT_PUBLIC_APP_URL, SUPABASE_*, OPENAI_API_KEY, STRIPE_*)
- docs/features/phase0/env_contract.md
- require/VibeCopy_Development_Milestones.md (on finalize)

## Variable definitions

| Variable | Scope | Purpose |
|----------|--------|---------|
| NEXT_PUBLIC_APP_URL | Public | App origin; redirects, links (Phase 0+) |
| SUPABASE_URL | Server + client | Supabase project URL (Phase 1) |
| SUPABASE_ANON_KEY | Server + client | Supabase anon/publishable key; client-safe (Phase 1) |
| SUPABASE_DB_URL | Server only | Direct Postgres URL; migrations, server DB access |
| SUPABASE_SERVICE_ROLE_KEY | Server only (optional) | Bypasses RLS; trusted server code only |
| OPENAI_API_KEY | Server only | OpenAI API (Phase 2) |
| STRIPE_SECRET_KEY | Server only | Stripe API (Phase 3) |
| STRIPE_WEBHOOK_SECRET | Server only | Stripe webhook verification (Phase 3) |

## Security considerations
- **Public (NEXT_PUBLIC_*):** Bundled into client JS. Use only for non-secret config (e.g. app URL). Never put API keys or secrets here.
- **Server-only:** Use only in server code (API routes, server components, server-only `lib`). Never expose in client bundles.
- **SUPABASE_ANON_KEY:** Safe for client; RLS and auth policies protect data. Do not expose service role key.
- **SUPABASE_SERVICE_ROLE_KEY:** Bypasses RLS. Use only in trusted server code; never in client or public env.
- **SUPABASE_DB_URL:** Contains DB password. Server-only; use for migrations or server-side Postgres clients.
- Never commit `.env`, `.env.local`, or any file with real secrets. Use `.env.example` with placeholders only (§8).

## How to Test
1. Confirm `.env.example` exists and contains only placeholders (no real keys).
2. Confirm `.gitignore` includes `.env*` and `!.env.example`.
3. Optional: `cp .env.example .env.local`, fill values, then `pnpm dev` / `pnpm build`.

## Edge Cases / Known Limits
- No runtime env validation in this milestone; add when first consuming env (e.g. Phase 1).

## Follow-ups (optional)
- Phase 1: wire SUPABASE_* in auth client.
- Phase 2: wire OPENAI_API_KEY in generate API.
- Phase 3: wire STRIPE_* in checkout and webhook.
