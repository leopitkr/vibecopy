# Feature: Credit system (usage_ledger + debit/refund)

## Milestone Items
- Phase 2 / 크레딧 시스템: credit_balance 컬럼 구현, 요청 시 크레딧 차감 로직, 트랜잭션 처리 (중복 차감 방지), 크레딧 부족 시 차단 처리, 크레딧 사용 로그 기록

## Summary
Implemented atomic credit debit/refund via `usage_ledger` (source of truth). `debit_credits` and `refund_credits` run as Postgres RPCs (transactions). Idempotency: unique(user_id, idempotency_key); Free plan: 3 generations/day. POST /api/generate requires `idempotency_key`, debits 1 credit before OpenAI, links generation_id to ledger after save, refunds on AI/DB failure. Error contract: 400 BAD_REQUEST, 401 UNAUTHORIZED, 402 INSUFFICIENT_CREDITS, 409 IDEMPOTENCY_CONFLICT, 429 DAILY_LIMIT_EXCEEDED, 500 AI_FAILED.

## Files Changed
- supabase/migrations/20260213120000_usage_ledger_and_credit_functions.sql
- lib/db/credits.ts
- app/api/generate/route.ts
- docs/features/phase2/credit_system.md

## How to Test
- (A) Free user: 4th request same day (unique idempotency_key) → 429 DAILY_LIMIT_EXCEEDED.
- (B) credit_balance 0 → 402 INSUFFICIENT_CREDITS.
- (C) OpenAI failure (e.g. invalid key): refund runs; usage_ledger has credit row; balance restored.
- (D) Same idempotency_key twice: 2nd returns 200 with same output (duplicated), no double charge.
- (E) Migration: usage_ledger has unique(user_id, idempotency_key).

## Edge Cases
- Refund failure after AI error: logged with console.error; 500 still returned.
- Duplicate key but no generation_id (dangling): 409 IDEMPOTENCY_CONFLICT.
