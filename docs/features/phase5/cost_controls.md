# Feature: Cost Controls (Phase 5 – 비용 통제)

## Milestone Items
- Phase 5 / 비용 통제: OpenAI 토큰 제한 설정, 최대 입력 글자 수 제한, 응답 캐싱 전략 적용

## Summary
- **Input length**: Server enforces `input_value` max 1,000 chars; 400 INPUT_TOO_LONG before debit/OpenAI. Client shows character counter and disables submit when over limit.
- **OpenAI limits**: max_output_tokens = 900, request timeout 30s (lib/openai/client.ts). No prompt changes.
- **Response caching**: `generations.cache_key` = sha256(channel, vibe, normalized_input). Before debit, lookup same user + cache_key within 24h; if hit with valid output, return 200 with cacheHit true and **no credit debit**. Cache is per-user only.

**Policy**: Cache hit does not debit credits (explicitly stated).

## Files Changed
- app/api/generate/route.ts (input check, cache_key, cache lookup, insert cache_key)
- lib/openai/client.ts (max 900 tokens, 30s timeout)
- supabase/migrations/20260213150000_generations_cache_key.sql
- components/GeneratePageClient.tsx (counter, inputValid, INPUT_TOO_LONG handling)
- lib/ui/generateClient.ts (ApiErrorCode: INPUT_TOO_LONG, RATE_LIMIT_EXCEEDED)
- docs/features/phase5/cost_controls.md

## How to Test
- (C-1) INPUT_TOO_LONG: Send body with input_value length > 1000 → 400 INPUT_TOO_LONG; no debit, no OpenAI call.
- (C-2) Token cap: Generate returns JSON within expected size; schema still valid.
- (C-3) Cache hit: POST same channel/vibe/input twice with different idempotency_key. 1st: normal debit + saved with cache_key. 2nd within 24h: 200, cacheHit true, same output, no debit.
- (C-4) Cache per-user: Different user, same input → not cache hit (new generation).

## Edge Cases / Known Limits
- Cache hit: credits response uses current balance for both before/after (no change).
- Input too long: Zod + explicit INPUT_TOO_LONG for 400; client blocks submit and shows counter.
- Output truncation: max_output_tokens 900 may truncate very long JSON; schema validation can fail and trigger retry/repair flow.
- Existing generation with null output_json is ignored for cache (only rows with output_json used).
