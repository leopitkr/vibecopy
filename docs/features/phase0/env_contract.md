# Feature: 환경변수(.env.local) 구조 정의

## Milestone Item
- Milestone: Phase 0 / 환경 구축
- Checkbox: 환경변수(.env.local) 구조 정의

## Summary
Defined env var contract for MVP and later phases. Added `.env.example` with placeholders and comments only (§8). No secrets; `.env*` remains in `.gitignore`. No runtime validation module (Next.js loads `.env.local` automatically; add validation in the phase that first uses env if needed).

## Files Changed
- .env.example (new, placeholders only)
- docs/features/phase0/env_contract.md
- require/VibeCopy_Development_Milestones.md

## Env contract

| Variable | Public/Server | Used in (phase) |
|----------|---------------|-----------------|
| NEXT_PUBLIC_APP_URL | Public | App URL, redirects (Phase 0+) |
| SUPABASE_URL | Server + client | Supabase client (Phase 1) |
| SUPABASE_ANON_KEY | Server + client | Supabase auth (Phase 1) |
| OPENAI_API_KEY | Server only | OpenAI client / generate API (Phase 2) |
| STRIPE_SECRET_KEY | Server only | Stripe API (Phase 3) |
| STRIPE_WEBHOOK_SECRET | Server only | Stripe webhook (Phase 3) |

## How to Test
1. Confirm `.env.example` exists and contains only placeholders.
2. Confirm `.gitignore` includes `.env*`.
3. Optional: `cp .env.example .env.local` then `pnpm dev` / `pnpm build` — app runs (no feature reads env yet).

## Edge Cases / Known Limits
- No env validation module in this milestone; add in Phase 1 or 2 when first consuming env if desired.

## Screenshots (optional)
N/A

## Follow-ups (optional)
- Phase 1: wire SUPABASE_* in auth client.
- Phase 2: wire OPENAI_API_KEY in generate API.
- Phase 3: wire STRIPE_* in checkout and webhook.
