# Feature: Error Logging System (Phase 5)

## Milestone Item
- Milestone: Phase 5 / 보안
- Checkbox: 에러 로깅 시스템 추가

## Summary
Server-side error logging to Supabase `error_logs` for diagnosing production issues. No external SaaS (no Sentry). Logging is best-effort (try/catch around writes); failures never break the main response. We do not log PII, API keys, or full prompts; only route, method, status, error_code, capped message (500 chars), and safe details (channel, vibe, input_length, debit_outcome, etc.).

## Files Changed
- supabase/migrations/20260213160000_error_logs.sql
- lib/logging/errorLog.ts (ErrorLogInput, writeErrorLog)
- app/api/generate/route.ts
- app/api/billing/checkout/route.ts
- app/api/billing/webhook/route.ts
- app/api/me/route.ts
- docs/features/phase5/error_logging.md

## How to Test
- (L-1) Force INPUT_TOO_LONG (input_value length > 1000) → ensure error_logs row created with user_id set.
- (L-2) Force RATE_LIMIT_EXCEEDED (rapid requests on free plan) → error log created, no credit debit.
- (L-3) Force AI_FAILED (e.g. invalid OpenAI key) → error log created with AI_FAILED.
- (L-4) Webhook invalid signature → error log created via service role with user_id null (reason in details).

## Security Notes
- No sensitive data: no full request body, no API keys, no raw prompts. Details limited to channel, vibe, input_length, cache_hit, rate_limit_outcome, debit_outcome, plan (when safe).
- RLS: select/insert own rows only (auth.uid() = user_id). Inserts with user_id null require service role (webhook path).
- Message capped at 500 chars.

## Edge Cases / Known Limits
- Logging insert failure: caught and ignored; main response unchanged.
- Unauthenticated errors (e.g. 401 on /api/generate): not written to error_logs (no user_id; server client cannot insert null per RLS). Webhook signature failure uses service role so user_id null is written.
- Admin UI: skipped for this task; query error_logs via Supabase dashboard or SQL.
