# Feature: API Rate Limiting (Phase 5)

## Milestone Item
- Milestone: Phase 5 / 보안
- Checkbox: API rate limiting

## Summary
Per-user + per-IP rate limiting for POST /api/generate using a sliding-window counter stored in Supabase `rate_limits`. Limits by plan: Free 3/min and 10/hr; Standard 10/min and 100/hr; Pro 30/min and 500/hr. Check runs after auth and before credit debit; 429 RATE_LIMIT_EXCEEDED does not deduct credits. cursor.rule checked.

## Files Changed
- lib/rateLimit.ts
- supabase/migrations/20260213140000_rate_limit.sql
- app/api/generate/route.ts
- docs/features/phase5/rate_limiting.md

## How to Test
- (R-1) Rapid calls: send 4 requests within 1 minute as free user → 4th returns 429; no credit deducted for 4th.
- (R-2) Free vs Pro: free 3/min; pro (or higher plan) allows 30/min.
- (R-3) Rate limit 429 response does not deduct credit (check credit_balance unchanged).
- (R-4) History: rate limit does not affect /history or generations table.

## Edge Cases / Known Limits
- IP from x-forwarded-for or x-real-ip; falls back to "unknown" (all same IP share limit per user).
- RLS: users can only select/insert own rows in rate_limits.
- No cleanup of old rows in this MVP (optional future: periodic delete older than 24h).
